import { faLocationDot, faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import bbox from "@turf/bbox";
import { Link } from "gatsby";
import _ from "lodash";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useEffect, useRef, useState } from "react";
import MapboxGL from "mapbox-gl/dist/mapbox-gl";
import Mapbox, { NavigationControl } from "react-map-gl";
import { db } from "../db";
import { useTheme } from "../hooks/ThemeContext";
import { useSanityRoutes } from "../hooks/useSanityRoutes";
import { getStopIdentifier } from "../stopUtils";
import mapboxStyles from "../styles/styleFactory";
import RouteSlim from "./RouteSlim";

const NearbyStopsList = ({ sanityAgencies, favoriteStops = [] }) => {
  const { sanityRoutes } = useSanityRoutes();
  const allSanityRoutes = sanityRoutes?.edges?.map((e) => e.node) || [];
  const { theme } = useTheme();
  const mapRef = useRef();

  const [nearbyStops, setNearbyStops] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Match OTP route to Sanity route to get correct colors and headsign
  const enrichRouteWithSanity = (otpRoute, agency) => {
    if (!agency) return otpRoute;

    const sanityRoute = allSanityRoutes.find(
      (sr) =>
        sr.agency?.slug?.current === agency.slug?.current &&
        sr.shortName === otpRoute.shortName
    );

    if (sanityRoute) {
      // Use the OTP headsign from patterns, or fall back to Sanity direction
      const otpHeadsign = otpRoute.headsign;
      return {
        ...otpRoute,
        longName: sanityRoute.longName || otpRoute.longName,
        color: sanityRoute.color?.hex?.replace('#', '') || otpRoute.color,
        textColor: sanityRoute.textColor?.hex?.replace('#', '') || otpRoute.textColor,
        direction: otpHeadsign ? {
          directionHeadsign: otpHeadsign,
        } : null,
      };
    }

    // If no Sanity match, still use OTP headsign
    return {
      ...otpRoute,
      direction: otpRoute.headsign ? {
        directionHeadsign: otpRoute.headsign,
      } : null,
    };
  };

  // Request geolocation on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setLocationLoading(false);
      },
      (error) => {
        setLocationError(
          error.code === 1
            ? "Location access denied. Please enable location services to find nearby stops."
            : "Unable to get your location."
        );
        setLocationLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  // Fetch nearby stops when we have location
  useEffect(() => {
    if (!userLocation) return;

    const fetchNearbyStops = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/.netlify/functions/nearby-stops?lat=${userLocation.lat}&lon=${userLocation.lon}&maxResults=20&maxDistance=1500`
        );
        const data = await response.json();

        if (data.data?.nearest?.edges) {
          // Log the raw OTP feed IDs for debugging
          console.log('OTP feed IDs:', data.data.nearest.edges.map(e => ({
            gtfsId: e.node.place?.gtfsId,
            stopName: e.node.place?.name,
            agencyName: e.node.place?.routes?.[0]?.agency?.name
          })));

          const stops = data.data.nearest.edges
            .map((edge) => edge.node)
            .filter((node) => node.place)
            .map((node) => {
              // Get the feed ID from the stop's gtfsId (format: "feedId:stopId")
              const otpFeedId = node.place.gtfsId?.split(":")?.[0]?.toLowerCase();

              // Match to Sanity agency by otpFeedId field
              const agency = sanityAgencies.find((a) => {
                // Primary match: otpFeedId field
                if (a.otpFeedId?.toLowerCase() === otpFeedId) return true;
                // Fallback: try slug match
                if (a.slug?.current?.toLowerCase() === otpFeedId) return true;
                return false;
              });

              const agencySlug = agency?.slug?.current || otpFeedId;

              // Convert patterns to routes with headsign for display
              const patterns = node.place.patterns || [];
              const routes = patterns.map(p => ({
                ...p.route,
                headsign: p.headsign,
                // Create unique key for route+direction
                routeDirectionKey: `${p.route?.gtfsId}:${p.headsign}`,
              }));

              return {
                ...node.place,
                routes, // Use patterns-derived routes instead of stop.routes
                distance: node.distance,
                agencySlug,
                agency,
                stopId: node.place.gtfsId?.split(":")[1],
              };
            });

          // Filter out stops whose route+direction combos are already covered by closer stops
          const coveredRouteDirections = new Set();
          const filteredStops = stops.filter((stop) => {
            // Get route+direction keys for this stop
            const stopRouteDirections = (stop.routes || []).map(r => r.routeDirectionKey);

            // Check if ALL route+directions at this stop are already covered
            const allCovered = stopRouteDirections.length > 0 &&
              stopRouteDirections.every(key => coveredRouteDirections.has(key));

            if (allCovered) {
              return false;
            }

            // Add this stop's route+directions to covered set
            stopRouteDirections.forEach(key => coveredRouteDirections.add(key));
            return true;
          });

          setNearbyStops(filteredStops);
        }
      } catch (err) {
        console.error("Error fetching nearby stops:", err);
        setLocationError("Error fetching nearby stops");
      }
      setLoading(false);
    };

    fetchNearbyStops();
  }, [userLocation, sanityAgencies]);

  const isStopFavorited = (stop) => {
    return favoriteStops.some(
      (fav) => fav.stopId === stop.stopId && fav.agency?.agencySlug === stop.agencySlug
    );
  };

  const toggleFavorite = async (stop) => {
    const isFavorited = isStopFavorited(stop);

    if (isFavorited) {
      // Remove from favorites
      const existing = favoriteStops.find(
        (fav) => fav.stopId === stop.stopId && fav.agency?.agencySlug === stop.agencySlug
      );
      if (existing && db) {
        await db.stops.delete(existing.id);
      }
    } else {
      // Group routes by shortName to collect all directions for each route
      const routesByShortName = {};
      (stop.routes || []).forEach((r) => {
        if (!routesByShortName[r.shortName]) {
          routesByShortName[r.shortName] = {
            route: r,
            headsigns: [],
          };
        }
        if (r.headsign) {
          routesByShortName[r.shortName].headsigns.push(r.headsign);
        }
      });

      // Build enriched routes with directions array
      const enrichedRoutes = Object.values(routesByShortName).map(({ route: r, headsigns }) => {
        // Find matching Sanity route
        const sanityRoute = allSanityRoutes.find(
          sr => sr.agency?.slug?.current === stop.agencySlug && sr.shortName === r.shortName
        );

        // Build directions array from headsigns
        const directions = [...new Set(headsigns)].map((headsign, idx) => {
          const sanityDirection = sanityRoute?.directions?.find(
            d => d.directionHeadsign?.toLowerCase() === headsign?.toLowerCase()
          );
          return {
            directionId: sanityDirection?.directionId ?? idx,
            directionHeadsign: headsign,
            directionDescription: sanityDirection?.directionDescription,
          };
        });

        return {
          routeShortName: r.shortName,
          displayShortName: r.shortName,
          routeLongName: sanityRoute?.longName || r.longName,
          routeColor: sanityRoute?.color?.hex || (r.color ? `#${r.color}` : "#666"),
          routeTextColor: sanityRoute?.textColor?.hex || (r.textColor ? `#${r.textColor}` : "#fff"),
          directions,
        };
      });

      // Build tripDirections from all route+direction combos
      const tripDirections = enrichedRoutes.flatMap(route =>
        route.directions.map(dir => ({
          routeId: route.routeShortName,
          directionId: dir.directionId,
          directionHeadsign: dir.directionHeadsign,
          routeColor: route.routeColor,
          routeTextColor: route.routeTextColor,
          routeLongName: route.routeLongName,
        }))
      );

      if (!db) return;
      await db.stops.add({
        stopId: stop.stopId,
        stopCode: stop.code,
        stopName: stop.name,
        stopLat: stop.lat,
        stopLon: stop.lon,
        routes: enrichedRoutes,
        tripDirections,
        agency: {
          agencySlug: stop.agencySlug,
          name: stop.agency?.name || stop.agencySlug,
        },
      });
    }
  };

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  if (locationLoading) {
    return (
      <div className="p-4 text-center">
        <FontAwesomeIcon icon={faLocationDot} className="text-blue-500 text-2xl mb-2 animate-pulse" />
        <p className="text-gray-600 dark:text-zinc-400">Getting your location...</p>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600 dark:text-zinc-400">{locationError}</p>
        <p className="text-sm text-gray-500 dark:text-zinc-500 mt-2">
          You can still browse stops by visiting agency pages.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600 dark:text-zinc-400">Finding nearby stops...</p>
      </div>
    );
  }

  if (nearbyStops.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600 dark:text-zinc-400">No transit stops found nearby.</p>
      </div>
    );
  }

  // Build stops feature collection for map
  const stopsFc = {
    type: "FeatureCollection",
    features: nearbyStops
      .filter((stop) => stop.lon && stop.lat)
      .map((stop) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [parseFloat(stop.lon), parseFloat(stop.lat)],
        },
        properties: {
          name: stop.name,
          code: stop.code || stop.stopId,
          offset: [0, 2.2],
        },
      })),
  };

  // Add user location to features
  const userLocationFc = userLocation ? {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [userLocation.lon, userLocation.lat],
      },
      properties: { name: "You" },
    }],
  } : null;

  // Calculate bounds
  const allFeatures = {
    type: "FeatureCollection",
    features: [
      ...stopsFc.features,
      ...(userLocationFc?.features || []),
    ],
  };
  const bounds = allFeatures.features.length > 0 ? bbox(allFeatures) : null;

  // Set up map style
  const style = theme ? _.cloneDeep(mapboxStyles[theme]) : null;
  if (style) {
    style.sources.stop.data = stopsFc;
    style.sources.vehicles.data = { type: "FeatureCollection", features: [] };

    // Add user location marker
    if (userLocationFc) {
      style.sources.userLocation = {
        type: "geojson",
        data: userLocationFc,
      };
      style.layers.push({
        id: "user-location-outer",
        type: "circle",
        source: "userLocation",
        paint: {
          "circle-radius": 14,
          "circle-color": "#3b82f6",
          "circle-opacity": 0.2,
        },
      });
      style.layers.push({
        id: "user-location-inner",
        type: "circle",
        source: "userLocation",
        paint: {
          "circle-radius": 7,
          "circle-color": "#3b82f6",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });
    }
  }

  const handleMapLoad = (evt) => {
    const mapInstance = evt.target;
    if (bounds) {
      mapInstance.fitBounds(
        [[bounds[0], bounds[1]], [bounds[2], bounds[3]]],
        { padding: 40, maxZoom: 15, duration: 0 }
      );
    }
  };

  return (
    <div>
      <div className="grayHeader">
        <FontAwesomeIcon icon={faLocationDot} className="mr-2 text-blue-500" />
        Stops near you
      </div>

      {/* Small map */}
      {style && (
        <div className="h-48 md:h-72 mb-2">
          <Mapbox
            ref={mapRef}
            mapLib={MapboxGL}
            mapboxAccessToken={process.env.MAPBOX_ACCESS_TOKEN}
            mapStyle={style}
            initialViewState={{ longitude: -83.05, latitude: 42.35, zoom: 12 }}
            onLoad={handleMapLoad}
          >
            <NavigationControl showCompass={false} />
          </Mapbox>
        </div>
      )}

      <p className="text-sm text-gray-500 dark:text-zinc-500 px-2 py-2">
        Tap the star to add stops to your favorites.
      </p>
      <ul className="list-none m-0">
        {nearbyStops.map((stop) => {
          const isFavorited = isStopFavorited(stop);
          return (
            <li
              key={`${stop.agencySlug}-${stop.stopId}`}
              className="flex items-start gap-3 py-3 px-2 border-b border-gray-200 dark:border-zinc-700 last:border-none"
            >
              <button
                onClick={() => toggleFavorite(stop)}
                className={`flex-shrink-0 p-1 rounded transition-colors ${
                  isFavorited
                    ? "text-yellow-500"
                    : "text-gray-300 dark:text-zinc-600 hover:text-yellow-400"
                }`}
                aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
              >
                <FontAwesomeIcon
                  icon={faStar}
                  className={`text-xl ${!isFavorited ? "opacity-40" : ""}`}
                />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/${stop.agencySlug}/stop/${getStopIdentifier(stop, stop.agency)}`}
                    className="font-medium text-gray-800 dark:text-zinc-200 hover:underline"
                  >
                    {stop.name}
                  </Link>
                  <span className="text-xs text-gray-400 dark:text-zinc-500">
                    {formatDistance(stop.distance)}
                  </span>
                </div>
                {stop.routes && stop.routes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {stop.routes.slice(0, 5).map((otpRoute, idx) => {
                      const route = enrichRouteWithSanity(otpRoute, stop.agency);
                      return (
                        <RouteSlim
                          key={otpRoute.routeDirectionKey || `${otpRoute.gtfsId}-${idx}`}
                          routeShortName={route.shortName}
                          displayShortName={route.shortName}
                          routeLongName={route.longName}
                          routeColor={route.color ? `#${route.color}` : "#666"}
                          routeTextColor={route.textColor ? `#${route.textColor}` : "#fff"}
                          direction={route.direction}
                          size="xs"
                        />
                      );
                    })}
                    {stop.routes.length > 5 && (
                      <span className="text-xs text-gray-400 dark:text-zinc-500">
                        +{stop.routes.length - 5} more
                      </span>
                    )}
                  </div>
                )}
                <div className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5 capitalize">
                  {stop.agency?.name || stop.agencySlug}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default NearbyStopsList;
