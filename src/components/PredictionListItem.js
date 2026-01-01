import * as Accordion from "@radix-ui/react-accordion";
import dayjs from "dayjs";
import React from "react";
import { AccordionContent, AccordionTrigger } from "./AccordionTrigger";
import RouteSlim from "./RouteSlim";
import VehicleBadge from "./VehicleBadge";

export const predictionText = (prdctdn) => {
  let className = "text-sm font-bold mr-2 text-right";

  if (prdctdn === "DUE") {
    return <span className={className}>now</span>;
  } else {
    return <span className={className}>{prdctdn} min</span>;
  }
};

/**
 * Displays the number badge and name of a route.
 * Pass a spread `route` GraphQL object with the following parameters:
 * @param {Number} feedIndex
 * @param {String} shortName
 * @param {String} longName
 * @param {Number} routeColor
 * @param {Number} routeTextColor
 */
const PredictionListItem = ({
  routeShortName,
  displayShortName,
  routeLongName,
  routeColor = "#000",
  routeTextColor = "#fff",
  agency,
  prediction,
  direction,
  vehicle,
}) => {
  const content = (
    <div className="flex items-center justify-between gap-2 flex-grow">
      <div className="flex items-center justify-between gap-2 w-full flex-grow">
        <RouteSlim
          {...{
            routeShortName,
            displayShortName,
            routeLongName,
            routeColor,
            routeTextColor,
            agency,
            direction,
          }}
          size="small"
        />
        <div className="flex flex-col justify-end">
          {predictionText(prediction.prdctdn)}
          <span className="text-xs block text-right mr-2 text-gray-400 -mt-1">
            {prediction.prdctdn === "DUE" ? "arriving" : "away"}
          </span>
        </div>
      </div>
    </div>
  );

  // If no vehicle, show without accordion/dropdown
  if (!vehicle) {
    return (
      <div className="AccordionItem py-3 px-2 flex items-center justify-between">
        {content}
      </div>
    );
  }

  // With vehicle, show accordion with dropdown
  return (
    <Accordion.Item className="AccordionItem" value={prediction.vid}>
      <AccordionTrigger>
        {content}
      </AccordionTrigger>
      <AccordionContent>
        <div className="flex items-center justify-between text-sm text-gray-700 dark:text-zinc-400 pt-2">
          <span>
            arriving at{" "}
            <span className="font-semibold">
              {dayjs(prediction.prdtm, "YYYYMMDD HH:MM").format("h:mm a")}
            </span>
          </span>
          <VehicleBadge busNumber={vehicle.vid} />
        </div>
      </AccordionContent>
    </Accordion.Item>
  );
};

export default PredictionListItem;
