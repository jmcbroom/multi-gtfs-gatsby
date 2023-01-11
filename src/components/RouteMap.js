import bbox from "@turf/bbox";
import MapboxGL from "mapbox-gl/dist/mapbox-gl";
import Mapbox, { NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useRef } from "react";
import { navigate } from "gatsby";
import mapboxStyle from "../styles/mapbox.json";


const RouteMap = ({ routeFc, stopsFc, timepointsFc, agency }) => {

  const routeFeatureCollection = routeFc
  const stopsFeatureCollection = stopsFc
  const timepointsFeatureCollection = timepointsFc
  
  const map = useRef();

  let mapInitialBbox = routeFeatureCollection.features.length > 0 ?
    bbox(routeFeatureCollection) : bbox(stopsFeatureCollection)

  let stopProperty = ['smart', 'the-ride'].indexOf(agency.slug.current) > -1 ? 'stopId' : 'stopCode'
  
  console.log(mapboxStyle)
  if(routeFeatureCollection.features.length > 0) {
    mapboxStyle.sources.routes.data = routeFeatureCollection;
  }
  if(stopsFeatureCollection.features.length > 0) {
    mapboxStyle.sources.stops.data = stopsFeatureCollection;
  }
  if(timepointsFeatureCollection.features.length > 0) {
    mapboxStyle.sources.timepoints.data = timepointsFeatureCollection;
  }
  
  const handleClick = (e) => {
    let stop = map.current.queryRenderedFeatures(e.point, {
      layers: ["stops-points"]
    })[0];
    
    if (stop) {
      navigate(`/${agency.slug.current}/stop/${stop.properties[stopProperty]}`)
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
      padding: 50,
      maxZoom: 17,
    }
  };
  
  return (
    <div id="map" style={{height: 500}}>
      <Mapbox
        ref={map}
        mapLib={MapboxGL}
        mapboxAccessToken={process.env.MAPBOX_ACCESS_TOKEN}
        mapStyle={mapboxStyle}
        initialViewState={initialViewState}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        interactiveLayerIds={[ "stops-points" ]}>
          <NavigationControl showCompass={false} />
      </Mapbox>
    </div>
  );
};

export default RouteMap;
