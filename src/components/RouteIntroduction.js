import React from "react";
import { formatArrivalTime, sortTripsByFrequentTimepoint } from "../util";
import RouteStopsList from "./RouteStopsList";

const serviceDisplayText = {
  weekday: `weekdays`,
  saturday: `Saturday`,
  sunday: `Sunday`,
};

const whenItRuns = (trips) => {
  let tripsByDay = {};

  Object.keys(trips).forEach((key) => {
    let tripObject = Object.values(trips[key]);
    let numTrips = tripObject.reduce((acc, val) => acc.concat(val));
    tripsByDay[key] = numTrips.length;
  });

  if (tripsByDay.weekday > 0 && tripsByDay.saturday > 0 && tripsByDay.sunday > 0) {
    return `every day of the week`;
  }

  if (tripsByDay.weekday > 0 && tripsByDay.saturday > 0 && tripsByDay.sunday === 0) {
    return `every day of the week except Sunday`;
  }

  if (tripsByDay.weekday > 0 && tripsByDay.saturday === 0 && tripsByDay.sunday === 0) {
    return `on weekdays, but not on weekends`;
  }

  if (tripsByDay.weekday == 0 && tripsByDay.saturday > 0 && tripsByDay.sunday === 0) {
    return `on Saturdays only`;
  }

  if (tripsByDay.weekday == 0 && tripsByDay.saturday === 0 && tripsByDay.sunday > 0) {
    return `on Saturdays only`;
  }
};

const whatDirectionItRuns = (route) => {
  let cardinalDirections = route.directions
    .map((dir) => dir.directionDescription)
    .map((dir) => dir.replace("bound", ""));

  return cardinalDirections.sort().join(" and ");
};

const RouteIntroEndpoints = ({ agency, route, trips, headsigns }) => {
  let services = Object.keys(trips);
  let directions = Object.keys(headsigns);

  let endpoints = directions.map((d) => {
    return headsigns[d].headsigns[0];
  });

  return (
    <div className="px-2 md:px-0">
      <p className="text-lg">
        The bus travels {whatDirectionItRuns(route)} between{" "}
        {endpoints.map((e, idx) => (
          <span key={e}>
          <span className="font-semibold pl-1">{e}</span>
          {idx === 0 && <span className="pl-1">{` and `}</span>}
          </span>
        ))}.
      </p>
      <p className="text-lg">Here's a list of the major stops in each travel direction:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-8">
        {endpoints.map((end, idx) => (
          <div key={end}>
            <div className="text-lg inline font-bold">
              <span className="">{headsigns[idx]?.description || `unknown`}</span> to{" "}
              <span className="">{end}</span>
            </div>
            <p className="m-0 text-gray-600 dark:text-zinc-400 my-2">
              Major {headsigns[idx]?.description || `unknown`} stops:
            </p>
            <RouteStopsList
              longTrips={route.longTrips}
              direction={idx}
              routeColor={route.routeColor}
              agency={agency}
              timepointsOnly
              small
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const RouteIntroRunTimes = ({ route, trips, headsigns }) => {
  let services = Object.keys(trips);
  let directions = Object.keys(headsigns);

  let endpoints = directions.map((d) => {
    return headsigns[d].headsigns[0];
  });

  let serviceTexts = {};

  let filteredServices = services.filter((s) => trips[s][0] && trips[s][0].length > 0);

  filteredServices.forEach((s) => {
    let sortedTrips = trips[s];

    if (sortedTrips.length == 0) {
      return;
    }

    let reducedTrips = Object.keys(sortedTrips)
      .map((key) => sortedTrips[key])
      .reduce((acc, val) => acc.concat(val));

    let sorted = sortTripsByFrequentTimepoint(reducedTrips);

    let firstTrip = sorted.trips[0];
    let lastTrip = sorted.trips[sorted.trips.length - 1];

    let firstTripStartTime = firstTrip.stopTimes[0].arrivalTime;
    let lastTripEndTime = lastTrip.stopTimes[lastTrip.stopTimes.length - 1].arrivalTime;

    if (
      lastTripEndTime.hours * 60 +
        lastTripEndTime.minutes -
        (firstTripStartTime.hours * 60 + firstTripStartTime.minutes) >
      1400
    ) {
      serviceTexts[s] = `runs 24 hours a day.`;
    } else {
      serviceTexts[s] = (
        <span>
          runs from <span className="font-semibold">{formatArrivalTime(firstTripStartTime)}</span>{" "}
          to <span className="font-semibold">{formatArrivalTime(lastTripEndTime)}</span>{". "}
        </span>
      );
    }
  });

  return (
    <div className="text-lg list-disc list-inside px-2 md:px-0">
      {filteredServices.map((s) => (
        <p key={s}>
          On <span className="font-semibold">{serviceDisplayText[s]}</span>, this bus{" "}
          {serviceTexts[s]}
        </p>
      ))}
    </div>
  );
};

/**
 * A component which displays the table of trips by direction and service day.
 * @param {} param0
 * @returns
 */
const RouteIntroduction = ({ agency, route, trips, headsigns }) => {
  let services = Object.keys(trips);
  let directions = Object.keys(headsigns);

  return (
    <div className="gap-6 flex flex-col p-0 py-4">
      <div>
        <div className="underline-title">When does this bus run?</div>
        <div className="text-lg px-2 md:px-0 my-2">This bus route runs {whenItRuns(trips)}.</div>
        <RouteIntroRunTimes route={route} trips={trips} headsigns={headsigns} />
      </div>

      <div>
        <div className="underline-title">Where does this bus go?</div>
        <RouteIntroEndpoints agency={agency} route={route} trips={trips} headsigns={headsigns} />
      </div>

      <table className="w-auto border-collapse mt-4 w-100 hidden">
        <tbody>
          <tr className="">
            <th className="bg-gray-100"> </th>
            {services.map((s) => (
              <th key={s} className="">
                {s}
              </th>
            ))}
          </tr>
          {directions.map((d) => (
            <tr className="pl-4" key={d}>
              <th className="text-right">
                <ul className="ml-4">
                  {headsigns[d].headsigns.map((h) => (
                    <li className="" key={h}>
                      {h}
                    </li>
                  ))}
                </ul>
              </th>
              {services.map((s) => {
                let sortedTrips = trips[s][d];

                if (sortedTrips.length > 0) {
                  let firstTrip = sortedTrips[0];
                  let lastTrip = sortedTrips[sortedTrips.length - 1];
                  let firstTripStartTime = firstTrip.stopTimes[0].arrivalTime;
                  let lastTripEndTime =
                    lastTrip.stopTimes[lastTrip.stopTimes.length - 1].arrivalTime;

                  return (
                    <td className="text-center px-6" key={`${s}_${d}`}>
                      <p>
                        {formatArrivalTime(firstTripStartTime)} to{" "}
                        {formatArrivalTime(lastTripEndTime)}
                      </p>
                      <p className="text-xs text-center mt-1 text-gray-500">
                        {trips[s][d].length} trips
                      </p>
                    </td>
                  );
                } else {
                  return (
                    <td className="text-center px-6 text-gray-600" key={`${s}_${d}`}>
                      no service
                    </td>
                  );
                }
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RouteIntroduction;
