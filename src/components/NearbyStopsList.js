import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import bbox from "@turf/bbox";
import { cloneDeep } from "lodash-es";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
import MapboxGL from "mapbox-gl/dist/mapbox-gl";
import Mapbox, { NavigationControl } from "react-map-gl";
import { db } from "../db";
import { useTheme } from "../hooks/ThemeContext";
import { useSanityRoutes } from "../hooks/useSanityRoutes";
import mapboxStyles from "../styles/styleFactory";
import StopCard from "./StopCard";
import { shortenHeadsign } from "../util";

const NearbyStopsList = ({ sanityAgencies, favoriteStops = [], customLocation = null }) => {
  const { sanityRoutes } = useSanityRoutes();
  const allSanityRoutes = useMemo(
    () => sanityRoutes?.edges?.map((e) => e.node) || [],
    [sanityRoutes]
  );
  const { theme } = useTheme();
  const mapRef = useRef();

  const [nearbyStops, setNearbyStops] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedStop, setSelectedStop] = useState(null);

  // Match OTP route to Sanity route to get correct colors and direction info
  const enrichRouteWithSanity = (otpRoute, agency) => {
    if (!agency) return otpRoute;

    const sanityRoute = allSanityRoutes.find(
      (sr) =>
        sr.agency?.slug?.current === agency.slug?.current &&
        sr.shortName === otpRoute.shortName
    );

    if (sanityRoute) {
      const otpHeadsign = otpRoute.headsign;
      const otpDirectionId = otpRoute.directionId;

      // Match by directionId first, fall back to headsign matching
      let matchedDirection = null;
      if (sanityRoute.directions?.length > 0) {
        // Primary: match by directionId
        if (otpDirectionId !== undefined && otpDirectionId !== null) {
          matchedDirection = sanityRoute.directions.find(
            (d) => d.directionId === otpDirectionId
          );
        }

        // Fallback: match by headsign if no directionId match
        if (!matchedDirection && otpHeadsign) {
          const headsignLower = otpHeadsign.toLowerCase();
          matchedDirection = sanityRoute.directions.find((d) => {
            const sanityHeadsign = d.directionHeadsign?.toLowerCase() || "";
            return sanityHeadsign === headsignLower ||
                   headsignLower.includes(sanityHeadsign) ||
                   sanityHeadsign.includes(headsignLower);
          });
        }
      }

      // Combine all headsigns into a single string
      const combinedHeadsign = otpRoute.headsigns?.length > 0
        ? otpRoute.headsigns.join(", ")
        : matchedDirection?.directionHeadsign;

      return {
        ...otpRoute,
        longName: sanityRoute.longName || otpRoute.longName,
        color: sanityRoute.color?.hex?.replace('#', '') || otpRoute.color,
        textColor: sanityRoute.textColor?.hex?.replace('#', '') || otpRoute.textColor,
        direction: matchedDirection ? {
          directionHeadsign: combinedHeadsign,
          directionDescription: matchedDirection.directionDescription,
        } : (combinedHeadsign ? { directionHeadsign: combinedHeadsign } : null),
      };
    }

    // If no Sanity match, still show headsigns if available
    const combinedHeadsign = otpRoute.headsigns?.length > 0
      ? otpRoute.headsigns.join(", ")
      : null;

    return {
      ...otpRoute,
      direction: combinedHeadsign ? { directionHeadsign: combinedHeadsign } : null,
    };
  };

  // Request geolocation on mount (only if no custom location)
  useEffect(() => {
    // Skip geolocation if custom location is provided
    if (customLocation) return;

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
  }, [customLocation]);

  // Fetch nearby stops when we have location (either custom or user location)
  useEffect(() => {
    const location = customLocation || userLocation;
    if (!location) return;

    const fetchNearbyStops = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/.netlify/functions/nearby-stops?lat=${location.lat}&lon=${location.lon}&maxResults=20&maxDistance=1500`
        );
        const data = await response.json();

        if (data.data?.nearest?.edges) {

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

              // Convert patterns to routes with directionId, deduped by route+direction
              // Collect all headsigns for each route+direction combo
              const patterns = node.place.patterns || [];
              const routeMap = new Map();
              patterns.forEach(p => {
                const key = `${p.route?.gtfsId}:${p.directionId}`;
                const headsign = shortenHeadsign(p.headsign);
                if (!routeMap.has(key)) {
                  routeMap.set(key, {
                    ...p.route,
                    directionId: p.directionId,
                    routeDirectionKey: key,
                    headsigns: headsign ? [headsign] : [],
                  });
                } else if (headsign) {
                  // Add unique headsigns
                  const existing = routeMap.get(key);
                  if (!existing.headsigns.includes(headsign)) {
                    existing.headsigns.push(headsign);
                  }
                }
              });
              const routes = Array.from(routeMap.values());

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
  }, [customLocation, userLocation, sanityAgencies]);

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
      // Build tripDirections directly from routes (each already has directionId)
      const tripDirections = (stop.routes || []).map(r => ({
        routeId: r.shortName,
        directionId: r.directionId,
      }));

      // Build routes with Sanity directions for departure-board map shapes
      const routeShortNames = [...new Set((stop.routes || []).map(r => r.shortName))];
      const routes = routeShortNames.map(shortName => {
        const sanityRoute = allSanityRoutes.find(
          sr => sr.agency?.slug?.current === stop.agencySlug && sr.shortName === shortName
        );
        return {
          routeShortName: shortName,
          displayShortName: shortName,
          routeLongName: sanityRoute?.longName || "",
          routeColor: sanityRoute?.color?.hex || "#666",
          routeTextColor: sanityRoute?.textColor?.hex || "#fff",
          directions: sanityRoute?.directions || [],
        };
      });

      if (!db) return;
      await db.stops.add({
        stopId: stop.stopId,
        stopCode: stop.code,
        stopName: stop.name,
        stopLat: stop.lat,
        stopLon: stop.lon,
        tripDirections,
        routes,
        agency: {
          agencySlug: stop.agencySlug,
          name: stop.agency?.name || stop.agencySlug,
        },
      });
    }
  };

  // Convert distance to walk time (assume 80m/min ~= 5km/h walking speed)
  const formatWalkTime = (meters) => {
    const minutes = Math.ceil(meters / 80);
    if (minutes <= 1) return "1 min walk";
    return `${minutes} min walk`;
  };

  const handleStopClick = (stop) => {
    const stopKey = `${stop.agencySlug}-${stop.stopId}`;
    const isAlreadySelected = selectedStop === stopKey;

    if (isAlreadySelected) {
      setSelectedStop(null);
    } else {
      setSelectedStop(stopKey);

      // Pan map to the stop
      if (mapRef.current && stop.lat && stop.lon) {
        mapRef.current.flyTo({
          center: [parseFloat(stop.lon), parseFloat(stop.lat)],
          zoom: 16,
          duration: 500,
        });
      }
    }
  };

  // Update map sources when selection changes
  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map || nearbyStops.length === 0) return;

    // Update stops source
    if (map.getSource("stop")) {
      const updatedStopsFc = {
        type: "FeatureCollection",
        features: nearbyStops
          .filter((stop) => stop.lon && stop.lat)
          .map((stop) => {
            const stopKey = `${stop.agencySlug}-${stop.stopId}`;
            return {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [parseFloat(stop.lon), parseFloat(stop.lat)],
              },
              properties: {
                name: stop.name,
                code: stop.code || stop.stopId,
                offset: [0, 2.2],
                selected: selectedStop === stopKey,
              },
            };
          }),
      };
      map.getSource("stop").setData(updatedStopsFc);
    }

    // Update route shapes source
    if (map.getSource("selectedRoutes")) {
      const routeShapes = { type: "FeatureCollection", features: [] };

      if (selectedStop) {
        const stop = nearbyStops.find(s => `${s.agencySlug}-${s.stopId}` === selectedStop);
        if (stop?.routes) {
          stop.routes.forEach((otpRoute) => {
            const sanityRoute = allSanityRoutes.find(
              (sr) =>
                sr.agency?.slug?.current === stop.agencySlug &&
                sr.shortName === otpRoute.shortName
            );

            if (!sanityRoute?.directions) return;

            const direction = sanityRoute.directions.find(
              (d) => d.directionId === otpRoute.directionId
            ) || sanityRoute.directions[0];

            if (direction?.directionShape) {
              try {
                const shape = typeof direction.directionShape === 'string'
                  ? JSON.parse(direction.directionShape)
                  : direction.directionShape;

                if (shape?.coordinates) {
                  routeShapes.features.push({
                    type: "Feature",
                    geometry: shape,
                    properties: {
                      routeShortName: otpRoute.shortName,
                      color: sanityRoute.color?.hex || "#666",
                    },
                  });
                }
              } catch (e) {
                console.warn("Failed to parse route shape:", e);
              }
            }
          });
        }
      }
      map.getSource("selectedRoutes").setData(routeShapes);
    }
  }, [selectedStop, nearbyStops, allSanityRoutes]);

  // Memoize map style to prevent flicker when favoriteStops changes
  // Must be before early returns to satisfy React hooks rules
  const { style, bounds } = useMemo(() => {
    if (!theme || nearbyStops.length === 0) {
      return { style: null, bounds: null };
    }

    // Build stops feature collection for map
    const stopsFc = {
      type: "FeatureCollection",
      features: nearbyStops
        .filter((stop) => stop.lon && stop.lat)
        .map((stop) => {
          const stopKey = `${stop.agencySlug}-${stop.stopId}`;
          return {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [parseFloat(stop.lon), parseFloat(stop.lat)],
            },
            properties: {
              name: stop.name,
              code: stop.code || stop.stopId,
              offset: [0, 2.2],
              selected: selectedStop === stopKey,
            },
          };
        }),
    };

    // Add user/search location to features
    const effectiveLocation = customLocation || userLocation;
    const locationFc = effectiveLocation ? {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [effectiveLocation.lon, effectiveLocation.lat],
        },
        properties: { name: customLocation?.name || "You" },
      }],
    } : null;

    // Calculate bounds
    const allFeatures = {
      type: "FeatureCollection",
      features: [
        ...stopsFc.features,
        ...(locationFc?.features || []),
      ],
    };
    const bounds = allFeatures.features.length > 0 ? bbox(allFeatures) : null;

    // Set up map style
    const style = cloneDeep(mapboxStyles[theme]);
    style.sources.stop.data = stopsFc;
    style.sources.vehicles.data = { type: "FeatureCollection", features: [] };

    // Add user/search location marker
    if (locationFc) {
      style.sources.userLocation = {
        type: "geojson",
        data: locationFc,
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

    // Add selected stop highlight layer
    style.layers.push({
      id: "selected-stop-highlight",
      type: "circle",
      source: "stop",
      filter: ["==", ["get", "selected"], true],
      paint: {
        "circle-radius": 18,
        "circle-color": "#3b82f6",
        "circle-opacity": 0.3,
      },
    });

    // Add route shapes source and layer
    style.sources.selectedRoutes = {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    };
    // Insert route layer before stops so stops render on top
    const stopLayerIndex = style.layers.findIndex(l => l.id === "stop-circle");
    style.layers.splice(stopLayerIndex, 0, {
      id: "selected-routes-line",
      type: "line",
      source: "selectedRoutes",
      paint: {
        "line-color": ["get", "color"],
        "line-width": 4,
        "line-opacity": 0.8,
      },
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
    });

    return { style, bounds };
  }, [theme, nearbyStops, customLocation, userLocation, selectedStop]);

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

  const handleMapLoad = (evt) => {
    const mapInstance = evt.target;
    if (bounds) {
      mapInstance.fitBounds(
        [[bounds[0], bounds[1]], [bounds[2], bounds[3]]],
        { padding: 40, maxZoom: 15, duration: 0, linear: true }
      );
    }
  };

  return (
    <div>
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
        Tap a stop to see it on the map. Tap the star to save it.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-2">
        {nearbyStops.map((stop) => {
          const stopKey = `${stop.agencySlug}-${stop.stopId}`;
          const isSelected = selectedStop === stopKey;

          // Enrich routes with Sanity data
          const enrichedRoutes = (stop.routes || []).map((otpRoute) => {
            const route = enrichRouteWithSanity(otpRoute, stop.agency);
            return {
              key: otpRoute.routeDirectionKey || `${otpRoute.gtfsId}-${otpRoute.directionId}`,
              shortName: route.shortName,
              longName: route.longName,
              color: route.color,
              textColor: route.textColor,
              direction: route.direction,
            };
          });

          return (
            <StopCard
              key={stopKey}
              stop={stop}
              agency={stop.agency}
              routes={enrichedRoutes}
              isFavorited={isStopFavorited(stop)}
              onToggleFavorite={toggleFavorite}
              isSelected={isSelected}
              onClick={handleStopClick}
              walkTime={formatWalkTime(stop.distance)}
              agencyColor={stop.agency?.color?.hex || "#666"}
            />
          );
        })}
      </div>
    </div>
  );
};

export default NearbyStopsList;
