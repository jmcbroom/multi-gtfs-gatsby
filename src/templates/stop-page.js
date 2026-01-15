import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useLiveQuery } from "dexie-react-hooks";
import { graphql } from "gatsby";
import React, { useEffect, useState, useMemo } from "react";
import { useTick } from "../hooks/useTick";
import AgencySlimHeader from "../components/AgencySlimHeader";
import StopHeader from "../components/StopHeader";
import StopMap from "../components/StopMap";
import StopPredictions from "../components/StopPredictions";
import StopRouteSelector from "../components/StopRouteSelector";
import StopTimesHere from "../components/StopTimesHere";
import StopAccessibility from "../components/StopAccessibility";
import StopTransfers from "../components/StopTransfers";
import NearbyBikeshare from "../components/NearbyBikeshare";
import { db } from "../db";
import { createAgencyData, createRouteData, getServiceDays } from "../util";
import { getStopIdentifier } from "../stopUtils";
import { useSanityRoutes } from "../hooks/useSanityRoutes";
import { useSanityAgencies } from "../hooks/useSanityAgencies";
dayjs.extend(relativeTime);


const Stop = ({ data, pageContext }) => {
  const favoriteStops = useLiveQuery(() => db?.stops?.toArray());

  let { sanityAgencies } = useSanityAgencies();

  let gtfsAgency = data.postgres.agencies[0];
  let sanityAgency = sanityAgencies.edges.map(e => e.node).filter(a => pageContext.agencySlug === a.slug.current)[0];
  let agencyData = createAgencyData(gtfsAgency, sanityAgency);
  let { serviceCalendars } = agencyData.feedInfo;
  let serviceDays = getServiceDays(serviceCalendars);

  const { sanityRoutes } = useSanityRoutes();

  let indexedStop = { ...data.postgres.stop[0] };

  delete indexedStop.times;
  
  indexedStop.agency = {
    agencySlug: agencyData.slug.current,
    agencyName: agencyData.name,
    feedIndex: agencyData.feedIndex,
  };

  let { stopLon, stopLat, stopName, stopCode, stopId, routes: rawRoutes, times: rawTimes } =
    data.postgres.stop[0];

  // Filter out route 1000 from times
  let times = rawTimes.filter(t => t.trip?.route?.routeShortName !== '1000');

  let stopIdentifier = getStopIdentifier({ stopId, stopCode }, sanityAgency);

  // Memoize routes processing to avoid overfetching
  const routes = useMemo(() => {
    return rawRoutes.filter(r => r.routeShortName !== '1000').map((r) => {
      // find the matching sanityRoute
      let matching = sanityRoutes.edges
        .map((e) => e.node)
        .filter((sr) => sr.shortName === r.routeShortName && sr.agency.currentFeedIndex === agencyData.feedIndex);

      // let's override the route attributes with those from Sanity
      if (matching.length === 1) {
        r = createRouteData(r, matching[0]);
      }

      // find in trip directions
      let matchingDirection = indexedStop.tripDirections.find(
        (td) => td.routeId === r.routeShortName
      );
      if (matchingDirection && r.directions) {
        r.directions = r.directions.filter((d) => d.directionId === matchingDirection.directionId);
        if (r.directions[0]) {
          r.directions[0].tripCount = matchingDirection.tripCount;
        }
      }

      return r;
    })
    .sort((a, b) => parseInt(a.routeShortName) > parseInt(b.routeShortName))
    .sort((a, b) => a.mapPriority > b.mapPriority);
  }, [rawRoutes, sanityRoutes.edges, agencyData.feedIndex, indexedStop.tripDirections]);

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

  const { now } = useTick(sanityAgency.realTimeEnabled);
  const [predictions, setPredictions] = useState(null);
  const [vehicles, setVehicles] = useState(null);

  // get stop route patterns
  const [patterns, setPatterns] = useState(null);
  const agencySlug = sanityAgency.slug.current;
  useEffect(() => {
    fetch(
      `/.netlify/functions/patterns?agency=${agencySlug}&routeId=${routes.map((r) => r.routeShortName).join(",")}`
    )
      .then((r) => r.json())
      .then((d) => {
        setPatterns(d);
      });
  }, [agencySlug, routes]);

  // transit windsor-specific code: get stop code from API
  const [twStopCode, setTwStopCode] = useState(null);
  useEffect(() => {
    if (agencySlug !== "transit-windsor") return;
    fetch(
      `/.netlify/functions/stoplist?stopId=${stopId}&agency=${agencySlug}`
    )
      .then((r) => r.json())
      .then((d) => {
        setTwStopCode(d[0].stopID);
      });
  }, [agencySlug, stopId]);

  const realTimeEnabled = sanityAgency.realTimeEnabled;
  useEffect(() => {
    if (!realTimeEnabled) return;

    // transit windsor-specific code: assign new stop code from API
    // TODO: remove/abstract this
    let stopToFetch = stopCode;
    if (agencySlug === "transit-windsor" && (!twStopCode || !patterns)) {
      return;
    }
    if (agencySlug === "transit-windsor" && twStopCode && patterns) {
      stopToFetch = twStopCode;
    }

    fetch(
      `/.netlify/functions/stop?stopId=${stopToFetch}&agency=${agencySlug}`
    )
      .then((r) => r.json())
      .then((d) => {
        // transit windsor-specific transformation code
        // TODO: remove/abstract this
        if (agencySlug === "transit-windsor") {
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
  }, [
    now,
    twStopCode,
    patterns,
    realTimeEnabled,
    agencySlug,
    stopCode,
  ]);

  useEffect(() => {
    if (!realTimeEnabled || !predictions) return;
    if (agencySlug === "transit-windsor") return;
    fetch(
      `/.netlify/functions/vehicle?vehicleIds=${predictions
        .map((prd) => prd.vid)
        .join(",")}&agency=${agencySlug}`
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
  }, [predictions, realTimeEnabled, agencySlug]);

  let [trackedBus, setTrackedBus] = useState(null);
  let [selectedRoute, setSelectedRoute] = useState(
    routes.length === 1 ? routes[0].routeShortName : null
  );

  let isFavoriteStop =
    favoriteStops?.filter(
      (stop) =>
        stop.stopId === stopId &&
        stop.agency?.agencySlug === pageContext.agencySlug
    ).length > 0;

  return (
    <div>
      <AgencySlimHeader agency={agencyData} />
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
          <StopMap
            agency={agencyData}
            stopFc={stopFc}
            routes={routes}
            times={times}
            trackedBus={trackedBus}
            predictions={predictions}
            vehicles={vehicles}
            selectedRoute={selectedRoute}
          />
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
              setSelectedRoute={setSelectedRoute}
              now={now}
            />
          )}
        </div>
        <div>
          <StopRouteSelector
            routes={routes}
            agency={agencyData}
            selectedRoute={selectedRoute}
            setSelectedRoute={setSelectedRoute}
          />
          <StopTimesHere
            times={times}
            routes={routes}
            agency={agencyData}
            serviceDays={serviceDays}
            selectedRoute={selectedRoute}
          />
          <StopTransfers stop={indexedStop} nearbyStops={indexedStop.nearby} routes={sanityRoutes.edges.map(e => e.node)} agencies={sanityAgencies.edges.map(e => e.node)} />
          <NearbyBikeshare nearbyBikeshare={pageContext.nearbyBikeshare} />
          {["ddot", "smart"].indexOf(agencyData.slug.current) > -1 && (
            <StopAccessibility stop={indexedStop} />
          )}
        </div>
      </div>
    </div>
  );
};

export const query = graphql`
  query StopQuery($feedIndex: Int, $stopId: String, $agencySlug: String) {
    agency: sanityAgency(slug: { current: { eq: $agencySlug } }) {
      name
    }
    allSanityAgency {
      edges {
        node {
          name
          currentFeedIndex
        }
      }
    }
    allSanityBikeshare {
      edges {
        node {
          name
          slug {
            current
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
            startDate
            endDate
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
        tripDirections: tripDirectionsList {
          routeId
          directionId
          tripCount
        }
        nearby: nearbyStopsList {
          feedIndex
          stopId
          stopCode
          stopName
          stopLat
          stopLon
          tripDirections: tripDirectionsList {
            routeId
            directionId
            tripCount
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

export const Head = ({ data, pageContext }) => {
  const stop = data.postgres?.stop?.[0];
  const stopName = stop?.stopName || "";
  const stopIdentifier = stop?.stopCode || stop?.stopId || "";
  const agencyName = data.agency?.name || "";
  const routes = stop?.routes || [];
  const nearbyStops = stop?.nearby || [];
  const nearbyBikeshare = pageContext.nearbyBikeshare;
  const allAgencies = data.allSanityAgency?.edges?.map(e => e.node) || [];
  const allBikeshare = data.allSanityBikeshare?.edges?.map(e => e.node) || [];

  // OG image URL is computed at build time in gatsby-node.js
  const ogImageUrl = pageContext.ogImageUrl;

  // Build description with routes served
  let description = `${agencyName} bus stop at ${stopName}`;

  if (routes.length > 0) {
    const routeNumbers = routes.map(r => `${r.routeShortName} ${r.routeLongName}`).slice(0, 5);
    if (routes.length <= 5) {
      description += `, served by route${routes.length > 1 ? "s" : ""} ${routeNumbers.join(", ")}.`;
    } else {
      description += `, served by routes ${routeNumbers.join(", ")}, and ${routes.length - 5} more.`;
    }
  }

  // List transfers to other agencies with specific routes
  const currentFeedIndex = pageContext.feedIndex;
  const transfersByAgency = {};

  nearbyStops
    .forEach(s => {
      const agency = allAgencies.find(a => a.currentFeedIndex === s.feedIndex);
      if (!agency) return;

      if (!transfersByAgency[agency.name]) {
        transfersByAgency[agency.name] = new Set();
      }

      // Ignore transfer to same routes (only for OG description)
      if (s.feedIndex === currentFeedIndex) {
        return;
      }

      // Add routes from this stop's tripDirections (for display on page, but skip in OG description)
      if (s.feedIndex !== currentFeedIndex) {
        s.tripDirections?.forEach(td => {
          transfersByAgency[agency.name].add(td.routeId);
        });
      }
      s.tripDirections?.forEach(td => {
        transfersByAgency[agency.name].add(td.routeId);
      });
    });

  const transferParts = Object.entries(transfersByAgency)
    .map(([agencyName, routeSet]) => {
      const routeList = [...routeSet].sort((a, b) => {
        const aNum = parseInt(a) || 999;
        const bNum = parseInt(b) || 999;
        return aNum - bNum;
      }).slice(0, 4);
      if (routeList.length === 0) {
        return;
      }

      if (routeList.length > 0) {
        return `${agencyName} ${routeList.join(", ")}`;
      }
      return agencyName;
    })
    .filter(Boolean);

  // Add bikeshare to transfers if nearby
  if (nearbyBikeshare) {
    const bikeshare = allBikeshare.find(b => b.slug?.current === nearbyBikeshare.bikeshareSlug);
    const bikeshareName = bikeshare?.name || "bikeshare";
    transferParts.push(bikeshareName);
  }

  if (transferParts.length > 0) {
    description += ` Nearby transfer to ${transferParts.join(" and ")}.`;
  }

  const title = `${agencyName} stop: ${stopName} (#${stopIdentifier}) | transit.det.city`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:url" content={`https://transit.det.city/${pageContext.agencySlug}/stop/${stopIdentifier}/`} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {ogImageUrl && <meta property="og:image" content={ogImageUrl} />}
      {ogImageUrl && <meta property="og:image:width" content="1200" />}
      {ogImageUrl && <meta property="og:image:height" content="630" />}
      <link rel="canonical" href={`https://transit.det.city/${pageContext.agencySlug}/stop/${stopIdentifier}/`} />
    </>
  );
};
