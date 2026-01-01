import React, { useState } from "react";
import { navigate } from "gatsby";
import { SearchBox } from "@mapbox/search-js-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationCrosshairs, faSpinner } from "@fortawesome/free-solid-svg-icons";

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

  const handleOriginRetrieve = (result) => {
    const feature = result.features?.[0];
    if (feature) {
      const [lon, lat] = feature.geometry.coordinates;
      setOrigin({
        name: feature.properties.name || feature.properties.full_address,
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
        name: feature.properties.name || feature.properties.full_address,
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

    const url = params.toString()
      ? `/trip-planner?${params.toString()}`
      : "/trip-planner";

    navigate(url);
  };

  return (
    <div className="bg-gray-100 dark:bg-zinc-800 p-4">

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex gap-2">
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
              <SearchBox
                accessToken={
                  process.env.GATSBY_MAPBOX_ACCESS_TOKEN ||
                  process.env.MAPBOX_ACCESS_TOKEN
                }
                options={{
                  bbox: DETROIT_BBOX,
                  proximity: { lng: -83.05, lat: 42.35 },
                }}
                placeholder="From..."
                onRetrieve={handleOriginRetrieve}
                theme={searchBoxTheme}
              />
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

        <div className="flex-1">
          <SearchBox
            accessToken={
              process.env.MAPBOX_ACCESS_TOKEN
            }
            options={{
              bbox: DETROIT_BBOX,
              proximity: { lng: -83.05, lat: 42.35 },
            }}
            placeholder="To..."
            onRetrieve={handleDestinationRetrieve}
            theme={searchBoxTheme}
          />
        </div>

        <button
          onClick={handlePlanTrip}
          className="bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-700 dark:text-zinc-200 text-sm font-medium py-2 px-4 rounded transition-colors"
        >
          Go
        </button>
      </div>
    </div>
  );
};

export default TripPlannerBox;
