import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useLiveQuery } from "dexie-react-hooks";
import { graphql } from "gatsby";
import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import AgencySlimHeader from "../components/AgencySlimHeader";
import StopHeader from "../components/StopHeader";
import StopMap from "../components/StopMap";
import StopPredictions from "../components/StopPredictions";
import StopTimesHere from "../components/StopTimesHere";
import { db } from "../db";
import {
  createAgencyData,
  createRouteData,
  getServiceDays
} from "../util";
dayjs.extend(relativeTime);

const Stop = ({ data, pageContext }) => {
  const favoriteStops = useLiveQuery(() => db.stops.toArray());

  let gtfsAgency = data.postgres.agencies[0];
  let sanityAgency = data.agency.edges.map((e) => e.node)[0];
  let agencyData = createAgencyData(gtfsAgency, sanityAgency);
  let { serviceCalendars } = agencyData.feedInfo;
  let serviceDays = getServiceDays(serviceCalendars);

  let { sanityRoutes } = data;

  let indexedStop = { ...data.postgres.stop[0] };
  indexedStop.agency = {
    agencySlug: agencyData.slug.current,
    agencyName: agencyData.name,
    feedIndex: agencyData.feedIndex,
  };

  let { stopLon, stopLat, stopName, stopCode, stopId, routes, times } =
    data.postgres.stop[0];

  let stopIdentifier =
    sanityAgency.stopIdentifierField === "stopId" ? stopId : stopCode;

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
          offset: [0, 2.2],
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
  }, [sanityAgency.realTimeEnabled]);

  // get stop route patterns
  const [patterns, setPatterns] = useState(null);
  useEffect(() => {
    fetch(
      `/.netlify/functions/patterns?agency=${
        sanityAgency.slug.current
      }&routeId=${routes.map((r) => r.routeShortName).join(",")}`
    )
      .then((r) => r.json())
      .then((d) => {
        setPatterns(d);
      });
  }, [sanityAgency.slug, routes]);

  // transit windsor-specific code: get stop code from API
  const [twStopCode, setTwStopCode] = useState(null);
  useEffect(() => {
    if (sanityAgency.slug.current !== "transit-windsor") return;
    else
      fetch(
        `/.netlify/functions/stoplist?stopId=${stopId}&agency=${sanityAgency.slug.current}`
      )
        .then((r) => r.json())
        .then((d) => {
          setTwStopCode(d[0].stopID);
        });
  }, [sanityAgency.slug, stopId]);

  useEffect(() => {
    if (!sanityAgency.realTimeEnabled) return;

    // transit windsor-specific code: assign new stop code from API
    // TODO: remove/abstract this
    let stopToFetch = stopCode;
    if (
      sanityAgency.slug.current === "transit-windsor" &&
      (!twStopCode || !patterns)
    ) {
      return;
    }
    if (
      sanityAgency.slug.current === "transit-windsor" &&
      twStopCode &&
      patterns
    ) {
      stopToFetch = twStopCode;
    }

    fetch(
      `/.netlify/functions/stop?stopId=${stopToFetch}&agency=${sanityAgency.slug.current}`
    )
      .then((r) => r.json())
      .then((d) => {
        // transit windsor-specific transformation code
        // TODO: remove/abstract this
        if (sanityAgency.slug.current === "transit-windsor") {
          let trips = [];
          d.grpByPtrn.forEach((ptrn) => {
            let matchingPattern = patterns.find(
              (r) => r.patternID === ptrn.patternId
            );
            if (!matchingPattern) return;
            ptrn.predictions.forEach((prd, idx) => {
              if (prd.predictionType !== "Predicted") return;
              let newPrd = {
                prd: dayjs(prd.predictTime),
                prdctdn: dayjs(prd.predictTime).diff(dayjs(), "minute"),
                rt: ptrn.routeCode,
                rtdir: matchingPattern.directionName,
                vid: `${ptrn.patternId}-${idx}`,
              };
              trips.push(newPrd);
            });
          });
          trips = trips
            .sort((a, b) => a.prdctdn > b.prdctdn)
            .filter((t) => t.prdctdn < 90);
          setPredictions(trips.slice(0, 7));
        }

        if (!d["bustime-response"]) return;

        // All other agencies are handled here
        if (d["bustime-response"].prd && d["bustime-response"].prd.length > 0) {
          setPredictions(d["bustime-response"].prd.slice(0, 7));
        } else {
          return;
        }
      });
  }, [now, twStopCode, patterns, sanityAgency.realTimeEnabled, sanityAgency.slug, stopCode]);

  useEffect(() => {
    if (!sanityAgency.realTimeEnabled || !predictions) return;
    if (sanityAgency.slug.current === "transit-windsor") return;
    fetch(
      `/.netlify/functions/vehicle?vehicleIds=${predictions
        .map((prd) => prd.vid)
        .join(",")}&agency=${sanityAgency.slug.current}`
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
  }, [predictions, sanityAgency.realTimeEnabled, sanityAgency.slug]);

  let [trackedBus, setTrackedBus] = useState(null);

  let isFavoriteStop =
    favoriteStops?.filter(
      (stop) =>
        stop.stopId === stopId &&
        stop.agency?.agencySlug === pageContext.agencySlug
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
      <div className="mt-4">
        <AgencySlimHeader agency={agencyData} />
      </div>
      <StopHeader
        favoriteStops={favoriteStops}
        agency={agencyData}
        indexedStop={indexedStop}
        isFavoriteStop={isFavoriteStop}
        stopName={stopName}
        stopIdentifier={stopIdentifier}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>

        {predictions && (
          <StopPredictions
            trackedBus={trackedBus}
            setTrackedBus={setTrackedBus}
            predictions={predictions}
            vehicles={vehicles}
            times={times}
            routes={routes}
            agency={agencyData}
            patterns={patterns}
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
        </div>
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
          stopIdentifierField
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
          displayShortName
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
            directionShape
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
