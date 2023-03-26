import * as Accordion from "@radix-ui/react-accordion";
import React from "react";
import "../styles/accordion.css";
import PredictionListItem from "./PredictionListItem";

const matchPredictionToRoute = (prediction, routes) => {
  let route = routes.filter((r) => r.routeShortName === prediction.rt)[0];
  let direction = route.directions.filter(
    (direction) =>
      direction.directionDescription.toLowerCase().slice(0, 3) ===
      prediction.rtdir.toLowerCase().slice(0, 3)
  )[0];
if(!direction) { direction = `unknown` }
  return { route, direction };
};

const matchPredictionToVehicle = (prediction, vehicles) => {
  let vehicle = vehicles.filter(
    (v) => v.vid === prediction.vid
  )[0];
  return vehicle;
};

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
      <div className="underline-title mb-2">Buses arriving here soon</div>
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
