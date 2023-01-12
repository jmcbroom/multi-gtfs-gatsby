import bbox from "@turf/bbox";
import MapboxGL from "mapbox-gl/dist/mapbox-gl";
import Mapbox, { GeolocateControl, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useRef, useState } from "react";
import { navigate } from "gatsby";
import mapboxStyle from "../styles/mapbox.json";
import _ from "lodash";
import RouteHeader from "./RouteHeader";

const AgencyMap = ({ routesFc, agency }) => {
  const routeFeatureCollection = routesFc;

  let [routes, setRoutes] = useState([]);

  const map = useRef();

  let mapInitialBbox = bbox(routeFeatureCollection);

  if (routeFeatureCollection.features.length > 0) {
    mapboxStyle.sources.routes.data = routeFeatureCollection;
  }

  const handleClick = (e) => {
    let stop = map.current.queryRenderedFeatures(e.point, {
      layers: ["stops-points"],
    })[0];

    if (stop) {
      navigate(`/${agency.slug.current}/stop/${stop.properties.stopCode}`);
    }
  };

  const handleMouseEnter = () => {
    map.current.getCanvas().style.cursor = "pointer";
  };

  const handleMouseLeave = () => {
    map.current.getCanvas().style.cursor = "";
  };

  const handleMoveEnd = () => {
    let routesOnMap = map.current.queryRenderedFeatures({
      layers: ["routes-case"],
    });

    if (map.current.getZoom() > 14) {
      let uniqueRoutes = _.uniqBy(routesOnMap, "properties.routeShortName").map(
        (r) => r.properties
      ).sort((a, b) => parseInt(a.routeShortName) > parseInt(b.routeShortName));
      setRoutes(uniqueRoutes);
    } else {
      setRoutes([]);
    }
  };

  const initialViewState = {
    bounds: mapInitialBbox,
    fitBoundsOptions: {
      padding: 50,
      maxZoom: 17,
    },
  };

  return (
    <>
      <div id="map" style={{ height: 500 }}>
        <Mapbox
          ref={map}
          mapLib={MapboxGL}
          mapboxAccessToken={process.env.MAPBOX_ACCESS_TOKEN}
          mapStyle={mapboxStyle}
          initialViewState={initialViewState}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMoveEnd={handleMoveEnd}
          interactiveLayerIds={["stops-points"]}
        >
          <NavigationControl showCompass={false} />
          <GeolocateControl />
        </Mapbox>
      </div>
      {routes.length > 0 && (
        <>
          <div className="underline-title">Routes in the map view</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 px-2 md:px-0 max-h-screen overflow-auto">
            {routes.map((r) => (
              <RouteHeader {...r} agency={agency} />
            ))}
          </div>
        </>
      )}
    </>
  );
};

export default AgencyMap;
