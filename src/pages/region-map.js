import { graphql } from "gatsby";
import MapboxGL from "mapbox-gl/dist/mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useRef, useState } from "react";
import Mapbox, { GeolocateControl, NavigationControl } from "react-map-gl";
import mapboxStyle from "../styles/mapbox.json";
import { createRouteData } from "../util";
import bbox from "@turf/bbox";
import _ from "lodash";
import RouteHeader from "../components/RouteHeader";

const RegionMapPage = ({ data }) => {
  let [routes, setRoutes] = useState([]);

  let sanityAgencies = data.allSanityAgency.edges.map((edge) => edge.node);
  let sanityRoutes = data.allSanityRoute.edges.map((edge) => edge.node);
  let gtfsAgencies = data.postgres.agencies;

  // filter out non-active gtfsAgencies/feeds
  // TODO: Don't pull these from the GraphQL query in the first place.
  let activeFeedIndices = sanityAgencies.map((agency) => agency.currentFeedIndex);
  gtfsAgencies = gtfsAgencies.filter((agency) => activeFeedIndices.indexOf(agency.feedIndex) > -1);

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
        gr.feedIndex == sanityRoute.agency.currentFeedIndex &&
        gr.routeShortName == sanityRoute.shortName
    );
    let routeData = createRouteData(matching[0], sanityRoute);

    // iterate through route directions
    routeData.directions.forEach((direction) => {
      // make a GeoJSON feature
      let feature = JSON.parse(direction.directionShape)[0];
      feature.properties = {
        feedIndex: routeData.feedIndex,
        routeShortName: routeData.routeShortName,
        routeLongName: routeData.routeLongName,
        routeColor: routeData.routeColor,
        routeTextColor: routeData.routeTextColor,
        tripCount: routeData.trips.totalCount,
        feedIndex: sanityRoute.agency.currentFeedIndex,
        agencySlug: sanityRoute.agency.slug.current,
      };
      allRouteFeatures.push(feature);
    });
  });

  allRouteFeatures.sort((a, b) => a.properties.tripCount > b.properties.tripCount);
  let routeFeatureCollection = {
    type: "FeatureCollection",
    features: allRouteFeatures,
  };

  const map = useRef();

  let mapInitialBbox = bbox(routeFeatureCollection);

  if (routeFeatureCollection.features.length > 0) {
    mapboxStyle.sources.routes.data = routeFeatureCollection;
  }

  const handleClick = (e) => {
    let routesClicked = map.current.queryRenderedFeatures(e.point, {
      layers: ["routes-case"],
    });
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
      ).sort((a, b) => parseInt(a.routeShortName) > parseInt(b.routeShortName)).sort((a, b) => a.feedIndex > b.feedIndex);
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
    <div>
      <p className="underline-title">Regional transit map</p>
      <div id="map" style={{ height: 450 }}>
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
          interactiveLayerIds={["routes-case"]}
        >
          <NavigationControl showCompass={false} />
          <GeolocateControl />
        </Mapbox>
      </div>

      {routes.length > 0 && (
        <>
          <p className="underline-title">Routes in the map view</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 px-2 md:px-0 max-h-screen overflow-auto">
            {routes.map((r) => (
              <RouteHeader {...r} agency={{ slug: { current: r.agencySlug } }} />
            ))}
          </div>
        </>
      )}
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
        routes: routesByFeedIndexAndAgencyIdList(orderBy: ROUTE_SORT_ORDER_ASC) {
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