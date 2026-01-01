import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExchange } from "@fortawesome/free-solid-svg-icons";
import { SearchBox } from "@mapbox/search-js-react";

// Detroit metro bounding box [west, south, east, north]
export const DETROIT_BBOX = [-84.159, 41.723, -82.375, 43.168];

/**
 * Origin/Destination input component with geocoding
 */
export const FromToInputs = ({
  origin,
  destination,
  setOrigin,
  setDestination,
  setSettingPoint,
  setItineraries,
  setFocusedLegIndex,
  getCurrentLocation,
  handleSwap,
  stacked = false,
}) => {
  const handleOriginRetrieve = (result) => {
    const feature = result.features?.[0];
    if (feature) {
      const [lon, lat] = feature.geometry.coordinates;
      setOrigin({
        name: feature.properties.name || feature.properties.full_address,
        lat: lat.toFixed(6),
        lon: lon.toFixed(6),
      });
      setSettingPoint("destination");
    }
  };

  const handleDestinationRetrieve = (result) => {
    const feature = result.features?.[0];
    if (feature) {
      const [lon, lat] = feature.geometry.coordinates;
      setDestination({
        name: feature.properties.name || feature.properties.full_address,
        lat: lat.toFixed(6),
        lon: lon.toFixed(6),
      });
      setSettingPoint(null);
    }
  };

  const clearOrigin = () => {
    setOrigin(null);
    setSettingPoint("origin");
    setItineraries([]);
    setFocusedLegIndex(null);
  };

  const clearDestination = () => {
    setDestination(null);
    setSettingPoint("destination");
    setItineraries([]);
    setFocusedLegIndex(null);
  };

  return (
    <div
      className={`relative flex ${stacked ? "flex-col gap-3 pl-6" : "flex-col md:flex-row gap-2"}`}
    >
      {/* Origin */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 h-9">
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold">
            A
          </div>
          {origin ? (
            <div className="flex items-center gap-2 flex-1 min-w-0 h-full">
              <span className="text-sm truncate">{origin.name}</span>
              <button
                onClick={clearOrigin}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-1 h-full">
              <div className="flex-1">
                <SearchBox
                  accessToken={process.env.MAPBOX_ACCESS_TOKEN}
                  options={{
                    bbox: DETROIT_BBOX,
                    proximity: { lng: -83.05, lat: 42.35 },
                  }}
                  placeholder="From..."
                  onRetrieve={handleOriginRetrieve}
                  theme={{ variables: { boxShadow: "none" } }}
                />
              </div>
              <button
                onClick={getCurrentLocation}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded hover:bg-gray-200 dark:hover:bg-zinc-700"
                title="Use current location"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="3" strokeWidth="2" />
                  <path strokeWidth="2" d="M12 2v4m0 12v4m10-10h-4M6 12H2" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Swap button */}
      {stacked ? (
        <button
          onClick={handleSwap}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          title="Swap origin and destination"
        >
          <FontAwesomeIcon icon={faExchange} className="rotate-90 text-xs" />
        </button>
      ) : (
        <div className="hidden md:flex flex-col">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-zinc-500 mb-1 font-medium">
            &nbsp;
          </div>
          <button
            onClick={handleSwap}
            className="flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded"
            title="Swap origin and destination"
          >
            <FontAwesomeIcon icon={faExchange} />
          </button>
        </div>
      )}

      {/* Destination */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 h-9">
          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold">
            B
          </div>
          {destination ? (
            <div className="flex items-center gap-2 flex-1 min-w-0 h-full">
              <span className="text-sm truncate">{destination.name}</span>
              <button
                onClick={clearDestination}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex-1 h-full">
              <SearchBox
                accessToken={process.env.MAPBOX_ACCESS_TOKEN}
                options={{
                  bbox: DETROIT_BBOX,
                  proximity: { lng: -83.05, lat: 42.35 },
                }}
                placeholder="To..."
                onRetrieve={handleDestinationRetrieve}
                theme={{ variables: { boxShadow: "none" } }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Date/Time input component
 */
export const WhenInputs = ({ date, setDate, time, setTime, arriveBy, setArriveBy }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="px-2 py-1 text-sm bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>
    <div className="flex items-center gap-2">
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="px-2 py-1 text-sm bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
      />
      <div className="inline-flex rounded bg-gray-200 dark:bg-zinc-700 p-0.5">
        <button
          className={`text-xs px-2 py-0.5 rounded transition-colors ${
            !arriveBy
              ? "bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 shadow-sm"
              : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
          }`}
          onClick={() => setArriveBy(false)}
        >
          Leave
        </button>
        <button
          className={`text-xs px-2 py-0.5 rounded transition-colors ${
            arriveBy
              ? "bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 shadow-sm"
              : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
          }`}
          onClick={() => setArriveBy(true)}
        >
          Arrive
        </button>
      </div>
    </div>
  </div>
);
