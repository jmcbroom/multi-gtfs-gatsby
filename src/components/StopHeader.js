import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { db } from "../db";
import StopBadge from "./StopBadge";

const addFavoriteStop = (stop, stopType="bus") => {
  if (!db) return;
  if(stopType === "bus") {
    db.stops.add(stop);
  }
  if(stopType === "bikeshare") {
    db.bikeshare.add(stop)
  }
};

const removeFavoriteStop = (stopToRemove, favoriteStops, stopType="bus") => {
  if (!db) return;
  let stopIdsToRemove = favoriteStops
    .filter(
      (stop) =>
        stop.stopId === stopToRemove.stopId &&
        stop.agency.agencySlug === stopToRemove.agency.agencySlug
    )
    .map((s) => s.id);
  stopIdsToRemove.forEach((id) => {
    if(stopType==="bus") {
      db.stops.delete(id);
    }
    if(stopType === 'bikeshare') {
      db.bikeshare.delete(id)
    }
  });
};

const StopHeader = ({
  favoriteStops,
  indexedStop,
  isFavoriteStop,
  stopName,
  stopIdentifier,
  stopType="bus",
}) => {
  return (
    <div className="mb-2 bg-gray-200 dark:bg-zinc-900 flex items-center justify-between p-2">
      <div className="flex items-center gap-2">
        <FontAwesomeIcon
          icon={faStar}
          size="lg"
          className={
            isFavoriteStop
              ? "text-yellow-500 dark:text-yellow-600 cursor-pointer"
              : "text-gray-400 dark:text-zinc-600 cursor-pointer"
          }
          onClick={() => {
            if (isFavoriteStop === false) {
              addFavoriteStop(indexedStop, stopType);
            } else {
              removeFavoriteStop(indexedStop, favoriteStops, stopType);
            }
          }}
        />
        <h1 className="text-sm md:text-base font-semibold m-0">{stopName}</h1>
      </div>
      {stopType === 'bus' && <span className="hidden md:inline"><StopBadge stopId={stopIdentifier} size="medium" /></span>}
      {stopType === 'bus' && <span className="md:hidden"><StopBadge stopId={stopIdentifier} size="small" /></span>}
    </div>
  );
};

export default StopHeader;
