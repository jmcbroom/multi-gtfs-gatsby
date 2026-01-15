import React, { useRef, useState, useMemo, useCallback } from "react";
import { Link } from "gatsby";
import { cloneDeep, uniqBy } from "lodash-es";
import bbox from "@turf/bbox";
import MapboxGL from "mapbox-gl/dist/mapbox-gl";
import Mapbox, { GeolocateControl, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import RouteBadge from "./RouteBadge";
import RouteSlim from "./RouteSlim";
import StopBadge from "./StopBadge";
import { useTheme } from "../hooks/ThemeContext";
import mapboxStyles from "../styles/styleFactory";
import { Cross2Icon } from "@radix-ui/react-icons";
import { shortenStopName } from "../util";

const SystemMap = ({ routes, stopsFc, agencySlug, agencyName, agencyData }) => {
  const { theme } = useTheme();
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);
  const map = useRef();

  // Create route features
  const routeFeatures = [];
  routes.forEach((route) => {
    route.directions?.forEach((direction) => {
      // Skip directions without directionShape (route geometry)
      if (!direction.directionShape) {
        console.warn(`Route ${route.routeShortName} direction ${direction.directionId} missing directionShape`);
        return;
      }

      try {
        let feature = JSON.parse(direction.directionShape)[0];
        feature.properties = {
          feedIndex: route.feedIndex,
          routeShortName: route.routeShortName,
          displayShortName: route.displayShortName,
          routeLongName: route.routeLongName,
          routeColor: route.routeColor,
          routeTextColor: route.routeTextColor,
          tripCount: route.trips.totalCount,
          mapPriority: route.mapPriority,
          agencySlug: agencySlug,
          agencyName: agencyName,
          link: `/${agencySlug}/route/${route.displayShortName}`,
          directionDescription: direction.directionDescription,
          directionHeadsign: direction.directionHeadsign,
          directionId: direction.directionId,
        };
        routeFeatures.push(feature);
      } catch (err) {
        console.warn(`Failed to parse directionShape for route ${route.routeShortName} direction ${direction.directionId}:`, err);
      }
    });
  });

  const routeFeatureCollection = {
    type: "FeatureCollection",
    features: routeFeatures,
  };

  // Build route lookup for directions
  const routeLookup = useMemo(() => {
    const lookup = {};
    routes.forEach((route) => {
      const key = `${route.feedIndex}-${route.routeShortName}`;
      lookup[key] = {
        directions: route.directions || [],
        longName: route.routeLongName,
      };
    });
    return lookup;
  }, [routes]);

  // Derive unique routes - include routes even without map geometry
  const allVisibleRoutes = useMemo(() => {
    // First, get routes from features
    const routesFromFeatures = uniqBy(
      routeFeatures,
      (ft) => `${ft.properties.feedIndex}-${ft.properties.routeShortName}`
    ).map((ft) => ft.properties);

    // Add routes that have no features (no directionShape) but should still appear in list
    const routesWithoutFeatures = routes
      .filter((route) => {
        const key = `${route.feedIndex}-${route.routeShortName}`;
        return !routesFromFeatures.some(
          (r) => `${r.feedIndex}-${r.routeShortName}` === key
        );
      })
      .map((route) => ({
        feedIndex: route.feedIndex,
        routeShortName: route.routeShortName,
        displayShortName: route.displayShortName,
        routeLongName: route.routeLongName,
        routeColor: route.routeColor,
        routeTextColor: route.routeTextColor,
        tripCount: route.trips?.totalCount || 0,
        mapPriority: route.mapPriority || 4,
        agencySlug: agencySlug,
        agencyName: agencyName,
        link: `/${agencySlug}/route/${route.displayShortName}`,
      }));

    return [...routesFromFeatures, ...routesWithoutFeatures];
  }, [routeFeatures, routes, agencySlug, agencyName]);

  // Use high-priority routes for bbox, but if there are none, use all routes
  let bboxFeatures = routeFeatures.filter((ft) => ft.properties.mapPriority < 4);
  if (bboxFeatures.length === 0) {
    bboxFeatures = routeFeatures;
  }

  const bboxFc = {
    type: "FeatureCollection",
    features: bboxFeatures,
  };

  const handleRouteClick = useCallback(
    (route) => {
      const routeKey = `${route.feedIndex}-${route.routeShortName}`;
      if (
        selectedRoute &&
        `${selectedRoute.feedIndex}-${selectedRoute.routeShortName}` ===
          routeKey
      ) {
        setSelectedRoute(null);
      } else {
        setSelectedRoute(route);
        setSelectedStop(null); // Clear stop selection
        if (routeFeatures.length > 0 && map.current) {
          const selectedRouteFeatures = routeFeatures.filter(
            (ft) =>
              ft.properties.feedIndex === route.feedIndex &&
              ft.properties.routeShortName === route.routeShortName
          );
          if (selectedRouteFeatures.length > 0) {
            const routeBbox = bbox({
              type: "FeatureCollection",
              features: selectedRouteFeatures,
            });
            const isMobile = window.innerWidth < 768;
            map.current.fitBounds(routeBbox, {
              padding: isMobile ? 35 : 50,
              maxZoom: 14,
              linear: true,
            });
          }
        }
      }
    },
    [selectedRoute, routeFeatures]
  );

  const getRouteDetails = useCallback(
    (route) => {
      const key = `${route.feedIndex}-${route.routeShortName}`;
      return routeLookup[key] || { directions: [] };
    },
    [routeLookup]
  );

  // Sort routes by route number/priority
  const sortedRoutes = useMemo(() => {
    return [...allVisibleRoutes].sort((a, b) => {
      if ((a.mapPriority || 4) !== (b.mapPriority || 4))
        return (a.mapPriority || 4) - (b.mapPriority || 4);
      const aNum = parseInt(a.routeShortName) || 999;
      const bNum = parseInt(b.routeShortName) || 999;
      if (aNum !== bNum) return aNum - bNum;
      return a.routeShortName.localeCompare(b.routeShortName);
    });
  }, [allVisibleRoutes]);

  const handleMouseMove = (e) => {
    if (!map.current) return;

    // Check for stops and timepoints
    const stops = map.current.queryRenderedFeatures(e.point, {
      layers: ["stops-points", "stops-timepoint-points", "timepoint-points"],
    });

    if (stops.length > 0) {
      map.current.getCanvas().style.cursor = "pointer";
      return;
    }

    // Check for route shapes and labels
    const routeLayers = [
      "routes-1",
      "routes-2",
      "routes-3",
      "routes-4",
      "route-labels-1",
      "route-labels-2",
      "route-labels-3",
      "route-labels-4",
    ];

    // Add highlight layers only if a route is selected
    if (selectedRoute) {
      routeLayers.push("routes-highlight-line", "routes-highlight-label");
    }

    const routes = map.current.queryRenderedFeatures(e.point, {
      layers: routeLayers,
    });

    if (routes.length > 0) {
      map.current.getCanvas().style.cursor = "pointer";
    } else {
      map.current.getCanvas().style.cursor = "";
    }
  };

  const handleMouseLeave = () => {
    if (map.current) {
      map.current.getCanvas().style.cursor = "";
    }
  };

  const handleMapClick = (e) => {
    if (!map.current) return;

    const stops = map.current.queryRenderedFeatures(e.point, {
      layers: ["stops-points", "stops-timepoint-points", "timepoint-points"],
    });

    if (stops.length > 0) {
      const stop = stops[0];
      const stopData = {
        stopId: stop.properties.stopId,
        stopCode: stop.properties.stopCode,
        stopName: stop.properties.stopName,
        isTimepoint: stop.properties.isTimepoint === true,
        coordinates: [
          stop.geometry.coordinates[0],
          stop.geometry.coordinates[1],
        ],
      };
      setSelectedStop(stopData);
      setSelectedRoute(null); // Clear route selection

      // Zoom to the stop
      map.current.easeTo({
        center: stopData.coordinates,
        zoom: 16,
        duration: 800,
      });
      return;
    }

    const routeLayers = [
      "routes-1",
      "routes-2",
      "routes-3",
      "routes-4",
      "route-labels-1",
      "route-labels-2",
      "route-labels-3",
      "route-labels-4",
    ];

    // Add highlight layers only if a route is selected
    if (selectedRoute) {
      routeLayers.push("routes-highlight-line", "routes-highlight-label");
    }

    const features = map.current.queryRenderedFeatures(e.point, {
      layers: routeLayers,
    });

    if (features.length > 0) {
      const feature = features[0];
      const route = {
        feedIndex: feature.properties.feedIndex,
        routeShortName: feature.properties.routeShortName,
        displayShortName: feature.properties.displayShortName,
        routeLongName: feature.properties.routeLongName,
        routeColor: feature.properties.routeColor,
        routeTextColor: feature.properties.routeTextColor,
        agencyName: feature.properties.agencyName,
        link: feature.properties.link,
        tripCount: feature.properties.tripCount,
        mapPriority: feature.properties.mapPriority,
      };
      handleRouteClick(route);
    }
  };

  const renderRouteItem = (r) => {
    const routeKey = `${r.feedIndex}-${r.routeShortName}`;
    const isSelected =
      selectedRoute &&
      `${selectedRoute.feedIndex}-${selectedRoute.routeShortName}` === routeKey;

    return (
      <div
        key={routeKey}
        onClick={() => handleRouteClick(r)}
        className={`cursor-pointer md:p-0 ${
          isSelected ? "bg-blue-50 dark:bg-blue-900/30" : ""
        }`}
      >
        <RouteSlim
          {...r}
          link={false}
          onClick={(e) => {
            e.preventDefault();
            handleRouteClick(r);
          }}
        />
      </div>
    );
  };

  // Build set of timepoint stop IDs when route is selected
  const timepointStopIds = useMemo(() => {
    if (!selectedRoute || !routes) return new Set();

    const route = routes.find(
      (r) =>
        r.feedIndex === selectedRoute.feedIndex &&
        r.routeShortName === selectedRoute.routeShortName
    );

    if (!route?.longTrips) return new Set();

    const stopIds = new Set();
    route.longTrips.forEach((trip) => {
      trip.stopTimes?.forEach((st) => {
        if (st.timepoint === 1 && st.stop) {
          stopIds.add(st.stop.stopId);
        }
      });
    });

    return stopIds;
  }, [selectedRoute, routes]);

  // Build timepoints feature collection for low zoom levels
  const timepointsFc = useMemo(() => {
    if (timepointStopIds.size === 0 || !stopsFc) return null;

    const timepointFeatures = stopsFc.features
      .filter((f) => timepointStopIds.has(f.properties.stopId))
      .map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          stopName: shortenStopName(f.properties.stopName),
          isTimepoint: true,
          offset: [0, 1.5],
          anchor: "top",
          justify: "center",
        },
      }));

    return {
      type: "FeatureCollection",
      features: timepointFeatures,
    };
  }, [timepointStopIds, stopsFc]);

  // Create map style
  if (!theme) return null;

  let mapStyle = cloneDeep(mapboxStyles[theme]);

  if (routeFeatureCollection.features.length > 0) {
    mapStyle.sources.routes.data = routeFeatureCollection;
  }

  if (stopsFc?.features?.length > 0) {
    mapStyle.sources.stops.data = stopsFc;
  }

  // Add timepoints source when route is selected (for low zoom levels)
  if (timepointsFc?.features?.length > 0) {
    mapStyle.sources.timepoints.data = timepointsFc;
  }

  // Add selected stop highlight
  if (selectedStop?.coordinates) {
    mapStyle.sources["selected-stop"] = {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: selectedStop.coordinates,
            },
            properties: {
              stopId: selectedStop.stopId,
            },
          },
        ],
      },
    };
  }

  const routeCaseLayerIds = [
    "routes-case-1",
    "routes-case-2",
    "routes-case-3",
    "routes-case-4",
  ];
  const routeLineLayerIds = ["routes-1", "routes-2", "routes-3", "routes-4"];
  const routeLabelLayerIds = [
    "route-labels-1",
    "route-labels-2",
    "route-labels-3",
    "route-labels-4",
  ];

  const innerLineOpacity = theme === "light" ? 0.55 : 0.35;

  if (selectedRoute) {
    const selectedFeatures = routeFeatures.filter(
      (ft) =>
        ft.properties.feedIndex === selectedRoute.feedIndex &&
        ft.properties.routeShortName === selectedRoute.routeShortName
    );
    mapStyle.sources["routes-highlight"] = {
      type: "geojson",
      data: { type: "FeatureCollection", features: selectedFeatures },
    };

    mapStyle.layers = mapStyle.layers.map((layer) => {
      if (routeCaseLayerIds.includes(layer.id)) {
        return { ...layer, paint: { ...layer.paint, "line-opacity": 0.25 } };
      }
      if (routeLineLayerIds.includes(layer.id)) {
        return { ...layer, paint: { ...layer.paint, "line-opacity": 0 } };
      }
      if (routeLabelLayerIds.includes(layer.id)) {
        return { ...layer, paint: { ...layer.paint, "text-opacity": 0 } };
      }
      // Quick transition from timepoints to regular stops at zoom 14
      if (layer.id === "timepoint-points") {
        return {
          ...layer,
          maxzoom: 14.05,
          paint: {
            ...layer.paint,
            "circle-opacity": {
              stops: [
                [13.5, 1],
                [14, 0.5],
                [14.05, 0],
              ],
            },
            "circle-stroke-opacity": {
              stops: [
                [13.5, 1],
                [14, 0.5],
                [14.05, 0],
              ],
            },
          },
        };
      }
      if (layer.id === "timepoint-labels") {
        return {
          ...layer,
          maxzoom: 14.05,
          paint: {
            ...layer.paint,
            "text-opacity": {
              stops: [
                [13.5, 1],
                [14, 0.5],
                [14.05, 0],
              ],
            },
          },
        };
      }
      // Ensure regular stops appear right after timepoints disappear
      if (layer.id === "stops-points") {
        return { ...layer, minzoom: 14 };
      }
      if (layer.id === "stops-timepoint-points") {
        return { ...layer, minzoom: 14 };
      }
      if (layer.id === "stops-labels") {
        return { ...layer, minzoom: 14 };
      }
      if (layer.id === "stops-timepoint-labels") {
        return { ...layer, minzoom: 14 };
      }
      return layer;
    });

    const highlightLayers = [
      {
        id: "routes-highlight-glow-outer",
        type: "line",
        source: "routes-highlight",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["get", "routeColor"],
          "line-width": {
            stops: [
              [8, 12],
              [12, 24],
              [16, 32],
            ],
          },
          "line-opacity": 0.15,
          "line-blur": {
            stops: [
              [8, 4],
              [12, 8],
              [16, 10],
            ],
          },
        },
      },
      {
        id: "routes-highlight-glow",
        type: "line",
        source: "routes-highlight",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["get", "routeColor"],
          "line-width": {
            stops: [
              [8, 8],
              [12, 14],
              [16, 18],
            ],
          },
          "line-opacity": 0.25,
          "line-blur": {
            stops: [
              [8, 2],
              [12, 3],
              [16, 4],
            ],
          },
        },
      },
      {
        id: "routes-highlight-case",
        type: "line",
        source: "routes-highlight",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["get", "routeColor"],
          "line-width": {
            stops: [
              [8, 4],
              [12, 7],
              [16, 10],
            ],
          },
          "line-opacity": 1,
        },
      },
      {
        id: "routes-highlight-line",
        type: "line",
        source: "routes-highlight",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["get", "routeTextColor"],
          "line-width": {
            stops: [
              [8, 2],
              [12, 3.5],
              [16, 5],
            ],
          },
          "line-opacity": innerLineOpacity,
        },
      },
      {
        id: "routes-highlight-label",
        type: "symbol",
        source: "routes-highlight",
        layout: {
          "text-field": ["get", "displayShortName"],
          "text-justify": "auto",
          "symbol-placement": "line",
          "symbol-spacing": 100,
          "text-rotation-alignment": "viewport",
          "text-font": ["Inter Bold"],
          "text-padding": {
            base: 1,
            stops: [
              [10, 2],
              [16, 10],
            ],
          },
          "text-size": {
            base: 1,
            stops: [
              [10, 10],
              [16, 14],
            ],
          },
        },
        paint: {
          "text-color": ["get", "routeTextColor"],
          "text-halo-color": ["get", "routeColor"],
          "text-halo-width": {
            base: 1.5,
            stops: [
              [10, 5],
              [16, 5],
            ],
          },
        },
      },
    ];
    const labelIndex = mapStyle.layers.findIndex(
      (l) => l.id === "route-labels-1"
    );
    if (labelIndex !== -1) {
      mapStyle.layers.splice(labelIndex + 1, 0, ...highlightLayers);
    } else {
      mapStyle.layers.push(...highlightLayers);
    }
  }

  // Add selected stop highlight layer
  if (selectedStop?.coordinates) {
    const selectedStopLayer = {
      id: "selected-stop-circle",
      type: "circle",
      source: "selected-stop",
      paint: {
        "circle-radius": 8,
        "circle-color": "#eab308",
        "circle-opacity": 1,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-opacity": 1,
      },
    };
    mapStyle.layers.push(selectedStopLayer);
  }

  const mapInitialBbox = bboxFc.features.length > 0 ? bbox(bboxFc) : null;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const initialViewState = mapInitialBbox
    ? {
        bounds: mapInitialBbox,
        fitBoundsOptions: {
          padding: isMobile ? 20 : 50,
          minZoom: 10.5, // Ensure priority 4 routes are visible
          maxZoom: 17,
          linear: true,
        },
      }
    : { longitude: -83.0458, latitude: 42.3314, zoom: 10 };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] grid-rows-[auto_1fr_auto] md:grid-rows-[auto_1fr] h-screen md:h-[calc(100vh-200px)] min-h-[500px] gap-0">
      {/* Routes Sidebar - hidden on mobile when route/stop selected, always visible on desktop */}
      <div
        className={`order-2 md:order-none bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-700 flex flex-col overflow-hidden md:row-span-2 ${
          selectedRoute || selectedStop ? "hidden md:flex" : ""
        }`}
      >
        {/* Header */}
        <h4 className="grayHeader">{allVisibleRoutes.length} routes</h4>

        <div className="flex flex-col p-2 gap-2 flex-1 overflow-y-auto">
          {sortedRoutes.map((r) => renderRouteItem(r))}
        </div>
      </div>

      {/* Map Container - order-1 on mobile, normal on desktop */}
      <div className="order-1 md:order-none flex flex-col overflow-hidden h-[300px] md:h-[60vh]">
        <h4 className="grayHeader">System map</h4>
        <div className="flex-1 relative min-h-0" style={{ height: '100%' }}>
          <Mapbox
            ref={map}
            mapLib={MapboxGL}
            mapboxAccessToken={process.env.MAPBOX_ACCESS_TOKEN}
            mapStyle={mapStyle}
            initialViewState={initialViewState}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleMapClick}
            style={{ width: "100%", height: "100%" }}
            attributionControl={false}
          >
            <GeolocateControl position="top-right" />
          </Mapbox>
        </div>
      </div>

      {/* Details Panel - replaces routes on mobile when selected, under map on desktop */}
      {(selectedRoute || selectedStop) && (
        <div className="order-2 md:order-none bg-white dark:bg-zinc-900 border-t md:border-t border-gray-200 dark:border-zinc-700 flex flex-col overflow-hidden md:max-h-none">
          <div className="flex items-center justify-between flex-shrink-0 grayHeader">
            {/* Header */}
            <h4 className="flex-1 m-0 p-0">
              {selectedRoute && "Selected route details"}
              {selectedStop && "Selected stop details"}
            </h4>
            <button
              onClick={() => {
                setSelectedRoute(null);
                setSelectedStop(null);
              }}
              className="rounded hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors"
              title="Clear selection"
            >
              <Cross2Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedRoute && (
              <div className="space-y-4">
                {/* Route Badge */}
                <div className="flex items-center gap-3">
                  <RouteBadge
                    route={{
                      displayShortName: selectedRoute.displayShortName,
                      routeColor: selectedRoute.routeColor,
                      routeTextColor: selectedRoute.routeTextColor,
                    }}
                    size="medium"
                  />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {selectedRoute.routeLongName}
                    </div>
                  </div>
                </div>

                {/* Directions */}
                {(() => {
                  const details = getRouteDetails(selectedRoute);
                  return (
                    details.directions.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Directions
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                          {details.directions.map((dir, idx) => (
                            <div
                              key={idx}
                              className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-zinc-800 rounded p-3"
                            >
                              {dir.directionDescription && (
                                <div className="font-medium">
                                  {dir.directionDescription}
                                </div>
                              )}
                              {dir.directionHeadsign && (
                                <div className="text-gray-600 dark:text-gray-400">
                                  to {dir.directionHeadsign}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  );
                })()}

                {/* View Schedule Link */}
                <Link
                  to={selectedRoute.link}
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View full schedule & details →
                </Link>
              </div>
            )}

            {selectedStop && (
              <div
                className="md:max-w-2xl rounded md:mx-auto space-y-2 md:space-y-4 border-l-4 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 md:rounded-lg p-3 md:p-4 md:shadow-sm"
                style={{ borderLeftColor: agencyData?.color?.hex || "#3b82f6" }}
              >
                {/* Stop Header - mimics StopCard layout */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <Link
                      to={`/${agencySlug}/stop/${selectedStop.stopCode}`}
                      className="font-medium text-gray-800 dark:text-zinc-200 hover:underline"
                    >
                      {selectedStop.stopName}
                    </Link>
                  </div>
                  <StopBadge stopId={selectedStop.stopCode} size="xs" />
                </div>

                {/* Routes section - show routes that serve this stop */}
                {(() => {
                  // Find routes and their directions that serve this stop
                  const routeDirectionsAtStop = [];

                  routes.forEach((route) => {
                    if (!route.longTrips || !route.directions) return;

                    // Find which directions serve this stop
                    const directionsAtStop = [];
                    route.longTrips.forEach((trip) => {
                      const hasStop = trip.stopTimes?.some(
                        (st) => st.stop?.stopId === selectedStop.stopId
                      );
                      if (hasStop) {
                        // Find the matching direction from route.directions
                        const direction = route.directions.find(
                          (d) => d.directionId === trip.directionId
                        );
                        if (
                          direction &&
                          !directionsAtStop.some(
                            (d) => d.directionId === direction.directionId
                          )
                        ) {
                          directionsAtStop.push(direction);
                        }
                      }
                    });

                    // Add an entry for each direction
                    directionsAtStop.forEach((direction) => {
                      routeDirectionsAtStop.push({
                        ...route,
                        direction,
                      });
                    });
                  });

                  if (routeDirectionsAtStop.length === 0) return null;

                  return (
                    <div>
                      <div className="flex flex-wrap gap-1.5">
                        {routeDirectionsAtStop.map((item, idx) => (
                          <RouteSlim
                            key={`${item.feedIndex}-${item.routeShortName}-${item.direction.directionId}-${idx}`}
                            routeShortName={item.routeShortName}
                            displayShortName={item.displayShortName}
                            routeLongName={item.routeLongName}
                            routeColor={item.routeColor}
                            routeTextColor={item.routeTextColor}
                            direction={{
                              directionId: item.direction.directionId,
                              directionHeadsign:
                                item.direction.directionHeadsign,
                              directionDescription:
                                item.direction.directionDescription,
                            }}
                            size="xs"
                            link={`/${agencySlug}/route/${item.displayShortName}`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Link to full stop page */}
                <Link
                  to={`/${agencySlug}/stop/${selectedStop.stopCode}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View full stop page →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemMap;
