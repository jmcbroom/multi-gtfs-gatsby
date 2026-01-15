import "mapbox-gl/dist/mapbox-gl.css";
import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import MapboxGL from "mapbox-gl/dist/mapbox-gl";
import Mapbox, { NavigationControl, GeolocateControl } from "react-map-gl";
import bbox from "@turf/bbox";
import { useSanityRoutes } from "../hooks/useSanityRoutes";
import { useMapStyle } from "../hooks/useMapStyle";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExpand } from "@fortawesome/free-solid-svg-icons";

const StopMap = ({
  stopFc,
  times,
  routes,
  predictions,
  vehicles,
  trackedBus,
  agency,
  selectedRoute,
}) => {
  const { sanityRoutes } = useSanityRoutes();
  const map = useRef();
  const { style } = useMapStyle();

  // Track if user has moved away from stop-centered view
  const [userHasMoved, setUserHasMoved] = useState(false);
  const isUserInteracting = useRef(false);
  const lastTrackedBus = useRef(null);

  // Compute route features
  const routeFc = useMemo(() => {
    if (!sanityRoutes?.edges) return { type: "FeatureCollection", features: [] };

    const allRoutes = sanityRoutes.edges.map((e) => e.node);
    const fc = { type: "FeatureCollection", features: [] };

    // If a route is selected, only show that route; otherwise show all routes at this stop
    const shortNames = selectedRoute
      ? [selectedRoute]
      : routes.map((r) => r.routeShortName);

    const filtered = allRoutes.filter(
      (r) =>
        r.agency.currentFeedIndex === agency.feedIndex &&
        shortNames.indexOf(r.shortName) > -1
    );

    filtered.forEach((route) => {
      route.directions.forEach((direction) => {
        let feature = JSON.parse(direction.directionShape)[0];
        feature.properties = {
          routeColor: route.color.hex,
          routeLongName: route.longName,
          routeShortName: route.shortName,
          routeTextColor: route.textColor.hex,
          mapPriority: route.mapPriority,
          direction: direction.directionDescription,
          directionId: direction.directionId,
        };
        fc.features.push(feature);
      });
    });

    return fc;
  }, [sanityRoutes, routes, agency.feedIndex, selectedRoute]);

  // Compute vehicle feature collection
  const vehicleFc = useMemo(() => {
    const fc = { type: "FeatureCollection", features: [] };

    if (predictions && vehicles && trackedBus) {
      const trackedPrediction = predictions.find((p) => p.vid === trackedBus);
      if (trackedPrediction) {
        const trackedVehicle = vehicles.find((v) => v.vid === trackedPrediction.vid);
        const matchingRoute = routeFc.features.find(
          (r) => r.properties.routeShortName === trackedPrediction.rt
        );
        if (trackedVehicle && matchingRoute) {
          fc.features.push({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [
                parseFloat(trackedVehicle.lon),
                parseFloat(trackedVehicle.lat),
              ],
            },
            properties: {
              vid: trackedVehicle.vid,
              name: trackedVehicle.vid,
              routeColor: matchingRoute.properties.routeColor,
              routeTextColor: matchingRoute.properties.routeTextColor,
              vehicleIcon: "bus",
            },
          });
        }
      }
    }

    return fc;
  }, [predictions, vehicles, trackedBus, routeFc]);

  // Get stop coordinates
  const stop = stopFc?.features?.[0];
  const stopCoords = stop?.geometry?.coordinates;

  // Track when user starts interacting
  const handleMoveStart = useCallback((e) => {
    if (e.originalEvent) {
      isUserInteracting.current = true;
    }
  }, []);

  // Track when user finishes moving the map
  const handleMoveEnd = useCallback((e) => {
    if (isUserInteracting.current) {
      setUserHasMoved(true);
      isUserInteracting.current = false;
    }
  }, []);

  // Fit to show stop and tracked vehicle only when trackedBus changes
  useEffect(() => {
    if (!map.current) return;

    // If trackedBus was cleared, reset to stop view
    if (!trackedBus && lastTrackedBus.current) {
      lastTrackedBus.current = null;
      if (stopCoords) {
        map.current.easeTo({
          center: stopCoords,
          zoom: 17.25,
          duration: 500,
        });
        setUserHasMoved(false);
      }
      return;
    }

    if (!trackedBus || trackedBus === lastTrackedBus.current) return;

    lastTrackedBus.current = trackedBus;

    if (vehicleFc.features.length > 0 && stopFc?.features?.length > 0) {
      const stopAndVehicleFc = {
        type: "FeatureCollection",
        features: [...stopFc.features, ...vehicleFc.features],
      };
      map.current.fitBounds(bbox(stopAndVehicleFc), {
        padding: 50,
        maxZoom: 17.25,
        duration: 500,
      });
      setUserHasMoved(true);
    }
  }, [trackedBus, vehicleFc, stopFc, stopCoords]);

  // Reset to stop-centered view
  const handleResetView = useCallback(() => {
    if (map.current && stopCoords) {
      map.current.easeTo({
        center: stopCoords,
        zoom: 17.25,
        duration: 500,
      });
      setUserHasMoved(false);
    }
  }, [stopCoords]);

  // Early return after all hooks
  if (!style || !stop) {
    return null;
  }

  // Update style sources
  style.sources.stop.data = stopFc;
  style.sources.vehicles.data = vehicleFc;

  if (routeFc.features.length > 0) {
    style.sources.routes.data = routeFc;
  }

  // turn off the route-labels
  style.layers.forEach((l, idx) => {
    if (l.id.startsWith("route-labels")) {
      style.layers[idx].maxzoom = 15;
    }
  });

  const initialViewState = {
    longitude: stopCoords[0],
    latitude: stopCoords[1],
    zoom: 17.25,
  };

  // Compute maxBounds from all routes with padding
  const maxBounds = routeFc.features.length > 0
    ? (() => {
        const bounds = bbox(routeFc);
        const padding = 0.02; // ~1-2 miles of padding
        return [
          [bounds[0] - padding, bounds[1] - padding],
          [bounds[2] + padding, bounds[3] + padding]
        ];
      })()
    : null;

  return (
    <div id="map" className="mb-8 min-h-[240px] h-[200px] md:h-96 relative">
      <div className="grayHeader flex justify-between items-center">
        <span>Stop map</span>
        {userHasMoved && (
          <button
            onClick={handleResetView}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            aria-label="Reset to stop view"
            title="Center on stop"
          >
            <FontAwesomeIcon icon={faExpand} className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <Mapbox
        ref={map}
        mapLib={MapboxGL}
        mapboxAccessToken={process.env.MAPBOX_ACCESS_TOKEN}
        mapStyle={style}
        initialViewState={initialViewState}
        maxBounds={maxBounds}
        onMoveStart={handleMoveStart}
        onMoveEnd={handleMoveEnd}
      >
        <NavigationControl showCompass={false} />
        <GeolocateControl />
      </Mapbox>
    </div>
  );
};

export default StopMap;
