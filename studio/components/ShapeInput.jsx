import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import { PatchEvent, FormField, set, unset } from "sanity";
import bbox from "@turf/bbox";
import { Map, mapboxgl, FullscreenControl } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useEffect } from "react";

const detroitBbox = [-83.287803, 42.255192, -82.910451, 42.45023];

const ShapeInput = React.forwardRef((props, ref) => {
  const {
    onChange,
    schemaType,
    compareValue,
    value,
    markers,
    presence
  } = props;

  const writeGeometry = React.useCallback(
    (geometry) => {
      const inputValue = JSON.stringify(geometry);
      onChange(PatchEvent.from(inputValue ? set(inputValue) : unset()));
    },
    [onChange]
  );

  useEffect(() => {
      let fc = null;
      if (value && JSON.parse(value).length > 0) {
        fc = {
          type: "FeatureCollection",
          features: JSON.parse(value),
        };
      }
      const accessToken = "pk.eyJ1Ijoiam1jYnJvb20iLCJhIjoianRuR3B1NCJ9.cePohSx5Od4SJhMVjFuCQA";

      let map = new Map({
        container: "map",
        style: "mapbox://styles/jmcbroom/cktr8i2jc1vby19qdjbtlvhwg",
        bounds: fc ? bbox(fc) : detroitBbox,
        fitBoundsOptions: {
          padding: 50,
        },
        accessToken: accessToken,
      });

      let Draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          line_string: true,
          trash: true,
        },
      });

      map.addControl(Draw, "bottom-left");

      // Add the control to the map.
      map.addControl(
        new MapboxGeocoder({
          accessToken: accessToken,
          mapboxgl: mapboxgl,
          bbox: detroitBbox
        })
      );
      map.addControl(new FullscreenControl(), "top-left");
      map.on("load", () => {
        if (fc) {
          Draw.set(fc);
        }

        map.on("draw.create", (e) => {
          let drawFc = Draw.getAll();
          writeGeometry(drawFc.features);
          if (drawFc.features[0].geometry.type === "Polygon") {
            map.fitBounds(bbox(drawFc), { padding: 20, maxZoom: 17 });
          }
        });
        map.on("draw.update", (e) => {
          let drawFc = Draw.getAll();
          writeGeometry(drawFc.features);
        });
        map.on("draw.delete", (e) => {
          let drawFc = Draw.getAll();
          writeGeometry(drawFc.features);
        });
      });
  }, []);

  return (
    <>
      <FormField
        compareValue={compareValue}
        __unstable_markers={markers}
        __unstable_presence={presence}
      >
        <div id="map" style={{ height: 500 }}></div>
        <input type="text" placeholder="Enter text" value={value} onChange={(e) => onChange(PatchEvent.from(set(e.target.value)))} />
      </FormField>
    </>
  );
});

export default ShapeInput;
