import "mapbox-gl/dist/mapbox-gl.css";
import React, { useState, useEffect, useRef, useMemo } from "react";
import MapboxGL from "mapbox-gl/dist/mapbox-gl";
import Mapbox, { NavigationControl } from "react-map-gl";
import mapboxStyles from "../styles/styleFactory";
import { cloneDeep, groupBy, chunk } from "lodash-es";
import { fetchVehiclesBatched } from "../utils/vehicleFetcher";
import { useTheme } from "../hooks/ThemeContext";
import bbox from "@turf/bbox";
import { useSanityRoutes } from "../hooks/useSanityRoutes";
import { getStopIdentifier, getApiStopIdentifier } from "../stopUtils";
import PredictionsList from "./PredictionsList";
import RealtimeHeader from "./RealtimeHeader";
import { Link } from "gatsby";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBicycle, faBolt, faParking, faThumbtack, faPlay, faPause } from "@fortawesome/free-solid-svg-icons";

const REFRESH_INTERVAL = 30;

const FavoritesDashboard = ({
  favoriteStops,
  favoriteBikeshare,
  sanityAgencies,
  bikeshareAgencies,
  widescreen = false,
  maxPredictionTime = 60,
  carouselMode: carouselModeProp,
  setCarouselMode: setCarouselModeProp,
  pinnedPrediction: pinnedPredictionProp,
  setPinnedPrediction: setPinnedPredictionProp
}) => {
  const { sanityRoutes } = useSanityRoutes();
  const map = useRef();
  const desktopMap = useRef();
  const { theme } = useTheme();
  const [predictions, setPredictions] = useState([]);
  const [bikeshareStatus, setBikeshareStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [vehicles, setVehicles] = useState([]);

  // Carousel mode state - use props if provided, otherwise use local state
  const [carouselModeLocal, setCarouselModeLocal] = useState(true);
  const [pinnedPredictionLocal, setPinnedPredictionLocal] = useState(null);

  const carouselMode = carouselModeProp !== undefined ? carouselModeProp : carouselModeLocal;
  const setCarouselMode = setCarouselModeProp || setCarouselModeLocal;
  const pinnedPrediction = pinnedPredictionProp !== undefined ? pinnedPredictionProp : pinnedPredictionLocal;
  const setPinnedPrediction = setPinnedPredictionProp || setPinnedPredictionLocal;

  const [activePredictionIndex, setActivePredictionIndex] = useState(0);
  const pinnedPredictionRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const CAROUSEL_INTERVAL = 8000; // 8 seconds per prediction

  // Keep ref in sync with state
  useEffect(() => {
    pinnedPredictionRef.current = pinnedPrediction;
  }, [pinnedPrediction]);

  const allRoutes = useMemo(
    () => sanityRoutes?.edges?.map((e) => e.node) || [],
    [sanityRoutes]
  );

  // Memoize base map style and feature collections to prevent flashing on countdown updates
  const { baseStyle, bounds } = useMemo(() => {
    if (!theme) return { baseStyle: null, bounds: null };

    // Build stops feature collection for map
    const stopsFc = {
      type: "FeatureCollection",
      features: (favoriteStops || [])
        .filter((stop) => stop.stopLon && stop.stopLat)
        .map((stop) => {
          const agency = sanityAgencies.find((a) => a.slug?.current === stop.agency?.agencySlug);
          return {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [parseFloat(stop.stopLon), parseFloat(stop.stopLat)],
            },
            properties: {
              name: stop.stopName,
              code: getStopIdentifier(stop, agency),
              offset: [0, 2.2],
            },
          };
        }),
    };

    // Build bikeshare stations feature collection
    const bikeshareFc = {
      type: "FeatureCollection",
      features: (favoriteBikeshare || []).map((station) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [station.lon, station.lat],
        },
        properties: {
          name: station.name,
          station_id: station.station_id,
        },
      })),
    };

    // Build routes feature collection
    const routeFc = {
      type: "FeatureCollection",
      features: [],
    };

    // Get unique route short names from favorite stops
    const routesByAgency = {};
    (favoriteStops || []).forEach((stop) => {
      if (!stop.routes) return;
      const agencySlug = stop.agency?.agencySlug;
      if (!routesByAgency[agencySlug]) {
        routesByAgency[agencySlug] = new Set();
      }
      stop.routes.forEach((r) => {
        routesByAgency[agencySlug].add(r.displayShortName || r.routeShortName);
      });
    });

    // Add route shapes
    Object.entries(routesByAgency).forEach(([agencySlug, shortNames]) => {
      const agency = sanityAgencies.find((a) => a.slug?.current === agencySlug);
      if (!agency) return;

      const filtered = allRoutes.filter(
        (r) =>
          r.agency?.currentFeedIndex === agency.currentFeedIndex &&
          shortNames.has(r.shortName)
      );

      filtered.forEach((route) => {
        route.directions?.forEach((direction) => {
          if (!direction.directionShape) return;
          try {
            const feature = JSON.parse(direction.directionShape)[0];
            feature.properties = {
              routeColor: route.color?.hex,
              routeLongName: route.longName,
              routeShortName: route.shortName,
              routeTextColor: route.textColor?.hex,
              mapPriority: route.mapPriority,
              direction: direction.directionDescription,
              directionId: direction.directionId,
            };
            routeFc.features.push(feature);
          } catch (e) {
            console.error("Error parsing route shape:", e);
          }
        });
      });
    });

    // Combine all features for bounds calculation
    const allFeatures = {
      type: "FeatureCollection",
      features: [...stopsFc.features, ...bikeshareFc.features],
    };

    // Set up map style
    const mapStyle = cloneDeep(mapboxStyles[theme]);
    mapStyle.sources.stop.data = stopsFc;
    mapStyle.sources.vehicles.data = { type: "FeatureCollection", features: [] };

    if (routeFc.features.length > 0) {
      mapStyle.sources.routes.data = routeFc;
    }

    // Add bikeshare source and layer if not already present
    if (!mapStyle.sources.bikeshare) {
      mapStyle.sources.bikeshare = {
        type: "geojson",
        data: bikeshareFc,
      };
      mapStyle.layers.push({
        id: "bikeshare-stations",
        type: "circle",
        source: "bikeshare",
        paint: {
          "circle-radius": 10,
          "circle-color": "#DC2626", // MoGo red
          "circle-stroke-width": 0,
        },
      });
      mapStyle.layers.push({
        id: "bikeshare-icons",
        type: "symbol",
        source: "bikeshare",
        layout: {
          "icon-image": "bicycle",
          "icon-size": 0.6,
          "icon-allow-overlap": true,
        },
        paint: {
          "icon-color": "#fff",
        },
      });
      mapStyle.layers.push({
        id: "bikeshare-labels",
        type: "symbol",
        source: "bikeshare",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-offset": [0, 1.8],
          "text-anchor": "top",
        },
        paint: {
          "text-color": theme === "dark" ? "#a1a1aa" : "#52525b",
          "text-halo-color": theme === "dark" ? "#18181b" : "#fff",
          "text-halo-width": 1,
        },
      });
    } else {
      mapStyle.sources.bikeshare.data = bikeshareFc;
    }

    const mapBounds = allFeatures.features.length > 0 ? bbox(allFeatures) : null;

    return { baseStyle: mapStyle, bounds: mapBounds };
  }, [favoriteStops, favoriteBikeshare, sanityAgencies, allRoutes, theme]);

  // Fetch predictions and vehicles together to avoid flickering
  useEffect(() => {
    if (!favoriteStops || favoriteStops.length === 0) {
      setLoading(false);
      return;
    }

    const fetchPredictionsAndVehicles = async (isInitialLoad = false) => {
      // Only show loading state on initial load to prevent flicker
      if (isInitialLoad) setLoading(true);
      const allPredictions = [];

      // Group stops by agency for efficient fetching
      const stopsByAgency = groupBy(favoriteStops, "agency.agencySlug");

      for (const [agencySlug, stops] of Object.entries(stopsByAgency)) {
        const agency = sanityAgencies.find((a) => a.slug?.current === agencySlug);
        if (!agency?.realTimeEnabled) continue;

        // Build a map of apiStopIdentifier -> stop info for matching predictions later
        const stopMap = {};
        const apiStopIdentifiers = [];

        for (const stop of stops) {
          const apiStopId = getApiStopIdentifier(stop, agency);
          const displayStopId = getStopIdentifier(stop, agency);
          if (!apiStopId) {
            console.warn(`No stop identifier found for stop:`, stop);
            continue;
          }
          apiStopIdentifiers.push(apiStopId);
          stopMap[apiStopId] = { stop, agency, agencySlug, apiStopId, displayStopId };
        }

        // Batch into groups of 10 (API limit)
        const batches = chunk(apiStopIdentifiers, 10);

        for (const batch of batches) {
          try {
            const response = await fetch(
              `/.netlify/functions/stop?stopId=${batch.join(",")}&agency=${agencySlug}`
            );
            const data = await response.json();

            if (data["bustime-response"]?.prd) {
              const preds = data["bustime-response"].prd.map((p) => {
                const stopInfo = stopMap[p.stpid] || {};
                return {
                  ...p,
                  stopName: stopInfo.stop?.stopName || p.stpnm,
                  stopId: stopInfo.stop?.stopId,
                  stopCode: stopInfo.stop?.stopCode,
                  stopIdentifier: stopInfo.displayStopId || p.stpid,
                  agencySlug,
                  agency,
                };
              });
              allPredictions.push(...preds);
            }
          } catch (err) {
            console.error(`Error fetching predictions for batch:`, batch, err);
          }
        }
      }

      // Sort by arrival time
      allPredictions.sort((a, b) => {
        const aMin = a.prdctdn === "DUE" ? 0 : parseInt(a.prdctdn);
        const bMin = b.prdctdn === "DUE" ? 0 : parseInt(b.prdctdn);
        return aMin - bMin;
      });

      // Dedupe by tatripid, keeping the earliest prediction for each trip
      const seenTrips = new Set();
      const dedupedPredictions = allPredictions.filter((pred) => {
        if (!pred.tatripid) return true;
        if (seenTrips.has(pred.tatripid)) return false;
        seenTrips.add(pred.tatripid);
        return true;
      });

      // Always fetch vehicles so they're ready when carousel is enabled
      let allVehicles = [];
      if (dedupedPredictions.length > 0) {
        // Include pinned prediction to ensure its vehicle is fetched
        const pinned = pinnedPredictionRef.current;
        const predictionsToFetch = pinned && !dedupedPredictions.some(p => p.vid === pinned.vid)
          ? [...dedupedPredictions, pinned]
          : dedupedPredictions;

        allVehicles = await fetchVehiclesBatched(predictionsToFetch, allRoutes);
      }

      // Update both states together to minimize re-renders
      setPredictions(dedupedPredictions);
      setVehicles(allVehicles);
      setLoading(false);
    };

    fetchPredictionsAndVehicles(true);
    setCountdown(REFRESH_INTERVAL);

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchPredictionsAndVehicles(false);
      setCountdown(REFRESH_INTERVAL);
    }, REFRESH_INTERVAL * 1000);
    return () => clearInterval(interval);
  }, [favoriteStops, sanityAgencies, allRoutes]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : REFRESH_INTERVAL));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter predictions by max time
  const filteredPredictions = useMemo(() => {
    return predictions.filter((pred) => {
      const minutes = pred.prdctdn === "DUE" ? 0 : parseInt(pred.prdctdn);
      return !isNaN(minutes) && minutes <= maxPredictionTime;
    });
  }, [predictions, maxPredictionTime]);

  // Filter predictions to only those with vehicles (for carousel cycling)
  const predictionsWithVehicles = useMemo(() => {
    if (vehicles.length === 0) return [];
    const vehicleVids = new Set(vehicles.map(v => v.vid));
    return filteredPredictions
      .map((pred, idx) => ({ pred, idx }))
      .filter(({ pred }) => vehicleVids.has(pred.vid));
  }, [filteredPredictions, vehicles]);

  // Carousel timer - cycle through predictions that have vehicles
  useEffect(() => {
    if (!carouselMode || pinnedPrediction !== null || predictionsWithVehicles.length === 0) {
      return;
    }

    const timer = setInterval(() => {
      setActivePredictionIndex((prev) => {
        // Find next prediction with a vehicle
        const currentIdx = predictionsWithVehicles.findIndex(p => p.idx === prev);
        const nextIdx = (currentIdx + 1) % predictionsWithVehicles.length;
        return predictionsWithVehicles[nextIdx].idx;
      });
    }, CAROUSEL_INTERVAL);

    return () => clearInterval(timer);
  }, [carouselMode, pinnedPrediction, predictionsWithVehicles]);

  // Reset active index when predictions change - start with first prediction that has a vehicle
  useEffect(() => {
    if (predictionsWithVehicles.length > 0) {
      const currentHasVehicle = predictionsWithVehicles.some(p => p.idx === activePredictionIndex);
      if (!currentHasVehicle) {
        setActivePredictionIndex(predictionsWithVehicles[0].idx);
      }
    }
  }, [predictionsWithVehicles, activePredictionIndex]);

  // Get the currently active prediction (pinned takes priority)
  const activePrediction = useMemo(() => {
    if (pinnedPrediction) {
      // Find the pinned prediction in current predictions list
      const found = filteredPredictions.find(
        (p) => p.vid === pinnedPrediction.vid && p.stpid === pinnedPrediction.stpid
      );
      return found || pinnedPrediction;
    }
    return filteredPredictions[activePredictionIndex] || null;
  }, [pinnedPrediction, filteredPredictions, activePredictionIndex]);

  // Derive active vehicle from vehicles array based on active prediction
  // Show vehicle when carousel is playing OR when a prediction is pinned
  const activeVehicle = useMemo(() => {
    if ((!carouselMode && !pinnedPrediction) || !activePrediction || vehicles.length === 0) {
      return null;
    }
    return vehicles.find(v => v.vid === activePrediction.vid) || null;
  }, [carouselMode, pinnedPrediction, activePrediction, vehicles]);

  // Fit map bounds to show stop and vehicle for active prediction
  // Works when carousel is playing OR when a prediction is pinned
  useEffect(() => {
    if ((!carouselMode && !pinnedPrediction) || !activePrediction || !activeVehicle || !mapLoaded) return;

    const fitMapToStopAndVehicle = (mapRef) => {
      if (!mapRef?.current) return;
      // react-map-gl v7: use getMap() to access underlying Mapbox GL Map instance
      const mapInstance = typeof mapRef.current.getMap === 'function'
        ? mapRef.current.getMap()
        : mapRef.current;
      if (!mapInstance) return;

      // Get stop coordinates from the prediction
      const stop = favoriteStops?.find(
        (s) =>
          (s.stopCode === activePrediction.stpid || s.stopId === activePrediction.stpid) &&
          s.agency?.agencySlug === activePrediction.agencySlug
      );

      if (!stop) return;

      const stopCoords = [parseFloat(stop.stopLon), parseFloat(stop.stopLat)];
      const vehicleCoords = [parseFloat(activeVehicle.lon), parseFloat(activeVehicle.lat)];

      // Calculate bounds
      const minLng = Math.min(stopCoords[0], vehicleCoords[0]);
      const maxLng = Math.max(stopCoords[0], vehicleCoords[0]);
      const minLat = Math.min(stopCoords[1], vehicleCoords[1]);
      const maxLat = Math.max(stopCoords[1], vehicleCoords[1]);

      mapInstance.fitBounds(
        [[minLng, minLat], [maxLng, maxLat]],
        { padding: 80, maxZoom: 15, duration: 1500, linear: true }
      );
    };

    fitMapToStopAndVehicle(map);
    fitMapToStopAndVehicle(desktopMap);
  }, [activePrediction, activeVehicle, carouselMode, pinnedPrediction, favoriteStops, mapLoaded]);

  // Re-center on all stops when paused (but not when pinned)
  useEffect(() => {
    if (carouselMode || pinnedPrediction || !mapLoaded || !bounds) return;

    const fitToBounds = (mapRef) => {
      if (!mapRef?.current) return;
      const mapInstance = typeof mapRef.current.getMap === 'function'
        ? mapRef.current.getMap()
        : mapRef.current;
      if (!mapInstance) return;

      mapInstance.fitBounds(
        [[bounds[0], bounds[1]], [bounds[2], bounds[3]]],
        { padding: 80, maxZoom: 15, duration: 1750, linear: true }
      );
    };

    fitToBounds(map);
    fitToBounds(desktopMap);
  }, [carouselMode, pinnedPrediction, mapLoaded, bounds]);

  // Build vehicle feature collection - only show active vehicle
  const vehiclesFc = useMemo(() => {
    if (!activeVehicle) {
      return { type: "FeatureCollection", features: [] };
    }

    return {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [parseFloat(activeVehicle.lon), parseFloat(activeVehicle.lat)],
        },
        properties: {
          vid: activeVehicle.vid,
          rt: activeVehicle.rt,
          des: activeVehicle.des,
          routeColor: activeVehicle.routeColor,
          routeTextColor: activeVehicle.routeTextColor,
          bearing: parseInt(activeVehicle.hdg) || 0,
          vehicleIcon: "bus",
        },
      }],
    };
  }, [activeVehicle]);

  // Build active stop feature for the "stop" source (shows as highlighted yellow)
  const activeStopFc = useMemo(() => {
    if (!activePrediction || !favoriteStops) {
      return { type: "FeatureCollection", features: [] };
    }

    const stop = favoriteStops.find(
      (s) =>
        (s.stopCode === activePrediction.stpid || s.stopId === activePrediction.stpid) &&
        s.agency?.agencySlug === activePrediction.agencySlug
    );

    if (!stop) return { type: "FeatureCollection", features: [] };

    const agency = sanityAgencies.find((a) => a.slug?.current === stop.agency?.agencySlug);

    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [parseFloat(stop.stopLon), parseFloat(stop.stopLat)],
          },
          properties: {
            name: stop.stopName,
            code: getStopIdentifier(stop, agency),
            offset: [0, -1.5],
            anchor: "bottom",
          },
        },
      ],
    };
  }, [activePrediction, favoriteStops, sanityAgencies]);

  // Compute final map style with vehicles and active stop included
  const style = useMemo(() => {
    if (!baseStyle) return null;

    const computedStyle = cloneDeep(baseStyle);

    // Add vehicles to the style
    if (vehiclesFc.features.length > 0) {
      computedStyle.sources.vehicles.data = vehiclesFc;
    }

    // When playing or pinned, show only active stop; when paused (not pinned), show all stops
    if ((carouselMode || pinnedPrediction) && activeStopFc.features.length > 0) {
      computedStyle.sources.stop.data = activeStopFc;
    }

    // Filter routes to only show the active prediction's route when playing or pinned
    // Show all routes when paused (not pinned)
    if ((carouselMode || pinnedPrediction) && activePrediction && computedStyle.sources.routes?.data?.features) {
      const filteredFeatures = computedStyle.sources.routes.data.features.filter(
        (f) => f.properties.routeShortName === activePrediction.rt
      );
      computedStyle.sources.routes.data = {
        type: "FeatureCollection",
        features: filteredFeatures,
      };
    }

    return computedStyle;
  }, [baseStyle, vehiclesFc, activeStopFc, activePrediction, carouselMode, pinnedPrediction]);

  // Fetch bikeshare status
  useEffect(() => {
    if (!favoriteBikeshare || favoriteBikeshare.length === 0 || !bikeshareAgencies) return;

    const fetchBikeshareStatus = async () => {
      const statusByStation = {};

      // Group by agency to fetch from correct feed
      const stationsByAgency = groupBy(favoriteBikeshare, "agency.slug.current");

      for (const [agencySlug, stations] of Object.entries(stationsByAgency)) {
        const agency = bikeshareAgencies.find((a) => a.slug?.current === agencySlug);
        if (!agency?.feedUrl) continue;

        try {
          const response = await fetch(`${agency.feedUrl}/station_status`);
          const data = await response.json();

          stations.forEach((station) => {
            const status = data.data.stations.find(
              (s) => s.station_id === station.station_id
            );
            if (status) {
              statusByStation[station.station_id] = status;
            }
          });
        } catch (err) {
          console.error(`Error fetching bikeshare status:`, err);
        }
      }

      setBikeshareStatus(statusByStation);
    };

    fetchBikeshareStatus();
    const interval = setInterval(fetchBikeshareStatus, 60000);
    return () => clearInterval(interval);
  }, [favoriteBikeshare, bikeshareAgencies]);

  // Get route data and Sanity headsign for a prediction
  const getRouteForPrediction = (prediction) => {
    const route = allRoutes.find(
      (r) =>
        r.agency?.slug?.current === prediction.agencySlug &&
        r.shortName === prediction.rt
    );
    if (route) {
      // prediction.rtdir is the direction description from the API (e.g., "Eastbound", "EAST")
      // Match it to Sanity's directionDescription to get the proper headsign
      const rtdirLower = prediction.rtdir?.toLowerCase() || "";
      let direction = route.directions?.find((d) => {
        const descLower = d.directionDescription?.toLowerCase() || "";
        // Match "eastbound" to "Eastbound", or "EAST" to "Eastbound"
        return descLower === rtdirLower ||
               descLower.includes(rtdirLower) ||
               rtdirLower.includes(descLower.replace("bound", ""));
      });

      return {
        displayShortName: route.shortName,
        routeShortName: route.shortName,
        routeLongName: route.longName,
        routeColor: route.color?.hex || "#000",
        routeTextColor: route.textColor?.hex || "#fff",
        direction: direction ? {
          directionHeadsign: direction.directionHeadsign,
          directionDescription: direction.directionDescription,
        } : { directionHeadsign: prediction.rtdir },
      };
    }
    return {
      displayShortName: prediction.rt,
      routeShortName: prediction.rt,
      routeLongName: "",
      routeColor: "#666",
      routeTextColor: "#fff",
      direction: { directionHeadsign: prediction.rtdir },
    };
  };

  const hasStops = favoriteStops && favoriteStops.length > 0;
  const hasBikeshare = favoriteBikeshare && favoriteBikeshare.length > 0;

  if (!hasStops && !hasBikeshare) {
    return null;
  }

  if (!style) return null;

  // Use bounds from favorites for initial view, fall back to Detroit center
  const initialViewState = bounds
    ? {
        bounds: [[bounds[0], bounds[1]], [bounds[2], bounds[3]]],
        fitBoundsOptions: { padding: 80, maxZoom: 16 },
      }
    : {
        longitude: -83.05,
        latitude: 42.35,
        zoom: 10,
      };

  const handleMapLoad = (evt) => {
    const mapInstance = evt.target;
    setMapLoaded(true);

    // Update vehicles source on load
    if (vehiclesFc.features.length > 0) {
      const source = mapInstance.getSource("vehicles");
      if (source) {
        source.setData(vehiclesFc);
      }
    }

    // Update active stop source on load
    if (activeStopFc.features.length > 0) {
      const source = mapInstance.getSource("stop");
      if (source) {
        source.setData(activeStopFc);
      }
    }
  };

  // Handle clicking on a prediction to pin/unpin
  const handlePredictionClick = (pred, idx) => {
    if (pinnedPrediction && pinnedPrediction.vid === pred.vid && pinnedPrediction.stpid === pred.stpid) {
      // Unpin if clicking the same prediction
      setPinnedPrediction(null);
    } else {
      // Pin this prediction
      setPinnedPrediction(pred);
      setActivePredictionIndex(idx);
    }
  };

  // Check if a prediction is active (keep highlight even when paused)
  const isPredictionActive = (pred, idx) => {
    if (pinnedPrediction) {
      return pinnedPrediction.vid === pred.vid && pinnedPrediction.stpid === pred.stpid;
    }
    return idx === activePredictionIndex;
  };

  // Check if carousel state is controlled externally
  const isExternallyControlled = carouselModeProp !== undefined;

  // Custom header for predictions panel with carousel controls
  const predictionsHeader = (
    <RealtimeHeader title="Upcoming arrivals" countdown={countdown}>
      {/* Only show controls here if not externally controlled (i.e., not in widescreen mode) */}
      {!isExternallyControlled && carouselMode && filteredPredictions.length > 0 && (
        <>
          {pinnedPrediction && (
            <span className="text-[10px] text-blue-500 flex items-center gap-1">
              <FontAwesomeIcon icon={faThumbtack} />
              pinned
            </span>
          )}
          <button
            onClick={() => {
              if (pinnedPrediction) {
                setPinnedPrediction(null);
              } else {
                setCarouselMode(!carouselMode);
              }
            }}
            className="text-[10px] text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
            title={pinnedPrediction ? "Resume carousel" : (carouselMode ? "Pause carousel" : "Start carousel")}
          >
            <FontAwesomeIcon icon={pinnedPrediction || !carouselMode ? faPlay : faPause} />
          </button>
        </>
      )}
    </RealtimeHeader>
  );

  // Bikeshare section for predictions panel
  const bikeshareSection = hasBikeshare && (
    <div className="flex-shrink-0 -mt-px">
      <div className="grayHeader !mt-0">Bike stations</div>
      <ul className="list-none m-0">
        {favoriteBikeshare.map((station) => {
          const status = bikeshareStatus[station.station_id];
          const eBikes = status?.vehicle_types_available
            ?.filter((v) => v.vehicle_type_id !== "ICONIC")
            .reduce((sum, v) => sum + v.count, 0) || 0;

          return (
            <li
              key={station.station_id}
              className="flex items-center gap-3 py-3 px-3 border-b border-gray-200 dark:border-zinc-700 last:border-none"
            >
              {/* Circular red badge with white bike icon */}
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                <FontAwesomeIcon icon={faBicycle} className="text-white text-xs" />
              </div>
              <Link
                to={`/${station.agency?.slug?.current}/station/${station.station_id}`}
                className="flex-1 min-w-0 truncate hover:underline text-sm font-medium"
              >
                {station.name}
              </Link>
              {status ? (
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-zinc-300 flex-shrink-0">
                  <span className="flex items-center gap-1" title="Bikes available">
                    <FontAwesomeIcon icon={faBicycle} className="text-xs" />
                    <span className="font-semibold">{status.num_bikes_available}</span>
                  </span>
                  <span className="flex items-center gap-1" title="E-bikes available">
                    <FontAwesomeIcon icon={faBolt} className="text-xs" />
                    <span className="font-semibold">{eBikes}</span>
                  </span>
                  <span className="flex items-center gap-1" title="Docks available">
                    <FontAwesomeIcon icon={faParking} className="text-xs" />
                    <span className="font-semibold">{status.num_docks_available}</span>
                  </span>
                </div>
              ) : (
                <span className="text-xs text-gray-400">Loading...</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );

  // Predictions panel props (shared between usages)
  const predictionsPanelProps = {
    predictions: filteredPredictions,
    vehicles,
    loading,
    header: predictionsHeader,
    isActive: isPredictionActive,
    isPinned: (pred) => pinnedPrediction?.vid === pred.vid && pinnedPrediction?.stpid === pred.stpid,
    onPredictionClick: handlePredictionClick,
    getRouteData: getRouteForPrediction,
    showStopName: true,
  };

  // Map panel
  const MapPanel = () => (
    <div className="flex-1 min-h-[300px] md:min-h-0">
      <div className="grayHeader">Map</div>
      <div className="h-[300px] md:h-full">
        <Mapbox
          ref={map}
          mapLib={MapboxGL}
          mapboxAccessToken={process.env.MAPBOX_ACCESS_TOKEN}
          mapStyle={style}
          initialViewState={initialViewState}
          onLoad={handleMapLoad}
        >
          <NavigationControl showCompass={false} />
        </Mapbox>
      </div>
    </div>
  );

  if (widescreen) {
    return (
      <div className="h-full flex flex-col md:flex-row">
        {/* Mobile: small map on top */}
        <div className="md:hidden h-48 flex-shrink-0 relative">
          <Mapbox
            ref={map}
            mapLib={MapboxGL}
            mapboxAccessToken={process.env.MAPBOX_ACCESS_TOKEN}
            mapStyle={style}
            initialViewState={initialViewState}
            onLoad={handleMapLoad}
          >
            <NavigationControl showCompass={false} />
          </Mapbox>
        </div>

        {/* Mobile: arrivals take remaining space */}
        <div className="md:hidden flex-1 min-h-0 overflow-hidden flex flex-col">
          <PredictionsList {...predictionsPanelProps}>
            {bikeshareSection}
          </PredictionsList>
        </div>

        {/* Desktop: side by side layout - 40/60 split */}
        <div className="hidden md:flex md:flex-row h-full w-full">
          <div className="w-[40%] flex flex-col border-r border-gray-200 dark:border-zinc-700 overflow-hidden">
            <PredictionsList {...predictionsPanelProps}>
              {bikeshareSection}
            </PredictionsList>
          </div>
          <div className="w-[60%] flex flex-col relative">
            <div className="h-full">
              <Mapbox
                ref={desktopMap}
                mapLib={MapboxGL}
                mapboxAccessToken={process.env.MAPBOX_ACCESS_TOKEN}
                mapStyle={style}
                initialViewState={initialViewState}
                onLoad={handleMapLoad}
              >
                <NavigationControl showCompass={false} />
              </Mapbox>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="grayHeader">Favorites Dashboard</div>

      {/* Mobile: stacked layout */}
      <div className="md:hidden flex flex-col gap-2">
        <MapPanel />
        <PredictionsList {...predictionsPanelProps}>
          {bikeshareSection}
        </PredictionsList>
      </div>

      {/* Desktop: 2-column layout */}
      <div className="hidden md:flex gap-2 h-[500px]">
        <div className="w-1/2 flex flex-col">
          <PredictionsList {...predictionsPanelProps}>
            {bikeshareSection}
          </PredictionsList>
        </div>
        <div className="w-1/2 flex flex-col">
          <MapPanel />
        </div>
      </div>
    </div>
  );
};

export default FavoritesDashboard;
