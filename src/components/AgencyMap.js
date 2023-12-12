import bbox from "@turf/bbox";
import MapboxGL from "mapbox-gl/dist/mapbox-gl";
import Mapbox, { GeolocateControl, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useRef, useState } from "react";
import { navigate } from "gatsby";
import { useTheme } from "../hooks/ThemeContext";
import mapboxStyles from "../styles/styleFactory";
import _ from "lodash";
import RouteHeader from "./RouteHeader";

const AgencyMap = ({ routesFc, agency }) => {

  const routeFeatureCollection = routesFc;

  let [routes, setRoutes] = useState([]);

  const map = useRef();
  const { theme } = useTheme();
  
  if (!theme) { return null; }

  let bboxFc = Object.assign({}, routeFeatureCollection);

  bboxFc.features = bboxFc.features.filter(ft => ft.properties.mapPriority < 4);

  let mapInitialBbox = bbox(bboxFc);

  let style = _.cloneDeep(mapboxStyles[theme]);

  if (routeFeatureCollection.features.length > 0) {
    style.sources.routes.data = routeFeatureCollection;
  }

  const handleClick = (e) => {
    // click a stop => navigate to URL
    let stop = map.current.queryRenderedFeatures(e.point, {
      layers: ["stops-points"],
    })[0];
    if (stop) {
      navigate(`/${agency.slug.current}/stop/${stop.properties.stopCode}`);
    }

    // click a routeLabel => navigate to that route URL
    let route = map.current.queryRenderedFeatures(e.point, {
      layers: [
        "route-labels-1",
        "route-labels-2",
        "route-labels-3",
        "route-labels-4",
      ],
    })[0];
    if (route) {
      navigate(
        `/${agency.slug.current}/route/${route.properties.displayShortName}`
      );
    }
  };

  const handleMouseEnter = () => {
    map.current.getCanvas().style.cursor = "pointer";
  };

  const handleMouseLeave = () => {
    map.current.getCanvas().style.cursor = "";
  };

  const zoomToRoutes = () => {
    if (map.current) {
      map.current?.easeTo({
        zoom: 14.01,
      });
    }
  };

  const geolocateOnMap = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((x) => {
        map.current?.easeTo({
          center: [x.coords.longitude, x.coords.latitude],
          zoom: 15,
        });
      });
    }
  };

  const handleMoveEnd = () => {
    let routesOnMap = map.current.queryRenderedFeatures({
      layers: [
        "routes-case-1",
        "routes-case-2",
        "routes-case-3",
        "routes-case-4",
      ],
    });

    if (map.current.getZoom() > 13.5) {
      let uniqueRoutes = _.uniqBy(routesOnMap, "properties.routeShortName")
        .map((r) => r.properties)
        .sort(
          (a, b) => parseInt(a.routeShortName) > parseInt(b.routeShortName)
        );
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
          mapStyle={style}
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
      <>
        <div className="my-2">{`${
          routes.length > 0 ? routes.length : `No`
        } routes shown on the map`}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 px-2 md:px-0 max-h-screen overflow-auto">
          {routes.length > 0 ? (
            <>
              {routes.map((r) => (
                <RouteHeader {...r} agency={agency} key={r.routeShortName} />
              ))}
            </>
          ) : (
            <div>
              <button className="font-bold" onClick={() => zoomToRoutes()}>
                Zoom in
              </button>{" "}
              or{" "}
              <button className="font-bold" onClick={() => geolocateOnMap()}>
                jump to your location
              </button>{" "}
              to show more routes.
            </div>
          )}
        </div>
      </>
    </>
  );
};

export default AgencyMap;
