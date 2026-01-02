import React from "react";
import PredictionRow from "./PredictionRow";

/**
 * Container component for displaying a list of predictions.
 * Shared between StopPredictions and FavoritesDashboard.
 *
 * @param {Object} props
 * @param {Array} props.predictions - Array of prediction objects
 * @param {Array} props.vehicles - Array of vehicle objects for hasVehicle check
 * @param {string|null} props.pinnedId - Currently pinned prediction vid (for pin icon)
 * @param {Function} props.isActive - Function: (pred, idx) => boolean, for highlight state
 * @param {Function} props.isPinned - Function: (pred, idx) => boolean, for pin icon (optional, defaults to pinnedId check)
 * @param {Function} props.onPredictionClick - Handler: (prediction, index) => void
 * @param {Function} props.getRouteData - Function: (prediction) => { route, direction }
 * @param {boolean} props.loading - Show loading state
 * @param {string|ReactNode} props.header - Header text or element
 * @param {number} props.maxItems - Limit displayed items (default: 20)
 * @param {boolean} props.showStopName - Whether to show stop name when active
 * @param {string} props.agencySlug - Agency slug for links (optional, falls back to prediction.agencySlug)
 * @param {number} props.countdown - Optional countdown timer value
 * @param {boolean} props.noWrapper - If true, renders just the list without wrapper div
 * @param {ReactNode} props.children - Extra content after the list (e.g., bikeshare section)
 */
const PredictionsList = ({
  predictions = [],
  vehicles = [],
  pinnedId = null,
  isActive: isActiveFn,
  isPinned: isPinnedFn,
  onPredictionClick,
  getRouteData,
  loading = false,
  header = "Next buses here",
  maxItems = 20,
  showStopName = false,
  agencySlug,
  countdown,
  noWrapper = false,
  children,
}) => {
  // Build a set of vehicle IDs for quick lookup
  const vehicleVids = new Set((vehicles || []).map(v => v.vid));

  const content = (
    <>
      {/* Header */}
      {header && (
        typeof header === "string" ? (
          <div className="grayHeader">{header}</div>
        ) : (
          header
        )
      )}

      {/* Predictions list */}
      <div className="flex-1 overflow-y-auto max-h-80 md:max-h-none">
        {loading ? (
          <div className="p-4 text-gray-500 dark:text-zinc-400 text-sm">
            Loading predictions...
          </div>
        ) : predictions.length === 0 ? (
          <div className="p-4 text-gray-500 dark:text-zinc-400 text-sm">
            No upcoming arrivals.
          </div>
        ) : (
          <ul className="list-none m-0">
            {predictions.slice(0, maxItems).map((pred, idx) => {
              const routeData = getRouteData ? getRouteData(pred) : {};
              const route = routeData.route || routeData;
              const direction = routeData.direction;

              // Determine active/pinned state
              const active = isActiveFn ? isActiveFn(pred, idx) : (pinnedId === pred.vid);
              const pinned = isPinnedFn ? isPinnedFn(pred, idx) : (pinnedId === pred.vid);
              const hasVehicle = pred.vid && vehicleVids.has(pred.vid);

              return (
                <PredictionRow
                  key={`${pred.vid}-${pred.stpid}-${idx}`}
                  prediction={pred}
                  route={route}
                  direction={direction}
                  isActive={active}
                  isPinned={pinned}
                  hasVehicle={hasVehicle}
                  onClick={() => onPredictionClick?.(pred, idx)}
                  showSeparator={idx > 0}
                  showStopName={showStopName}
                  stopName={pred.stpnm || pred.stopName}
                  stopLabel={pred.stopLabel}
                  stopIdentifier={pred.stopIdentifier}
                  agencySlug={agencySlug || pred.agencySlug}
                />
              );
            })}
          </ul>
        )}
      </div>

      {/* Extra content (e.g., bikeshare) */}
      {children}

      {/* Countdown timer in bottom left */}
      {countdown !== undefined && (
        <div className="absolute bottom-1 left-2 text-[10px] text-gray-300 dark:text-zinc-600 font-mono">
          {countdown}s
        </div>
      )}
    </>
  );

  if (noWrapper) {
    return content;
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col relative pb-6">
      {content}
    </div>
  );
};

export default PredictionsList;
