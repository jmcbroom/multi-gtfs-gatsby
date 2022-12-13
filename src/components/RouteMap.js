import bbox from "@turf/bbox";
import { Map, NavigationControl } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useEffect } from "react";
import mapboxStyle from "../styles/mapbox.json";

const RouteMap = ({ routeFc, timepointsFc }) => {

  const routeFeatureCollection = routeFc
  const timepointsFeatureCollection = timepointsFc

  useEffect(() => {
    const accessToken = process.env.MAPBOX_ACCESS_TOKEN;

    let map = new Map({
      container: "map",
      style: mapboxStyle,
      bounds: bbox(routeFeatureCollection),
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
      map.getSource("routes").setData(routeFeatureCollection);
      map.getSource("timepoints").setData(timepointsFeatureCollection)
    });

    map.on("click", (e) => {
      const features = map.queryRenderedFeatures(e.point);
      console.log(features);
    });
  }, []);

  return <div id="map" style={{height: 500}}></div>;
};

export default RouteMap;
