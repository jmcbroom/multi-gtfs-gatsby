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
          size="xs"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 py-1 rounded">
      <FontAwesomeIcon icon={getModeIcon(leg.mode)} className="text-xs" />
    </div>
  );
};

export default ItinerarySummary;
