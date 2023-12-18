import * as Accordion from "@radix-ui/react-accordion";
import dayjs from "dayjs";
import React from "react";
import { AccordionContent, AccordionTrigger } from "./AccordionTrigger";
import { predictionText } from "./PredictionListItem";
import RouteSlim from "./RouteSlim";
import _ from "lodash";
import VehicleBadge from "./VehicleBadge";
import nearestPoint from "@turf/nearest-point";

const RoutePredictionItem = ({ vehicle, predictions, vehicleType }) => {
  if (!vehicle) {
    return null;
  }

  let {
    routeColor,
    routeTextColor,
    routeShortName,
    displayShortName,
    description,
    headsign,
    nextStop,
    vid,
  } = vehicle.properties;

  let timepoints = new Set(
    Array.from(
      vehicle.properties.trips
        .map((t) =>
          t.stopTimes
            .filter((st) => st.timepoint === 1)
            .map((st) => st.stop.stopCode)
        )
        .flat()
    )
  );

  let nearest = null;

  if (!predictions) {
    let direction = vehicle.properties.directions.find(
      (d) => d.directionHeadsign === vehicle.properties.headsign
    );
    if (!direction) { return null }
    let stopsFromTrips = vehicle.properties.trips
      .filter((t) => t.directionId === direction.directionId)
      .map((trip) => trip.stopTimes.map((st) => st.stop))
      .flat();

    let uniqueStops = _.uniqBy(stopsFromTrips, "stopId");

    let featureCollection = {
      type: "FeatureCollection",
      features: uniqueStops.map((stop) => {
        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [stop.stopLon, stop.stopLat],
          },
          properties: {
            stopCode: stop.stopCode,
            stopName: stop.stopName,
          },
        };
      }),
    };

    nearest = nearestPoint(vehicle, featureCollection);
  }

  return (
    <Accordion.Item className="AccordionItem" value={vid}>
      <AccordionTrigger>
        <div className="flex items-center justify-between gap-2 text-xs flex-grow">
          <div className="flex items-center justify-between gap-2 w-full flex-grow">
            <RouteSlim
              displayShortName={displayShortName}
              routeShortName={routeShortName}
              routeLongName={description}
              routeColor={routeColor}
              routeTextColor={routeTextColor}
              direction={{
                directionDescription: description,
                directionHeadsign: headsign,
              }}
            />
            <div className="flex flex-col justify-end">
              <span className="text-xs block text-right mr-2 text-gray-400">
                {nextStop && (
                  <>
                    <span>
                      next stop{" "}
                      {predictions?.length > 0 &&
                        (predictions[0].prdctdn === "DUE"
                          ? `, now:`
                          : `, in ${predictions[0].prdctdn}m:`)}
                    </span>
                  </>
                )}
              </span>
              <span className="text-sm mr-2 text-right">
                {nextStop && nextStop.stpnm}
              </span>
            </div>
          </div>
        </div>
      </AccordionTrigger>
      {predictions ? (
        <AccordionContent className="p-0 text-sm pt-2">
          <span className="font-bold text-xs pb-1 block text-gray-500 dark:text-zinc-500">
            Next major stops:
          </span>
          <div className="gap-1 flex flex-col">
            {predictions &&
              predictions
                .filter((prd) => [...timepoints].indexOf(prd.stpid) > -1)
                .slice(0, 5)
                .map((prediction, idx) => {
                  return (
                    <div
                      className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-700 pb-1 border-dotted last:border-b-0"
                      key={prediction.vid}
                    >
                      <div className="flex flex-col">
                        <span>{prediction.stpnm}</span>
                        <span className="text-xs text-gray-500 font-semibold">
                          {dayjs(prediction.prdtm, "YYYYMMDD hh:mm").format(
                            "h:mm a"
                          )}
                        </span>
                      </div>
                      <span className="text-sm">
                        {predictionText(prediction.prdctdn)}
                      </span>
                    </div>
                  );
                })}
          </div>
          <div className="flex items-end justify-between text-sm pt-2 content-end flex-row-reverse">
            <VehicleBadge vehicleType={vehicleType} busNumber={vehicle.properties.vid} />
          </div>
        </AccordionContent>
      ) : (
        <AccordionContent>
          <div className="flex items-end justify-between text-sm pt-2">
            {nearest && vehicle.properties.agency === 'transit-windsor' && (
              <div className="text-gray-700 dark:text-zinc-300 flex flex-col">
                <span>near stop:</span>{" "}
                <span className="font-semibold">
                  {nearest.properties.stopName}
                </span>
              </div>
            )}
            {
              vehicle.properties.agency === 'qline' && (
                <div>
                  <span className="font-normal text-gray-500">
                    {vehicle.properties.status}
                  </span>
                </div>
              )
            }
            <VehicleBadge vehicleType={vehicleType} busNumber={vehicle.properties.vid} />
          </div>
        </AccordionContent>
      )}
    </Accordion.Item>
  );
};

export default RoutePredictionItem;
