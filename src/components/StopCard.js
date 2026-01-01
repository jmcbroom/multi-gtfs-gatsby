import React from "react";
import { Link } from "gatsby";
import { getStopIdentifier } from "../stopUtils";
import RouteSlim from "./RouteSlim";
import StopBadge from "./StopBadge";

const StopCard = ({ stop, agency, routeDirections, onDelete }) => {
  const stopIdentifier = getStopIdentifier(stop, agency);

  return (
    <div key={stop.id} className="relative bg-gray-100 dark:bg-zinc-900 border-b border-dotted border-gray-400 dark:border-zinc-700 last:border-none">
      {onDelete && (
        <button
          onClick={onDelete}
          className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-gray-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 text-xs transition-colors"
          title="Remove from favorites"
        >
          &times;
        </button>
      )}
      <div className="flex items-center justify-between px-2 py-1 pr-6">
        <Link
          to={`/${stop.agency.agencySlug}/stop/${stopIdentifier}`}
          className="flex items-center gap-2"
        >
          <span className="plex font-semibold">{stop.stopName}</span>
        </Link>
        <StopBadge stopId={stopIdentifier} size="xs" />
      </div>
      <div className="bg-gray-100 dark:bg-zinc-900 p-2 grid cols-1 md:grid-cols-2 gap-2">
        {routeDirections && routeDirections
          .sort((a,b) => b.tripCount - a.tripCount)
          .slice(0,5)
          .map((rd) => {
            let route = stop.routes.find((r) => r.displayShortName === rd.routeId);
            let direction = route?.directions?.find((d) => d.directionId === rd.directionId);
            return { rd, route, direction };
          })
          .filter(({ route, direction }) => route && direction)
          .map(({ rd, route, direction }) => (
            <RouteSlim
              key={`${rd.routeId}-${rd.directionId}`}
              {...route}
              direction={direction}
              size="small"
            />
          ))}
      </div>
    </div>
  );
};

export default StopCard;
