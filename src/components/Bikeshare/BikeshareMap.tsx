import bbox from "@turf/bbox";
import { cloneDeep } from "lodash-es";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useRef } from "react";
import MapboxGL from "mapbox-gl/dist/mapbox-gl";
import Mapbox, { GeolocateControl, NavigationControl } from "react-map-gl";
import { useTheme } from "../../hooks/ThemeContext";
import mapboxStyles from "../../styles/styleFactory";
import { FeatureCollection } from "geojson";
import { navigate } from "gatsby";
import MapLegend from "../MapLegend";

interface BikeshareMapProps {
  stationsFc: FeatureCollection;
  nearbyStopsFc?: FeatureCollection;
  showLegend?: boolean;
  legendText?: string;
  includeNearbyStops?: boolean;
  onBoundsChange?: (bounds: [number, number, number, number] | null) => void;
  bikeshareSlug?: string;
}

const BikeshareMap:React.FC<BikeshareMapProps> = ({
  stationsFc,
  nearbyStopsFc,
  showLegend = false,
  legendText = "Station colors indicate bike availability. Zoom in to see exact bike counts.",
  includeNearbyStops = false,
  onBoundsChange,
  bikeshareSlug = "mogo"
}) => {

  const map = useRef<any>();
  const { theme } = useTheme();
  
  if (!theme) { return null; }

  let boundingBox: any = bbox(stationsFc)

  let style = cloneDeep(mapboxStyles[theme]);
  style.sources.bikeshare.data = stationsFc;

  if (nearbyStopsFc) {
    style.sources.secondaryStops.data = nearbyStopsFc;
  }

  // add stations layer

  const handleClick = (e: any) => {

    const features = map.current.queryRenderedFeatures(e.point, {
      layers: ["bikeshare-point"],
    });

    if (features.length > 0) {
      const feature = features[0];
      // navigate to station page
      navigate(`/${bikeshareSlug}/station/${feature.id}`)
    }

    const stopFeatures = map.current.queryRenderedFeatures(e.point, {
      layers: ["secondary-stops-points", "secondary-stops-labels"],
    });

    if (stopFeatures.length > 0) {
      const feature = stopFeatures[0];
      // navigate to stop page
      navigate(`/${feature.properties.agency}/stop/${feature.properties.agency == 'ddot' ? feature.properties.stopCode : feature.properties.stopId}`)
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
    if (onBoundsChange && map.current) {
      const bounds = map.current.getBounds();
      if (bounds) {
        onBoundsChange([
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth()
        ]);
      }
    }
  };

  const handleLoad = () => {
    // Report initial bounds after map loads
    if (onBoundsChange && map.current) {
      const bounds = map.current.getBounds();
      if (bounds) {
        onBoundsChange([
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth()
        ]);
      }
    }
  };

  const initialViewState = {
    bounds: boundingBox,
    fitBoundsOptions: {
      padding: 50,
      maxZoom: 17,
      linear: true,
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
          onLoad={handleLoad}
          interactiveLayerIds={["bikeshare-point", "secondary-stops-points", "secondary-stops-labels"]}
        >
          <NavigationControl showCompass={false} />
          <GeolocateControl />
        </Mapbox>
      </div>
      
      {showLegend && (
        <MapLegend
          marks={[
            {
              color: "#DC2626",
              text: "MoGo bikeshare station",
              size: "w-4 h-4",
            },
            ...(includeNearbyStops ? [{
              color: "white",
              text: "Nearby bus stop",
              size: "w-3 h-3",
            }] : [])
          ]}
          text="Tap a station to see availability details."
        />
      )}
    </>
  );
};

export default BikeshareMap;
