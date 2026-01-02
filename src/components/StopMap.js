import "mapbox-gl/dist/mapbox-gl.css";
import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import MapboxGL from "mapbox-gl/dist/mapbox-gl";
import Mapbox, { NavigationControl } from "react-map-gl";
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
    const shortNames = routes.map((r) => r.routeShortName);
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
  }, [sanityRoutes, routes, agency.feedIndex]);

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
    if (!map.current || !trackedBus || trackedBus === lastTrackedBus.current) return;

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
  }, [trackedBus, vehicleFc, stopFc]);

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

  return (
    <div id="map" style={{ height: 350 }} className="mb-8 relative">
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
        onMoveStart={handleMoveStart}
        onMoveEnd={handleMoveEnd}
      >
        <NavigationControl showCompass={false} />
      </Mapbox>
    </div>
  );
};

export default StopMap;
