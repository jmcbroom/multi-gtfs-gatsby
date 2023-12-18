import * as Accordion from "@radix-ui/react-accordion";
import React from "react";
import "../styles/accordion.css";
import RoutePredictionItem from "./RoutePredictionItem";
import { getVehicleType } from "../util";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWifi } from "@fortawesome/free-solid-svg-icons";

const RoutePredictions = ({
  vehicles,
  setTrackedBus,
  predictions,
  routeType = 3,
}) => {
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
        {vehicles &&
          vehicles.features?.map((vehicle, idx) => {
            if (vehicle === undefined) {
              return null;
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
      </Accordion.Root>
    </div>
  );
};

export default RoutePredictions;
