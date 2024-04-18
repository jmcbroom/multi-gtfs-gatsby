import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBicycle, faBus, faStar } from "@fortawesome/free-solid-svg-icons";
import { db } from "../db";

const addFavoriteStop = (stop, stopType="bus") => {
  if(stopType === "bus") {
    db.stops.add(stop);
  }
  if(stopType === "bikeshare") {
    db.bikeshare.add(stop)
  }
};

const removeFavoriteStop = (stopToRemove, favoriteStops, stopType="bus") => {
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
    <div className="mb-2 bg-gray-200 dark:bg-zinc-900 flex items-center justify-between">
      <div className="flex items-center justify-between">
        <FontAwesomeIcon
          icon={stopType === "bus" ? faBus : faBicycle}
          size="lg"
          className="m-0 p-3 text-gray-500 dark:text-zinc-500 dark:bg-zinc-800 bg-gray-300 mr-2"
          style={{ backgroundColor: "" }}
        />
        <h1 className="text-base font-semibold m-0">{stopName}</h1>
      </div>
      <div className="flex items-center justify-between gap-2 px-2">
        <FontAwesomeIcon
          icon={faStar}
          size="lg"
          className={
            isFavoriteStop
              ? "text-yellow-500 dark:text-yellow-600"
              : "text-gray-400 dark:text-zinc-600"
          }
          onClick={() => {
            if (isFavoriteStop === false) {
              addFavoriteStop(indexedStop, stopType);
            } else {
              removeFavoriteStop(indexedStop, favoriteStops, stopType);
            }
          }}
        />
        {stopType === 'bus' && <span className="text-xs text-gray-500 dark:text-zinc-500 font-mono p-1 bg-gray-300 dark:bg-zinc-700">
          #{stopIdentifier}
        </span>}
      </div>
    </div>
  );
};

export default StopHeader;
