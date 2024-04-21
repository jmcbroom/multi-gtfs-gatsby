import * as Accordion from "@radix-ui/react-accordion";
import React from "react";
import "../styles/accordion.css";
import RoutePredictionItem from "./RoutePredictionItem";
import { getVehicleType } from "../util";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWifi } from "@fortawesome/free-solid-svg-icons";

import _ from "lodash";

const RoutePredictions = ({
  vehicles,
  setTrackedBus,
  predictions,
  routeType = 3,
}) => {
  
  let directions = vehicles?.features[0]?.properties.directions;

  let vehiclesByDirection = _.groupBy(
    vehicles?.features,
    "properties.description"
  );

  return (
    <div className="">
      {vehicles?.features?.length > 0 ? (
        <div className="grayHeader text-gray-800 dark:text-gray-300 flex items-center justify-between">
          <div>
            {vehicles.features.length}
            {` `}
            {getVehicleType(routeType)}
            {/* add plural */}
            {vehicles?.features?.length > 1
              ? getVehicleType(routeType).slice(-1) === "s"
                ? `es`
                : `s`
              : ``}{" "}
            tracked
          </div>
          <FontAwesomeIcon icon={faWifi} className="text-green-500" />
        </div>
      ) : (
        <div className="grayHeader text-gray-400 flex items-center justify-between">
          <div>
            No {getVehicleType(routeType)}
            {/* add plural */}
            {getVehicleType(routeType).slice(-1) === "s"
              ? `es`
              : `s`} tracked{" "}
          </div>
          <FontAwesomeIcon icon={faWifi} className="text-gray-300" />
        </div>
      )}

      <Accordion.Root
        className="AccordionRoot"
        type="single"
        defaultValue={null}
        onValueChange={(value) => {
          setTrackedBus(value);
        }}
        collapsible
      >
        {directions &&
          Object.keys(vehiclesByDirection).map((direction, idx) => {
            return (
              <div>
                <h4 className="m-0">
                  {direction} to {vehiclesByDirection[direction][0].properties.headsign}
                </h4>
                {vehiclesByDirection[direction] &&
                  vehiclesByDirection[direction].map((vehicle, idx) => {
                    if (vehiclesByDirection[direction].length === 0) {
                      return <div>No buses tracking in this direction</div>;
                    }
                    return (
                      <RoutePredictionItem
                        vehicle={vehicle}
                        predictions={predictions?.filter(
                          (p) => p.vid === vehicle.properties.vid
                        )}
                        key={vehicle?.properties.vid || idx}
                        vehicleType={getVehicleType(routeType)}
                      />
                    );
                  })}
              </div>
            );
          })}
      </Accordion.Root>
    </div>
  );
};

export default RoutePredictions;
