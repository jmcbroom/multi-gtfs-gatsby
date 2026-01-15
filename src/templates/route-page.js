import * as Tabs from "@radix-ui/react-tabs";
import { graphql, Link } from "gatsby";
import React, { useState, useEffect } from "react";
import { useTick } from "../hooks/useTick";
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
  generateRouteOgImageUrl,
  getHeadsignsByDirectionId,
  getServiceDays,
  getTripsByServiceAndDirection,
  getTripsByServiceDay,
  shortenHeadsign,
} from "../util";
import { getStopIdentifier } from "../stopUtils";

const Route = ({ data, pageContext, location }) => {
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

  sanityRoute.directions.forEach((dir) => {
    // get timepoints for each direction
    let timepoints = dir.directionTimepoints;
    // set timepoint = 1 for each stopTime that is a timepoint
    // Only process trips matching this direction
    trips
      .filter((trip) => trip.directionId === dir.directionId)
      .forEach((trip) => {
        trip.stopTimes.forEach((st) => {
          if(dir.directionTimepoints.length > 0) {
            st.timepoint = 0;
          }
          if (timepoints.includes(getStopIdentifier(st.stop, agencyData))) {
            st.timepoint = 1;
          }
        });
        trip.stopTimes[trip.stopTimes.length - 1].timepoint = 1;
      });

    longTrips
      .filter((trip) => trip.directionId === dir.directionId)
      .forEach((trip) => {
        trip.stopTimes[0].timepoint = 1;
        trip.stopTimes.forEach((st) => {
          if (timepoints.includes(getStopIdentifier(st.stop, agencyData))) {
            st.timepoint = 1;
          }
        });
        trip.stopTimes[trip.stopTimes.length - 1].timepoint = 1;
      });
  });

  // Don't filter calendars here - let getServiceDays use the trips data to find the right service IDs
  // This handles cases where a route uses service IDs not in the agency's main serviceIds list
  let serviceDays = getServiceDays(
    serviceCalendars, // pass all calendars
    null, // use current date
    trips  // pass trips so deduplication can prefer service IDs with actual trips
  );
  let tripsByServiceDay = getTripsByServiceDay(trips, serviceDays);
  let headsignsByDirectionId = getHeadsignsByDirectionId(trips, sanityRoute);
  let tripsByServiceAndDirection = getTripsByServiceAndDirection(
    trips,
    serviceDays,
    headsignsByDirectionId
  );

  if (sanityRoute) {
    sanityRoute.directions.forEach((dir) => {
      if (dir.directionHeadsign) {
        headsignsByDirectionId[dir.directionId][0] = dir.directionHeadsign;
      }
    });
    sanityRoute.mapPriority = 2;
  }

  let routeData = createRouteData(gtfsRoute, sanityRoute);

  // Parse URL parameters for initial state
  const urlParams = typeof window !== "undefined" ? new URLSearchParams(location?.search || "") : null;
  const urlDirection = urlParams?.get("direction");
  const urlDay = urlParams?.get("day");

  // Validate URL direction parameter
  const validDirections = Object.keys(headsignsByDirectionId);
  const initialDirection = urlDirection && validDirections.includes(urlDirection)
    ? urlDirection
    : validDirections[0];

  // Determine default service based on day of week
  let defaultService = "weekday";
  if (dayOfWeek() === "sunday" && tripsByServiceDay.sunday.length > 0) {
    defaultService = "sunday";
  }
  if (dayOfWeek() === "saturday" && tripsByServiceDay.saturday.length > 0) {
    defaultService = "saturday";
  }

  // Validate URL day parameter
  const validServices = ["weekday", "saturday", "sunday"];
  const initialService = urlDay && validServices.includes(urlDay) && tripsByServiceDay[urlDay]?.length > 0
    ? urlDay
    : defaultService;

  const [direction, setDirection] = useState(initialDirection);
  const [service, setService] = useState(initialService);

  // Update URL when direction or service changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    params.set("direction", direction);
    params.set("day", service);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }, [direction, service]);

  const { now, countdown } = useTick(sanityAgency.realTimeEnabled);

  let [patterns, setPatterns] = useState(null);
  let [vehicles, setVehicles] = useState(null);
  let [predictions, setPredictions] = useState(null);

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
      <AgencySlimHeader agency={agencyData} />

      <div className="bg-gray-300 dark:bg-zinc-900">
        <RouteHeader {...gtfsRoute} agency={agencyData} showFavorite={true} />
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
          <div className="flex flex-col md:grid md:grid-cols-2 gap-2 pb-6">
            {sanityRoute && (
              <div className="order-first md:order-last">
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
                    agencyData,
                    trips
                  )}
                  agency={agencyData}
                  trackedBus={trackedBus}
                />
              </div>
            )}
            {agencyData.realTimeEnabled && (
              <RoutePredictions
                vehicles={createVehicleFc(
                  vehicles,
                  patterns,
                  routeData,
                  agencyData,
                  trips
                )}
                predictions={predictions}
                setTrackedBus={setTrackedBus}
                countdown={countdown}
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
        <Tabs.Content className=" " value="schedule">
          <div className="bg-gray-100 dark:bg-zinc-900 px-3 py-2 md:p-4 md:py-6 flex flex-col gap-2 md:gap-6">
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
            startDate
            endDate
          }
        }
      }
    }
  }
`;

export default Route;

export const Head = ({ data, pageContext }) => {
  const agencyName = data.agency?.name || "";
  const routeShortName = data.route?.displayShortName || data.route?.shortName || "";
  const routeLongName = data.route?.longName || "";
  const routeColor = data.route?.color?.hex || data.postgres?.agencies?.[0]?.routes?.[0]?.routeColor || "004d99";
  const directions = data.route?.directions || [];
  const serviceIds = data.agency?.serviceIds || [];
  const serviceCalendars = data.postgres?.agencies?.[0]?.feedInfo?.serviceCalendars || [];

  // Generate OG image URL
  const ogImageUrl = generateRouteOgImageUrl({
    directions,
    routeColor,
    accessToken: process.env.GATSBY_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN,
  });

  // Build a description with endpoints from direction headsigns
  let description = `${agencyName} bus ${routeShortName}`;
  if (routeLongName) {
    description += ` ${routeLongName}`;
  }

  // Extract and shorten headsigns to show endpoints
  const headsigns = directions
    .map(d => d.directionHeadsign)
    .filter(Boolean)
    .map(h => shortenHeadsign(h));

  if (headsigns.length === 2) {
    description += `, running between ${headsigns[0]} / ${headsigns[1]}.`;
  } else if (headsigns.length === 1) {
    description += `. Serves ${headsigns[0]}.`;
  }

  // Determine operating days from service calendars
  const activeCalendars = serviceCalendars.filter(sc => serviceIds.includes(sc.serviceId));
  const days = {
    monday: activeCalendars.some(c => c.monday),
    tuesday: activeCalendars.some(c => c.tuesday),
    wednesday: activeCalendars.some(c => c.wednesday),
    thursday: activeCalendars.some(c => c.thursday),
    friday: activeCalendars.some(c => c.friday),
    saturday: activeCalendars.some(c => c.saturday),
    sunday: activeCalendars.some(c => c.sunday),
  };

  const weekdays = days.monday && days.tuesday && days.wednesday && days.thursday && days.friday;
  const weekend = days.saturday && days.sunday;

  let operatingDays = "";
  if (weekdays && weekend) {
    operatingDays = "daily";
  } else if (weekdays && days.saturday && !days.sunday) {
    operatingDays = "Mon-Sat";
  } else if (weekdays && !days.saturday && !days.sunday) {
    operatingDays = "Mon-Fri";
  } else if (!weekdays && weekend) {
    operatingDays = "Sat-Sun";
  } else if (days.saturday && !days.sunday) {
    operatingDays = "Saturdays";
  } else if (days.sunday && !days.saturday) {
    operatingDays = "Sundays";
  } else {
    // Fallback: list individual days
    const dayNames = [];
    if (days.monday) dayNames.push("Mon");
    if (days.tuesday) dayNames.push("Tue");
    if (days.wednesday) dayNames.push("Wed");
    if (days.thursday) dayNames.push("Thu");
    if (days.friday) dayNames.push("Fri");
    if (days.saturday) dayNames.push("Sat");
    if (days.sunday) dayNames.push("Sun");
    operatingDays = dayNames.join(", ");
  }

  if (operatingDays) {
    description += ` Operates ${operatingDays}.`;
  }

  return (
    <>
      <title>{`${agencyName} ${routeShortName}: ${routeLongName}`} | transit.det.city</title>
      <meta name="description" content={description} />
      <meta property="og:url" content={`https://transit.det.city/${pageContext.agencySlug}/route/${routeShortName}/`} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={`${agencyName} Route ${routeShortName}: ${routeLongName}`} />
      <meta property="og:description" content={description} />
      {ogImageUrl && <meta property="og:image" content={ogImageUrl} />}
      {ogImageUrl && <meta property="og:image:width" content="1200" />}
      {ogImageUrl && <meta property="og:image:height" content="630" />}
      <link rel="canonical" href={`https://transit.det.city/${pageContext.agencySlug}/route/${routeShortName}/`} />
    </>
  );
};
