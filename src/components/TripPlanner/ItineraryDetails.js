import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import ItineraryLeg from "./ItineraryLeg";
import { OriginStep, DestinationStep, TransferStep, WalkEndpointStep } from "./ItineraryTimeline";

const ItineraryDetails = ({
  itinerary,
  originName,
  destinationName,
  onLegHover,
  onBack
}) => {
  if (!itinerary) return null;

  const { legs, start, end } = itinerary;

  // Check if trip starts with a walk
  const startsWithWalk = legs[0]?.mode === 'WALK';
  // Check if trip ends with a walk
  const endsWithWalk = legs[legs.length - 1]?.mode === 'WALK';

  return (
    <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 border border-gray-200 dark:border-zinc-800">
      <div className="flex items-center gap-2 mb-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded bg-gray-200 dark:bg-zinc-800 shadow-inner hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors"
            aria-label="Back to options"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-sm text-gray-600 dark:text-zinc-400" />
          </button>
        )}
        <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
          Directions
        </h3>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-zinc-700">
        {/* Origin - combine with walk if trip starts with walk */}
        {startsWithWalk ? (
          <WalkEndpointStep
            name={originName || legs[0]?.from?.name}
            time={start}
            walkLeg={legs[0]}
            type="origin"
          />
        ) : (
          <OriginStep name={originName || legs[0]?.from?.name} time={start} />
        )}

        {legs.map((leg, idx) => {
          const nextLeg = legs[idx + 1];

          // Skip first leg if it's a walk (already combined with origin)
          if (idx === 0 && startsWithWalk) {
            return null;
          }

          // Skip last leg if it's a walk (will be combined with destination)
          if (idx === legs.length - 1 && endsWithWalk) {
            return null;
          }

          const isShortWalkTransfer = leg.mode === 'WALK' &&
            leg.distance < 200 &&
            idx > 0 &&
            legs[idx - 1]?.mode !== 'WALK' &&
            nextLeg && nextLeg.mode !== 'WALK';

          if (isShortWalkTransfer) {
            return (
              <TransferStep
                key={`transfer-${idx}`}
                fromLeg={legs[idx - 1]}
                toLeg={nextLeg}
                walkLeg={leg}
                isLast={false}
                index={idx}
                onHover={onLegHover}
              />
            );
          }

          return (
            <ItineraryLeg key={idx} leg={leg} index={idx} isLast={false} onHover={onLegHover} />
          );
        })}

        {/* Destination - combine with walk if trip ends with walk */}
        {endsWithWalk ? (
          <WalkEndpointStep
            name={destinationName || legs[legs.length - 1]?.to?.name}
            time={end}
            walkLeg={legs[legs.length - 1]}
            type="destination"
          />
        ) : (
          <DestinationStep name={destinationName || legs[legs.length - 1]?.to?.name} time={end} />
        )}
      </div>
    </div>
  );
};

export default ItineraryDetails;
