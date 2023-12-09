import { graphql } from "gatsby";
import MapboxGL from "mapbox-gl/dist/mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useRef, useState } from "react";
import Mapbox, { GeolocateControl, NavigationControl } from "react-map-gl";
import { useTheme } from "../hooks/ThemeContext";
import mapboxStyles from "../styles/styleFactory";
import { createRouteData } from "../util";
import { navigate } from "gatsby";
import bbox from "@turf/bbox";
import _ from "lodash";
import RouteHeader from "../components/RouteHeader";

const RegionMapPage = ({ data }) => {
  const { theme } = useTheme();
  
  let style = _.cloneDeep(mapboxStyles[theme]);

  let [routes, setRoutes] = useState([]);

  let sanityAgencies = data.allSanityAgency.edges.map((edge) => edge.node);
  let sanityRoutes = data.allSanityRoute.edges.map((edge) => edge.node);
  let gtfsAgencies = data.postgres.agencies;

  // filter out non-active gtfsAgencies/feeds
  // TODO: Don't pull these from the GraphQL query in the first place.
  let activeFeedIndices = sanityAgencies.map(
    (agency) => agency.currentFeedIndex
  );
  gtfsAgencies = gtfsAgencies.filter(
    (agency) => activeFeedIndices.indexOf(agency.feedIndex) > -1
  );

  // roll up all the gtfsRoutes into one
  let gtfsRoutes = gtfsAgencies
    .map((agency) => agency.routes)
    .reduce((acc, val) => acc.concat(val));

  // features container for the GeoJSON FeatureCollection
  let allRouteFeatures = [];

  // iterate through the Sanity routes
  sanityRoutes.forEach((sanityRoute) => {
    // match to the corresponding GTFS route
    let matching = gtfsRoutes.filter(
      (gr) =>
        gr.feedIndex === sanityRoute.agency.currentFeedIndex &&
        gr.routeShortName === sanityRoute.shortName
    );
    let routeData = createRouteData(matching[0], sanityRoute);

    // iterate through route directions
    routeData.directions.forEach((direction) => {
      // make a GeoJSON feature
      let feature = JSON.parse(direction.directionShape)[0];
      feature.properties = {
        feedIndex: routeData.feedIndex,
        routeShortName: routeData.displayShortName,
        displayShortName: routeData.displayShortName,
        routeLongName: routeData.routeLongName,
        routeColor: routeData.routeColor,
        routeTextColor: routeData.routeTextColor,
        tripCount: routeData.trips.totalCount,
        mapPriority: routeData.mapPriority,
        agencySlug: sanityRoute.agency.slug.current,
      };
      allRouteFeatures.push(feature);
    });
  });

  allRouteFeatures.sort(
    (a, b) => a.properties.tripCount > b.properties.tripCount
  );
  let routeFeatureCollection = {
    type: "FeatureCollection",
    features: allRouteFeatures,
  };

  let bboxFc = Object.assign({}, routeFeatureCollection);

  bboxFc.features = bboxFc.features.filter(ft => ft.properties.mapPriority < 4);

  const map = useRef();
  
  if (!theme) { return null; }

  let mapInitialBbox = bbox(bboxFc);

  if (routeFeatureCollection.features.length > 0) {
    style.sources.routes.data = routeFeatureCollection;
  }

  const handleClick = (e) => {
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
        `/${route.properties.agencySlug}/route/${route.properties.displayShortName}`
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

    if (map.current.getZoom() > 14) {
      let uniqueRoutes = _.uniqBy(routesOnMap, "properties.routeShortName")
        .map((r) => r.properties)
        .sort((a, b) => parseInt(a.routeShortName) > parseInt(b.routeShortName))
        .sort((a, b) => a.feedIndex > b.feedIndex);
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

  routes = routes.sort((a,b) => b.mapPriority < a.mapPriority)

  return (
    <div>
      <p className="grayHeader">Regional transit map</p>
      <div id="map" style={{ height: 550 }}>
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
        >
          <NavigationControl showCompass={false} />
          <GeolocateControl />
        </Mapbox>
      </div>

      <>
        <div className="grayHeader my-2">{`${
          routes.length > 0 ? routes.length : `No`
        } routes shown on the map`}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-2 md:px-0 max-h-screen overflow-auto">
          {routes.length > 0 ? (
            <>
              {routes.map((r) => (
                <RouteHeader
                  {...r}
                  agency={{ slug: { current: r.agencySlug } }}
                />
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
    </div>
  );
};

export const query = graphql`
  query RegionMapQuery {
    postgres {
      agencies: agenciesList {
        agencyName
        agencyUrl
        agencyTimezone
        agencyLang
        agencyPhone
        agencyFareUrl
        agencyEmail
        bikesPolicyUrl
        feedIndex
        agencyId
        routes: routesByFeedIndexAndAgencyIdList(
          orderBy: ROUTE_SORT_ORDER_ASC
        ) {
          feedIndex
          routeShortName
          routeLongName
          routeColor
          routeTextColor
          routeSortOrder
          implicitSort
          trips: tripsByFeedIndexAndRouteId {
            totalCount
          }
        }
        feedInfo: feedInfoByFeedIndex {
          serviceCalendars: calendarsByFeedIndexList {
            sunday
            thursday
            tuesday
            wednesday
            monday
            friday
            saturday
            serviceId
          }
        }
      }
    }
    allSanityRoute {
      edges {
        node {
          longName
          shortName
          displayShortName
          agency {
            currentFeedIndex
            slug {
              current
            }
          }
          routeColor: color {
            hex
          }
          routeTextColor: textColor {
            hex
          }
          directions: extRouteDirections {
            directionHeadsign
            directionDescription
            directionId
            directionTimepoints
            directionShape
          }
          mapPriority
        }
      }
    }
    allSanityAgency {
      edges {
        node {
          name
          currentFeedIndex
          color {
            hex
          }
          textColor {
            hex
          }
          slug {
            current
          }
          description: _rawDescription
        }
      }
    }
  }
`;

export default RegionMapPage;
