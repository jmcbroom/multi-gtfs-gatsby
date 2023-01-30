import style from "./style.json";

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
  realtime: {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  }
};

style.sources = {...style.sources, ...newSources}

let routeLayers = [
  {
    "id": "routes-case",
    "type": "line",
    "source": "routes",
    "layout": {
      "line-join": "round",
      "line-cap": "round"
    },
    "paint": {
      "line-color": ["get", "routeColor"],
      "line-opacity": 1,
      "line-width": {
        "base": 1.5,
        "stops": [
          [10, 2],
          [10.5, 4],
          [13, 6],
          [18, 32]
        ]
      }
    }
  },
  {
    "id": "routes",
    "type": "line",
    "source": "routes",
    "layout": {
      "line-join": "round",
      "line-cap": "round"
    },
    "paint": {
      "line-color": ["get", "routeTextColor"],
      "line-opacity": 0.55,
      "line-width": {
        "base": 1.5,
        "stops": [
          [10, 1],
          [10.5, 2],
          [13, 4],
          [18, 22]
        ]
      }
    }
  },
  {
    "id": "route-labels",
    "type": "symbol",
    "source": "routes",
    "interactive": true,
    "paint": {
      "text-color": ["get", "routeTextColor"],
      "text-halo-color": ["get", "routeColor"],
      "text-halo-width": {
        "base": 1.5,
        "stops": [
          [10, 5],
          [16, 2]
        ]
      }
    },
     "layout": {
      "text-field": ["get", "routeShortName"],
      "text-justify": "auto",
      "symbol-placement": "line",
      "symbol-spacing": 180,
      "text-rotation-alignment": "viewport",
      "text-font": ["Inter Bold"],
      "text-padding": {
        "base": 1,
        "stops": [
          [10, 0.1],
          [18, 5]
        ]
      },
      "text-size": {
        "base": 1.5,
        "stops": [
          [10, 8],
          [16, 18],
          [18, 28]
        ]
      }
      }
  }
];

let adminBoundaryIndex = style.layers.map(l => l.id).indexOf(`admin-0-boundary-disputed`)

style.layers.splice(adminBoundaryIndex, 0, ...routeLayers)

let stopLayers = [
  {
    "id": "timepoint-points",
    "type": "circle",
    "source": "timepoints",
    "interactive": true,
    "maxzoom": 15,
    "layout": {},
    "paint": {
      "circle-color": "#444",
      "circle-stroke-color": "black",
      "circle-stroke-width": {
        "stops": [
          [8, 1],
          [19, 3]
        ]
      },
      "circle-stroke-opacity": 1,
      "circle-opacity": 1,
      "circle-radius": {
        "stops": [
          [8, 0.5],
          [10.5, 2.5],
          [15, 4]
        ]
      }
    }
  },
  {
    "id": "timepoint-labels",
    "type": "symbol",
    "source": "timepoints",
    "maxzoom": 15,
    "layout": {
      "text-line-height": 0.8,
      "text-size": {
        "base": 1,
        "stops": [
          [6, 6],
          [11, 10],
          [13, 14]
        ]
      },
      "text-allow-overlap": false,
      "text-padding": 10,
      "text-offset": [0, 1.5],
      "text-font": ["Inter Bold"],
      "visibility": "visible",
      "text-field": ["get", "stopName"],
      "text-max-width": 5
    },
    "paint": {
      "text-translate": [0, 0],
      "text-halo-color": "white",
      "text-halo-width": 2,
      "text-opacity": {
        "stops": [
          [9.5, 0],
          [9.51, 0.1],
          [9.6, 0.9],
          [14.9, 0.9],
          [15, 0]
        ]
      },
      "text-color": "black"
    }
  },
  {
    "id": "stops-points",
    "type": "circle",
    "source": "stops",
    "interactive": true,
    "filter": ["==", "$type", "Point"],
    "layout": {},
    "minzoom": 14,
    "paint": {
      "circle-color": "white",
      "circle-stroke-color": "#222",
      "circle-stroke-width": {
        "stops": [[13, 1], [19, 3]]
      },
      "circle-stroke-opacity": {
        "stops": [[13, 0], [13.1, 0.1], [13.2, 0.8]]
      },
      "circle-opacity": {
        "stops": [[13, 0], [13.1, 0.1], [13.2, 0.8]]
      },
      "circle-radius": {
        "stops": [[13, 1.5], [19, 12]]
      }
    }
  },
  {
    "id": "stops-labels",
    "type": "symbol",
    "source": "stops",
    "minzoom": 15,
    "layout": {
      "text-line-height": 1,
      "text-size": {
        "base": 1,
        "stops": [[15, 7], [18, 15]]
      },
      "text-allow-overlap": true,
      "text-ignore-placement": true,
      "text-font": ["Inter Semi Bold"],
      "text-justify": "center",
      "text-padding": 0,
      "text-offset": [0, 1],
      "text-anchor": "top",
      "text-field": ["get", "stopName"],
      "text-letter-spacing": -0.01,
      "text-max-width": 5
    },
    "paint": {
      "text-translate": [0, 0],
      "text-halo-color": "hsl(0, 0%, 100%)",
      "text-halo-width": 2,
      "text-color": "hsl(0, 0%, 0%)",
      "text-opacity": {
        "base": 1,
        "stops": [[15, 0], [15.1, 0.1], [15.2, 1]]
      }
    }
  },
  {
    "id": "stop-point",
    "type": "circle",
    "source": "stop",
    "filter": ["==", "$type", "Point"],
    "layout": {},
    "paint": {
      "circle-color": "yellow",
      "circle-stroke-color": "#222",
      "circle-stroke-width": {
        "stops": [
          [10, 1],
          [19, 3]
        ]
      },
      "circle-stroke-opacity": {
        "stops": [
          [8, 0],
          [8.1, 0.1],
          [13.2, 0.8]
        ]
      },
      "circle-opacity": 1,
      "circle-radius": {
        "stops": [
          [8, 3.5],
          [13, 3.5],
          [19, 12]
        ]
      }
    }
  },
  {
    "id": "stop-label",
    "type": "symbol",
    "source": "stop",
    "layout": {
      "text-line-height": 1,
      "text-size": {
        "base": 1,
        "stops": [
          [8, 7],
          [18, 15]
        ]
      },
      "text-allow-overlap": false,
      "text-ignore-placement": false,
      "text-font": ["Inter Semi Bold"],
      "text-justify": "center",
      "text-padding": 1,
      "text-offset": [0, 1],
      "text-anchor": "top",
      "text-field": ["get", "name"],
      "text-letter-spacing": -0.01,
      "text-max-width": 5
    },
    "paint": {
      "text-translate": [0, 0],
      "text-halo-color": "hsl(0, 0%, 100%)",
      "text-halo-width": 4,
      "text-color": "hsl(0, 0%, 0%)",
      "text-opacity": {
        "base": 1,
        "stops": [
          [8, 0],
          [8.1, 0.8],
          [15.2, 1]
        ]
      }
    }
  }
];

style.layers = style.layers.concat(stopLayers)

export default style;