import React, { useCallback, useState, useEffect } from "react";
import { matchPredictionToRoute } from "../util";
import PredictionsList from "./PredictionsList";
import RealtimeHeader from "./RealtimeHeader";

const StopPredictions = ({
  predictions,
  times,
  routes,
  agency,
  trackedBus,
  setTrackedBus,
  vehicles,
  patterns,
  setSelectedRoute,
  now
}) => {
  // Countdown timer - counts down from 30 to 0
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (!now) return;

    // Reset countdown when `now` changes (indicating a refresh happened)
    setCountdown(30);

    // Tick every second
    const interval = setInterval(() => {
      setCountdown(c => (c > 0 ? c - 1 : 30));
    }, 1000);

    return () => clearInterval(interval);
  }, [now]);
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

  // Handle click to pin/unpin and select route
  const handlePredictionClick = useCallback((pred) => {
    if (trackedBus === pred.vid) {
      setTrackedBus(null); // Unpin
      // Also unselect route
      if (setSelectedRoute) {
        setSelectedRoute(null);
      }
    } else {
      setTrackedBus(pred.vid); // Pin
      // Also select this route
      if (setSelectedRoute) {
        setSelectedRoute(pred.rt);
      }
    }
  }, [trackedBus, setTrackedBus, setSelectedRoute]);

  const header = <RealtimeHeader title="Real-time info" countdown={countdown} />;

  return (
    <PredictionsList
      predictions={predictions}
      vehicles={vehicles}
      pinnedId={trackedBus}
      onPredictionClick={handlePredictionClick}
      getRouteData={getRouteData}
      header={header}
      agencySlug={agency.slug.current}
    />
  );
};

export default StopPredictions;
