import * as Accordion from "@radix-ui/react-accordion";
import React from "react";
import "../styles/accordion.css";
import { matchPredictionToRoute, matchPredictionToVehicle } from "../util";
import PredictionListItem from "./PredictionListItem";

const StopPredictions = ({
  predictions,
  times,
  routes,
  agency,
  trackedBus,
  setTrackedBus,
  vehicles
}) => {
  return (
    <div>
      <div className="grayHeader">Buses arriving here soon</div>
      <Accordion.Root
        className="AccordionRoot"
        type="single"
        defaultValue={null}
        onValueChange={(value) => {
          setTrackedBus(value);
        }}
        collapsible
      >
        {predictions.map((prediction, idx) => {
          let { route, direction } = matchPredictionToRoute(prediction, routes);
          let vehicle;
          if(vehicles) {
            vehicle = matchPredictionToVehicle(prediction, vehicles);
          }
          return (
            <PredictionListItem
              {...route}
              agency={agency}
              prediction={prediction}
              vehicle={vehicle}
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

export default StopPredictions;
