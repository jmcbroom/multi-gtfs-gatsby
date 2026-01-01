import React, { useRef, useState, useEffect } from "react";
import { Link } from "gatsby";
import StopTimeLabel from "./StopTimeLabel";
import { faChevronCircleRight, faPlane } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { sortTripsByFrequentTimepoint } from "../util";
import { getStopIdentifier } from "../stopUtils";

const RouteTimeTable = ({ trips, route, agency, service, direction }) => {
  const scrollContainerRef = useRef(null);
  const [scrollState, setScrollState] = useState({ left: false, right: true, top: false, bottom: true });

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateScrollState = () => {
      const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } = container;
      setScrollState({
        left: scrollLeft > 5,
        right: scrollLeft < scrollWidth - clientWidth - 5,
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
  }, [service, direction]);

  let {routeColor} = route;

  // Remove # prefix if present, and handle white color
  if (routeColor?.startsWith('#')) {
    routeColor = routeColor.slice(1);
  }
  if (routeColor?.toLowerCase() === 'ffffff') {
    routeColor = 'eee';
  }

  let borderedRowStyle = {
    borderBottom: `2px solid #${routeColor}`
  }
  let selectedTrips = trips[service][direction];
  let sortedTrips = [];
  let timepoints = null;
  if (selectedTrips !== undefined && selectedTrips.length > 0) {
    sortedTrips = sortTripsByFrequentTimepoint(selectedTrips).trips;
    timepoints = sortTripsByFrequentTimepoint(selectedTrips).timepoints;
  }
  else {
    sortedTrips = [];
    timepoints = [];
  }

  // needed to add this filter back in... but it's interesting to think about letting users see all times.
  timepoints = timepoints.filter(tp => tp.timepoint)

  const shortenTimepointName = (timepointName) => {
    let split = timepointName.split(' - ');
    if (split.length > 1) {
      timepointName = split[0]
    }
    return timepointName;
  }

  return (
    <div className="relative mx-auto w-full">
      {/* Scroll shadow indicators */}
      <div
        className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 z-20 transition-opacity duration-200"
        style={{
          opacity: scrollState.left ? 1 : 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.06), transparent)'
        }}
      />
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 z-20 transition-opacity duration-200"
        style={{
          opacity: scrollState.right ? 1 : 0,
          background: 'linear-gradient(to left, rgba(0,0,0,0.06), transparent)'
        }}
      />
      <div
        className="pointer-events-none absolute left-0 right-0 bottom-0 h-4 z-20 transition-opacity duration-200"
        style={{
          opacity: scrollState.bottom ? 1 : 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.04), transparent)'
        }}
      />

      <div
        ref={scrollContainerRef}
        className="overflow-auto overscroll-contain"
        style={{
          maxHeight: '70vh',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
        }}
      >
        <table className="tabular" style={{tableLayout: 'fixed'}}>
          <thead className="z-10" style={{ position: 'sticky', top: 0 }}>
            <tr className="bg-white dark:bg-black">
              {timepoints.map((s, k) => (
                <th key={`${s.stop.stopCode} + ${k}`} className="text-[10px] md:text-sm pt-1 md:pt-2 timetable-header w-[56px] md:w-40 p-0 bg-white dark:bg-black tabular relative">
                  <div className="flex flex-col items-center justify-end h-12 md:h-24 bg-white dark:bg-black">
                    <Link to={`/${agency.slug.current}/stop/${getStopIdentifier(s.stop, agency)}`} className="leading-tight md:leading-none text-[9px] md:text-sm font-bold mb-0.5 md:mb-2 px-0.5 md:px-2">
                      {(s.stop.stopName.includes("DTW") || s.stop.stopName.includes("METRO AIRPORT")) && <FontAwesomeIcon icon={faPlane} size="1x" className="mx-1" />}
                      {shortenTimepointName(s.stop.stopName)}
                    </Link>
                    <FontAwesomeIcon icon={faChevronCircleRight} className="relative z-10 bg-white dark:bg-black text-gray-700 dark:text-zinc-400 text-xs md:text-lg" />
                  </div>
                  <div style={{
                    position: 'absolute',
                    left: k === 0 ? 'calc(50% - 8px)' : 0,
                    right: k + 1 === timepoints.length ? 'calc(50% - 8px)' : 0,
                    height: ".5em",
                    bottom: ".45em",
                    zIndex: 1,
                    backgroundColor: `#${routeColor}`,
                  }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>


          {sortedTrips.map((t, i) => (
            <tr key={t.tripId} style={(i + 1) % 5 === 0 ? borderedRowStyle : {}}>
              {timepoints.map((tp, j) => {

                let filtered = t.stopTimes.filter(st => {
                  return st.stop.stopId === tp.stop.stopId;
                });

                if (filtered.length === 0) {
                  return (
                    <td key={`${t.id}-${i}-${j}`}
                      className={`text-center py-0.5 md:py-2 px-0.5 md:px-2 text-[10px] md:text-sm bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-zinc-600 border-r md:border-r-2 border-dotted dark:border-zinc-700`}>
                      -
                    </td>
                  )
                };
                if (filtered.length > 1) {
                  let indices = timepoints.map(t => t.stop.stopId === tp.stop.stopId).reduce((a, e, i) => (e === true) ? a.concat(i) : a, [])
                  let value = indices.indexOf(j)
                  return (
                    <td key={`${t.id}-${i}-${j}`}
                      className={`text-center py-0.5 md:py-2 px-0.5 md:px-2 text-[10px] md:text-sm border-r md:border-r-2 bg-white dark:bg-black`}>
                      <StopTimeLabel arrivalTime={filtered[value].arrivalTime} />
                    </td>
                  )
                }
                return (
                  <td key={`${t.id}-${i}-${j}`}
                    className={j < timepoints.length - 1 ?
                      `
                      text-center py-0.5 md:py-2 px-0.5 md:px-2 text-[10px] md:text-sm border-r md:border-r-2 border-opacity-25 border-dotted border-gray-700 dark:border-zinc-700 z-0 tabular
                      ${filtered.length === 0 ? `bg-gray-100 dark:bg-zinc-900` : `bg-white dark:bg-black`}
                      ` :
                      `
                      text-center py-0.5 md:py-2 px-0.5 md:px-2 text-[10px] md:text-sm z-0
                      ${filtered.length === 0 ? `bg-gray-100 dark:bg-zinc-900` : `bg-white dark:bg-black`}
                      `
                      }>
                    {filtered.length > 0 ?
                      <StopTimeLabel arrivalTime={filtered[0].arrivalTime} /> :
                      `-`
                    }
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}

export default RouteTimeTable;