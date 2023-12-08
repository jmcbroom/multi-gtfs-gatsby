import React from "react";
import { Link } from "gatsby";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBus } from "@fortawesome/free-solid-svg-icons";
import RouteSlim from "./RouteSlim";

const StopCard = ({ stop, agency }) => {
  return (
    <div key={stop.id} className="bg-gray-200 dark:bg-zinc-800 border-b border-dotted border-gray-400 dark:border-zinc-700 last:border-none p-1">
      <div className="flex items-center justify-between px-2 py-1">
        <Link
          to={`/${stop.agency.agencySlug}/stop/${stop[agency.stopIdentifierField]}`}
        >
          <FontAwesomeIcon icon={faBus} className="mr-2 text-gray-500" />
          <span className="plex font-semibold">{stop.stopName}</span>
        </Link>
        <span className="font-mono font-extralight text-gray-500 text-xs">
          #{stop[agency.stopIdentifierField]}
        </span>
      </div>
      <div className="bg-gray-200 dark:bg-zinc-800 p-2 flex flex-col gap-2">
        {stop.routes.map((r) => {
          let directionIds = new Set(
            stop.times
              .filter((t) => t.trip.routeId === r.routeId)
              .map((t) => t.trip.directionId)
          );
          let direction = r.directions.filter((d) =>
            directionIds.has(d.directionId)
          )[0];
          return (
            <RouteSlim
              key={r.routeId}
              {...r}
              direction={direction}
              agency={agency}
            />
          );
        })}
      </div>
    </div>
  );
};

export default StopCard;
