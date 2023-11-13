import React from "react";
import { Link } from "gatsby";
import { AccordionContent, AccordionTrigger } from "./AccordionTrigger";
import * as Accordion from "@radix-ui/react-accordion";
import dayjs from "dayjs";

export const predictionText = (prdctdn) => {
  if (prdctdn === "DUE") {
    return <span className="text-base font-bold">now</span>;
  } else {
    return <span className="text-base font-bold">{prdctdn} min</span>;
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
  routeLongName,
  routeColor = "#000",
  routeTextColor = "#fff",
  agency,
  prediction,
  direction,
  vehicle
}) => {

  return (
    <Accordion.Item
      className="AccordionItem"
      value={prediction.vid}
    >
      <AccordionTrigger>
        <div className="flex items-center justify-between gap-2 text-xs flex-grow">
          <div className="flex items-center justify-between gap-2 w-full flex-grow">
            <div className="flex items-center gap-2">
              <span
                className="w-6 h-6 text-2xs font-bold text-center justify-center items-center flex bg-white"
                style={{
                  background: `${routeColor}`,
                  color: `${routeTextColor}`,
                }}
              >
                {routeShortName}
              </span>
              <div className="flex flex-col justify-start text-left">
                <span className="font-semibold text-sm">{routeLongName}</span>
                <span className="text-sm">
                  {direction.directionDescription?.replace("bound", "")} to{" "}
                  {direction.directionHeadsign}
                </span>
              </div>
            </div>
            <div className="flex flex-col justify-end">

            <span className="text-base font-bold mr-2 text-right">
              {predictionText(prediction.prdctdn)}
            </span>
            <span className="text-xs block text-right mr-2 text-gray-400 -mt-1">
              {prediction.prdctdn === "DUE" ? "arriving" : "away"}
            </span>
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-0 text-sm">
        <span>
          {vehicle && (
            <ul className="list-disc list-inside">
              <li>Arriving at {dayjs(prediction.prdtm, 'YYYYMMDD HH:MM').format('h:mm a')}</li>
              <li>Bus number: {vehicle.vid}</li>
            </ul>
          )}
          {!vehicle && <span>No vehicle information available.</span>}
        </span>
      </AccordionContent>
    </Accordion.Item>
  );
};

export default PredictionListItem;
