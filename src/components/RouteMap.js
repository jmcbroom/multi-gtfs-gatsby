import bbox from "@turf/bbox";
import MapboxGL from "mapbox-gl/dist/mapbox-gl";
import Mapbox, { NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useRef } from "react";
import { navigate } from "gatsby";
import { useTheme } from "../hooks/ThemeContext";
import mapboxStyles from "../styles/styleFactory";
import _ from "lodash";

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
  const { theme } = useTheme();

  if (!theme) {
    return null;
  }

  let mapInitialBbox =
    routeFeatureCollection.features.length > 0
      ? bbox(stopsFeatureCollection)
      : bbox(stopsFeatureCollection);

  let stopProperty =
    ["smart", "theride"].indexOf(agency.slug.current) > -1
      ? "stopId"
      : "stopCode";

  let style = _.cloneDeep(mapboxStyles[theme]);
  // turn off the route-labels
  style.layers.forEach((l, idx) => {
    if (l.id.startsWith("route-labels")) {
      style.layers[idx].layout.visibility = "none";
    }
  });

  if (routeFeatureCollection.features.length > 0) {
    style.sources.routes.data = routeFeatureCollection;
  }
  if (stopsFeatureCollection.features.length > 0) {
    style.sources.stops.data = stopsFeatureCollection;
  }
  if (timepointsFeatureCollection.features.length > 0) {
    style.sources.timepoints.data = timepointsFeatureCollection;
  }
  if (vehicleFc?.features?.length > 0) {
    style.sources.vehicles.data = vehicleFc;
  }

  const handleClick = (e) => {
    if(!clickStops) { return };

    let stop = map.current.queryRenderedFeatures(e.point, {
      layers: ["stops-points"],
    })[0];

    if (stop) {
      navigate(`/${agency.slug.current}/stop/${stop.properties[stopProperty]}`);
    }
  };

  const handleMouseEnter = () => {
    map.current.getCanvas().style.cursor = "pointer";
  };

  const handleMouseLeave = () => {
    map.current.getCanvas().style.cursor = "";
  };

  const initialViewState = {
    bounds: mapInitialBbox,
    fitBoundsOptions: {
      padding: mapPadding,
      bearing: mapBearing,
      offset: mapOffset,
      maxZoom: 17
    },
  };

  if(trackedBus) {
    let trackedFeature = vehicleFc.features.filter(v => v.properties.vid === trackedBus)[0]
    if(!trackedFeature) { return };
    map.current?.easeTo({
      center: trackedFeature.geometry.coordinates,
      zoom: 14.75,
      duration: 2000
    })
  }
  else {
    map.current?.fitBounds(initialViewState.bounds, initialViewState.fitBoundsOptions)
  }

  return (
    <div id="map" className={`h-64 sm:h-72 md:h-96 lg:h-128 mb-8`}>
      <div className="grayHeader">Route map</div>

      <Mapbox
        ref={map}
        mapLib={MapboxGL}
        mapboxAccessToken={process.env.MAPBOX_ACCESS_TOKEN}
        mapStyle={style}
        initialViewState={initialViewState}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        twoFingerDrag={true}
        interactiveLayerIds={clickStops ? ["stops-points"] : []}
      >
        <NavigationControl showCompass={false} />
      </Mapbox>
    </div>
  );
};

export default RouteMap;
