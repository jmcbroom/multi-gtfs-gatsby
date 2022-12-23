import bbox from "@turf/bbox";
import { Map, NavigationControl } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useEffect } from "react";
import mapboxStyle from "../styles/mapbox.json";

const RouteMap = ({ routeFc, timepointsFc }) => {

  const routeFeatureCollection = routeFc
  const timepointsFeatureCollection = timepointsFc

  let mapInitialBbox = routeFeatureCollection.features.length > 0 ? bbox(routeFeatureCollection) : bbox(timepointsFeatureCollection)

  useEffect(() => {
    const accessToken = process.env.MAPBOX_ACCESS_TOKEN;

    let map = new Map({
      container: "map",
      style: mapboxStyle,
      bounds: mapInitialBbox,
      fitBoundsOptions: {
        padding: 50,
        maxZoom: 17,
      },
      interactive: true,
      accessToken: accessToken,
    });

    map.addControl(new NavigationControl({ showCompass: false }));

    map.on("load", () => {
      map.resize();
      if(routeFeatureCollection.features.length > 0) {
        map.getSource("routes").setData(routeFeatureCollection);
      }
      if(timepointsFeatureCollection.features.length > 0) {
        map.getSource("timepoints").setData(timepointsFeatureCollection)
      }
    });

    map.on("click", (e) => {
      const features = map.queryRenderedFeatures(e.point);
    });
  }, []);

  return <div id="map" style={{height: 500}}></div>;
};

export default RouteMap;
