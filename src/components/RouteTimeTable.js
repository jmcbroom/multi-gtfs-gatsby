import React from "react";
import { formatArrivalTime } from "../util";
import { Link } from "gatsby";
import { faChevronCircleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { sortTripsByFrequentTimepoint } from "../util";

const RouteTimeTable = ({ trips, route, agency, service, direction }) => {

  let {routeColor, feedIndex} = route;

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

  return (
    <div className="mx-auto" style={{width: '100%', overflow: 'auto', maxHeight: '700px'}}>
    <table className="tabular mx-auto" style={{tableLayout: 'fixed'}}>
      <thead className="z-10 mt-2" style={{ position: 'sticky' }}>
        <tr className="bg-gray-100" style={{ position: 'sticky' }}>
          {timepoints.map((s, k) => (
            <th key={`${s.stop.stopCode} + ${k}`} className="text-sm pt-2 timetable-header w-40 p-0 bg-white tabular">
              <div className="flex flex-col items-center justify-end h-24 bg-white">
                <Link to={`/${agency.slug.current}/stop/${agency.slug.current === 'ddot' ? s.stop.stopCode : s.stop.stopId}`} className="leading-none text-sm font-bold bg-white mb-2 px-2">
                  {s.stop.stopName}
                </Link>
                <FontAwesomeIcon icon={faChevronCircleRight} size="lg" className="relative z-10 bg-white text-gray-700" />
              </div>
              <div style={{
                position: 'absolute',
                right: k === 0 ? -10 : null,
                height: ".5em",
                bottom: ".5em",
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
                    className={`text-center timetable-entry bg-gray-100 text-gray-600 border-r-2 border-dotted`}>
                    -
                  </td>
                )
              };
              if (filtered.length > 1) {
                let indices = timepoints.map(t => t.stop.stopId === tp.stop.stopId).reduce((a, e, i) => (e === true) ? a.concat(i) : a, [])
                let value = indices.indexOf(j)
                return (
                  <td key={`${t.id}-${i}-${j}`}
                    className={`text-center text-sm border-r-2 timetable-entry ${formatArrivalTime(filtered[value].arrivalTime).indexOf("p") > -1 ? `font-semibold` : `font-base`}`}>
                    {formatArrivalTime(filtered[value].arrivalTime).slice(0, -3)}
                  </td>
                )
              }
              return (
                <td key={`${t.id}-${i}-${j}`}
                  className={j < timepoints.length - 1 ?
                    `
                    text-center text-sm border-r-2 border-opacity-25 border-dotted border-gray-700 z-0 timetable-entry tabular 
                    ${filtered.length === 0 && `bg-gray-100`} 
                    ${formatArrivalTime(filtered[0].arrivalTime).indexOf("p") > -1 ? `font-semibold` : `font-base`}
                    ` :
                    `
                    text-center text-sm z-0 timetable-entry 
                    ${filtered.length === 0 && `bg-gray-100`} 
                    ${formatArrivalTime(filtered[0].arrivalTime).indexOf("p") > -1 ? `font-semibold` : `font-base`}
                    `
                    }>
                  {filtered.length > 0 ?
                    formatArrivalTime(filtered[0].arrivalTime).slice(0, -3) :
                    `-`
                  }
                </td>
              )
            })}
          </tr>
        ))}
                {/* <tr style={{ }}>
          {timepoints.map((s, k) => (
            <th key={`${s.stop.stopCode} + ${k}`} className="text-sm pt-2 timetable-header w-40 p-0 bg-white tabular">
              <div style={{
                position: 'absolute',
                right: k === 0 ? -10 : null,
                height: ".5em",
                top: "1em",
                zIndex: 1,
                width: (k === 0 || k + 1 === timepoints.length) ? "55%" : "100%",
                backgroundColor: `${routeColor === 'FFFFFF' ? '5f6369' : routeColor}`,
                verticalAlign: "center"
              }} />
              <div className="flex flex-col items-center justify-start h-24 bg-white">
                <FontAwesomeIcon icon={faChevronCircleRight} size="lg" className="relative z-10 bg-white text-gray-700" />
                <Link to={`/${agency.slug.current}/stop/${agency.slug.current === 'ddot' ? s.stop.stopCode : s.stop.stopId}`} className="leading-none text-sm font-bold bg-white mt-2 px-2">
                  {s.stop.stopName}
                </Link>
              </div>
            </th>
          ))}
        </tr> */}

      </tbody>
    </table>
    </div>
  )
}

export default RouteTimeTable;