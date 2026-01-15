import React, { useState } from "react";
import { navigate } from "gatsby";
import { SearchBox } from "@mapbox/search-js-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationCrosshairs, faSpinner } from "@fortawesome/free-solid-svg-icons";

// Placeholder for SSR when SearchBox is null-loaded
const SearchBoxPlaceholder = ({ placeholder }) => (
  <input
    type="text"
    placeholder={placeholder}
    disabled
    className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded"
  />
);

// Detroit metro bounding box [west, south, east, north]
const DETROIT_BBOX = [-84.159, 41.723, -82.375, 43.168];

// Remove shadow from SearchBox
const searchBoxTheme = {
  variables: {
    boxShadow: "none",
  },
};

const TripPlannerBox = () => {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Date/Time state - use America/Detroit timezone
  const now = new Date();
  const detroitDate = now.toLocaleDateString('en-CA', { timeZone: 'America/Detroit' }); // YYYY-MM-DD format
  const detroitTime = now.toLocaleTimeString('en-GB', { timeZone: 'America/Detroit', hour: '2-digit', minute: '2-digit', hour12: false });
  const [date, setDate] = useState(detroitDate);
  const [time, setTime] = useState(detroitTime);
  const [arriveBy, setArriveBy] = useState(false);

  const formatPlaceName = (properties) => {
    const name = properties.name || properties.place_formatted || properties.full_address;
    return name?.replace(/, United States$/, "");
  };

  const handleOriginRetrieve = (result) => {
    const feature = result.features?.[0];
    if (feature) {
      const [lon, lat] = feature.geometry.coordinates;
      setOrigin({
        name: formatPlaceName(feature.properties),
        lat: lat.toFixed(6),
        lon: lon.toFixed(6),
      });
    }
  };

  const handleDestinationRetrieve = (result) => {
    const feature = result.features?.[0];
    if (feature) {
      const [lon, lat] = feature.geometry.coordinates;
      setDestination({
        name: formatPlaceName(feature.properties),
        lat: lat.toFixed(6),
        lon: lon.toFixed(6),
      });
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({
          name: "Current location",
          lat: position.coords.latitude.toFixed(6),
          lon: position.coords.longitude.toFixed(6),
        });
        setGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to get your location. Please check your browser permissions.");
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePlanTrip = () => {
    const params = new URLSearchParams();

    if (origin) {
      params.set("fromLat", origin.lat);
      params.set("fromLon", origin.lon);
      params.set("fromName", origin.name);
    }

    if (destination) {
      params.set("toLat", destination.lat);
      params.set("toLon", destination.lon);
      params.set("toName", destination.name);
    }

    if (date) params.set("date", date);
    if (time) params.set("time", time);
    if (arriveBy) params.set("arriveBy", "true");

    const url = params.toString()
      ? `/trip-planner?${params.toString()}`
      : "/trip-planner";

    navigate(url);
  };

  return (
    <div className="bg-gray-100 dark:bg-zinc-800 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Row 1: From */}
        <div className="flex gap-2">
          {origin?.name === "Current location" ? (
            <div className="flex-1 flex items-center bg-white dark:bg-zinc-700 px-3 py-2 rounded text-sm">
              <FontAwesomeIcon icon={faLocationCrosshairs} className="text-blue-500 mr-2" />
              <span className="text-gray-700 dark:text-zinc-200">Current location</span>
              <button
                onClick={() => setOrigin(null)}
                className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex-1">
              {SearchBox ? (
                <SearchBox
                  accessToken={
                    process.env.GATSBY_MAPBOX_ACCESS_TOKEN ||
                    process.env.MAPBOX_ACCESS_TOKEN
                  }
                  options={{
                    bbox: DETROIT_BBOX,
                    proximity: { lng: -83.05, lat: 42.35 },
                    types: "address,place,poi,neighborhood,locality",
                    poi_category_exclusions: "brand",
                  }}
                  placeholder="From..."
                  onRetrieve={handleOriginRetrieve}
                  theme={searchBoxTheme}
                />
              ) : (
                <SearchBoxPlaceholder placeholder="From..." />
              )}
            </div>
          )}
          <button
            onClick={handleCurrentLocation}
            disabled={gettingLocation}
            className="flex items-center justify-center w-10 bg-white dark:bg-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-600 rounded transition-colors"
            title="Use current location"
          >
            <FontAwesomeIcon
              icon={gettingLocation ? faSpinner : faLocationCrosshairs}
              className={`text-gray-500 dark:text-zinc-400 ${gettingLocation ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Row 1: To */}
        <div>
          {SearchBox ? (
            <SearchBox
              accessToken={process.env.MAPBOX_ACCESS_TOKEN}
              options={{
                bbox: DETROIT_BBOX,
                proximity: { lng: -83.05, lat: 42.35 },
                types: "address,place,poi,neighborhood,locality",
                poi_category_exclusions: "brand",
              }}
              placeholder="To..."
              onRetrieve={handleDestinationRetrieve}
              theme={searchBoxTheme}
            />
          ) : (
            <SearchBoxPlaceholder placeholder="To..." />
          )}
        </div>

        {/* Row 2: Date/Time */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-2 py-1.5 text-sm bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="px-2 py-1.5 text-sm bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <div className="inline-flex rounded bg-gray-200 dark:bg-zinc-700 p-0.5">
            <button
              type="button"
              className={`text-xs px-2 py-1 rounded transition-colors ${
                !arriveBy
                  ? "bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 shadow-sm"
                  : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
              }`}
              onClick={() => setArriveBy(false)}
            >
              Leave
            </button>
            <button
              type="button"
              className={`text-xs px-2 py-1 rounded transition-colors ${
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

        {/* Row 2: Go button */}
        <div className="flex">
          <button
            onClick={handlePlanTrip}
            className="flex-1 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-700 dark:text-zinc-200 text-sm font-medium py-2 px-4 rounded transition-colors"
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripPlannerBox;
