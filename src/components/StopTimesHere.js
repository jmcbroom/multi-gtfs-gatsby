import * as Accordion from "@radix-ui/react-accordion";
import _ from "lodash";
import React, { useState } from "react";
import "../styles/accordion.css";
import { dayOfWeek, getTripsByServiceDay } from "../util";
import { AccordionContent, AccordionTrigger } from "./AccordionTrigger";
import ServicePicker from "./ServicePicker";
import StopTimeLabel from "./StopTimeLabel";
import RouteSlim from "./RouteSlim";

const StopTimesHere = ({ times, routes, agency, serviceDays }) => {

  let timesByRoute = _.groupBy(times, "trip.route.routeShortName");

  Object.keys(timesByRoute).forEach((key) => {
    timesByRoute[key] = getTripsByServiceDay(
      timesByRoute[key].map((time) => {
        return { ...time.trip, arrivalTime: time.arrivalTime };
      }),
      serviceDays
    );
  });

  let defaultService = dayOfWeek();

  let [service, setService] = useState(defaultService);

  return (
    <div>
      <div className="grayHeader">Routes that stop here</div>
      <Accordion.Root
        className="AccordionRoot"
        type="single"
        defaultValue={routes[0]?.displayShortName}
        collapsible
      >
        {routes.map((route, idx) => {
          return (
            <Accordion.Item
              key={route.displayShortName}
              className="AccordionItem"
              value={route.displayShortName}
            >
              <AccordionTrigger>
                <RouteSlim {...route} agency={agency} className="px-2" />
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-2 mt-2">

                <ServicePicker
                  services={timesByRoute[route.routeShortName]}
                  service={service}
                  setService={setService}
                  />
                <span className="text-gray-500 text-sm py-1">
                  {timesByRoute[route.routeShortName][service].length > 0
                    ? `Buses arrive here at:`
                    : `There is no service on this route on ${
                      service.startsWith("s")
                      ? `${service.slice(0,1).toUpperCase()}${service.slice(1)}s.`
                      : `weekday`
                    }`}
                </span>

                <ul className="columns-3 sm:columns-4 md:columns-5 gap-0 border-l-2 border-dotted border-grey-700 dark:border-zinc-700 text-center list-none ml-0">
                  {timesByRoute[route.routeShortName][service].map((trip) => (
                    <li
                    className="border-r-2 border-dotted border-grey-700 dark:border-zinc-700 tabular"
                    key={trip.tripId}
                    >
                      <StopTimeLabel arrivalTime={trip.arrivalTime} />
                    </li>
                  ))}
                </ul>
                </div>
              </AccordionContent>
            </Accordion.Item>
          );
        })}
      </Accordion.Root>
    </div>
  );
};

export default StopTimesHere;