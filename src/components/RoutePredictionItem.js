import * as Accordion from "@radix-ui/react-accordion";
import React, { useEffect } from "react";
import { AccordionContent, AccordionTrigger } from "./AccordionTrigger";
import dayjs from "dayjs";
import {predictionText} from './PredictionListItem'
const RoutePredictionItem = ({ vehicle, now, predictions }) => {
  let {
    routeColor,
    routeTextColor,
    routeShortName,
    routeLongName,
    direction,
    prediction,
    description,
    headsign,
    nextStop,
    vid,
  } = vehicle.properties;

  let timepoints = new Set(
    Array.from(
      vehicle.properties.trips
        .map((t) =>
          t.stopTimes
            .filter((st) => st.timepoint === 1)
            .map((st) => st.stop.stopCode)
        )
        .flat()
    )
  );

  console.log(nextStop)
  console.log(predictions)

  return (
    <Accordion.Item className="AccordionItem" value={vid} on>
      <AccordionTrigger>
        <div className="flex items-center justify-between gap-2 text-xs flex-grow">
          <div className="flex items-center justify-between gap-2 w-full flex-grow">
            <div className="flex items-center gap-2">
              <span
                className="w-8 h-8 font-extrabold text-center justify-center items-center flex bg-white"
                style={{
                  background: `${routeColor}`,
                  color: `${routeTextColor}`,
                }}
              >
                {routeShortName}
              </span>
              <div className="flex flex-col justify-start text-left">
                <span className="font-semibold text-xs">
                  {" "}
                  {description.replace("bound", "")} to{" "}
                </span>
                <span className="text-sm">{headsign}</span>
              </div>
            </div>
            <div className="flex flex-col justify-end">
              <span className="text-xs block text-right mr-2 text-gray-400">
                {nextStop && (<>
                <span>next stop, {predictions[0].prdctdn === 'DUE' ? `now:` : ` in ${predictions[0].prdctdn}m:`}</span>
                </>)}
              </span>
              <span className="text-sm mr-2 text-right">
                {nextStop && nextStop.stpnm}
              </span>
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-0 text-sm">
        <span className="font-bold pb-1 block">Next major stops:</span>
        <div className="gap-1 flex flex-col">
          {predictions
            .filter((prd) => [...timepoints].indexOf(prd.stpid) > -1)
            .slice(0, 5)
            .map((prediction, idx) => {
              return (
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span>{prediction.stpnm}</span>
                    <span className="text-xs text-gray-500 font-semibold">
                      {dayjs(prediction.prdtm, "YYYYMMDD hh:mm").format(
                        "h:mm a"
                      )}
                    </span>
                  </div>
                  <span className="text-base font-semibold">{predictionText(prediction.prdctdn)}</span>
                </div>
              );
            })}
        </div>
      </AccordionContent>
    </Accordion.Item>
  );
};

export default RoutePredictionItem;
