import _ from "lodash";
import dark from "./mapDark.json";
import light from "./mapLight.json";

let styles = _.cloneDeep({ light, dark });

let newSources = {
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
};

for (const style in styles) {
  styles[style].sources = { ...styles[style].sources, ...newSources };
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

// let stopLayers = [
//   {
//     id: "timepoint-points",
//     type: "circle",
//     source: "timepoints",
//     interactive: true,
//     maxzoom: 15,
//     layout: {},
//     paint: {
//       "circle-color": "#444",
//       "circle-stroke-color": "black",
//       "circle-stroke-width": {
//         stops: [
//           [8, 1],
//           [19, 3],
//         ],
//       },
//       "circle-stroke-opacity": 1,
//       "circle-opacity": 1,
//       "circle-radius": {
//         stops: [
//           [8, 0.5],
//           [10.5, 2.5],
//           [15, 4],
//         ],
//       },
//     },
//   },
//   {
//     id: "timepoint-labels",
//     type: "symbol",
//     source: "timepoints",
//     maxzoom: 15,
//     layout: {
//       "text-line-height": 0.8,
//       "text-size": {
//         base: 1,
//         stops: [
//           [6, 6],
//           [11, 10],
//           [22, 14],
//         ],
//       },
//       "text-allow-overlap": false,
//       "text-padding": 10,
//       "text-offset": ['get', 'offset'],
//       "text-anchor": ['get', 'anchor'],     
//       "text-justify": ["get", "justify"],
//       "text-font": ["Inter Bold"],
//       visibility: "visible",
//       "text-field": ["get", "stopName"],
//       "text-max-width": 4,
//     },
//     paint: {
//       "text-translate": [0, 0],
//       "text-halo-color": "white",
//       "text-halo-width": 2,
//       "text-opacity": {
//         stops: [
//           [7.5, 0],
//           [7.51, 0.1],
//           [7.6, 0.9],
//           [14.9, 0.9],
//           [15, 0],
//         ],
//       },
//       "text-color": "black",
//     },
//   },
//   {
//     id: "stops-points",
//     type: "circle",
//     source: "stops",
//     interactive: true,
//     filter: ["==", "$type", "Point"],
//     layout: {},
//     minzoom: 14,
//     paint: {
//       "circle-color": "white",
//       "circle-stroke-color": "#222",
//       "circle-stroke-width": {
//         stops: [
//           [13, 1],
//           [19, 3],
//         ],
//       },
//       "circle-stroke-opacity": {
//         stops: [
//           [13, 0],
//           [13.1, 0.1],
//           [13.2, 0.8],
//         ],
//       },
//       "circle-opacity": {
//         stops: [
//           [13, 0],
//           [13.1, 0.1],
//           [13.2, 0.8],
//         ],
//       },
//       "circle-radius": {
//         stops: [
//           [13, 1.5],
//           [19, 12],
//         ],
//       },
//     },
//   },
//   {
//     id: "vehicle-points",
//     type: "circle",
//     source: "vehicles",
//     interactive: true,
//     filter: ["==", "$type", "Point"],
//     layout: {},
//     paint: {
//       "circle-color": ["get", "routeTextColor"],
//       "circle-stroke-color": ["get", "routeColor"],
//       "circle-stroke-width": {
//         stops: [
//           [10, 2],
//           [19, 5],
//         ],
//       },
//       "circle-stroke-opacity": 0.8,
//       "circle-opacity": 0.95,
//       "circle-radius": {
//         stops: [
//           [8, 6],
//           [13, 10],
//           [19, 18],
//         ],
//       },
//     },
//   },
//   {
//     id: "vehicle-icons",
//     type: "symbol",
//     source: "vehicles",
//     interactive: true,
//     filter: ["==", "$type", "Point"],
//     layout: {
//       "icon-image": ["get", "vehicleIcon"],
//       "icon-size": {
//         stops: [
//           [8, 0.75],
//           [13, 1.25],
//           [19, 1.5],
//         ],
//       },
//       "icon-allow-overlap": true,
//       "icon-ignore-placement": true,
//       "icon-rotate": ["get", "bearing"],
//       "icon-rotation-alignment": "map",
//       "icon-pitch-alignment": "map",
//     },
//     paint: {
//       "icon-opacity": 1
//     }
//   },
//   {
//     id: "stops-labels",
//     type: "symbol",
//     source: "stops",
//     minzoom: 15,
//     layout: {
//       "text-line-height": 1,
//       "text-size": {
//         base: 1,
//         stops: [
//           [15, 7],
//           [18, 15],
//         ],
//       },
//       "text-allow-overlap": true,
//       "text-ignore-placement": true,
//       "text-font": ["Inter Semi Bold"],
//       "text-justify": "center",
//       "text-padding": 0,
//       "text-offset": ['get', 'offset'],
//       "text-anchor": ['get', 'anchor'],
//       "text-justify": ["get", "justify"],
//       "text-field": ["get", "stopName"],
//       "text-letter-spacing": -0.01,
//       "text-max-width": 5,
//     },
//     paint: {
//       "text-translate": [0, 0],
//       "text-halo-color": "hsl(0, 0%, 100%)",
//       "text-halo-width": 2,
//       "text-color": "hsl(0, 0%, 0%)",
//       "text-opacity": {
//         base: 1,
//         stops: [
//           [15, 0],
//           [15.1, 0.1],
//           [15.2, 1],
//         ],
//       },
//     },
//   },
//   {
//     id: "stop-point",
//     type: "circle",
//     source: "stop",
//     filter: ["==", "$type", "Point"],
//     minzoom: 17,
//     layout: {},
//     paint: {
//       "circle-color": "yellow",
//       "circle-stroke-color": "#222",
//       "circle-stroke-width": {
//         stops: [
//           [10, 1],
//           [19, 3],
//         ],
//       },
//       "circle-stroke-opacity": {
//         stops: [
//           [8, 0],
//           [8.1, 0.1],
//           [13.2, 0.8],
//         ],
//       },
//       "circle-opacity": 1,
//       "circle-radius": {
//         stops: [
//           [8, 3.5],
//           [13, 3.5],
//           [19, 12],
//         ],
//       },
//     },
//   },
//   {
//     id: "stop-label",
//     type: "symbol",
//     source: "stop",
//     layout: {
//       "text-line-height": 1,
//       "text-size": {
//         base: 1,
//         stops: [
//           [8, 7],
//           [18, 15],
//         ],
//       },
//       "text-allow-overlap": false,
//       "text-ignore-placement": false,
//       "text-font": ["Inter Semi Bold"],
//       "text-justify": "center",
//       "text-padding": 1,
//       "text-offset": ['get', 'offset'],
//       "text-anchor": ['get', 'anchor'],
//       "text-justify": ["get", "justify"],
//       "text-field": ["get", "name"],
//       "text-letter-spacing": -0.01,
//       "text-max-width": 5,
//     },
//     paint: {
//       "text-translate": [0, 0],
//       "text-halo-color": "hsl(0, 0%, 100%)",
//       "text-halo-width": 4,
//       "text-color": "hsl(0, 0%, 0%)",
//       "text-opacity": {
//         base: 1,
//         stops: [
//           [8, 0],
//           [8.1, 0.8],
//           [15.2, 1],
//         ],
//       },
//     },
//   },
// ];

for (const style in styles) {
  let stopLayers = [
    {
      id: "timepoint-points",
      type: "circle",
      source: "timepoints",
      interactive: true,
      maxzoom: 15,
      layout: {},
      paint: {
        "circle-color": "#444",
        "circle-stroke-color": "black",
        "circle-stroke-width": {
          stops: [
            [8, 1],
            [19, 3],
          ],
        },
        "circle-stroke-opacity": 1,
        "circle-opacity": 1,
        "circle-radius": {
          stops: [
            [8, 0.5],
            [10.5, 2.5],
            [15, 4],
          ],
        },
      },
    },
    {
      id: "timepoint-labels",
      type: "symbol",
      source: "timepoints",
      maxzoom: 15.1,
      layout: {
        "text-line-height": 0.8,
        "text-size": {
          base: 1,
          stops: [
            [6, 6],
            [11, 9],
            [22, 14],
          ],
        },
        "text-allow-overlap": false,
        "text-offset": ['get', 'offset'],
        "text-anchor": ['get', 'anchor'],
        "text-justify": ["get", "justify"],
        "text-font": ["Inter Semi Bold"],
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
            [7.51, 0.1],
            [7.6, 0.9],
            [14.9, 0.9],
            [15, 0.1],
            [15.1, 0],
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
      filter: ["==", "$type", "Point"],
      layout: {},
      minzoom: 15,
      paint: {
        "circle-color": "white",
        "circle-stroke-color": "#222",
        "circle-stroke-width": {
          stops: [
            [13, 1],
            [19, 3],
          ],
        },
        "circle-stroke-opacity": {
          stops: [
            [13, 0],
            [13.1, 0.1],
            [13.2, 0.8],
          ],
        },
        "circle-opacity": {
          stops: [
            [13, 0],
            [13.1, 0.1],
            [13.2, 0.8],
          ],
        },
        "circle-radius": {
          stops: [
            [13, 1.5],
            [19, 12],
          ],
        },
      },
    },
    {
      id: "stops-labels",
      type: "symbol",
      source: "stops",
      minzoom: 15,
      layout: {
        "text-line-height": 1,
        "text-size": {
          base: 1,
          stops: [
            [15, 11],
            [18, 14],
          ],
        },
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "text-font": ["Inter Semi Bold"],
        "text-justify": "center",
        "text-padding": 0,
        "text-offset": ['get', 'offset'],
        "text-anchor": ['get', 'anchor'],
        "text-justify": ["get", "justify"],
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
        "text-opacity": {
          base: 1,
          stops: [
            [15, 0],
            [15.01, 0.9],
            [15.1, 1],
          ],
        },
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
      minzoom: 17,
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
        "text-justify": "center",
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
  ];
  
  styles[style].layers = styles[style].layers.concat(stopLayers);
}

export default styles;
