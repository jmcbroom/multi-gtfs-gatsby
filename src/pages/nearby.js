import { graphql } from "gatsby";
import _ from "lodash";
import MapboxGL from "mapbox-gl/dist/mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useEffect, useRef, useState } from "react";
import Mapbox, { NavigationControl } from "react-map-gl";
import { useTheme } from "../hooks/ThemeContext";
import mapboxStyles from "../styles/styleFactory";
import { createAgencyData, createAllStopsFc, createRouteData } from "../util";
import NearbyPredictions from "../components/NearbyPredictions";

const NearbyPage = ({ data }) => {
  const { theme } = useTheme();

  let style = _.cloneDeep(mapboxStyles[theme]);

  let [routes, setRoutes] = useState([]);
  let [stops, setStops] = useState(null);

  // get the user's position
  let [position, setPosition] = useState(null);

  // Get predictions for nearby stops
  let [predictions, setPredictions] = useState(null);
  let [trackedBus, setTrackedBus] = useState(null);

  // set up a 10s 'tick' using `now`
  let [now, setNow] = useState(new Date());

  useEffect(() => {
    let tick = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (stops) {
      let ddotStops = stops["ddot"]
        ?.slice(0, 10)
        .map((s) => s.properties.stopCode)
        .join(",");
      let smartStops = stops["smart"]
        ?.slice(0, 10)
        .map((s) => s.properties.stopCode)
        .join(",");
      let therideStops = stops["theride"]
        ?.slice(0, 10)
        .map((s) => s.properties.stopCode)
        .join(",");
      let fetches = [];
      let agencies = []
      if (stops.ddot?.length > 0) {
        fetches.push(
          fetch(
            `/.netlify/functions/stop?stopId=${ddotStops}&agency=ddot`
          ).then((r) => r.json())
        );
        agencies.push(24)
      }
      if (stops.smart?.length > 0) {
        fetches.push(
          fetch(
            `/.netlify/functions/stop?stopId=${smartStops}&agency=smart`
          ).then((r) => r.json())
        );
        agencies.push(25)
      }
      if (stops.theride?.length > 0) {
        fetches.push(
          fetch(
            `/.netlify/functions/stop?stopId=${therideStops}&agency=theride`
          ).then((r) => r.json())
        );
        agencies.push(27)
      }
      Promise.all(fetches).then((r) => {
        r.forEach((agency, idx) => {
          agency["bustime-response"].prd?.forEach((prediction) => {
            prediction.agency = agencies[idx];
          });
        });
    
        setPredictions(
          _.groupBy(
            r.map((response) => response["bustime-response"].prd).flat(),
            "vid"
          )
        );
      });
    }
  }, [now, stops]);

  let sanityAgencies = data.allSanityAgency.edges.map((edge) => edge.node);
  let gtfsAgencies = data.postgres.agencies;
  let combinedAgencies = sanityAgencies.map((sanityAgency) => {
    let gtfsAgency = gtfsAgencies.find(
      (agency) => agency.feedIndex === sanityAgency.currentFeedIndex
    );
    return createAgencyData(gtfsAgency, sanityAgency);
  });

  let sanityRoutes = data.allSanityRoute.edges.map((edge) => edge.node);
  let { allStops } = data.postgres;
  let allStopsFc = createAllStopsFc({ allStops, agencies: sanityAgencies });

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

  let allRoutes = [];
  // iterate through the Sanity routes
  sanityRoutes.forEach((sanityRoute) => {
    // match to the corresponding GTFS route
    let matching = gtfsRoutes.filter(
      (gr) =>
        gr.feedIndex === sanityRoute.agency.currentFeedIndex &&
        gr.routeShortName === sanityRoute.shortName
    );
    let routeData = createRouteData(matching[0], sanityRoute);
    allRoutes.push(routeData);

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

  const map = useRef();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setPosition([position.coords.longitude, position.coords.latitude]);
        map.current.easeTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 15.75,
        });
      });
    }
  }, []);

  if (!theme) {
    return null;
  }

  if (routeFeatureCollection.features.length > 0) {
    style.sources.routes.data = routeFeatureCollection;
  }
  if (allStopsFc.features.length > 0) {
    style.sources.stops.data = allStopsFc;
  }

  const handleClick = (e) => {};

  const handleMouseEnter = () => {
    map.current.getCanvas().style.cursor = "pointer";
  };

  const handleMouseLeave = () => {
    map.current.getCanvas().style.cursor = "";
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

    let stopsOnMap = map.current.queryRenderedFeatures({
      layers: ["stops-points"],
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

    if (map.current.getZoom() > 15.5) {
      let uniqueStops = _.uniqBy(stopsOnMap, "properties.stopCode");
      setStops(_.groupBy(uniqueStops, "properties.agencySlug"));
      if (!predictions) {
        setNow(new Date());
      }
    } else {
      setStops([]);
    }
  };

  const initialViewState = {
    center: position,
    fitBoundsOptions: {
      padding: 50,
      maxZoom: 17,
    },
  };

  // routes = routes.sort((a, b) => b.mapPriority < a.mapPriority);

  return (
    <div>
      <h2 className="grayTitle">Near your location</h2>
      <div className="md:grid md:grid-cols-2 gap-2">
        <NearbyPredictions
          agencies={combinedAgencies}
          predictions={predictions}
          routes={allRoutes}
          position={position}
          stops={stops}
          allStops={allStopsFc}
          setTrackedBus={setTrackedBus}
        />
        <div id="map" style={{ height: 450 }}>
          <div className="grayHeader">Your general location</div>
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
          </Mapbox>
        </div>
      </div>
    </div>
  );
};

export const query = graphql`
  query NearbyQuery {
    postgres {
      allStops: stopsList(filter: { feedIndex: { in: [24, 25, 27] } }) {
        stopLat
        stopLon
        stopName
        stopId
        stopCode
        feedIndex
      }
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
          realTimeEnabled
        }
      }
    }
  }
`;

export default NearbyPage;
