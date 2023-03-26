import * as Accordion from "@radix-ui/react-accordion";
import React from "react";
import "../styles/accordion.css";
import RoutePredictionItem from "./RoutePredictionItem";

const RoutePredictions = ({ vehicles, setTrackedBus, predictions, now }) => {
  return (
    <div className="">
      <div className="grayHeader">{vehicles?.features?.length || `No`} bus{vehicles?.features?.length > 1 && `es`} currently being tracked </div>
      <Accordion.Root
        className="AccordionRoot"
        type="single"
        defaultValue={null}
        onValueChange={(value) => {
          setTrackedBus(value);
        }}
        collapsible
      >
        {vehicles && predictions && vehicles.features.map((vehicle, idx) => {
          return <RoutePredictionItem vehicle={vehicle} now={now} predictions={predictions?.filter(p => p.vid === vehicle.properties.vid)} />;
        })}
        {!vehicles && (
          <div className="p-2">No buses are being tracked right now.</div>
        )}
      </Accordion.Root>
    </div>
  );
};

export default RoutePredictions;
