import MapboxGL from "mapbox-gl/dist/mapbox-gl";
import Mapbox, { NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React from "react";
import mapboxStyle from "../styles/styleFactory";
import _ from 'lodash'

const StopMap = ({ stopFc }) => {
  let stop = stopFc.features[0];

  let style = _.cloneDeep(mapboxStyle)
  style.sources.stop.data = stopFc;
  
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
