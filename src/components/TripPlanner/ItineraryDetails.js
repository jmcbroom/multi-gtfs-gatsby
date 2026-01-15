import React from "react";
import ItineraryLeg from "./ItineraryLeg";
import { OriginStep, DestinationStep, TransferStep } from "./ItineraryTimeline";

const ItineraryDetails = ({
  itinerary,
  originName,
  destinationName,
  onLegHover
}) => {
  if (!itinerary) return null;

  const { legs, start, end } = itinerary;

  return (
    <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 border border-gray-200 dark:border-zinc-800">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3">
        Directions
      </h3>

      <div>
        <OriginStep name={originName || legs[0]?.from?.name} time={start} />

        {legs.map((leg, idx) => {
          const nextLeg = legs[idx + 1];

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

        <DestinationStep name={destinationName || legs[legs.length - 1]?.to?.name} time={end} />
      </div>
    </div>
  );
};

export default ItineraryDetails;
