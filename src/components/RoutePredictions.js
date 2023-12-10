import * as Accordion from "@radix-ui/react-accordion";
import React from "react";
import "../styles/accordion.css";
import RoutePredictionItem from "./RoutePredictionItem";
import { getVehicleType } from "../util";

const RoutePredictions = ({
  vehicles,
  setTrackedBus,
  predictions,
  now,
  routeType = 3,
}) => {
  return (
    <div className="">
      <div className="grayHeader">
        {vehicles?.features?.length || `No`} {getVehicleType(routeType)}
        {/* add plural */}
        {vehicles?.features?.length > 1
          ? getVehicleType(routeType).slice(-1) === "s"
            ? `es`
            : `s`
          : ``}{" "}
        currently being tracked{" "}
      </div>
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
          vehicles.features.map((vehicle, idx) => {
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
        {!vehicles && (
          <div className="p-2">No buses are being tracked right now.</div>
        )}
      </Accordion.Root>
    </div>
  );
};

export default RoutePredictions;
