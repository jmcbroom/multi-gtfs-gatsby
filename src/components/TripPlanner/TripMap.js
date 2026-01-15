import bbox from "@turf/bbox";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useRef, useEffect, useMemo } from "react";
import MapboxGL from "mapbox-gl/dist/mapbox-gl";
import Mapbox, { NavigationControl, GeolocateControl, Source, Layer } from "react-map-gl";
import { useTheme } from "../../hooks/ThemeContext";
import { cloneDeep } from "lodash-es";
import dark from "../../styles/mapDark.json";
import light from "../../styles/mapLight.json";
import { legsToGeoJSON, createEndpointMarkers, createStopMarkers } from "../../tripPlannerUtils";

const TripMap = ({
  itinerary, // Backward compatibility
  itineraries = [],
  selectedIndex = null,
  hoveredIndex = null, // Index of the itinerary being hovered in the list
  hoveredLegIndex = null, // Index of the leg being hovered in the details
  focusedLegIndex = null, // Index of the leg to zoom/focus on (from stepper)
  origin,
  destination,
  onClick,
  cursor
}) => {
  const map = useRef();
  const { theme } = useTheme();

  // Determine effective itineraries and mode
  // If selectedIndex is NOT null, we are focusing on one itinerary.
  // If selectedIndex IS null, we are in overview mode (translucent lines for all).
  const isOverview = selectedIndex === null;

  // Normalize effective itineraries list
  const effectiveItineraries = useMemo(() => {
    if (itineraries.length > 0) return itineraries;
    if (itinerary) return [itinerary];
    return [];
  }, [itineraries, itinerary]);

  const focusedItinerary = useMemo(() => {
    if (selectedIndex !== null && effectiveItineraries[selectedIndex]) {
      return effectiveItineraries[selectedIndex];
    }
    return null;
  }, [effectiveItineraries, selectedIndex]);

  // Generate GeoJSON
  const { legsFc, stopsFc, endpointsFc } = useMemo(() => {
    // Scenario 1: No itineraries - show endpoints only (from props)
    if (effectiveItineraries.length === 0) {
      const features = [];
      if (origin) {
        features.push({
          type: 'Feature',
          properties: { type: 'origin', name: origin.name || 'Origin' },
          geometry: { type: 'Point', coordinates: [parseFloat(origin.lon), parseFloat(origin.lat)] }
        });
      }
      if (destination) {
        features.push({
          type: 'Feature',
          properties: { type: 'destination', name: destination.name || 'Destination' },
          geometry: { type: 'Point', coordinates: [parseFloat(destination.lon), parseFloat(destination.lat)] }
        });
      }
      return {
        legsFc: { type: 'FeatureCollection', features: [] },
        stopsFc: { type: 'FeatureCollection', features: [] },
        endpointsFc: { type: 'FeatureCollection', features }
      };
    }

    // Scenario 2: Focused Itinerary (Single View)
    if (!isOverview && focusedItinerary) {
      return {
        legsFc: legsToGeoJSON(focusedItinerary.legs),
        stopsFc: createStopMarkers(focusedItinerary),
        endpointsFc: createEndpointMarkers(focusedItinerary)
      };
    }

    // Scenario 3: Overview Mode (Multiple Itineraries)
    const allLegFeatures = [];

    effectiveItineraries.forEach((itin, idx) => {
      const fc = legsToGeoJSON(itin.legs);
      fc.features.forEach(f => {
        f.properties.itineraryIndex = idx;
        f.properties.isHoveredItinerary = hoveredIndex === idx;
      });
      allLegFeatures.push(...fc.features);
    });

    // For endpoints in overview, we primarily want the Origin/Destination from the query (props)
    // or fallback to the first itinerary's endpoints.
    // To keep it clean, let's use the props if available, else first itinerary.
    let endpointFeatures = [];
    if (origin && destination) {
      endpointFeatures = [
        {
          type: 'Feature',
          properties: { type: 'origin', name: origin.name || 'Origin' },
          geometry: { type: 'Point', coordinates: [parseFloat(origin.lon), parseFloat(origin.lat)] }
        },
        {
          type: 'Feature',
          properties: { type: 'destination', name: destination.name || 'Destination' },
          geometry: { type: 'Point', coordinates: [parseFloat(destination.lon), parseFloat(destination.lat)] }
        }
      ];
    } else if (effectiveItineraries[0]) {
      endpointFeatures = createEndpointMarkers(effectiveItineraries[0]).features;
    }

    // For stops in overview:
    // Maybe only show stops if an itinerary is hovered? Or none to avoid clutter?
    // Let's show stops ONLY for the hovered itinerary if one exists.
    let stopFeatures = [];
    if (hoveredIndex !== null && effectiveItineraries[hoveredIndex]) {
      stopFeatures = createStopMarkers(effectiveItineraries[hoveredIndex]).features;
    }

    return {
      legsFc: { type: 'FeatureCollection', features: allLegFeatures },
      stopsFc: { type: 'FeatureCollection', features: stopFeatures },
      endpointsFc: { type: 'FeatureCollection', features: endpointFeatures }
    };
  }, [effectiveItineraries, focusedItinerary, isOverview, origin, destination, hoveredIndex]);

  // Calculate bounds for the full trip
  const fullBounds = useMemo(() => {
    if (legsFc.features.length > 0) return bbox(legsFc);
    if (endpointsFc.features.length >= 2) return bbox(endpointsFc);
    return null;
  }, [legsFc, endpointsFc]);

  // Calculate bounds for a focused leg
  const focusedLegBounds = useMemo(() => {
    if (focusedLegIndex === null || !focusedItinerary?.legs) return null;
    const leg = focusedItinerary.legs[focusedLegIndex];
    if (!leg) return null;

    // Create a simple feature collection for this leg
    const legFc = legsToGeoJSON([leg]);
    if (legFc.features.length > 0) {
      return bbox(legFc);
    }
    return null;
  }, [focusedLegIndex, focusedItinerary]);

  // Handle bounds updates - prioritize focused leg bounds
  useEffect(() => {
    if (map.current && focusedLegBounds) {
      map.current.fitBounds(focusedLegBounds, { padding: 80, maxZoom: 17, linear: true });
    }
  }, [focusedLegBounds]);

  // Handle full bounds updates (when no leg is focused)
  useEffect(() => {
    if (map.current && fullBounds && focusedLegIndex === null) {
      map.current.fitBounds(fullBounds, { padding: 50, maxZoom: 16, linear: true });
    }
  }, [fullBounds, focusedLegIndex]);

  if (!theme) return null;

  const baseStyle = theme === 'dark' ? cloneDeep(dark) : cloneDeep(light);

  const initialViewState = {
    longitude: -83.05,
    latitude: 42.33,
    zoom: 11
  };

  // Styles logic
  // Opacity:
  // Single view: 1.0 (or default logic)
  // Overview:
  //   - If nothing hovered: 0.3 for all
  //   - If something hovered: 1.0 for hovered, 0.1 for others
  const getOverviewOpacity = (baseOpacity) => {
    if (!isOverview) return baseOpacity; // No opacity changes in single view

    if (hoveredIndex === null) return baseOpacity; // Base state (0.3)

    return [
      'case',
      ['boolean', ['feature-state', 'hover'], ['==', ['get', 'itineraryIndex'], hoveredIndex]],
      1.0, // Active/Hovered opacity
      0.1  // Dimmed opacity
    ];
  };

  // Line Width
  const getLineWidth = (baseWidth) => {
    if (!isOverview) return baseWidth;
    if (hoveredIndex === null) return baseWidth;
    return [
      'case',
      ['==', ['get', 'itineraryIndex'], hoveredIndex],
      baseWidth + 2,
      baseWidth
    ];
  };

  return (
    <div id="trip-map" className="h-full">
      <Mapbox
        ref={map}
        mapLib={MapboxGL}
        mapboxAccessToken={process.env.MAPBOX_ACCESS_TOKEN}
        mapStyle={baseStyle}
        initialViewState={initialViewState}
        style={{ width: "100%", height: "100%" }}
        onClick={onClick}
        cursor={cursor}
      >
        <NavigationControl showCompass={false} />
        <GeolocateControl />

        {/* ----------------- SINGLE VIEW LAYERS ----------------- */}
        {!isOverview && (
          <>
            {/* Glow for single view leg hover or focus */}
            <Source id="all-legs" type="geojson" data={legsFc}>
              <Layer
                id="all-legs-glow"
                type="line"
                filter={['==', ['id'], focusedLegIndex ?? hoveredLegIndex ?? -1]}
                paint={{
                  "line-color": "#facc15",
                  "line-width": 22,
                  "line-opacity": 0.3
                }}
                layout={{ "line-cap": "round", "line-join": "round" }}
              />
            </Source>

            {/* Walk legs - dashed */}
            <Source id="walk-legs" type="geojson" data={{ type: 'FeatureCollection', features: legsFc.features.filter(f => !f.properties.isTransit) }}>
              <Layer
                id="walk-legs-line"
                type="line"
                paint={{
                  "line-color": theme === 'dark' ? "#888888" : "#666666",
                  "line-width": 4,
                  "line-dasharray": [2, 2]
                }}
                layout={{ "line-cap": "round", "line-join": "round" }}
              />
            </Source>

            {/* Transit legs */}
            <Source id="transit-legs" type="geojson" data={{ type: 'FeatureCollection', features: legsFc.features.filter(f => f.properties.isTransit) }}>
              <Layer
                id="transit-legs-case"
                type="line"
                paint={{
                  "line-color": ["get", "routeColor"],
                  "line-width": 8
                }}
                layout={{ "line-cap": "round", "line-join": "round" }}
              />
              <Layer
                id="transit-legs-line"
                type="line"
                paint={{
                  "line-color": "#ffffff",
                  "line-width": 4,
                  "line-opacity": 0.5
                }}
                layout={{ "line-cap": "round", "line-join": "round" }}
              />
            </Source>
          </>
        )}

        {/* ----------------- OVERVIEW LAYERS ----------------- */}
        {isOverview && (
          <Source id="overview-legs" type="geojson" data={legsFc}>
            {/* Walk legs */}
            <Layer
              id="overview-walk-lines"
              type="line"
              filter={['==', ['get', 'mode'], 'WALK']}
              paint={{
                "line-color": theme === 'dark' ? "#888888" : "#666666",
                "line-width": getLineWidth(4),
                "line-dasharray": [2, 2],
                "line-opacity": getOverviewOpacity(0.3)
              }}
              layout={{ "line-cap": "round", "line-join": "round" }}
            />

            {/* Transit legs */}
            <Layer
              id="overview-transit-lines"
              type="line"
              filter={['!=', ['get', 'mode'], 'WALK']}
              paint={{
                "line-color": ["get", "routeColor"],
                "line-width": getLineWidth(6),
                "line-opacity": getOverviewOpacity(0.4)
              }}
              layout={{ "line-cap": "round", "line-join": "round" }}
            />
          </Source>
        )}

        {/* Markers (Endpoints and Stops) */}
        <Source id="endpoints" type="geojson" data={endpointsFc}>
          <Layer
            id="origin-point"
            type="circle"
            filter={["==", ["get", "type"], "origin"]}
            paint={{
              "circle-radius": 10,
              "circle-color": "#22c55e",
              "circle-stroke-width": 3,
              "circle-stroke-color": "#ffffff"
            }}
          />
          <Layer
            id="destination-point"
            type="circle"
            filter={["==", ["get", "type"], "destination"]}
            paint={{
              "circle-radius": 10,
              "circle-color": "#ef4444",
              "circle-stroke-width": 3,
              "circle-stroke-color": "#ffffff"
            }}
          />
          <Layer
            id="endpoint-labels"
            type="symbol"
            layout={{
              "text-field": ["match", ["get", "type"], "origin", "A", "destination", "B", ""],
              "text-size": 12,
              "text-font": ["Inter Bold"],
              "text-allow-overlap": true,
              "text-ignore-placement": true
            }}
            paint={{ "text-color": "#ffffff" }}
          />
        </Source>

        <Source id="stops" type="geojson" data={stopsFc}>
          <Layer
            id="stop-circles"
            type="circle"
            paint={{
              "circle-radius": 5,
              "circle-color": ["get", "routeColor"],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff"
            }}
          />
          <Layer
            id="stop-labels"
            type="symbol"
            minzoom={15}
            layout={{
              "text-field": ["get", "name"],
              "text-size": { "base": 1, "stops": [[15, 7], [18, 15]] },
              "text-offset": [0, 0.8],
              "text-anchor": "top",
              "text-font": ["Inter Semi Bold"],
              "text-max-width": 5,
              "text-allow-overlap": true,
              "text-ignore-placement": true,
              "text-letter-spacing": -0.01
            }}
            paint={{
              "text-color": theme === 'dark' ? "#ffffff" : "#000000",
              "text-halo-color": theme === 'dark' ? "hsl(0, 0%, 25%)" : "hsl(0, 0%, 100%)",
              "text-halo-width": 2
            }}
          />
        </Source>
      </Mapbox>
    </div>
  );
};

export default TripMap;
