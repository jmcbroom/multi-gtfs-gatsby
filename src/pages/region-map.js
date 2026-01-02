import bbox from "@turf/bbox";
import { graphql, Link } from "gatsby";
import _ from "lodash";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useRef, useState, useMemo, useEffect, useCallback } from "react";
import MapboxGL from "mapbox-gl/dist/mapbox-gl";
import Mapbox, { GeolocateControl, NavigationControl, Popup } from "react-map-gl";
import RouteBadge from "../components/RouteBadge";
import { useTheme } from "../hooks/ThemeContext";
import { useSanityAgencies } from "../hooks/useSanityAgencies";
import { useSanityRoutes } from "../hooks/useSanityRoutes";
import mapboxStyles from "../styles/styleFactory";
import { createRouteData } from "../util";
import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";

const RegionMapPage = ({ data }) => {
  const { theme } = useTheme();

  let style = _.cloneDeep(mapboxStyles[theme]);

  // State
  const [visibleAgencies, setVisibleAgencies] = useState(new Set());
  const [hoveredRoute, setHoveredRoute] = useState(null);
  const [agenciesInitialized, setAgenciesInitialized] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [sortMode, setSortMode] = useState("agency"); // agency, route, frequency
  const [visibleRouteKeys, setVisibleRouteKeys] = useState(null);

  let { sanityAgencies } = useSanityAgencies();
  sanityAgencies = sanityAgencies.edges.map((edge) => edge.node);
  let gtfsAgencies = data.postgres.agencies;

  let { sanityRoutes } = useSanityRoutes();
  sanityRoutes = sanityRoutes.edges.map((edge) => edge.node);

  // filter out non-active gtfsAgencies/feeds
  // TODO: Don't pull these from the GraphQL query in the first place.
  const activeFeedIndices = useMemo(
    () => sanityAgencies.map((agency) => agency.currentFeedIndex),
    [sanityAgencies]
  );
  gtfsAgencies = gtfsAgencies.filter(
    (agency) => activeFeedIndices.indexOf(agency.feedIndex) > -1
  );

  // Initialize visible agencies to all active agencies
  useEffect(() => {
    if (!agenciesInitialized && activeFeedIndices.length > 0) {
      setVisibleAgencies(new Set(activeFeedIndices));
      setAgenciesInitialized(true);
    }
  }, [agenciesInitialized, activeFeedIndices]);

  // Build agency lookup for names/colors
  const agencyLookup = useMemo(() => {
    const lookup = {};
    sanityAgencies.forEach((agency) => {
      lookup[agency.currentFeedIndex] = {
        name: agency.name,
        fullName: agency.fullName,
        color: agency.color?.hex || "#666",
        textColor: agency.textColor?.hex || "#fff",
        slug: agency.slug?.current,
      };
    });
    return lookup;
  }, [sanityAgencies]);

  // Build route lookup for directions/headsigns
  const routeLookup = useMemo(() => {
    const lookup = {};
    sanityRoutes.forEach((route) => {
      const key = `${route.agency.currentFeedIndex}-${route.shortName}`;
      lookup[key] = {
        directions: route.directions || [],
        longName: route.longName,
      };
    });
    return lookup;
  }, [sanityRoutes]);

  // Build calendar lookup by feedIndex -> serviceId -> calendar
  const calendarLookup = useMemo(() => {
    const lookup = {};
    gtfsAgencies.forEach((agency) => {
      if (!agency.feedInfo?.serviceCalendars) return;
      lookup[agency.feedIndex] = {};
      agency.feedInfo.serviceCalendars.forEach((cal) => {
        lookup[agency.feedIndex][cal.serviceId] = cal;
      });
    });
    return lookup;
  }, [gtfsAgencies]);

  // Function to get service days for a route
  const getServiceDaysForRoute = (feedIndex, trips) => {
    const calendars = calendarLookup[feedIndex];
    if (!calendars || !trips?.nodes) return { weekday: false, saturday: false, sunday: false };

    const serviceIds = [...new Set(trips.nodes.map(t => t.serviceId))];
    let weekday = false, saturday = false, sunday = false;

    serviceIds.forEach((serviceId) => {
      const cal = calendars[serviceId];
      if (!cal) return;
      if (cal.monday || cal.tuesday || cal.wednesday || cal.thursday || cal.friday) weekday = true;
      if (cal.saturday) saturday = true;
      if (cal.sunday) sunday = true;
    });

    return { weekday, saturday, sunday };
  };

  // roll up all the gtfsRoutes into one
  let gtfsRoutes = gtfsAgencies
    .map((agency) => agency.routes)
    .reduce((acc, val) => acc.concat(val));

  // features container for the GeoJSON FeatureCollection
  let allRouteFeatures = [];

  // iterate through the Sanity routes
  sanityRoutes.forEach((sanityRoute) => {
    // match to the corresponding GTFS route
    let matching = gtfsRoutes.filter(
      (gr) =>
        gr.feedIndex === sanityRoute.agency.currentFeedIndex &&
        gr.routeShortName === sanityRoute.shortName
    );

    if (matching.length === 0) {
      return;
    }
    let routeData = createRouteData(matching[0], sanityRoute);

    let link = `/${sanityRoute.agency.slug.current}/route/${routeData.displayShortName}`;
    if (
      ["qline", "people-mover", "d2a2", "michigan-flyer"].indexOf(
        sanityRoute.agency.slug.current
      ) > -1
    ) {
      link = `/${sanityRoute.agency.slug.current}`;
    }

    // Get service days for this route
    const serviceDays = getServiceDaysForRoute(routeData.feedIndex, matching[0].trips);

    // iterate through route directions
    routeData.directions.forEach((direction) => {
      // make a GeoJSON feature
      let feature = JSON.parse(direction.directionShape)[0];
      const agencyInfo = agencyLookup[routeData.feedIndex] || {};
      feature.properties = {
        feedIndex: routeData.feedIndex,
        routeShortName: routeData.displayShortName,
        displayShortName: routeData.displayShortName,
        routeLongName: routeData.routeLongName,
        routeColor: routeData.routeColor,
        routeTextColor: routeData.routeTextColor,
        tripCount: routeData.trips.totalCount,
        mapPriority: routeData.mapPriority,
        agencySlug: sanityRoute.agency.slug.current,
        agencyName: agencyInfo.name || sanityRoute.agency.slug.current,
        link: link,
        serviceDays: serviceDays,
      };
      allRouteFeatures.push(feature);
    });
  });

  allRouteFeatures.sort(
    (a, b) => a.properties.tripCount > b.properties.tripCount
  );

  // Filter features by visible agencies
  const filteredFeatures = allRouteFeatures.filter(
    (ft) => visibleAgencies.has(ft.properties.feedIndex)
  );

  // Derive unique routes from filtered features, filtered by viewport
  const allVisibleRoutes = useMemo(() => {
    // First get unique routes
    const uniqueRoutes = _.uniqBy(filteredFeatures, (ft) =>
      `${ft.properties.feedIndex}-${ft.properties.routeShortName}`
    );
    // Then filter by viewport if we have visible route keys
    const viewportFiltered = visibleRouteKeys
      ? uniqueRoutes.filter((ft) => {
          const key = `${ft.properties.feedIndex}-${ft.properties.routeShortName}`;
          return visibleRouteKeys.has(key);
        })
      : uniqueRoutes;
    return viewportFiltered.map((ft) => ft.properties);
  }, [filteredFeatures, visibleRouteKeys]);

  let routeFeatureCollection = {
    type: "FeatureCollection",
    features: filteredFeatures,
  };

  let bboxFc = {
    type: "FeatureCollection",
    features: allRouteFeatures.filter((ft) => ft.properties.mapPriority < 4),
  };

  const map = useRef();
  const routeListRef = useRef();

  // Scroll to selected route when it changes or when visible routes update
  useEffect(() => {
    if (selectedRoute && routeListRef.current) {
      const routeKey = `${selectedRoute.feedIndex}-${selectedRoute.routeShortName}`;
      const element = routeListRef.current.querySelector(`[data-route-key="${routeKey}"]`);
      if (element) {
        const container = routeListRef.current;
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        // Account for sticky agency header height (~28px for py-1.5 + text-xs)
        const headerOffset = sortMode === 'agency' ? 28 : 0;
        const scrollTop = container.scrollTop + (elementRect.top - containerRect.top) - headerOffset;
        container.scrollTo({ top: scrollTop, behavior: 'smooth' });
      }
    }
  }, [selectedRoute, visibleRouteKeys, sortMode]);

  const handleRouteClick = useCallback((route) => {
    const routeKey = `${route.feedIndex}-${route.routeShortName}`;
    if (selectedRoute && `${selectedRoute.feedIndex}-${selectedRoute.routeShortName}` === routeKey) {
      setSelectedRoute(null);
    } else {
      setSelectedRoute(route);
      // Fit bounds to the selected route
      const routeFeatures = filteredFeatures.filter(
        ft => ft.properties.feedIndex === route.feedIndex &&
              ft.properties.routeShortName === route.routeShortName
      );
      if (routeFeatures.length > 0 && map.current) {
        const routeBbox = bbox({ type: "FeatureCollection", features: routeFeatures });
        map.current.fitBounds(routeBbox, { padding: 50, maxZoom: 14, linear: true });
      }
    }
  }, [selectedRoute, filteredFeatures]);

  const getRouteDetails = useCallback((route) => {
    const key = `${route.feedIndex}-${route.routeShortName}`;
    return routeLookup[key] || { directions: [] };
  }, [routeLookup]);

  // Sort routes based on sortMode
  const sortedRoutes = useMemo(() => {
    const sorted = [...allVisibleRoutes];
    switch (sortMode) {
      case "agency":
        return sorted.sort((a, b) => {
          if (a.feedIndex !== b.feedIndex) return a.feedIndex - b.feedIndex;
          if ((a.mapPriority || 4) !== (b.mapPriority || 4)) return (a.mapPriority || 4) - (b.mapPriority || 4);
          const aNum = parseInt(a.routeShortName) || 999;
          const bNum = parseInt(b.routeShortName) || 999;
          if (aNum !== bNum) return aNum - bNum;
          return a.routeShortName.localeCompare(b.routeShortName);
        });
      case "route":
        return sorted.sort((a, b) => {
          const aNum = parseInt(a.routeShortName) || 999;
          const bNum = parseInt(b.routeShortName) || 999;
          if (aNum !== bNum) return aNum - bNum;
          return a.routeShortName.localeCompare(b.routeShortName);
        });
      case "frequency":
        return sorted.sort((a, b) => b.tripCount - a.tripCount);
      default:
        return sorted;
    }
  }, [allVisibleRoutes, sortMode]);

  // Group routes by agency when in agency mode
  const groupedRoutes = useMemo(() => {
    if (sortMode !== "agency") return null;
    return _.groupBy(sortedRoutes, "feedIndex");
  }, [sortedRoutes, sortMode]);

  // Get visible route keys from rendered features
  const updateVisibleRoutes = useCallback(() => {
    if (!map.current) return;
    const m = map.current.getMap ? map.current.getMap() : map.current;
    if (!m || !m.queryRenderedFeatures) return;

    const routeLayers = ["routes-1", "routes-2", "routes-3", "routes-4"];
    const visibleFeatures = m.queryRenderedFeatures(undefined, { layers: routeLayers });

    const visibleKeys = new Set(
      visibleFeatures.map(ft => `${ft.properties.feedIndex}-${ft.properties.routeShortName}`)
    );
    setVisibleRouteKeys(visibleKeys);
  }, []);

  const handleMoveEnd = useCallback(() => {
    updateVisibleRoutes();
  }, [updateVisibleRoutes]);

  const handleLoad = useCallback(() => {
    // Small delay to ensure layers are rendered
    setTimeout(updateVisibleRoutes, 100);
  }, [updateVisibleRoutes]);

  if (!theme) {
    return null;
  }

  let mapInitialBbox = bbox(bboxFc);

  if (routeFeatureCollection.features.length > 0) {
    style.sources.routes.data = routeFeatureCollection;
  }

  // Highlight selected route using separate layers on top
  const routeCaseLayerIds = [
    "routes-case-1", "routes-case-2", "routes-case-3", "routes-case-4",
  ];
  const routeLineLayerIds = [
    "routes-1", "routes-2", "routes-3", "routes-4",
  ];
  const routeLabelLayerIds = [
    "route-labels-1", "route-labels-2", "route-labels-3", "route-labels-4",
  ];

  const innerLineOpacity = theme === "light" ? 0.55 : 0.35;

  if (selectedRoute) {
    // Create highlight source with only the selected route's features
    const selectedFeatures = filteredFeatures.filter(
      ft => ft.properties.feedIndex === selectedRoute.feedIndex &&
            ft.properties.routeShortName === selectedRoute.routeShortName
    );
    style.sources["routes-highlight"] = {
      type: "geojson",
      data: { type: "FeatureCollection", features: selectedFeatures }
    };

    // Dim all base route layers - keep colors but reduce opacity
    // Hide inner line layer entirely to avoid overlap artifacts
    style.layers = style.layers.map(layer => {
      if (routeCaseLayerIds.includes(layer.id)) {
        return { ...layer, paint: { ...layer.paint, "line-opacity": 0.25 } };
      }
      if (routeLineLayerIds.includes(layer.id)) {
        return { ...layer, paint: { ...layer.paint, "line-opacity": 0 } };
      }
      if (routeLabelLayerIds.includes(layer.id)) {
        return { ...layer, paint: { ...layer.paint, "text-opacity": 0 } };
      }
      return layer;
    });

    // Insert highlight layers right after route-labels-1 (before road labels)
    const highlightLayers = [
      {
        id: "routes-highlight-glow-outer",
        type: "line",
        source: "routes-highlight",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["get", "routeColor"],
          "line-width": { stops: [[8, 12], [12, 24], [16, 32]] },
          "line-opacity": 0.15,
          "line-blur": { stops: [[8, 4], [12, 8], [16, 10]] }
        }
      },
      {
        id: "routes-highlight-glow",
        type: "line",
        source: "routes-highlight",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["get", "routeColor"],
          "line-width": { stops: [[8, 8], [12, 14], [16, 18]] },
          "line-opacity": 0.25,
          "line-blur": { stops: [[8, 2], [12, 3], [16, 4]] }
        }
      },
      {
        id: "routes-highlight-case",
        type: "line",
        source: "routes-highlight",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["get", "routeColor"],
          "line-width": { stops: [[8, 4], [12, 7], [16, 10]] },
          "line-opacity": 1
        }
      },
      {
        id: "routes-highlight-line",
        type: "line",
        source: "routes-highlight",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["get", "routeTextColor"],
          "line-width": { stops: [[8, 2], [12, 3.5], [16, 5]] },
          "line-opacity": innerLineOpacity
        }
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
          "text-padding": { base: 1, stops: [[10, 2], [16, 10]] },
          "text-size": { base: 1, stops: [[10, 10], [16, 14]] }
        },
        paint: {
          "text-color": ["get", "routeTextColor"],
          "text-halo-color": ["get", "routeColor"],
          "text-halo-width": { base: 1.5, stops: [[10, 5], [16, 5]] }
        }
      }
    ];
    // Find route-labels-1 and insert after it
    const labelIndex = style.layers.findIndex(l => l.id === "route-labels-1");
    if (labelIndex !== -1) {
      style.layers.splice(labelIndex + 1, 0, ...highlightLayers);
    } else {
      style.layers.push(...highlightLayers);
    }
  }


  const handleMouseMove = (e) => {
    if (!map.current) return;

    // Only show popup on route labels (not lines, which can stack)
    const labels = map.current.queryRenderedFeatures(e.point, {
      layers: [
        "route-labels-1",
        "route-labels-2",
        "route-labels-3",
        "route-labels-4",
      ],
    });

    if (labels.length > 0) {
      map.current.getCanvas().style.cursor = "pointer";
      const feature = labels[0];
      setHoveredRoute({
        ...feature.properties,
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat,
      });
    } else {
      map.current.getCanvas().style.cursor = "";
      setHoveredRoute(null);
    }
  };

  const handleMouseLeave = () => {
    map.current.getCanvas().style.cursor = "";
    setHoveredRoute(null);
  };

  const toggleAgency = (feedIndex) => {
    setVisibleAgencies((prev) => {
      const next = new Set(prev);
      if (next.has(feedIndex)) {
        next.delete(feedIndex);
      } else {
        next.add(feedIndex);
      }
      return next;
    });
  };

  const initialViewState = {
    bounds: mapInitialBbox,
    fitBoundsOptions: {
      padding: 50,
      maxZoom: 17,
      linear: true,
    },
  };

  const renderRouteItem = (r) => {
    const routeKey = `${r.feedIndex}-${r.routeShortName}`;
    const isSelected = selectedRoute &&
      `${selectedRoute.feedIndex}-${selectedRoute.routeShortName}` === routeKey;
    const details = getRouteDetails(r);

    return (
      <div
        key={routeKey}
        data-route-key={routeKey}
        className={`border-b border-gray-100 dark:border-zinc-800 last:border-b-0 ${
          isSelected ? "bg-blue-50 dark:bg-blue-900/30" : ""
        }`}
      >
        {/* Route Header Row */}
        <button
          onClick={() => handleRouteClick(r)}
          className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors ${
            isSelected ? "hover:bg-blue-100 dark:hover:bg-blue-900/50" : ""
          }`}
        >
          <RouteBadge
            route={{
              displayShortName: r.displayShortName,
              routeColor: r.routeColor,
              routeTextColor: r.routeTextColor,
            }}
            size="small"
          />
          <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {r.routeLongName}
          </span>
          {isSelected ? (
            <ChevronDownIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
          )}
        </button>

        {/* Expanded Details (shown when selected) */}
        {isSelected && (
          <div className="px-3 pb-3 pt-1 bg-gray-50 dark:bg-zinc-800/50">
            {/* Directions */}
            {details.directions.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Directions
                </div>
                <div className="space-y-1">
                  {details.directions.map((dir, idx) => (
                    <div key={idx} className="text-xs text-gray-700 dark:text-gray-300">
                      {dir.directionDescription && (
                        <span className="font-medium">{dir.directionDescription}</span>
                      )}
                      {dir.directionDescription && dir.directionHeadsign && " to "}
                      {dir.directionHeadsign && (
                        <span>{dir.directionHeadsign}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Service Days */}
            {r.serviceDays && (
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Service
                </div>
                <div className="flex gap-2 text-xs">
                  <span className={r.serviceDays.weekday ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-600 line-through"}>
                    Weekday
                  </span>
                  <span className={r.serviceDays.saturday ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-600 line-through"}>
                    Saturday
                  </span>
                  <span className={r.serviceDays.sunday ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-600 line-through"}>
                    Sunday
                  </span>
                </div>
              </div>
            )}

            {/* View Route Link */}
            <Link
              to={r.link}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              View schedule & details →
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full">
      {/* Routes Sidebar */}
      <div className="w-80 flex-shrink-0 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-700 flex flex-col">
          {/* Header with count and sort */}
          <div className="px-3 py-2 border-b border-gray-200 dark:border-zinc-700 flex-shrink-0 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {allVisibleRoutes.length} routes
            </span>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              className="text-xs bg-transparent border border-gray-300 dark:border-zinc-600 rounded px-2 py-1 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="agency">By agency</option>
              <option value="route">By route #</option>
              <option value="frequency">By frequency</option>
            </select>
          </div>

          <div ref={routeListRef} className="flex-1 overflow-y-auto">
            {/* Grouped by agency mode */}
            {sortMode === "agency" && groupedRoutes && Object.entries(groupedRoutes).map(([feedIndex, agencyRoutes]) => {
              const agencyInfo = agencyLookup[parseInt(feedIndex)];
              return (
                <div key={feedIndex}>
                  {/* Agency Header Bar */}
                  <div
                    className="sticky top-0 px-3 py-1.5 flex items-center gap-2 z-10"
                    style={{
                      backgroundColor: agencyInfo?.color || "#666",
                      color: agencyInfo?.textColor || "#fff",
                    }}
                  >
                    <span className="text-xs font-semibold">{agencyInfo?.name || "Agency"}</span>
                    <span className="text-xs opacity-75">({agencyRoutes.length})</span>
                  </div>
                  {/* Routes in this agency */}
                  {agencyRoutes.map((r) => renderRouteItem(r))}
                </div>
              );
            })}

            {/* Flat list for other sort modes */}
            {sortMode !== "agency" && sortedRoutes.map((r) => renderRouteItem(r))}
          </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        {/* Agency Filter Chips */}
        <div className="absolute top-2 left-2 right-2 z-10 flex gap-2 overflow-x-auto pb-1">
          {sanityAgencies.map((agency) => {
            const isActive = visibleAgencies.has(agency.currentFeedIndex);
            return (
              <button
                key={agency.currentFeedIndex}
                onClick={() => toggleAgency(agency.currentFeedIndex)}
                className={`
                  flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium
                  transition-all duration-200 border-2 shadow-sm
                  ${isActive
                    ? "opacity-100"
                    : "opacity-50 grayscale"
                  }
                `}
                style={{
                  backgroundColor: isActive ? agency.color?.hex || "#666" : "#e5e5e5",
                  color: isActive ? agency.textColor?.hex || "#fff" : "#666",
                  borderColor: agency.color?.hex || "#666",
                }}
              >
                {agency.name}
              </button>
            );
          })}
        </div>

        <Mapbox
        ref={map}
        mapLib={MapboxGL}
        mapboxAccessToken={process.env.MAPBOX_ACCESS_TOKEN}
        mapStyle={style}
        initialViewState={initialViewState}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMoveEnd={handleMoveEnd}
        onLoad={handleLoad}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl showCompass={false} />
        <GeolocateControl />

        {/* Route Hover Popup */}
        {hoveredRoute && (
          <Popup
            longitude={hoveredRoute.longitude}
            latitude={hoveredRoute.latitude}
            anchor="bottom"
            closeButton={false}
            closeOnClick={false}
            offset={10}
          >
            <div className="p-1 min-w-[180px]">
              <div className="flex items-center gap-2 mb-1">
                <RouteBadge
                  route={{
                    displayShortName: hoveredRoute.displayShortName,
                    routeColor: hoveredRoute.routeColor,
                    routeTextColor: hoveredRoute.routeTextColor,
                  }}
                  size="small"
                />
                <span className="font-semibold text-sm truncate">
                  {hoveredRoute.routeLongName}
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {hoveredRoute.agencyName}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                ~{hoveredRoute.tripCount} daily trips
              </div>
            </div>
          </Popup>
        )}
        </Mapbox>
      </div>
    </div>
  );
};

export const query = graphql`
  query RegionMapQuery {
    postgres {
      agencies: agenciesList {
        agencyName
        agencyUrl
        agencyTimezone
        agencyLang
        agencyPhone
        agencyFareUrl
        agencyEmail
        bikesPolicyUrl
        feedIndex
        agencyId
        routes: routesByFeedIndexAndAgencyIdList(
          orderBy: ROUTE_SORT_ORDER_ASC
        ) {
          feedIndex
          routeShortName
          routeLongName
          routeColor
          routeTextColor
          routeSortOrder
          implicitSort
          trips: tripsByFeedIndexAndRouteId {
            totalCount
            nodes {
              serviceId
            }
          }
        }
        feedInfo: feedInfoByFeedIndex {
          serviceCalendars: calendarsByFeedIndexList {
            sunday
            thursday
            tuesday
            wednesday
            monday
            friday
            saturday
            serviceId
          }
        }
      }
    }
  }
`;

export default RegionMapPage;
