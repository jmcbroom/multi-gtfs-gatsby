import * as Accordion from "@radix-ui/react-accordion";
import _ from "lodash";
import React, { useState, useEffect, useRef } from "react";
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

  // Combined times for all routes
  let allTimes = getTripsByServiceDay(
    times.map((time) => {
      return { ...time.trip, arrivalTime: time.arrivalTime };
    }),
    serviceDays
  );

  let defaultService = dayOfWeek();

  let [service, setService] = useState(defaultService);
  let [viewMode, setViewMode] = useState("byRoute"); // "byRoute" or "combined"
  const listRef = useRef(null);

  // Find index of first trip after current time
  const findCurrentTimeIndex = (trips) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return trips.findIndex((trip) => {
      const tripMinutes = trip.arrivalTime.hours * 60 + trip.arrivalTime.minutes;
      return tripMinutes >= currentMinutes;
    });
  };

  // Scroll to current time when switching to combined view
  useEffect(() => {
    if (viewMode === "combined" && listRef.current && allTimes[service]?.length > 0) {
      const currentIndex = findCurrentTimeIndex(allTimes[service]);
      if (currentIndex > 0) {
        // Small delay to ensure DOM is rendered
        setTimeout(() => {
          const items = listRef.current?.querySelectorAll('li');
          if (items && items[currentIndex]) {
            // Scroll within the container, not the page
            listRef.current.scrollTop = items[currentIndex].offsetTop - listRef.current.offsetTop;
          }
        }, 50);
      }
    }
  }, [viewMode, service]);

  // Get route data for display in combined view
  const getRouteForTrip = (trip) => {
    return routes.find(r => r.routeShortName === trip.route?.routeShortName) || {
      displayShortName: trip.route?.routeShortName || '?',
      routeColor: trip.route?.routeColor || '#000',
      routeTextColor: trip.route?.routeTextColor || '#fff'
    };
  };

  return (
    <div>
      <div className="grayHeader">This stop's bus schedule</div>
      <div className="flex items-center justify-between gap-2 p-2 bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
        <ServicePicker
          services={allTimes}
          service={service}
          setService={setService}
        />
        <div className="inline-flex rounded bg-gray-200 dark:bg-zinc-700 p-0.5 flex-shrink-0">
          <button
            className={`text-xs px-2 py-0.5 rounded transition-colors ${viewMode === 'combined' ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'}`}
            onClick={() => setViewMode('combined')}
          >
            All
          </button>
          <button
            className={`text-xs px-2 py-0.5 rounded transition-colors ${viewMode === 'byRoute' ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'}`}
            onClick={() => setViewMode('byRoute')}
          >
            By route
          </button>
        </div>
      </div>

      {viewMode === "combined" ? (
        <div className="flex flex-col gap-2 p-2">
          <span className="text-gray-500 text-sm py-1">
            {allTimes[service].length > 0
              ? null
              : `There is no service on ${
                service.startsWith("s")
                ? `${service.slice(0,1).toUpperCase()}${service.slice(1)}s.`
                : `weekdays`
              }`}
          </span>
          <ul ref={listRef} className="flex flex-col gap-1 list-none ml-0 max-h-96 overflow-y-auto">
            {allTimes[service].map((trip) => {
              const routeData = getRouteForTrip(trip);
              return (
                <li
                  className="flex items-center gap-2 py-0.5"
                  key={trip.tripId}
                >
                  <span className="w-16 flex-shrink-0">
                    <StopTimeLabel arrivalTime={trip.arrivalTime} ampm={true} />
                  </span>
                  <RouteSlim {...routeData} direction={{ directionHeadsign: trip.tripHeadsign }} size="small" />
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <Accordion.Root
          className="AccordionRoot"
          type="single"
          defaultValue={routes[0]?.displayShortName}
          collapsible
        >
          {routes.map((route) => {
            return (
              <Accordion.Item
                key={route.displayShortName}
                className="AccordionItem"
                value={route.displayShortName}
              >
                <AccordionTrigger>
                  <RouteSlim {...route} agency={agency} direction={route.directions[0]} className="px-2" />
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="text-gray-500 text-sm py-1">
                      {timesByRoute[route.routeShortName][service].length > 0
                        ? `Buses arrive here at:`
                        : `There is no service on this route on ${
                          service.startsWith("s")
                          ? `${service.slice(0,1).toUpperCase()}${service.slice(1)}s.`
                          : `weekdays`
                        }`}
                    </span>
                    <ul className="columns-4 sm:columns-5 md:columns-5 lg:columns-6 gap-2 list-none ml-0">
                      {timesByRoute[route.routeShortName][service].map((trip) => (
                        <li
                          className="py-0.5 tabular"
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
      )}
    </div>
  );
};

export default StopTimesHere;