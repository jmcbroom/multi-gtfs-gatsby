import React, { useCallback } from "react";
import { matchPredictionToRoute } from "../util";
import PredictionsList from "./PredictionsList";

const StopPredictions = ({
  predictions,
  times,
  routes,
  agency,
  trackedBus,
  setTrackedBus,
  vehicles,
  patterns
}) => {
  // Match prediction to route data for display
  // If direction can't be matched, don't show headsign (bus may be on previous direction before turning around)
  const getRouteData = useCallback((prediction) => {
    const matched = matchPredictionToRoute(prediction, routes, patterns);
    if (!matched) {
      return {
        route: {
          routeShortName: prediction.rt,
          displayShortName: prediction.rt,
          routeLongName: "",
          routeColor: "#666",
          routeTextColor: "#fff",
        },
        direction: null,
      };
    }
    return {
      route: matched.route,
      direction: matched.direction || null,
    };
  }, [routes, patterns]);

  // Handle click to pin/unpin
  const handlePredictionClick = useCallback((pred) => {
    if (trackedBus === pred.vid) {
      setTrackedBus(null); // Unpin
    } else {
      setTrackedBus(pred.vid); // Pin
    }
  }, [trackedBus, setTrackedBus]);

  return (
    <PredictionsList
      predictions={predictions}
      vehicles={vehicles}
      pinnedId={trackedBus}
      onPredictionClick={handlePredictionClick}
      getRouteData={getRouteData}
      header="Next buses here (real-time)"
      agencySlug={agency.slug.current}
    />
  );
};

export default StopPredictions;
