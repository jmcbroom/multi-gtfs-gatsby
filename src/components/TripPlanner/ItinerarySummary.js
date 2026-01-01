import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import RouteBadge from "../RouteBadge";
import { getModeIcon } from "./ItineraryLeg";

/**
 * Summary pill for a single leg in the collapsed itinerary view
 */
const ItinerarySummary = ({ leg }) => {
  const isTransit = leg.mode !== 'WALK';

  if (isTransit) {
    const route = leg.route;
    return (
      <div className="flex items-center">
        <RouteBadge
          route={{
            displayShortName: route?.shortName,
            routeColor: route?.color ? `#${route.color}` : undefined,
            routeTextColor: route?.textColor ? `#${route.textColor}` : undefined
          }}
          size="small"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400">
      <FontAwesomeIcon icon={getModeIcon(leg.mode)} className="text-sm" />
    </div>
  );
};

export default ItinerarySummary;
