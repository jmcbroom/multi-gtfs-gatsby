import bbox from "@turf/bbox";
import { Map, NavigationControl } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useEffect } from "react";
import mapboxStyle from "../styles/mapbox.json";

const StopMap = ({ stopFc }) => {

  useEffect(() => {
    const accessToken = process.env.MAPBOX_ACCESS_TOKEN;

    let stop = stopFc.features[0]

    let map = new Map({
      container: "map",
      style: mapboxStyle,
      center: stop.geometry.coordinates,
      zoom: 18,
      interactive: true,
      accessToken: accessToken,
    });

    map.addControl(new NavigationControl({ showCompass: false }));

    map.on("load", () => {
      map.resize();
      if(stopFc.features.length > 0) {
        map.getSource("stop").setData(stopFc);
      }
      // if(timepointsFeatureCollection.features.length > 0) {
      //   map.getSource("timepoints").setData(timepointsFeatureCollection)
      // }
    });

    map.on("click", (e) => {
      const features = map.queryRenderedFeatures(e.point);
    });
  }, []);

  return <div id="map" style={{height: 275}}></div>;
};

export default StopMap;
