import { groupBy } from "lodash-es";
import React, { useState, useEffect, useRef } from "react";
import { dayOfWeek, getTripsByServiceDay } from "../util";
import { useTheme } from "../hooks/ThemeContext";
import ServicePicker from "./ServicePicker";
import StopTimeLabel from "./StopTimeLabel";
import RouteBadge from "./RouteBadge";
import RouteSlim from "./RouteSlim";

const StopTimesHere = ({ times, routes, agency, serviceDays, selectedRoute }) => {
  const { theme } = useTheme();
  const columnRuleColor = theme === 'dark' ? 'rgb(63 63 70)' : 'rgb(229 231 235)'; // zinc-700 / gray-200

  let timesByRoute = groupBy(times, "trip.route.routeShortName");

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

  const [scrollState, setScrollState] = useState({ top: false, bottom: true });

  // Track scroll position for shadow indicators
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;

    const updateScrollState = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setScrollState({
        top: scrollTop > 5,
        bottom: scrollTop < scrollHeight - clientHeight - 5,
      });
    };

    updateScrollState();
    container.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    return () => {
      container.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [selectedRoute, service]);

  // Scroll to current time when showing all routes view
  useEffect(() => {
    if (!selectedRoute && listRef.current && allTimes[service]?.length > 0) {
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
  }, [selectedRoute, service]);

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
      <div className="p-2 bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
        <ServicePicker
          services={allTimes}
          service={service}
          setService={setService}
        />
      </div>

      {!selectedRoute ? (
        <div className="bg-gray-50 dark:bg-zinc-900 p-3">
          <span className="text-xs text-gray-400 dark:text-zinc-500">
            {allTimes[service].length > 0
              ? `All routes arriving at this stop:`
              : `There is no service on ${
                service.startsWith("s")
                ? `${service.slice(0,1).toUpperCase()}${service.slice(1)}s.`
                : `weekdays`
              }`}
          </span>
          <div className="relative mt-2">
            <div
              className="pointer-events-none absolute left-0 right-0 top-0 h-4 z-20 transition-opacity duration-200"
              style={{
                opacity: scrollState.top ? 1 : 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.04), transparent)'
              }}
            />
            <div
              className="pointer-events-none absolute left-0 right-0 bottom-0 h-4 z-20 transition-opacity duration-200"
              style={{
                opacity: scrollState.bottom ? 1 : 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.04), transparent)'
              }}
            />
            <div ref={listRef} className="max-h-64 md:max-h-96 overflow-y-auto">
              <ul className="columns-3 sm:columns-4 lg:columns-5 gap-1 list-none ml-0" style={{ columnRule: `1px solid ${columnRuleColor}` }}>
                {allTimes[service].map((trip) => {
                  const routeData = getRouteForTrip(trip);
                  return (
                    <li
                      className="break-inside-avoid flex items-center justify-around gap-1 sm:gap-1 p-1"
                      key={trip.tripId}
                    >
                      <StopTimeLabel arrivalTime={trip.arrivalTime} />
                      <RouteBadge route={routeData} size="xxs" />
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2">PM times shown in <strong>bold.</strong></p>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-zinc-900">
          {/* Schedule for selected route */}
          {selectedRoute && timesByRoute[selectedRoute] && (
            <div className="p-3">
              {timesByRoute[selectedRoute][service]?.length > 0 ? (
                <div className="text-sm text-gray-600 dark:text-zinc-300 flex items-center justify-center gap-2 mb-2">
                  <span>Bus schedule for:</span>
                  <RouteSlim {...routes.find(r => r.routeShortName === selectedRoute)} size="xs" link={`/${agency.slug.current}/route/${selectedRoute}`} />
                </div>
              ) : (
                <span className="text-xs text-gray-400 dark:text-zinc-500">
                  There is no service on this route on {service.startsWith("s")
                    ? `${service.slice(0,1).toUpperCase()}${service.slice(1)}s.`
                    : `weekdays`}
                </span>
              )}
              <ul
                className="columns-4 sm:columns-5 md:columns-6 gap-2 text-center list-none ml-0 mt-2"
                style={{ columnRule: `1px solid ${columnRuleColor}` }}
              >
                {timesByRoute[selectedRoute][service]?.map((trip) => (
                  <li
                    className="py-0.5 tabular break-inside-avoid"
                    key={trip.tripId}
                  >
                    <StopTimeLabel arrivalTime={trip.arrivalTime} />
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2">PM times shown in <strong>bold.</strong></p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StopTimesHere;