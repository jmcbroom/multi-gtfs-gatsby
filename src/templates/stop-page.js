import { graphql } from "gatsby";
import React, { useEffect, useState } from "react";
import AgencySlimHeader from "../components/AgencySlimHeader";
import StopMap from "../components/StopMap";
import StopPredictions from "../components/StopPredictions";
import { Helmet } from "react-helmet";
import StopTimesHere from "../components/StopTimesHere";
import {
  createAgencyData,
  createRouteData,
  getServiceDays,
  getTripsByServiceDay,
} from "../util";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const addFavoriteStop = (stop) => {
  db.stops.add(stop);
};

const removeFavoriteStop = (stopToRemove, favoriteStops) => {
  let stopIdsToRemove = favoriteStops
    .filter((stop) => stop.stopId === stopToRemove.stopId && stop.agency.agencySlug === stopToRemove.agency.agencySlug)
    .map((s) => s.id);
  stopIdsToRemove.forEach((id) => {
    db.stops.delete(id);
  });
};

const Stop = ({ data, pageContext }) => {
  const favoriteStops = useLiveQuery(() => db.stops.toArray());

  let gtfsAgency = data.postgres.agencies[0];
  let sanityAgency = data.agency.edges.map((e) => e.node)[0];
  let agencyData = createAgencyData(gtfsAgency, sanityAgency);
  let { serviceCalendars } = agencyData.feedInfo;
  let serviceDays = getServiceDays(serviceCalendars);

  let { sanityRoutes } = data;

  let indexedStop = {...data.postgres.stop[0]};
  indexedStop.agency = { agencySlug: agencyData.slug.current, agencyName: agencyData.name, feedIndex: agencyData.feedIndex };
  console.log(indexedStop)

  let { stopLon, stopLat, stopName, stopCode, stopId, routes, times } = data.postgres.stop[0];

  let stopIdentifier = pageContext.agencySlug === "ddot" ? stopCode : stopId;

  let [currentRoute, setCurrentRoute] = useState(routes[0]);

  let tripsByServiceDay = getTripsByServiceDay(
    times.map((time) => time.trip),
    serviceDays
  );

  console.log(favoriteStops);

  routes.forEach((r) => {
    // find the matching sanityRoute
    let matching = sanityRoutes.edges
      .map((e) => e.node)
      .filter((sr) => sr.shortName === r.routeShortName);

    // let's override the route attributes with those from Sanity
    if (matching.length === 1) {
      r = createRouteData(r, matching[0]);
    }
  });

  routes = routes
    .sort((a, b) => parseInt(a.routeShortName) > parseInt(b.routeShortName))
    .sort((a, b) => a.mapPriority > b.mapPriority);

  const stopFc = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [stopLon, stopLat],
        },
        properties: {
          name: stopName,
          code: stopIdentifier,
        },
      },
    ],
  };

  // set up a 10s 'tick' using `now`
  let [now, setNow] = useState(new Date());
  const [predictions, setPredictions] = useState(null);
  const [vehicles, setVehicles] = useState(null);

  useEffect(() => {
    if (!sanityAgency.realTimeEnabled) return;
    let tick = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!sanityAgency.realTimeEnabled) return;
    fetch(
      `/.netlify/functions/stop?stopId=${stopCode}&agency=${pageContext.agencySlug}`
    )
      .then((r) => r.json())
      .then((d) => {
        if (d["bustime-response"].prd && d["bustime-response"].prd.length > 0) {
          setPredictions(d["bustime-response"].prd.slice(0, 7));
        } else {
          return;
        }
      });
  }, [now]);

  useEffect(() => {
    if (!sanityAgency.realTimeEnabled || !predictions) return;
    fetch(
      `/.netlify/functions/vehicle?vehicleIds=${predictions
        .map((prd) => prd.vid)
        .join(",")}&agency=${pageContext.agencySlug}`
    )
      .then((r) => r.json())
      .then((d) => {
        if (
          d["bustime-response"].vehicle &&
          d["bustime-response"].vehicle.length > 0
        ) {
          setVehicles(d["bustime-response"].vehicle);
        } else {
          return;
        }
      });
  }, [predictions]);

  let [trackedBus, setTrackedBus] = useState(null);

  let isFavoriteStop =
    favoriteStops?.filter(
      (stop) =>
        stop.stopId === stopId && stop.agency?.agencySlug === pageContext.agencySlug
    ).length > 0;

  return (
    <div>
      <Helmet>
        <title>{`${agencyData.name} bus stop: ${stopName} (#${stopIdentifier})`}</title>
        <meta
          property="og:url"
          content={`https://transit.det.city/${pageContext.agencySlug}/stop/${stopIdentifier}/`}
        />
        <meta property="og:type" content={`website`} />
        <meta
          property="og:title"
          content={`${agencyData.name} bus stop: ${stopName} (#${stopIdentifier})`}
        />
        <meta
          property="og:description"
          content={`${agencyData.name} bus stop: ${stopName} (#${stopIdentifier})`}
        />
      </Helmet>
      <AgencySlimHeader agency={agencyData} />
      <div className="mb-2 bg-gray-200 dark:bg-zinc-900 p-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl -mb-1">{stopName}</h1>
          <span className="text-sm text-gray-500 dark:text-zinc-500 m-0">
            stop #{pageContext.agencySlug === "ddot" ? stopCode : stopId}
          </span>
        </div>
        <div className="mx-2">
          <FontAwesomeIcon
            icon={faStar}
            size="lg"
            className={isFavoriteStop ? "text-yellow-500" : "text-gray-400"}
            onClick={() => {
              if (isFavoriteStop === false) {
                addFavoriteStop(indexedStop);
              } else {
                removeFavoriteStop(
                  indexedStop,
                  favoriteStops
                );
              }
            }}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {predictions && (
          <StopPredictions
            trackedBus={trackedBus}
            setTrackedBus={setTrackedBus}
            predictions={predictions}
            vehicles={vehicles}
            times={times}
            routes={routes}
            agency={agencyData}
          />
        )}
        <StopMap
          agency={agencyData}
          stopFc={stopFc}
          routes={routes}
          times={times}
          trackedBus={trackedBus}
          predictions={predictions}
          vehicles={vehicles}
        />
        <StopTimesHere
          times={times}
          routes={routes}
          agency={agencyData}
          serviceDays={serviceDays}
        />
      </div>
    </div>
  );
};

export const query = graphql`
  query StopQuery($feedIndex: Int, $sanityFeedIndex: Float, $stopId: String) {
    agency: allSanityAgency(
      filter: { currentFeedIndex: { eq: $sanityFeedIndex } }
    ) {
      edges {
        node {
          name
          fullName
          id
          realTimeEnabled
          color {
            hex
          }
          textColor {
            hex
          }
          slug {
            current
          }
        }
      }
    }
    sanityRoutes: allSanityRoute(
      filter: { agency: { currentFeedIndex: { eq: $sanityFeedIndex } } }
    ) {
      edges {
        node {
          longName
          shortName
          color {
            hex
          }
          textColor {
            hex
          }
          mapPriority
          directions: extRouteDirections {
            directionHeadsign
            directionDescription
            directionId
            directionTimepoints
          }
        }
      }
    }
    postgres {
      agencies: agenciesList(condition: { feedIndex: $feedIndex }) {
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
        routes: routesByFeedIndexAndAgencyIdList {
          routeShortName
          routeLongName
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
      stop: stopsList(
        filter: {
          feedIndex: { equalTo: $feedIndex }
          stopId: { equalTo: $stopId }
        }
      ) {
        stopId
        stopCode
        stopName
        stopLat
        stopLon
        routes: routesList {
          routeShortName
          routeLongName
          routeColor
          routeTextColor
        }
        nearby: nearbyStopsList {
          stopId
          stopName
          stopLat
          stopLon
          routes: routesList {
            routeShortName
            routeLongName
            routeColor
            routeTextColor
          }
        }
        times: stopTimesByFeedIndexAndStopIdList(orderBy: ARRIVAL_TIME_ASC) {
          trip: tripByFeedIndexAndTripId {
            tripId
            route: routeByFeedIndexAndRouteId {
              routeColor
              routeTextColor
              routeShortName
              routeLongName
              agencyId
            }
            directionId
            serviceId
            tripHeadsign
            stopTimesByFeedIndexAndTripId {
              totalCount
            }
          }
          stopSequence
          arrivalTime {
            hours
            minutes
            seconds
          }
        }
      }
    }
  }
`;

export default Stop;
