import React from "react";
import { Link } from "gatsby";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbtack } from "@fortawesome/free-solid-svg-icons";
import RouteSlim from "./RouteSlim";
import VehicleBadge from "./VehicleBadge";

/**
 * A single prediction row display, shared between StopPredictions and FavoritesDashboard.
 * Shows arrival time, route info, and vehicle badge with optional pinning.
 */
const PredictionRow = ({
  prediction,      // Prediction object with prdctdn, vid, rt, rtdir, stpid, stpnm
  route,           // Route data: routeShortName, routeColor, routeTextColor, displayShortName, routeLongName
  direction,       // Direction info for RouteSlim (directionHeadsign, directionDescription)
  isActive,        // Whether this prediction is highlighted (pinned or carousel-active)
  isPinned,        // Whether this prediction is specifically pinned (shows pin icon)
  hasVehicle,      // Whether vehicle location is available
  onClick,         // Click handler for pin/unpin
  showSeparator,   // Whether to show separator line (idx > 0)
  showStopName,    // Whether to show "arriving at [stop]" when active
  stopName,        // Stop name to display
  stopLabel,       // Short label for stop (e.g., "A", "B") - displays as map-style marker
  stopIdentifier,  // Stop identifier for link (may differ from stpid)
  agencySlug,      // Agency slug for links
}) => {
  const stopLink = stopIdentifier || prediction.stpid;
  // For backwards compatibility: if only isPinned is passed, use it for both
  const highlighted = isActive !== undefined ? isActive : isPinned;
  const showPinIcon = isPinned !== undefined ? isPinned : highlighted;

  return (
    <li
      onClick={onClick}
      className={`relative flex items-center gap-2 md:gap-4 py-3 px-2 md:px-3 cursor-pointer transition-colors ${
        highlighted
          ? "bg-blue-50 dark:bg-blue-900/30"
          : "hover:bg-gray-50 dark:hover:bg-zinc-800"
      }`}
    >
      {/* Separator line */}
      {showSeparator && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-200 dark:bg-zinc-700" />
      )}

      {/* Pin icon in top right - only for pinned prediction */}
      {showPinIcon && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className="absolute -top-0.5 right-1 p-0.5 text-blue-500 rounded transition-colors hover:text-blue-600"
          title="Unpin"
        >
          <FontAwesomeIcon icon={faThumbtack} className="text-[10px]" />
        </button>
      )}

      {/* Arrival time */}
      <div className="w-11 md:w-14 flex-shrink-0 text-right font-['Inter'] tabular-nums">
        {prediction.prdctdn === "DUE" ? (
          <span className="text-lg font-bold">now</span>
        ) : (
          <>
            <span className="text-xl font-semibold">{prediction.prdctdn}</span>
            <span className="text-[10px] text-gray-400 dark:text-zinc-500 ml-0.5">min</span>
          </>
        )}
      </div>

      {/* Stop label marker (matches map style) */}
      {stopLabel && (
        <div
          className="w-6 h-6 flex-shrink-0 rounded-full bg-white border border-gray-400 flex items-center justify-center"
          title={stopName}
        >
          <span className="text-xs font-bold text-black leading-none">{stopLabel}</span>
        </div>
      )}

      {/* Route info */}
      <div className="flex-1 min-w-0">
        <RouteSlim
          {...route}
          direction={direction}
          size="small"
        />
        {highlighted && showStopName && stopName && (
          <Link
            to={`/${agencySlug}/stop/${stopLink}`}
            onClick={(e) => e.stopPropagation()}
            className="block text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5 truncate hover:text-gray-700 dark:hover:text-zinc-200"
          >
            arriving at {stopName}
          </Link>
        )}
      </div>

      {/* Vehicle badge in lower right */}
      <div className="absolute bottom-1 right-1">
        <VehicleBadge
          vehicleId={prediction.vid}
          size="xs"
          active={highlighted}
          notTracking={prediction.vid && !hasVehicle}
        />
      </div>
    </li>
  );
};

export default PredictionRow;
