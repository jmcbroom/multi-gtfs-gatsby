import React from "react";
import { formatArrivalTime, sortTripsByFrequentTimepoint } from "../util";

const serviceDisplayText = {
  weekday: `weekdays`,
  saturday: `Saturday`,
  sunday: `Sunday`,
}

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

const RouteIntroEndpoints = ({ route, trips, headsigns }) => {
  let services = Object.keys(trips);
  let directions = Object.keys(headsigns);

  let endpoints = directions.map((d) => {
    return headsigns[d].headsigns[0];
  });

  return (
    <ul className="px-3 text-lg list-disc list-inside">
      {endpoints.map((end, idx) => (
        <li key={end}>
          <span className="font-semibold">{headsigns[idx]?.description || `unknown`}</span> to{" "}
          <span className="font-semibold">{end}</span>
        </li>
      ))}
    </ul>
  );
};

const RouteIntroRunTimes = ({ route, trips, headsigns }) => {
  let services = Object.keys(trips);
  let directions = Object.keys(headsigns);

  let endpoints = directions.map((d) => {
    return headsigns[d].headsigns[0];
  });

  let serviceTexts = {};

  let filteredServices = services.filter((s) => trips[s][0].length > 0);

  filteredServices.forEach((s) => {
    let sortedTrips = trips[s];

    if (sortedTrips.length == 0) {
      return;
    }

    let reducedTrips = Object.keys(sortedTrips)
      .map((key) => sortedTrips[key])
      .reduce((acc, val) => acc.concat(val));

    console.log(s, reducedTrips)

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
      serviceTexts[s] = `runs 24 hours a day`;
    } else {
      serviceTexts[s] = (
        <span>
          runs from <span className="font-semibold">{formatArrivalTime(firstTripStartTime)}</span>{" "}
          to <span className="font-semibold">{formatArrivalTime(lastTripEndTime)}</span>{" "}
        </span>
      );
    }
  });

  return (
    <ul className="px-3 text-lg list-disc list-inside">
      {filteredServices.map((s) => (
        <li key={s}>
          On {serviceDisplayText[s]}, this bus {serviceTexts[s]}
        </li>
      ))}
    </ul>
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

    <section className="gap-6 flex flex-col p-0">
      <div>
        <p className="text-sm text-gray-700 bg-gray-300 py-2 px-3">When does this bus run?</p>
        <p className="text-lg px-3">This bus route runs {whenItRuns(trips)}.</p>
        <RouteIntroRunTimes route={route} trips={trips} headsigns={headsigns} />
      </div>
      <div>
        <p className="text-sm text-gray-700 bg-gray-300 py-2 px-3">Where does this bus go?</p>
        <p className="text-lg px-3">The bus travels {whatDirectionItRuns(route)}:</p>
        <RouteIntroEndpoints route={route} trips={trips} headsigns={headsigns} />
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
    </section>
  );
};

export default RouteIntroduction;
