import React, { useState } from "react";
import { navigate } from "gatsby";
import { SearchBox } from "@mapbox/search-js-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapLocationDot } from "@fortawesome/free-solid-svg-icons";

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
    <div className="bg-gray-100 dark:bg-zinc-800 p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <FontAwesomeIcon icon={faMapLocationDot} />
        <div className="flex flex-col">
          <span className="mb-0 text-lg font-semibold">
            Plan a trip using Detroit's transit system
          </span>
          <span className="text-xs font-regular text-gray-500">
            Currently covered: Detroit & its suburbs, Ann Arbor/Ypsilanti, Flint, and
            Windsor.
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <div className="text-xs text-gray-500 dark:text-zinc-400 mb-1">
            From
          </div>
          <SearchBox
            accessToken={
              process.env.GATSBY_MAPBOX_ACCESS_TOKEN ||
              process.env.MAPBOX_ACCESS_TOKEN
            }
            options={{
              bbox: DETROIT_BBOX,
              proximity: { lng: -83.05, lat: 42.35 },
            }}
            placeholder="Starting point..."
            onRetrieve={handleOriginRetrieve}
            theme={searchBoxTheme}
          />
        </div>

        <div>
          <div className="text-xs text-gray-500 dark:text-zinc-400 mb-1">
            To
          </div>
          <SearchBox
            accessToken={
              process.env.GATSBY_MAPBOX_ACCESS_TOKEN ||
              process.env.MAPBOX_ACCESS_TOKEN
            }
            options={{
              bbox: DETROIT_BBOX,
              proximity: { lng: -83.05, lat: 42.35 },
            }}
            placeholder="Destination..."
            onRetrieve={handleDestinationRetrieve}
            theme={searchBoxTheme}
          />
        </div>

        <button
          onClick={handlePlanTrip}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          Plan trip
        </button>
      </div>
    </div>
  );
};

export default TripPlannerBox;
