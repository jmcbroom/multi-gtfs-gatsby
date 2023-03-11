import MapboxGL from "mapbox-gl/dist/mapbox-gl";
import Mapbox, { NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React, {useRef} from "react";
import mapboxStyle from "../styles/styleFactory";
import _ from 'lodash'
import { createRouteFc } from "../util";
import bbox from "@turf/bbox";

const StopMap = ({ stopFc, routeFc, times, predictions, vehicles, trackedBus }) => { 
  
  const map = useRef();

  let stop = stopFc.features[0];

  // make a feature collection of the vehicles
  let vehicleFc = {
    type: "FeatureCollection",
    features: []
  }
  // if we have predictions and vehicles, push a new feature for the tracked bus
  if(predictions && vehicles) {

    let trackedPrediction = predictions.filter(p => p.vid === trackedBus)[0]
    if(trackedPrediction) {
      let trackedVehicle = vehicles.filter(v => v.vid === trackedPrediction.vid)[0]
      let matchingRoute = routeFc.features.filter(r => r.properties.routeShortName === trackedPrediction.rt)[0]
      if(trackedVehicle) {
        vehicleFc.features.push({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [parseFloat(trackedVehicle.lon), parseFloat(trackedVehicle.lat)]
          },
          properties: {
            name: trackedVehicle.vid,
            routeColor: matchingRoute.properties.routeColor,
            routeTextColor: matchingRoute.properties.routeTextColor,
          }
        })
      }
    }

    let stopAndVehicleFc = {
      type: "FeatureCollection",
      features: [...stopFc.features, ...vehicleFc.features]
    }
    map.current.fitBounds(bbox(stopAndVehicleFc), {padding: 50, maxZoom: 17.25})

  }


  let style = _.cloneDeep(mapboxStyle)
  style.sources.stop.data = stopFc;
  style.sources.vehicles.data = vehicleFc

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
        ref={map}
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
