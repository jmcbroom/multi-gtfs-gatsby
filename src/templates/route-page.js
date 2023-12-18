import * as Tabs from "@radix-ui/react-tabs";
import { graphql, Link } from "gatsby";
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import AgencySlimHeader from "../components/AgencySlimHeader";
import DirectionPicker from "../components/DirectionPicker";
import RouteHeader from "../components/RouteHeader";
import RouteIntroduction from "../components/RouteIntroduction";
import RouteMap from "../components/RouteMap";
import RouteStopsList from "../components/RouteStopsList";
import RouteTimeTable from "../components/RouteTimeTable";
import ServicePicker from "../components/ServicePicker";
import RoutePredictions from "../components/RoutePredictions";

import "../styles/tabs.css";
import {
  createAgencyData,
  createRouteData,
  createRouteFc,
  createStopsFc,
  createVehicleFc,
  dayOfWeek,
  getHeadsignsByDirectionId,
  getServiceDays,
  getTripsByServiceAndDirection,
  getTripsByServiceDay,
} from "../util";

const Route = ({ data, pageContext }) => {
  let gtfsAgency = data.postgres.agencies[0];
  let sanityAgency = data.agency;
  let agencyData = createAgencyData(gtfsAgency, sanityAgency);

  let gtfsRoute = data.postgres.routes[0];
  let sanityRoute = data.route;

  if (sanityRoute) {
    gtfsRoute.routeLongName = sanityRoute.longName;
    gtfsRoute.routeColor = sanityRoute.color.hex;
    gtfsRoute.routeTextColor = sanityRoute.textColor.hex;
  }

  let { trips, longTrips } = gtfsRoute;
  let { serviceCalendars } = agencyData.feedInfo;

  sanityRoute.directions.forEach((dir, idx) => {
    // get timepoints for each direction
    let timepoints = dir.directionTimepoints;
    // set timepoint = 1 for each stopTime that is a timepoint
    trips.forEach((trip) => {
      trip.stopTimes[0].timepoint = 1;
      trip.stopTimes.forEach((st, idx) => {
        if (timepoints.includes(st.stop[agencyData.stopIdentifierField])) {
          st.timepoint = 1;
        }
      });
      trip.stopTimes[trip.stopTimes.length - 1].timepoint = 1;
    });

    longTrips.forEach((trip) => {
      trip.stopTimes[0].timepoint = 1;
      trip.stopTimes.forEach((st, idx) => {
        if (timepoints.includes(st.stop[agencyData.stopIdentifierField])) {
          st.timepoint = 1;
        }
      });
      trip.stopTimes[trip.stopTimes.length - 1].timepoint = 1;
    });
  });

  let serviceDays = getServiceDays(
    serviceCalendars.filter((sc) =>
      data.agency.serviceIds.includes(sc.serviceId)
    )
  );
  let tripsByServiceDay = getTripsByServiceDay(trips, serviceDays);
  let headsignsByDirectionId = getHeadsignsByDirectionId(trips, sanityRoute);
  let tripsByServiceAndDirection = getTripsByServiceAndDirection(
    trips,
    serviceDays,
    headsignsByDirectionId
  );

  if (sanityRoute) {
    sanityRoute.directions.forEach((dir, idx) => {
      if (dir.directionHeadsign) {
        headsignsByDirectionId[dir.directionId][0] = dir.directionHeadsign;
      }
    });
    sanityRoute.mapPriority = 2;
  }

  let routeData = createRouteData(gtfsRoute, sanityRoute);
  const [direction, setDirection] = useState(
    Object.keys(headsignsByDirectionId)[0]
  );

  let defaultService = "weekday";

  if (dayOfWeek() === "sunday" && tripsByServiceDay.sunday.length > 0) {
    defaultService = "sunday";
  }
  if (dayOfWeek() === "saturday" && tripsByServiceDay.saturday.length > 0) {
    defaultService = "saturday";
  }

  const [service, setService] = useState(defaultService);

  let [now, setNow] = useState(new Date());

  let [patterns, setPatterns] = useState(null);
  let [vehicles, setVehicles] = useState(null);
  let [predictions, setPredictions] = useState(null);
  useEffect(() => {
    if (!sanityAgency.realTimeEnabled) return;
    let tick = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(tick);
  }, [sanityAgency.realTimeEnabled]);

  useEffect(() => {
    if (!sanityAgency.realTimeEnabled) return;

    let url = `/.netlify/functions/route?routeId=${sanityRoute.shortName}&agency=${sanityAgency.slug.current}`;

    if (sanityAgency.slug.current === "transit-windsor" && !patterns) {
      return;
    }
    if (sanityAgency.slug.current === "transit-windsor" && patterns) {
      url = `/.netlify/functions/route?routeId=${
        sanityRoute.shortName
      }&agency=${sanityAgency.slug.current}&patterns=${patterns
        .map((p) => p.pid)
        .join(",")}`;
    }

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (sanityAgency.slug.current === "transit-windsor") {
          let asVehicles = d.map((v) => {
            return {
              vid: v.name,
              lat: v.lat.toString(),
              lon: v.lng.toString(),
              hdg: v.bearing,
              rt: sanityRoute.shortName,
              des: v.headsignText,
              pid: v.patternId,
              spd: v.velocity,
            };
          });
          setVehicles(asVehicles);
        } else {
          setVehicles(d["bustime-response"]["vehicle"]);
        }
      });
  }, [
    now,
    patterns,
    sanityRoute.shortName,
    sanityAgency.realTimeEnabled,
    sanityAgency.slug,
  ]);

  useEffect(() => {
    if (!sanityAgency.realTimeEnabled || !vehicles) return;
    if (sanityAgency.slug.current === "transit-windsor") return;

    fetch(
      `/.netlify/functions/predictions?vehicleId=${vehicles
        .map((v) => v.vid)
        .join(",")}&agency=${sanityAgency.slug.current}`
    )
      .then((r) => r.json())
      .then((d) => {
        setPredictions(d["bustime-response"]["prd"]);
      });
  }, [vehicles, sanityAgency.slug, sanityAgency.realTimeEnabled]);

  useEffect(() => {
    if (!sanityAgency.realTimeEnabled) return;

    fetch(
      `/.netlify/functions/patterns?routeId=${sanityRoute.shortName}&agency=${sanityAgency.slug.current}`
    )
      .then((r) => r.json())
      .then((d) => {
        if (sanityAgency.slug.current === "transit-windsor") {
          let filtered = d.filter((p) => p.routeCode === sanityRoute.shortName);
          let asPatterns = filtered.map((p) => {
            return {
              pid: p.patternID,
              rtdir: p.directionName.replace("BOUND", ""),
              pt: [],
            };
          });
          setPatterns(asPatterns);
        } else {
          setPatterns(d["bustime-response"]["ptr"]);
        }
      });
  }, [sanityAgency.slug, sanityAgency.realTimeEnabled, sanityRoute.shortName]);

  let [trackedBus, setTrackedBus] = useState(null);

  return (
    <div>
      <Helmet>
        <title>{`${agencyData.name} ${routeData.displayShortName}: ${routeData.routeLongName}`}</title>
        <meta
          property="og:url"
          content={`https://transit.det.city/${pageContext.agencySlug}/route/${routeData.displayShortName}/`}
        />
        <meta property="og:type" content={`website`} />
        <meta
          property="og:title"
          content={`${agencyData.name} bus route: ${routeData.displayShortName} ${routeData.routeLongName}`}
        />
        <meta
          property="og:description"
          content={`${agencyData.name} bus route ${routeData.displayShortName} ${routeData.routeLongName}`}
        />
      </Helmet>

      <div className="mt-4">
        <AgencySlimHeader agency={agencyData} />
      </div>

      <div className="bg-gray-300 dark:bg-zinc-900">
        <RouteHeader {...gtfsRoute} agency={agencyData} />
      </div>

      <Tabs.Root className="tabRoot" defaultValue={pageContext.initialTab}>
        <Tabs.List className="tabList" aria-label="Bus route pages">
          <Link
            to={`/${pageContext.agencySlug}/route/${gtfsRoute.displayShortName}/`}
          >
            <Tabs.Trigger className="tabTrigger" value="">
              Home
            </Tabs.Trigger>
          </Link>
          <Link
            to={`/${pageContext.agencySlug}/route/${gtfsRoute.displayShortName}/map`}
          >
            <Tabs.Trigger className="tabTrigger" value="map">
              Map
            </Tabs.Trigger>
          </Link>
          <Link
            to={`/${pageContext.agencySlug}/route/${gtfsRoute.displayShortName}/schedule`}
          >
            <Tabs.Trigger className="tabTrigger" value="schedule">
              Schedule
            </Tabs.Trigger>
          </Link>
          <Link
            to={`/${pageContext.agencySlug}/route/${gtfsRoute.displayShortName}/stops`}
          >
            <Tabs.Trigger className="tabTrigger" value="stops">
              Stops
            </Tabs.Trigger>
          </Link>
        </Tabs.List>
        <Tabs.Content className="tabContent" value="">
          <div className="md:grid md:grid-cols-2 gap-2 pb-6">
            {agencyData.realTimeEnabled && (
              <RoutePredictions
                vehicles={createVehicleFc(
                  vehicles,
                  patterns,
                  routeData,
                  agencyData
                )}
                predictions={predictions}
                setTrackedBus={setTrackedBus}
                now={now}
              />
            )}
            {sanityRoute && (
              <RouteMap
                routeFc={createRouteFc(sanityRoute, gtfsRoute)}
                stopsFc={createStopsFc(sanityRoute, tripsByServiceAndDirection)}
                timepointsFc={createStopsFc(
                  sanityRoute,
                  tripsByServiceAndDirection,
                  true,
                  true,
                  true
                )}
                vehicleFc={createVehicleFc(
                  vehicles,
                  patterns,
                  routeData,
                  agencyData
                )}
                agency={agencyData}
                trackedBus={trackedBus}
              />
            )}
          </div>
          <RouteIntroduction
            agency={agencyData}
            route={routeData}
            trips={tripsByServiceAndDirection}
            headsigns={headsignsByDirectionId}
          />
        </Tabs.Content>
        <Tabs.Content className="tabContent" value="map">
          {sanityRoute && (
            <RouteMap
              routeFc={createRouteFc(sanityRoute, gtfsRoute)}
              stopsFc={createStopsFc(sanityRoute, tripsByServiceAndDirection)}
              timepointsFc={createStopsFc(
                sanityRoute,
                tripsByServiceAndDirection,
                true,
                true,
                true
              )}
              vehicleFc={createVehicleFc(
                vehicles,
                patterns,
                routeData,
                agencyData
              )}
              agency={agencyData}
            />
          )}
        </Tabs.Content>
        <Tabs.Content className="tabContent" value="schedule">
          <div className="bg-gray-100 dark:bg-zinc-900 p-4 md:py-6 flex flex-col gap-4 md:gap-8">
            <DirectionPicker
              directions={headsignsByDirectionId}
              {...{ direction, setDirection }}
            />
            <ServicePicker
              services={tripsByServiceDay}
              {...{ service, setService }}
            />
          </div>
          <RouteTimeTable
            trips={tripsByServiceAndDirection}
            route={gtfsRoute}
            agency={agencyData}
            service={service}
            direction={direction}
          />
        </Tabs.Content>
        <Tabs.Content className="tabContent" value="stops">
          <div className="bg-gray-100 dark:bg-zinc-900 p-4 md:py-6 flex flex-col gap-4 md:gap-8">
            <DirectionPicker
              directions={headsignsByDirectionId}
              {...{ direction, setDirection }}
            />
          </div>
          <div className="px-3 flex flex-col gap-4 md:gap-8">
            <RouteStopsList
              longTrips={longTrips}
              direction={direction}
              routeColor={gtfsRoute.routeColor}
              agency={agencyData}
            />
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

export const query = graphql`
  query RouteQuery(
    $feedIndex: Int
    $routeNo: String
    $agencySlug: String
    $serviceIds: [String!]
  ) {
    route: sanityRoute(
      shortName: { eq: $routeNo }
      agency: { slug: { current: { eq: $agencySlug } } }
    ) {
      color {
        hex
      }
      longName
      routeType
      shortName
      displayShortName
      slug {
        current
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
    agency: sanityAgency(slug: { current: { eq: $agencySlug } }) {
      name
      color {
        hex
      }
      textColor {
        hex
      }
      currentFeedIndex
      realTimeEnabled
      stopIdentifierField
      serviceIds
      slug {
        current
      }
    }
    postgres {
      routes: routesList(
        condition: { feedIndex: $feedIndex, routeShortName: $routeNo }
      ) {
        agencyId
        routeShortName
        routeLongName
        routeDesc
        routeType
        routeUrl
        routeColor
        routeTextColor
        routeSortOrder
        feedIndex
        trips: tripsByFeedIndexAndRouteIdList(
          filter: { serviceId: { in: $serviceIds } }
        ) {
          serviceId
          directionId
          tripId
          tripHeadsign
          stopTimes: stopTimesByFeedIndexAndTripIdList(
            orderBy: STOP_SEQUENCE_ASC
          ) {
            arrivalTime {
              hours
              minutes
              seconds
            }
            stop: stopByFeedIndexAndStopId {
              stopCode
              stopId
              stopName
              stopLon
              stopLat
            }
            timepoint
          }
        }
        longTrips: longestTripsList {
          tripId
          stopTimes: stopTimesByFeedIndexAndTripIdList(
            orderBy: STOP_SEQUENCE_ASC
          ) {
            stopId
            stop: stopByFeedIndexAndStopId {
              stopCode
              stopId
              stopName
              stopLon
              stopLat
            }
            arrivalTime {
              hours
              minutes
              seconds
            }
            timepoint
            stopSequence
          }
          serviceId
          directionId
          direction
        }
      }
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
    }
  }
`;

export default Route;
