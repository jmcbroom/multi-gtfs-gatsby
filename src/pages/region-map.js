import bbox from "@turf/bbox";
import { graphql } from "gatsby";
import _ from "lodash";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useRef, useState, useMemo, useEffect } from "react";
import MapboxGL from "mapbox-gl/dist/mapbox-gl";
import Mapbox, { GeolocateControl, NavigationControl, Popup } from "react-map-gl";
import RouteHeader from "../components/RouteHeader";
import RouteBadge from "../components/RouteBadge";
import { useTheme } from "../hooks/ThemeContext";
import { useSanityAgencies } from "../hooks/useSanityAgencies";
import { useSanityRoutes } from "../hooks/useSanityRoutes";
import mapboxStyles from "../styles/styleFactory";
import { createRouteData } from "../util";
import { ChevronDownIcon } from "@radix-ui/react-icons";

const RegionMapPage = ({ data }) => {
  const { theme } = useTheme();

  let style = _.cloneDeep(mapboxStyles[theme]);

  // State
  const [routes, setRoutes] = useState([]);
  const [visibleAgencies, setVisibleAgencies] = useState(new Set());
  const [hoveredRoute, setHoveredRoute] = useState(null);
  const [panelExpanded, setPanelExpanded] = useState(true);
  const [agenciesInitialized, setAgenciesInitialized] = useState(false);

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

  let routeFeatureCollection = {
    type: "FeatureCollection",
    features: filteredFeatures,
  };

  let bboxFc = {
    type: "FeatureCollection",
    features: allRouteFeatures.filter((ft) => ft.properties.mapPriority < 4),
  };

  const map = useRef();

  if (!theme) {
    return null;
  }

  let mapInitialBbox = bbox(bboxFc);

  if (routeFeatureCollection.features.length > 0) {
    style.sources.routes.data = routeFeatureCollection;
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

  const handleMoveEnd = () => {
    if (!map.current) return;

    let routesOnMap = map.current.queryRenderedFeatures({
      layers: [
        "routes-case-1",
        "routes-case-2",
        "routes-case-3",
        "routes-case-4",
      ],
    });

    if (map.current.getZoom() > 14) {
      let uniqueRoutes = _.uniqBy(routesOnMap, (r) => `${r.properties.feedIndex}-${r.properties.routeShortName}`)
        .map((r) => r.properties)
        .sort((a, b) => parseInt(a.routeShortName) - parseInt(b.routeShortName))
        .sort((a, b) => a.feedIndex - b.feedIndex);
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
    },
  };

  // Sort and group routes by agency
  const sortedRoutes = [...routes].sort((a, b) => {
    if (a.feedIndex !== b.feedIndex) return a.feedIndex - b.feedIndex;
    return (a.mapPriority || 4) - (b.mapPriority || 4);
  });

  const groupedRoutes = _.groupBy(sortedRoutes, "agencySlug");

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Map Section */}
      <div className="relative flex-1 min-h-[300px]">
        {/* Agency Filter Chips */}
        <div className="absolute top-2 left-2 right-12 z-10 flex gap-2 overflow-x-auto pb-1">
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

      {/* Collapsible Route Panel */}
      <div className="bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-700">
        <button
          onClick={() => setPanelExpanded(!panelExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {routes.length > 0 ? `${routes.length} routes in view` : "No routes in view"}
          </span>
          <ChevronDownIcon
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
              panelExpanded ? "rotate-180" : ""
            }`}
          />
        </button>

        {panelExpanded && (
          <div className="max-h-[40vh] overflow-y-auto px-4 pb-4 border-t border-gray-100 dark:border-zinc-800">
            {routes.length > 0 ? (
              Object.entries(groupedRoutes).map(([agencySlug, agencyRoutes]) => {
                const firstRoute = agencyRoutes[0];
                const agencyInfo = agencyLookup[firstRoute?.feedIndex];
                return (
                  <div key={agencySlug} className="mt-3 first:mt-2">
                    {/* Agency Group Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: agencyInfo?.color || "#666" }}
                      />
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                        {agencyInfo?.name || agencySlug}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({agencyRoutes.length})
                      </span>
                    </div>
                    {/* Routes Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {agencyRoutes.map((r) => (
                        <RouteHeader
                          {...r}
                          key={`${r.feedIndex}-${r.routeShortName}`}
                          agency={{ slug: { current: r.agencySlug } }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-4 text-gray-600 dark:text-gray-400">
                <button
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={() => zoomToRoutes()}
                >
                  Zoom in
                </button>{" "}
                or{" "}
                <button
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={() => geolocateOnMap()}
                >
                  jump to your location
                </button>{" "}
                to show routes.
              </div>
            )}
          </div>
        )}
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
