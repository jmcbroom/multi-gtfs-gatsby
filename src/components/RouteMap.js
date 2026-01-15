import bbox from "@turf/bbox";
import { navigate } from "gatsby";
import MapboxGL from "mapbox-gl/dist/mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import Mapbox, { NavigationControl, GeolocateControl } from "react-map-gl";
import { useMapStyle } from "../hooks/useMapStyle";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExpand } from "@fortawesome/free-solid-svg-icons";

const RouteMap = ({
  routeFc,
  stopsFc,
  timepointsFc,
  vehicleFc,
  agency,
  trackedBus,
  className = ``,
  clickStops=true,
  mapBearing = 0,
  mapPadding = 30,
  mapOffset=[0, 0]
}) => {

  const routeFeatureCollection = routeFc;
  const stopsFeatureCollection = stopsFc;
  const timepointsFeatureCollection = timepointsFc;

  const map = useRef();
  const { style } = useMapStyle();

  // Track if the map has been initialized and if user has moved away from initial bounds
  const [hasInitialized, setHasInitialized] = useState(false);
  const [userHasMoved, setUserHasMoved] = useState(false);
  const isUserInteracting = useRef(false);

  // Compute bbox from both route and stops combined
  const mapInitialBbox = useMemo(() => {
    if (!routeFeatureCollection?.features?.length && !stopsFeatureCollection?.features?.length) {
      return null;
    }
    const combinedFc = {
      type: "FeatureCollection",
      features: [...(routeFeatureCollection?.features || []), ...(stopsFeatureCollection?.features || [])]
    };
    return bbox(combinedFc);
  }, [routeFeatureCollection, stopsFeatureCollection]);

  const stopProperty = useMemo(() => {
    return ["smart", "theride"].indexOf(agency?.slug?.current) > -1
      ? "stopId"
      : "stopCode";
  }, [agency?.slug?.current]);

  // Fit bounds only on initial load (when map first becomes available)
  const handleLoad = useCallback(() => {
    if (!hasInitialized && map.current) {
      setHasInitialized(true);
    }
  }, [hasInitialized]);

  // Track when user starts interacting (to prevent programmatic updates during interaction)
  const handleMoveStart = useCallback((e) => {
    // e.originalEvent exists for user-initiated moves, not for programmatic ones
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

  // Handle tracked bus - only easeTo when trackedBus changes, not on every render
  useEffect(() => {
    if (!map.current || !hasInitialized) return;

    if (trackedBus) {
      const trackedFeature = vehicleFc?.features?.find(v => v.properties.vid === trackedBus);
      if (trackedFeature) {
        map.current.easeTo({
          center: trackedFeature.geometry.coordinates,
          zoom: 14.75,
          duration: 2000
        });
        setUserHasMoved(true); // Tracking a bus counts as moving away from full view
      }
    }
  }, [trackedBus, hasInitialized]); // Note: intentionally not including vehicleFc to avoid constant updates

  // Reset to full view
  const handleResetView = useCallback(() => {
    if (map.current && mapInitialBbox) {
      map.current.fitBounds(mapInitialBbox, {
        padding: mapPadding,
        bearing: mapBearing,
        offset: mapOffset,
        maxZoom: 17,
        duration: 500
      });
      setUserHasMoved(false);
    }
  }, [mapInitialBbox, mapPadding, mapBearing, mapOffset]);

  const handleClick = useCallback((e) => {
    if(!clickStops || !map.current) { return };

    let stop = map.current.queryRenderedFeatures(e.point, {
      layers: ["stops-points", "stops-timepoint-points"],
    })[0];

    if (stop) {
      navigate(`/${agency.slug.current}/stop/${stop.properties[stopProperty]}`);
    }
  }, [clickStops, agency?.slug?.current, stopProperty]);

  const handleMouseEnter = useCallback(() => {
    if (map.current) {
      map.current.getCanvas().style.cursor = "pointer";
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (map.current) {
      map.current.getCanvas().style.cursor = "";
    }
  }, []);

  // Early return after all hooks
  if (!style || !mapInitialBbox) {
    return null;
  }

  // turn off the route-labels
  style.layers.forEach((l, idx) => {
    if (l.id.startsWith("route-labels")) {
      style.layers[idx].layout.visibility = "none";
    }
  });

  if (routeFeatureCollection?.features?.length > 0) {
    style.sources.routes.data = routeFeatureCollection;
  }
  if (stopsFeatureCollection?.features?.length > 0) {
    style.sources.stops.data = stopsFeatureCollection;
  }
  if (timepointsFeatureCollection?.features?.length > 0) {
    style.sources.timepoints.data = timepointsFeatureCollection;
  }
  if (vehicleFc?.features?.length > 0) {
    style.sources.vehicles.data = vehicleFc;
  }

  const initialViewState = {
    bounds: mapInitialBbox,
    fitBoundsOptions: {
      padding: mapPadding,
      bearing: mapBearing,
      offset: mapOffset,
      maxZoom: 17,
      linear: true,
    },
  };

  return (
    <div id="map" className={`h-64 sm:h-72 md:h-96 lg:h-128 mb-8 relative`}>
      <div className="grayHeader flex justify-between items-center">
        <span>Route map</span>
        {userHasMoved && (
          <button
            onClick={handleResetView}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            aria-label="Reset to full route view"
            title="Full view"
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
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onLoad={handleLoad}
        onMoveStart={handleMoveStart}
        onMoveEnd={handleMoveEnd}
        twoFingerDrag={true}
        interactiveLayerIds={clickStops ? ["stops-points", "stops-timepoint-points"] : []}
      >
        <NavigationControl showCompass={false} />
        <GeolocateControl />
      </Mapbox>
    </div>
  );
};

export default RouteMap;
