import React, { useState, useCallback, useEffect } from "react";
import RoutePredictionRow from "./RoutePredictionRow";
import RealtimeHeader from "./RealtimeHeader";
import { getVehicleType } from "../util";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { groupBy } from "lodash-es";
import { shortenHeadsign } from "../util";

const RoutePredictions = ({
  vehicles,
  setTrackedBus,
  setVisibleVehicles,  // Optional callback to control which vehicles show on map
  predictions,
  routeType = 3,
  countdown,
}) => {
  const [activeVehicle, setActiveVehicle] = useState(null);
  const [collapsedDirections, setCollapsedDirections] = useState(new Set());

  let directions = vehicles?.features[0]?.properties.directions;

  let vehiclesByDirection = groupBy(
    vehicles?.features,
    "properties.description"
  );

  const directionKeys = Object.keys(vehiclesByDirection);

  // Notify parent of visible vehicles when collapsed state changes
  useEffect(() => {
    if (!setVisibleVehicles) return;

    const visibleVids = [];
    directionKeys.forEach((direction) => {
      if (!collapsedDirections.has(direction)) {
        vehiclesByDirection[direction]?.forEach((v) => {
          visibleVids.push(v.properties.vid);
        });
      }
    });
    setVisibleVehicles(visibleVids);
  }, [collapsedDirections, vehiclesByDirection, directionKeys, setVisibleVehicles]);

  const handleVehicleClick = useCallback((vid) => {
    if (activeVehicle === vid) {
      setActiveVehicle(null);
      setTrackedBus(null);
    } else {
      setActiveVehicle(vid);
      setTrackedBus(vid);
    }
  }, [activeVehicle, setTrackedBus]);

  const toggleDirection = useCallback((direction) => {
    setCollapsedDirections((prev) => {
      const next = new Set(prev);
      if (next.has(direction)) {
        next.delete(direction);
      } else {
        next.add(direction);
      }
      return next;
    });
  }, []);

  // Count total vehicles across all directions for separator logic
  let vehicleIndex = 0;

  const vehicleType = getVehicleType(routeType);
  const pluralSuffix = vehicleType.slice(-1) === "s" ? "es" : "s";
  const hasVehicles = vehicles?.features?.length > 0;

  const headerTitle = hasVehicles
    ? `${vehicles.features.length} ${vehicleType}${vehicles.features.length > 1 ? pluralSuffix : ""} tracked`
    : `No ${vehicleType}${pluralSuffix} tracked`;

  return (
    <div>
      <RealtimeHeader
        title={headerTitle}
        countdown={countdown}
        enabled={hasVehicles}
      />

      {directions &&
        directionKeys.map((direction, dirIdx) => {
          const isCollapsed = collapsedDirections.has(direction);
          const vehiclesInDirection = vehiclesByDirection[direction] || [];

          return (
            <div key={direction}>
              <h4
                onClick={() => toggleDirection(direction)}
                className="w-full flex items-center justify-between gap-0 mt-2 cursor-pointer hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors"
              >
                <span>
                  {direction} to {shortenHeadsign(vehiclesInDirection[0]?.properties.headsign)}
                </span>
                <FontAwesomeIcon
                  icon={isCollapsed ? faChevronRight : faChevronDown}
                  className="text-[10px] w-3"
                />
              </h4>

              {!isCollapsed && (
                <ul className="list-none m-0">
                  {vehiclesInDirection.map((vehicle, idx) => {
                    const currentIndex = vehicleIndex++;
                    const vid = vehicle.properties.vid;
                    return (
                      <RoutePredictionRow
                        key={vid || idx}
                        vehicle={vehicle}
                        predictions={predictions?.filter((p) => p.vid === vid)}
                        vehicleType={getVehicleType(routeType)}
                        isActive={activeVehicle === vid}
                        onClick={() => handleVehicleClick(vid)}
                        showSeparator={currentIndex > 0 || dirIdx > 0}
                      />
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
    </div>
  );
};

export default RoutePredictions;
