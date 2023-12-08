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
  return (
    <Accordion.Item className="AccordionItem" value={prediction.vid}>
      <AccordionTrigger>
        <div className="flex items-center justify-between gap-2 text-xs flex-grow">
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
            />
            <div className="flex flex-col justify-end">
              {predictionText(prediction.prdctdn)}
              <span className="text-xs block text-right mr-2 text-gray-400 -mt-1">
                {prediction.prdctdn === "DUE" ? "arriving" : "away"}
              </span>
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {vehicle && (
          <div className="flex items-center justify-between text-sm text-gray-700 dark:text-zinc-400 pt-2">
            <span>
              arriving at{" "}
              <span className="font-semibold">
                {dayjs(prediction.prdtm, "YYYYMMDD HH:MM").format("h:mm a")}
              </span>
            </span>
            <VehicleBadge busNumber={vehicle.vid} />
          </div>
        )}
        {!vehicle && (
          <span className="text-gray-600 dark:text-zinc-500 text-xs">
            No vehicle information available.
          </span>
        )}
      </AccordionContent>
    </Accordion.Item>
  );
};

export default PredictionListItem;
