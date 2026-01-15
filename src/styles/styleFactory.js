import { cloneDeep } from "lodash-es";
import dark from "./mapDark.json";
import light from "./mapLight.json";

let styles = cloneDeep({ light, dark });

let newSources = {
  esri: {
    type: "vector",
    tiles: [
      "https://tiles.arcgis.com/tiles/qvkbeam7Wirps6zC/arcgis/rest/services/Basemap_Dynamic_Detail/VectorTileServer/tile/{z}/{y}/{x}.pbf",
    ],
  },
  routes: {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  },
  timepoints: {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  },
  stops: {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  },
  secondaryStops: {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  },
  stop: {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  },
  vehicles: {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  },
  bikeshare: {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  }
};

for (const style in styles) {
  styles[style].sources = { ...styles[style].sources, ...newSources };
}

// Add impervious surface layers (from City of Detroit ESRI tiles)
for (const style in styles) {
  let imperviousLayer = {
    id: "impervious-surface-roads",
    type: "fill",
    source: "esri",
    "source-layer": "Impervious Surface",
    filter: ["==", "_symbol", 0],
    minzoom: 14,
    layout: {},
    paint: {
      "fill-color": style === "light" ? "#efefef" : "#2a2a2a",
      "fill-opacity": 0.75,
    },
  };

  // Insert impervious layers early in the stack (before admin boundaries)
  let insertIndex = styles[style].layers.findIndex((l) => l.id === "admin-0-boundary-disputed");
  if (insertIndex === -1) insertIndex = styles[style].layers.length;
  styles[style].layers.splice(insertIndex, 0, imperviousLayer);

  // Match road-simple line color to impervious surface
  let roadSimpleLayer = styles[style].layers.find((l) => l.id === "road-simple");
  if (roadSimpleLayer) {
    roadSimpleLayer.paint["line-color"] = style === "light" ? "#efefef" : "#2a2a2a";
  }
}

for (const style in styles) {
  let routeLayers = [
    {
      id: "routes-case-4",
      type: "line",
      source: "routes",
      filter: ["==", "mapPriority", 4],
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      minzoom: 10.5,
      paint: {
        "line-color": ["get", "routeColor"],
        "line-opacity": 1,
        "line-width": {
          base: 1.5,
          stops: [
            [10.5, 1],
            [11, 2],
            [13, 4],
            [18, 22],
          ],
        },
      },
    },
    {
      id: "routes-4",
      type: "line",
      source: "routes",
      minzoom: 10.5,
      filter: ["==", "mapPriority", 4],
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": ["get", "routeTextColor"],
        "line-opacity": style === "light" ? 0.55 : 0.35,
        "line-width": {
          base: 1.5,
          stops: [
            [10.5, 0.5],
            [11, 1],
            [13, 2],
            [18, 12],
          ],
        },
      },
    },
    {
      id: "routes-case-3",
      type: "line",
      source: "routes",
      filter: ["==", "mapPriority", 3],
      minzoom: 8,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": ["get", "routeColor"],
        "line-opacity": 1,
        "line-width": {
          base: 1.5,
          stops: [
            [8, 0.8],
            [8.5, 1.75],
            [13, 6],
            [18, 28],
          ],
        },
      },
    },
    {
      id: "routes-3",
      type: "line",
      source: "routes",
      minzoom: 8,
      filter: ["==", "mapPriority", 3],
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": ["get", "routeTextColor"],
        "line-opacity": style === "light" ? 0.55 : 0.35,
        "line-width": {
          base: 1.5,
          stops: [
            [8, 0.4],
            [8.5, 0.75],
            [13, 3.5],
            [18, 20],
          ],
        },
      },
    },
    {
      id: "routes-case-2",
      type: "line",
      source: "routes",
      filter: ["==", "mapPriority", 2],
      minzoom: 7.5,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": ["get", "routeColor"],
        "line-opacity": 1,
        "line-width": {
          base: 1.5,
          stops: [
            [7.5, 1],
            [8, 2],
            [13, 7],
            [18, 30],
          ],
        },
      },
    },
    {
      id: "routes-2",
      type: "line",
      source: "routes",
      minzoom: 7.5,
      filter: ["==", "mapPriority", 2],
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": ["get", "routeTextColor"],
        "line-opacity": style === "light" ? 0.55 : 0.35,
        "line-width": {
          base: 1.5,
          stops: [
            [7.5, 0.5],
            [8, 1],
            [13, 4],
            [18, 22],
          ],
        },
      },
    },
    {
      id: "routes-case-1",
      type: "line",
      source: "routes",
      filter: ["==", "mapPriority", 1],
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": ["get", "routeColor"],
        "line-opacity": 1,
        "line-width": {
          base: 1.5,
          stops: [
            [10, 2.5],
            [10.5, 5],
            [13, 7],
            [18, 36],
          ],
        },
      },
    },
    {
      id: "routes-1",
      type: "line",
      source: "routes",
      filter: ["==", "mapPriority", 1],
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": ["get", "routeTextColor"],
        "line-opacity": style === "light" ? 0.55 : 0.35,
        "line-width": {
          base: 1.5,
          stops: [
            [10, 1.25],
            [10.5, 2.5],
            [13, 5],
            [18, 24],
          ],
        },
      },
    },
    {
      id: "route-labels-4",
      type: "symbol",
      source: "routes",
      filter: ["==", "mapPriority", 4],
      minzoom: 11.5,
      interactive: true,
      paint: {
        "text-color": ["get", "routeTextColor"],
        "text-halo-color": ["get", "routeColor"],
        "text-halo-width": {
          base: 1.5,
          stops: [
            [10, 5],
            [16, 2],
          ],
        },
      },
      layout: {
        "text-field": ["get", "displayShortName"],
        "text-justify": "auto",
        "symbol-placement": "line",
        "symbol-spacing": 180,
        "text-rotation-alignment": "viewport",
        "text-font": ["Inter Bold"],
        "text-padding": {
          base: 1,
          stops: [
            [10, 0.1],
            [18, 5],
          ],
        },
        "text-size": {
          base: 1.5,
          stops: [
            [10, 8],
            [16, 18],
            [18, 28],
          ],
        },
      },
    },
    {
      id: "route-labels-3",
      type: "symbol",
      source: "routes",
      filter: ["==", "mapPriority", 3],
      minzoom: 9,
      interactive: true,
      paint: {
        "text-color": ["get", "routeTextColor"],
        "text-halo-color": ["get", "routeColor"],
        "text-halo-width": {
          base: 1.5,
          stops: [
            [10, 5],
            [16, 5],
          ],
        },
      },
      layout: {
        "text-field": ["get", "displayShortName"],
        "text-justify": "auto",
        "symbol-placement": "line",
        "symbol-spacing": 180,
        "text-rotation-alignment": "viewport",
        "text-font": ["Inter Bold"],
        "text-padding": {
          base: 1,
          stops: [
            [10, 0.1],
            [18, 5],
          ],
        },
        "text-size": {
          base: 1.5,
          stops: [
            [10, 8],
            [16, 18],
            [18, 24],
          ],
        },
      },
    },
    {
      id: "route-labels-2",
      type: "symbol",
      source: "routes",
      filter: ["==", "mapPriority", 2],
      minzoom: 8.5,
      interactive: true,
      paint: {
        "text-color": ["get", "routeTextColor"],
        "text-halo-color": ["get", "routeColor"],
        "text-halo-width": {
          base: 1.5,
          stops: [
            [10, 5],
            [16, 5],
          ],
        },
      },
      layout: {
        "text-field": ["get", "displayShortName"],
        "text-justify": "auto",
        "symbol-placement": "line",
        "symbol-spacing": 180,
        "text-rotation-alignment": "viewport",
        "text-font": ["Inter Bold"],
        "text-padding": {
          base: 1,
          stops: [
            [10, 0.1],
            [18, 5],
          ],
        },
        "text-size": {
          base: 1.5,
          stops: [
            [10, 8],
            [16, 20],
            [18, 28],
          ],
        },
      },
    },
    {
      id: "route-labels-1",
      type: "symbol",
      source: "routes",
      filter: ["==", "mapPriority", 1],
      interactive: true,
      paint: {
        "text-color": ["get", "routeTextColor"],
        "text-halo-color": ["get", "routeColor"],
        "text-halo-width": {
          base: 1.5,
          stops: [
            [10, 5],
            [16, 5],
          ],
        },
      },
      layout: {
        "text-field": ["get", "displayShortName"],
        "text-justify": "auto",
        "symbol-placement": "line",
        "symbol-spacing": 100,
        "text-rotation-alignment": "viewport",
        "text-font": ["Inter Bold"],
        "text-padding": {
          base: 1,
          stops: [
            [10, 0.1],
            [18, 4],
          ],
        },
        "text-size": {
          base: 1.5,
          stops: [
            [10, 10],
            [16, 24],
            [18, 32],
          ],
        },
      },
    },
  ];
  
  let adminBoundaryIndex = styles[style].layers
    .map((l) => l.id)
    .indexOf(`admin-0-boundary-disputed`);
  
  styles[style].layers.splice(adminBoundaryIndex, 0, ...routeLayers);
}

for (const style in styles) {
  let stopLayers = [
    {
      id: "timepoint-points",
      type: "circle",
      source: "timepoints",
      interactive: true,
      maxzoom: 13.5,
      layout: {},
      paint: {
        "circle-color": "#444",
        "circle-stroke-color": "black",
        "circle-stroke-width": {
          stops: [
            [8, 1],
            [13, 2],
          ],
        },
        "circle-stroke-opacity": {
          stops: [
            [12.5, 1],
            [13, 0.5],
            [13.5, 0],
          ],
        },
        "circle-opacity": {
          stops: [
            [12.5, 1],
            [13, 0.5],
            [13.5, 0],
          ],
        },
        "circle-radius": {
          stops: [
            [8, 0.5],
            [10.5, 2.5],
            [13, 3.5],
          ],
        },
      },
    },
    {
      id: "timepoint-labels",
      type: "symbol",
      source: "timepoints",
      maxzoom: 13.5,
      layout: {
        "text-line-height": 0.8,
        "text-size": {
          base: 1,
          stops: [
            [6, 7],
            [10, 10],
            [13, 12],
          ],
        },
        "text-allow-overlap": false,
        "text-offset": ['get', 'offset'],
        "text-anchor": ['get', 'anchor'],
        "text-justify": ["get", "justify"],
        "text-font": ["Inter Bold"],
        visibility: "visible",
        "text-field": ["get", "stopName"],
        "text-max-width": 5,
      },
      paint: {
        "text-translate": [0, 0],
        "text-halo-color": style === "light" ?
          "white" : "hsl(0, 0%, 25%)",
        "text-halo-width": 2,
        "text-opacity": {
          stops: [
            [7.5, 0],
            [7.6, 1],
            [12.5, 1],
            [13, 0.3],
            [13.5, 0],
          ],
        },
        "text-color": style === "light" ?
          "black" : "white",
      },
    },
    {
      id: "stops-points",
      type: "circle",
      source: "stops",
      interactive: true,
      filter: ["all", ["==", "$type", "Point"], ["!=", "isTimepoint", true]],
      layout: {},
      minzoom: 12,
      paint: {
        "circle-color": "white",
        "circle-stroke-color": "#222",
        "circle-stroke-width": {
          stops: [
            [12, 0.5],
            [15, 1],
            [19, 3],
          ],
        },
        "circle-stroke-opacity": 0.8,
        "circle-opacity": 0.8,
        "circle-radius": {
          stops: [
            [12, 1],
            [14, 2],
            [15, 3],
            [19, 12],
          ],
        },
      },
    },
    {
      id: "stops-timepoint-points",
      type: "circle",
      source: "stops",
      interactive: true,
      filter: ["all", ["==", "$type", "Point"], ["==", "isTimepoint", true]],
      layout: {},
      minzoom: 12,
      paint: {
        "circle-color": "#333",
        "circle-stroke-color": "#000",
        "circle-stroke-width": {
          stops: [
            [12, 1],
            [15, 1.5],
            [19, 4],
          ],
        },
        "circle-stroke-opacity": 1,
        "circle-opacity": 1,
        "circle-radius": {
          stops: [
            [12, 2],
            [14, 3],
            [15, 4.5],
            [19, 14],
          ],
        },
      },
    },
    {
      id: "stops-labels",
      type: "symbol",
      source: "stops",
      filter: ["!=", "isTimepoint", true],
      minzoom: 14,
      layout: {
        "text-line-height": 1,
        "text-size": {
          base: 1,
          stops: [
            [14, 7],
            [15, 9],
            [18, 13],
          ],
        },
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "text-font": ["Inter Semi Bold"],
        "text-padding": 0,
        "text-offset": ["coalesce", ["get", "offset"], ["literal", [0.75, 0]]],
        "text-anchor": ["coalesce", ["get", "anchor"], "left"],
        "text-justify": ["coalesce", ["get", "justify"], "left"],
        "text-field": ["get", "stopName"],
        "text-letter-spacing": -0.01,
        "text-max-width": 5,
      },
      paint: {
        "text-translate": [0, 0],
        "text-halo-color": style === "light" ?
          "hsl(0, 0%, 100%)" :
          "hsl(0, 0%, 25%)",
        "text-halo-width": 2,
        "text-color": style === "light" ?
          "hsl(0, 0%, 0%)" :
          "hsl(0, 0%, 100%)",
        "text-opacity": 1,
      },
    },
    {
      id: "stops-timepoint-labels",
      type: "symbol",
      source: "stops",
      filter: ["==", "isTimepoint", true],
      minzoom: 13,
      layout: {
        "text-line-height": 1,
        "text-size": {
          base: 1,
          stops: [
            [13, 9],
            [15, 11],
            [18, 15],
          ],
        },
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "text-font": ["Inter Bold"],
        "text-padding": 0,
        "text-offset": ["coalesce", ["get", "offset"], ["literal", [0.75, 0]]],
        "text-anchor": ["coalesce", ["get", "anchor"], "left"],
        "text-justify": ["coalesce", ["get", "justify"], "left"],
        "text-field": ["get", "stopName"],
        "text-letter-spacing": -0.01,
        "text-max-width": 5,
      },
      paint: {
        "text-translate": [0, 0],
        "text-halo-color": style === "light" ?
          "hsl(0, 0%, 100%)" :
          "hsl(0, 0%, 25%)",
        "text-halo-width": 2,
        "text-color": style === "light" ?
          "hsl(0, 0%, 0%)" :
          "hsl(0, 0%, 100%)",
        "text-opacity": 1,
      },
    },
    {
      id: "secondary-stops-points",
      type: "circle",
      source: "secondaryStops",
      interactive: true,
      filter: ["==", "$type", "Point"],
      layout: {},
      minzoom: 12,
      paint: {
        "circle-color": "white",
        "circle-stroke-color": "#222",
        "circle-stroke-width": {
          stops: [
            [12, 0.3],
            [15, 0.5],
            [19, 2],
          ],
        },
        "circle-stroke-opacity": 0.8,
        "circle-opacity": 0.8,
        "circle-radius": {
          stops: [
            [12, 0.75],
            [14, 1.5],
            [15, 2],
            [19, 8],
          ],
        },
      },
    },
    {
      id: "secondary-stops-labels",
      type: "symbol",
      source: "secondaryStops",
      minzoom: 14,
      layout: {
        "text-line-height": 1,
        "text-size": {
          base: 1,
          stops: [
            [14, 6],
            [15, 9],
            [18, 13],
          ],
        },
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "text-font": ["Inter Semi Bold"],
        "text-padding": 10,
        "text-offset": ["coalesce", ["get", "offset"], ["literal", [0.75, 0]]],
        "text-anchor": ["coalesce", ["get", "anchor"], "left"],
        "text-justify": ["coalesce", ["get", "justify"], "left"],
        "text-field": ["get", "stopName"],
        "text-letter-spacing": -0.01,
        "text-max-width": 5,
      },
      paint: {
        "text-translate": [0, 0],
        "text-halo-color": style === "light" ?
          "hsl(0, 0%, 100%)" :
          "hsl(0, 0%, 25%)",
        "text-halo-width": 2,
        "text-color": style === "light" ?
          "hsl(0, 0%, 0%)" :
          "hsl(0, 0%, 100%)",
        "text-opacity": 1,
      },
    },
    {
      id: "vehicle-icon-arrows",
      type: "symbol",
      source: "vehicles",
      interactive: true,
      filter: ["==", "$type", "Point"],
      layout: {
        "icon-image": "campsite",
        "icon-size": {
          stops: [
            [8, 1],
            [13, 1.5],
            [19, 2.25],
          ],
        },
        "icon-offset": {
          stops: [
            [8, [0, -7]],
            [19, [0, -11]]
          ]
        },
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "icon-rotate": ["get", "bearing"],
        "icon-rotation-alignment": "map",
        "icon-pitch-alignment": "map",
      },
      paint: {
        "icon-opacity": 1,
        "icon-color": "#222",
      }
    },
    {
      id: "vehicle-points",
      type: "circle",
      source: "vehicles",
      interactive: true,
      filter: ["==", "$type", "Point"],
      layout: {},
      paint: {
        "circle-color": ["get", "routeTextColor"],
        "circle-stroke-color": ["get", "routeColor"],
        "circle-stroke-width": {
          stops: [
            [10, 2],
            [19, 5],
          ],
        },
        "circle-stroke-opacity": 1,
        "circle-opacity": 0.95,
        "circle-radius": {
          stops: [
            [8, 6],
            [13, 10],
            [19, 18],
          ],
        },
      },
    },
    
    {
      id: "vehicle-icons",
      type: "symbol",
      source: "vehicles",
      interactive: true,
      filter: ["==", "$type", "Point"],
      layout: {
        "icon-image": ["get", "vehicleIcon"],
        "icon-size": {
          stops: [
            [8, 0.75],
            [13, 1.25],
            [19, 1.5],
          ],
        },
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
      paint: {
        "icon-opacity": 1
      }
    },
    {
      id: "stop-point",
      type: "circle",
      source: "stop",
      filter: ["==", "$type", "Point"],
      layout: {},
      // minzoom: 17,
      paint: {
        "circle-color": "yellow",
        "circle-stroke-color": "#222",
        "circle-stroke-width": {
          stops: [
            [10, 1],
            [19, 3],
          ],
        },
        "circle-stroke-opacity": {
          stops: [
            [8, 0],
            [8.1, 0.1],
            [13.2, 0.8],
          ],
        },
        "circle-opacity": 1,
        "circle-radius": {
          stops: [
            [8, 3.5],
            [13, 3.5],
            [19, 12],
          ],
        },
      },
    },
    {
      id: "stop-label",
      type: "symbol",
      source: "stop",
      layout: {
        "text-line-height": 1,
        "text-size": {
          base: 1,
          stops: [
            [8, 7],
            [18, 15],
          ],
        },
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "text-font": ["Inter Semi Bold"],
        "text-padding": 1,
        "text-offset": ['get', 'offset'],
        "text-anchor": ['get', 'anchor'],
        "text-justify": ["get", "justify"],
        "text-field": ["get", "name"],
        "text-letter-spacing": -0.01,
        "text-max-width": 5,
      },
      paint: {
        "text-translate": [0, 0],
        "text-halo-color": style === "light" ?
          "hsl(0, 0%, 100%)" :
          "hsl(0, 0%, 25%)",
        "text-halo-width": 4,
        "text-color": style === "light" ?
          "hsl(0, 0%, 0%)" :
          "hsl(0, 0%, 100%)",
        "text-opacity": {
          base: 1,
          stops: [
            [8, 0],
            [8.1, 0.8],
            [15.2, 1],
          ],
        },
      },
    },
    {
      id: "bikeshare-point",
      type: "circle",
      source: "bikeshare",
      filter: ["==", "$type", "Point"],
      layout: {},
      paint: {
        "circle-color": "#DC2626", // MoGo red
        "circle-stroke-width": 0,
        "circle-opacity": 1,
        "circle-radius": {
          stops: [
            [8, 2],
            [13, 6],
            [19, 14],
          ],
        },
      },
    },
    {
      id: "bikeshare-icon",
      type: "symbol",
      source: "bikeshare",
      filter: ["==", "$type", "Point"],
      minzoom: 12,
      layout: {
        "icon-image": "bicycle",
        "icon-size": {
          stops: [
            [12, 0.4],
            [15, 0.7],
            [19, 1],
          ],
        },
        "icon-allow-overlap": true,
      },
      paint: {
        "icon-color": "#fff",
      },
    },
    {
      id: "bikeshare-label",
      type: "symbol",
      source: "bikeshare",
      layout: {
        "text-line-height": 1,
        "text-size": {
          base: 1,
          stops: [
            [8, 7],
            [18, 13],
          ],
        },
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "text-font": ["Inter Semi Bold"],
        "text-padding": 0.5,
        "text-offset": [-1.2, 0],
        "text-anchor": 'right',
        "text-justify": 'right',
        "text-field": ["get", "name"],
        "text-letter-spacing": -0.01,
        "text-max-width": 5,
      },
      paint: {
        "text-translate": [0, 0],
        "text-halo-color": style === "light" ?
          "hsl(0, 0%, 100%)" :
          "hsl(0, 0%, 25%)",
        "text-halo-width": 2,
        "text-color": style === "light" ?
          "hsl(0, 0%, 0%)" :
          "hsl(0, 0%, 100%)",
        "text-opacity": {
          base: 1,
          stops: [
            [13, 0],
            [13.1, 0.8],
            [15.2, 1],
          ],
        },
      },
    },

  ];
  
  styles[style].layers = styles[style].layers.concat(stopLayers);
}

export default styles;
