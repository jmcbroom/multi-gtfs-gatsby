import React from "react";
import { Link } from "gatsby";
import StopTimeLabel from "./StopTimeLabel";
import { faChevronCircleRight, faPlane } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { sortTripsByFrequentTimepoint } from "../util";

const RouteTimeTable = ({ trips, route, agency, service, direction }) => {
  let {routeColor} = route;

  // white routeColor needs to be gray
  if(routeColor === 'ffffff'){
    routeColor = 'eee'
  }

  let borderedRowStyle = {
    borderBottom: `2px solid ${routeColor}`
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

  // const initcap = (str) => {
  //   return str.toLowerCase().replace(/(?:^|\s)\w/g, function(match) {
  //     return match.toUpperCase();
  //   });
  // }

  const shortenTimepointName = (timepointName) => {
    let split = timepointName.split(' - ');
    if (split.length > 1) {
      timepointName = split[0]
    }

    // timepointName = initcap(timepointName);

    // timepointName = timepointName.replace('Transit Center', 'TC');
    // timepointName = timepointName.replace('Park & Ride', 'P&R');
    // timepointName = timepointName.replace('Park And Ride', 'P&R');
    // timepointName = timepointName.replace('Metro Airport', 'DTW');
    // timepointName = timepointName.replace('Mcnamara', 'McNamara');
    // timepointName = timepointName.replace('Wb', '');
    // timepointName = timepointName.replace('+', '&')
    return timepointName;
  }

  return (
    <div className="mx-auto" style={{width: '100%', overflow: 'auto', maxHeight: '700px'}}>
    <table className="tabular mx-auto" style={{tableLayout: 'fixed'}}>
      <thead className="z-10 mt-2" style={{ position: 'sticky' }}>
        <tr className="bg-gray-100" style={{ position: 'sticky' }}>
          {timepoints.map((s, k) => (
            <th key={`${s.stop.stopCode} + ${k}`} className="text-sm pt-2 timetable-header w-40 p-0 bg-white dark:bg-black tabular">
              <div className="flex flex-col items-center justify-end h-24 bg-white dark:bg-black">
                <Link to={`/${agency.slug.current}/stop/${s.stop[agency.stopIdentifierField]}`} className="leading-none text-sm font-bold mb-2 px-2">
                  {(s.stop.stopName.includes("DTW") || s.stop.stopName.includes("METRO AIRPORT")) && <FontAwesomeIcon icon={faPlane} size="normal" className="mx-1" />}
                  {shortenTimepointName(s.stop.stopName)}
                </Link>
                <FontAwesomeIcon icon={faChevronCircleRight} size="lg" className="relative z-10 bg-white dark:bg-black text-gray-700 dark:text-zinc-400" />
              </div>
              <div style={{
                position: 'absolute',
                right: k === 0 ? -10 : null,
                height: ".6em",
                bottom: ".3em",
                zIndex: 1,
                width: (k === 0 || k + 1 === timepoints.length) ? "55%" : "100%",
                backgroundColor: `${routeColor === 'FFFFFF' ? '5f6369' : routeColor}`,
                verticalAlign: "center"
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
                    className={`text-center bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-zinc-600 border-r-2 border-dotted dark:border-zinc-700`}>
                    -
                  </td>
                )
              };
              if (filtered.length > 1) {
                let indices = timepoints.map(t => t.stop.stopId === tp.stop.stopId).reduce((a, e, i) => (e === true) ? a.concat(i) : a, [])
                let value = indices.indexOf(j)
                return (
                  <td key={`${t.id}-${i}-${j}`}
                    className={`text-center text-sm border-r-2 bg-white dark:bg-black`}>
                    <StopTimeLabel arrivalTime={filtered[value].arrivalTime} />
                  </td>
                )
              }
              return (
                <td key={`${t.id}-${i}-${j}`}
                  className={j < timepoints.length - 1 ?
                    `
                    text-center text-sm border-r-2 border-opacity-25 border-dotted border-gray-700 dark:border-zinc-700 z-0 tabular 
                    ${filtered.length === 0 ? `bg-gray-100 dark:bg-zinc-900` : `bg-white dark:bg-black`} 
                    ` :
                    `
                    text-center text-sm z-0 
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
  )
}

export default RouteTimeTable;