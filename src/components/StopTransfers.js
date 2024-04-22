import React from "react";

import _ from "lodash";
import StopCard from "./StopCard";

const StopTransfers = ({ stop, nearbyStops, routes, agencies }) => {
  // filter out stops that have the same trip directions as the current stop

  nearbyStops = nearbyStops.filter((nearbyStop) => {
    return (
      JSON.stringify(nearbyStop.tripDirections) !=
      JSON.stringify(stop.tripDirections)
    );
  });

  let tripDirectionsSeen = stop.tripDirections?.map(td => JSON.stringify(td)) || []
  let transferStops = [];

  for (let nearbyStop of nearbyStops) {
    let add = false;

    for (let tripDirection of nearbyStop.tripDirections) {
      if (!tripDirectionsSeen.includes(JSON.stringify(tripDirection))) {
        add = true;
        tripDirectionsSeen.push(JSON.stringify(tripDirection));
      }
    }

    if (add) {
      transferStops.push(nearbyStop);
    }

  }

  return (
    <div>
      <h4>Nearby bus transfers</h4>
      <div>
        {transferStops.map((nearbyStop, idx) => {
          nearbyStop.agency = agencies.find(
            (a) => a.currentFeedIndex === nearbyStop.feedIndex
          );

          nearbyStop.agency.agencySlug = nearbyStop.agency.slug.current;

          nearbyStop.routes = [];

          for (let tripDirection of _.sortBy(nearbyStop.tripDirections, (td) => td.tripCount).reverse()) {

            delete tripDirection.tripCount;

            // find the trip direction in the previous iterations of the loop and exclude display!
            let directionsSeen = transferStops.slice(0, idx).map(td => td.tripDirections).flat().map(td => JSON.stringify(td));
            if (directionsSeen.includes(JSON.stringify(tripDirection)) || stop.tripDirections?.map(td => delete td.tripCount && JSON.stringify(td)).includes(JSON.stringify(tripDirection))) {
              continue;
            }

            // otherwise, it's "new" and can be displayed.
            let matchingRoute = routes.find(
              (rt) =>
                rt.shortName === tripDirection.routeId &&
                rt.agency.currentFeedIndex === nearbyStop.feedIndex
            );

            if (matchingRoute && !directionsSeen.includes(JSON.stringify(tripDirection))) {
              matchingRoute.routeColor = `${matchingRoute.color.hex}`;
              matchingRoute.routeTextColor = `${matchingRoute.textColor.hex}`;
              matchingRoute.routeLongName = matchingRoute.longName;
              nearbyStop.routes.push(matchingRoute);
            }

          }

          nearbyStop.times = [];

          if (nearbyStop.routes.length == 0) {
            return;
          }

          return (
            <StopCard
              key={JSON.stringify(nearbyStop)}
              stop={nearbyStop}
              agency={nearbyStop.agency}
              routeDirections={nearbyStop.tripDirections}
            />
          );
        })}
      </div>
    </div>
  );
};

export default StopTransfers;
