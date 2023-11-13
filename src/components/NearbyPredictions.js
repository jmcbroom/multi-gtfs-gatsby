import React from "react";
import distance from "@turf/distance";
import dayjs from "dayjs";
import { matchPredictionToRoute } from "../util";
import * as Accordion from "@radix-ui/react-accordion";
import PredictionListItem from "./PredictionListItem";

const NearbyPredictions = ({
  agencies,
  predictions,
  routes,
  position,
  stops,
  allStops,
  setTrackedBus,
}) => {
  let filteredFeedIndices = agencies
    .filter((a) => a.realTimeEnabled)
    .map((a) => a.feedIndex);
  routes = routes.filter((r) => filteredFeedIndices.includes(r.feedIndex));

  let stopsFeatures = [];
  if (!predictions) {
    return <div>No predictions nearby.</div>;
  }
  Object.keys(stops).forEach((agency) => {
    // find the stop in allStops
    let featureStops = stops[agency].map((stop) => {
      let filteredStop = allStops.features.find(
        (s) =>
          parseInt(s.properties.stopCode) ===
            parseInt(stop.properties.stopCode) &&
          s.properties.agencySlug === agency
      );
      let distanceFromPosition = distance(position, stop.geometry.coordinates, {
        units: "feet",
      });
      filteredStop.properties.distance = distanceFromPosition;
      return filteredStop;
    });
    stopsFeatures = [...stopsFeatures, ...featureStops];
  });

  let stopsByDistance = stopsFeatures.sort(
    (a, b) => a.properties.distance - b.properties.distance
  );
  let stopCodesByDistance = stopsByDistance.map((s) => s.properties.stopCode);

  let filteredPredictions = null;
  if (predictions) {
    filteredPredictions = Object.keys(predictions)
      .map((vehicle) => {
        let vehiclePredictions = predictions[vehicle];
        vehiclePredictions = vehiclePredictions.sort(
          (a, b) =>
            stopCodesByDistance.indexOf(a.stpid) -
            stopCodesByDistance.indexOf(b.stpid)
        );
        return vehiclePredictions[0];
      })
      .sort(
        (a, b) =>
          dayjs(a.prdtm, "YYYYMMDD hh:mm") - dayjs(b.prdtm, "YYYYMMDD hh:mm")
      );
  }


  return (
    <div>
      <div className="grayHeader">Next buses to arrive</div>
      <Accordion.Root
        className="AccordionRoot"
        type="single"
        defaultValue={null}
        onValueChange={(value) => {
          setTrackedBus(value);
        }}
        collapsible
      >
        {filteredPredictions.length > 0 &&
          filteredPredictions
            .filter((f) => f !== undefined)
            .map((prediction, idx) => {
              let { route, direction } = matchPredictionToRoute(
                prediction,
                routes
              );
              return (
                <PredictionListItem
                  {...route}
                  agency={agencies[0]}
                  prediction={prediction}
                  direction={direction}
                  key={prediction.vid}
                  className="px-2"
                />
              );
            })}
      </Accordion.Root>
    </div>
  );
};
export default NearbyPredictions;
