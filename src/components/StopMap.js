import MapboxGL from "mapbox-gl/dist/mapbox-gl";
import Mapbox, { NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React from "react";
import mapboxStyle from "../styles/styleFactory";
import _ from 'lodash'
import { createRouteFc } from "../util";

const StopMap = ({ stopFc, routeFc, times }) => {
  let stop = stopFc.features[0];

  
  let style = _.cloneDeep(mapboxStyle)
  style.sources.stop.data = stopFc;

  if (routeFc.features.length > 0) {
    style.sources.routes.data = routeFc;
  }

  // turn off the route-labels
  style.layers.forEach((l, idx) => {
    if(l.id.startsWith('route-labels')) {
      style.layers[idx].maxzoom = 15
    }
  });
  
  
  const initialViewState = {
    longitude: stop.geometry.coordinates[0],
    latitude: stop.geometry.coordinates[1],
    zoom: 17.25
  };
  
  return (
    <div id="map" style={{height: 350}}>
      <Mapbox
        mapLib={MapboxGL}
        mapboxAccessToken={process.env.MAPBOX_ACCESS_TOKEN}
        mapStyle={style}
        initialViewState={initialViewState}>
          <NavigationControl showCompass={false} />
      </Mapbox>
    </div>
  );
};

export default StopMap;
