import React from "react";
import { Link } from "gatsby";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBus } from "@fortawesome/free-solid-svg-icons";
import RouteSlim from "./RouteSlim";

const StopCard = ({ stop, agency, routeDirections }) => {

  let directionIds = new Set();

  return (
    <div key={stop.id} className="bg-gray-100 dark:bg-zinc-900 border-b border-dotted border-gray-400 dark:border-zinc-700 last:border-none p-1">
      <div className="flex items-center justify-between px-2 py-1">
        <Link
          to={`/${stop.agency.agencySlug}/stop/${stop[agency.stopIdentifierField]}`}
        >
          <FontAwesomeIcon icon={faBus} className="mr-2 text-gray-500" />
          <span className="plex font-semibold">{stop.stopName}</span>
        </Link>
        <span className="font-mono font-extralight bg-gray-200 p-1 text-gray-500 dark:bg-zinc-800 text-xs">
          #{stop[agency.stopIdentifierField]}
        </span>
      </div>
      <div className="bg-gray-100 dark:bg-zinc-900 p-2 flex flex-col gap-2">
        {routeDirections && routeDirections.sort((a,b) => b.tripCount - a.tripCount).slice(0,5).map((rd) => {
          let route = stop.routes.find((r) => r.displayShortName === rd.routeId);
          let direction = route?.directions.find((d) => d.directionId === rd.directionId);

          if(!route || !direction) {
            return;
          }
          else {
            return (
              <RouteSlim
                key={route.routeId}
                {...route}
                direction={direction}
              />
            );
          }
        })}
      </div>
    </div>
  );
};

export default StopCard;
