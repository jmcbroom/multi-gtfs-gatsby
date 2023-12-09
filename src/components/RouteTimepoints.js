import React from "react";
import RouteStopsList from "./RouteStopsList";
import { whatDirectionItRuns } from "./RouteIntroduction";

export const RouteTimepoints = ({ agency, route, trips, headsigns }) => {
  let directions = Object.keys(headsigns);

  let endpoints = directions.map((d) => {
    return headsigns[d].headsigns[0];
  });

  let adverbs = {
    clockwise: `around`,
    counterclockwise: `around`,
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-8">
      {endpoints.map((end, idx) => (
        <div key={end}>
          <div className="grayHeader">
            <span className="font-bold text-base">
              {headsigns[idx]?.description || `unknown`}
            </span>
            <span className="text-gray-600 font-normal text-base"> {adverbs[headsigns[idx]?.description || `to`]} {end}</span>
          </div>
          <RouteStopsList
            longTrips={route.longTrips}
            direction={idx}
            routeColor={route.routeColor}
            agency={agency}
            timepointsOnly
            small />
        </div>
      ))}
    </div>
  );
};

export default RouteTimepoints;
