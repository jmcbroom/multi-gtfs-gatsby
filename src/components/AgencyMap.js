import bbox from "@turf/bbox";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useRef, useState, useEffect, useCallback } from "react";
import MapboxGL from "mapbox-gl/dist/mapbox-gl";
import Mapbox, { GeolocateControl, NavigationControl, Popup } from "react-map-gl";
import { navigate } from "gatsby";
import _ from "lodash";
import RouteHeader from "./RouteHeader";
import RouteSlim from "./RouteSlim";
import VehicleBadge from "./VehicleBadge";
import { useMapStyle } from "../hooks/useMapStyle";
import { useMapNavigation } from "../hooks/useMapNavigation";

const AgencyMap = ({ routesFc, stopsFc, agency }) => {

  const routeFeatureCollection = routesFc;

  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [hoveredVehicle, setHoveredVehicle] = useState(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);

  const map = useRef();
  const { theme, style: baseStyle } = useMapStyle();
  const { zoomIn, geolocate } = useMapNavigation(map);

  // Fetch GTFS-RT vehicle positions
  const fetchVehicles = useCallback(async () => {
    if (!agency?.gtfsRtVehiclePositions) return;

    try {
      const response = await fetch(
        `/.netlify/functions/gtfs-rt-vehicles?url=${encodeURIComponent(agency.gtfsRtVehiclePositions)}`
      );
      if (response.ok) {
        const data = await response.json();
        setVehicles(data.vehicles || []);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  }, [agency?.gtfsRtVehiclePositions]);

  // Fetch vehicles when real-time is enabled, poll every 15 seconds
  useEffect(() => {
    if (!realTimeEnabled) {
      setVehicles([]);
      return;
    }
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 15000);
    return () => clearInterval(interval);
  }, [fetchVehicles, realTimeEnabled]);

  // Build route lookup from routesFc (colors, names, and direction headsigns)
  const routeLookup = {};
  routeFeatureCollection?.features?.forEach((feature) => {
    const { routeShortName, displayShortName, routeLongName, routeColor, routeTextColor, directionDescription, directionHeadsign, directionId } = feature.properties;
    const key = routeShortName || displayShortName;
    if (!key) return;

    if (!routeLookup[key]) {
      routeLookup[key] = {
        routeShortName: key,
        displayShortName: displayShortName || key,
        routeLongName: routeLongName || "",
        routeColor: routeColor || "#666",
        routeTextColor: routeTextColor || "#fff",
        directions: {},
      };
    }
    // Store direction info by directionId (both string and number keys)
    if (directionId !== undefined && directionId !== null) {
      const dirInfo = {
        directionDescription: directionDescription,
        directionHeadsign: directionHeadsign,
      };
      routeLookup[key].directions[directionId] = dirInfo;
      routeLookup[key].directions[String(directionId)] = dirInfo;
    }
    // Also index by lowercase
    if (!routeLookup[key.toLowerCase()]) {
      routeLookup[key.toLowerCase()] = routeLookup[key];
    }
  });

  // Create vehicle GeoJSON feature collection with route colors
  const vehiclesFc = {
    type: "FeatureCollection",
    features: vehicles.map((v) => {
      // Try to match by routeId (GTFS-RT uses route_id)
      const routeInfo =
        routeLookup[v.routeId] ||
        routeLookup[v.routeId?.toLowerCase()] ||
        null;

      // Get direction info - prefer Sanity over GTFS-RT
      // Try both numeric and string keys since directionId types can vary
      const directionInfo =
        routeInfo?.directions?.[v.directionId] ||
        routeInfo?.directions?.[String(v.directionId)] ||
        null;

      return {
        type: "Feature",
        properties: {
          vehicleId: v.vehicleId || v.id,
          routeId: v.routeId,
          bearing: v.bearing || 0,
          speed: v.speed,
          tripId: v.tripId,
          directionId: v.directionId,
          directionDescription: directionInfo?.directionDescription || null,
          directionHeadsign: directionInfo?.directionHeadsign || v.headsign || null,
          vehicleIcon: "bus",
          // Route info for display
          displayShortName: routeInfo?.displayShortName || v.routeId,
          routeLongName: routeInfo?.routeLongName || "",
          routeColor: routeInfo?.routeColor || "#666",
          routeTextColor: routeInfo?.routeTextColor || "#fff",
        },
        geometry: {
          type: "Point",
          coordinates: [v.longitude, v.latitude],
        },
      };
    }),
  };

  if (!baseStyle) { return null; }

  let bboxFc = Object.assign({}, routeFeatureCollection);

  bboxFc.features = bboxFc.features.filter(ft => ft.properties.mapPriority < 4);

  let mapInitialBbox = bbox(bboxFc);

  // Clone the base style so we can add route/vehicle data
  let style = _.cloneDeep(baseStyle);

  if (routeFeatureCollection.features.length > 0) {
    style.sources.routes.data = routeFeatureCollection;
  }

  // Add vehicles to map style
  if (vehiclesFc.features.length > 0) {
    style.sources.vehicles.data = vehiclesFc;
  }

  // Add stops to map style
  if (stopsFc?.features?.length > 0) {
    style.sources.stops.data = stopsFc;
  }

  const handleClick = (e) => {
    // click a stop => navigate to URL
    let stop = map.current.queryRenderedFeatures(e.point, {
      layers: ["stops-points"],
    })[0];
    if (stop) {
      navigate(`/${agency.slug.current}/stop/${stop.properties.stopCode}`);
    }

    // click a routeLabel => navigate to that route URL
    let route = map.current.queryRenderedFeatures(e.point, {
      layers: [
        "route-labels-1",
        "route-labels-2",
        "route-labels-3",
        "route-labels-4",
      ],
    })[0];
    if (route) {
      navigate(
        `/${agency.slug.current}/route/${route.properties.displayShortName}`
      );
    }
  };

  const handleMouseMove = (e) => {
    if (!map.current) return;

    // Check for vehicle hover
    const vehicleFeatures = map.current.queryRenderedFeatures(e.point, {
      layers: ["vehicle-points"],
    });

    if (vehicleFeatures.length > 0) {
      map.current.getCanvas().style.cursor = "pointer";
      const feature = vehicleFeatures[0];
      setHoveredVehicle({
        ...feature.properties,
        longitude: feature.geometry.coordinates[0],
        latitude: feature.geometry.coordinates[1],
      });
      return;
    }

    // Check for other interactive elements
    const stopFeatures = map.current.queryRenderedFeatures(e.point, {
      layers: ["stops-points"],
    });

    if (stopFeatures.length > 0) {
      map.current.getCanvas().style.cursor = "pointer";
    } else {
      map.current.getCanvas().style.cursor = "";
    }

    setHoveredVehicle(null);
  };

  const handleMouseLeave = () => {
    if (map.current) {
      map.current.getCanvas().style.cursor = "";
    }
    setHoveredVehicle(null);
  };

  const zoomToRoutes = () => {
    if (map.current) {
      map.current?.easeTo({
        zoom: 14.01,
      });
    }
  };

  const geolocateOnMap = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((x) => {
        map.current?.easeTo({
          center: [x.coords.longitude, x.coords.latitude],
          zoom: 15,
        });
      });
    }
  };

  const handleMoveEnd = () => {
    let routesOnMap = map.current.queryRenderedFeatures({
      layers: [
        "routes-case-1",
        "routes-case-2",
        "routes-case-3",
        "routes-case-4",
      ],
    });

    if (map.current.getZoom() > 11.5) {
      let uniqueRoutes = _.uniqBy(routesOnMap, "properties.routeShortName")
        .map((r) => r.properties)
        .sort(
          (a, b) => parseInt(a.routeShortName) > parseInt(b.routeShortName)
        );
      setRoutes(uniqueRoutes);
    } else {
      setRoutes([]);
    }
  };

  const initialViewState = {
    bounds: mapInitialBbox,
    fitBoundsOptions: {
      padding: 50,
      maxZoom: 17,
      linear: true,
    },
  };

  return (
    <>
      <div id="map" style={{ height: 500 }} className="relative">
        <Mapbox
          ref={map}
          mapLib={MapboxGL}
          mapboxAccessToken={process.env.MAPBOX_ACCESS_TOKEN}
          mapStyle={style}
          initialViewState={initialViewState}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMoveEnd={handleMoveEnd}
          interactiveLayerIds={["stops-points", "vehicle-points"]}
        >
          <NavigationControl showCompass={false} />
          <GeolocateControl />

          {/* Vehicle hover popup */}
          {hoveredVehicle && (
            <Popup
              longitude={hoveredVehicle.longitude}
              latitude={hoveredVehicle.latitude}
              anchor="bottom"
              closeButton={false}
              closeOnClick={false}
              offset={15}
            >
              <div className="p-1.5 min-w-[180px]">
                <div className="flex items-center gap-2 mb-2">
                  <VehicleBadge vehicleId={hoveredVehicle.vehicleId} size="small" />
                  {hoveredVehicle.speed > 0 && (
                    <span className="text-xs text-gray-500">
                      {Math.round(hoveredVehicle.speed * 2.237)} mph
                    </span>
                  )}
                </div>
                {hoveredVehicle.routeId && (
                  <RouteSlim
                    displayShortName={hoveredVehicle.displayShortName}
                    routeLongName={hoveredVehicle.routeLongName}
                    routeColor={hoveredVehicle.routeColor}
                    routeTextColor={hoveredVehicle.routeTextColor}
                    size="small"
                  />
                )}
              </div>
            </Popup>
          )}
        </Mapbox>
        {/* Real-time toggle */}
        {agency?.gtfsRtVehiclePositions && (
          <button
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            className={`
              absolute top-2 left-2 px-3 py-1.5 rounded-full shadow-md text-sm font-medium
              flex items-center gap-2 transition-colors
              ${realTimeEnabled
                ? "bg-green-600 text-white"
                : "bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200"
              }
            `}
          >
            {realTimeEnabled ? (
              <>
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                {vehicles.length} vehicles
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                Real-time off
              </>
            )}
          </button>
        )}
      </div>
      <>
        <div className="my-2">{`${
          routes.length > 0 ? routes.length : `No`
        } routes shown on the map`}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 px-2 md:px-0 max-h-screen overflow-auto">
          {routes.length > 0 ? (
            <>
              {routes.map((r) => (
                <RouteHeader {...r} agency={agency} key={r.routeShortName} />
              ))}
            </>
          ) : (
            <div>
              <button className="font-bold" onClick={() => zoomToRoutes()}>
                Zoom in
              </button>{" "}
              or{" "}
              <button className="font-bold" onClick={() => geolocateOnMap()}>
                jump to your location
              </button>{" "}
              to show more routes.
            </div>
          )}
        </div>
      </>
    </>
  );
};

export default AgencyMap;
