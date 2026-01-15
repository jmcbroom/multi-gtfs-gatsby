import * as Tabs from "@radix-ui/react-tabs";
import { graphql, Link } from "gatsby";
import React from "react";
import PortableText from "react-portable-text";
import AgencySlimHeader from "../components/AgencySlimHeader";
import RouteHeader from "../components/RouteHeader";
import RouteSlim from "../components/RouteSlim";
import SystemMap from "../components/SystemMap";
import { createAgencyData, createRouteData } from "../util";
import { getStopIdentifier } from "../stopUtils";

const Agency = ({ data, pageContext }) => {

  let gtfsAgency = data.postgres.agencies[0];
  let sanityAgency = data.allSanityAgency.edges[0].node;
  let agencyData = createAgencyData(gtfsAgency, sanityAgency);

  let {
    agencyUrl,
    agencyPhone,
    routes,
    description,
    name,
    fareAttributes,
    fareContent,
  } = agencyData;

  // let's not display any routes that don't have scheduled trips.
  let sanityRoutes = data.allSanityRoute.edges.map((e) => e.node);
  routes = routes
    .filter((r) => r.trips.totalCount > 0)
    .sort((a, b) => a.implicitSort - b.implicitSort);
  // match gtfsRoutes with the sanityRoutes
  routes = routes.map((r) => {
    // find the matching sanityRoute
    let matching = sanityRoutes.filter(
      (sr) => sr.shortName === r.routeShortName
    );

    // let's override the route attributes with those from Sanity
    if (matching.length === 1) {
      return createRouteData(r, matching[0]);
    }
    return r;
  });

  let allRoutes = Object.assign([], routes.filter(r => r.directions));

  // Process timepoints for each route
  allRoutes.forEach((route) => {
    if (!route.directions || !route.longTrips) return;

    route.directions.forEach((dir) => {
      let timepoints = dir.directionTimepoints || [];

      // Mark timepoints in stop times
      route.longTrips
        .filter((trip) => trip.directionId === dir.directionId)
        .forEach((trip) => {
          // Always mark first and last stops as timepoints
          if (trip.stopTimes && trip.stopTimes.length > 0) {
            trip.stopTimes[0].timepoint = 1;
            trip.stopTimes[trip.stopTimes.length - 1].timepoint = 1;

            // Mark stops that are in the timepoints array
            trip.stopTimes.forEach((st) => {
              if (timepoints.includes(getStopIdentifier(st.stop, agencyData))) {
                st.timepoint = 1;
              }
            });
          }
        });
    });
  });

  // generate human-readable text for fare info
  fareAttributes = fareAttributes?.map((fare) => {
    fare.formattedPrice = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: fare.currencyType,
    }).format(fare.price);

    if (fare.transfers === 0) {
      fare.formattedTransfers = "a single ride";
    } else {
      fare.formattedTransfers =
        fare.transferDuration <= 60 ** 2 * 24
          ? `${Math.floor(fare.transferDuration / 60 ** 2)} hour`
          : `${Math.floor(fare.transferDuration / 60 ** 2 / 24)} day`;

      fare.formattedTransfers += fare.formattedTransfers.startsWith("1 ")
        ? ""
        : "s";

      fare.formattedTransfers += " with ";

      fare.formattedTransfers += fare.transfers
        ? fare.transfers + " transfer" + (fare.transfers === 1 ? "" : "s")
        : fare.transfers === 0
        ? "no transfers"
        : "unlimited transfers";
    }

    return fare;
  });

  // Create stops feature collection for SystemMap component
  let stopIdentifierField = sanityAgency.stopIdentifierField || "stopCode";
  let stopsFc = {
    type: "FeatureCollection",
    features: data.postgres.stops.map((stop) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [stop.stopLon, stop.stopLat],
      },
      properties: {
        stopId: stop.stopId,
        stopCode: stop[stopIdentifierField] || stop.stopCode || stop.stopId,
        stopName: stop.stopName,
        offset: [0, 0.8],
        anchor: "top",
        justify: "center",
      },
    })),
  };

  return (
    <>
      <AgencySlimHeader agency={agencyData} />
      <Tabs.Root className="tabRoot" defaultValue={pageContext.initialTab}>
        <Tabs.List className="tabList" aria-label="Manage your account">
          <Link to={`/${pageContext.agencySlug}`}>
            <Tabs.Trigger className="tabTrigger" value="">
              Home
            </Tabs.Trigger>
          </Link>
          <Link to={`/${pageContext.agencySlug}/routes`}>
            <Tabs.Trigger className="tabTrigger" value="routes">
              Routes
            </Tabs.Trigger>
          </Link>
          <Link to={`/${pageContext.agencySlug}/map`}>
            <Tabs.Trigger className="tabTrigger" value="map">
              Map
            </Tabs.Trigger>
          </Link>
        </Tabs.List>
        <Tabs.Content className="tabContent" value="">
          <PortableText content={description} className="pb-2 pt-1 px-2" />
          <div className="gap-4 flex flex-col">
            <div>
              <h4 className="grayHeader">Fares</h4>
              <section>
                {fareAttributes?.map((fare, idx) => (
                  <p key={`${agencyData.agencyId}${idx}`}>
                    The{" "}
                    <span className="font-semibold">{fare.formattedPrice}</span>{" "}
                    fare is valid for {fare.formattedTransfers}.
                  </p>
                ))}
                {fareContent && <PortableText content={fareContent} />}
              </section>
            </div>

            <div>
              <h4 className="grayHeader">Contact information</h4>
              <section>

              <p>
                You can find {name}'s website at{" "}
                <a href={agencyUrl}>{agencyUrl}</a>.
              </p>
              {agencyPhone && agencyPhone.length > 6 && agencyPhone !== '1111111' && <p>
                {name}'s customer service number is{" "}
                <a href={`tel:${agencyPhone}`}>{agencyPhone}</a>.
              </p>}
              </section>
            </div>
            <div>
              <h4 className="grayHeader">List of routes</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 py-4 px-2">
                {allRoutes.map((r) => (
                  <RouteSlim
                    key={r.displayShortName}
                    {...r}
                    link={`/${pageContext.agencySlug}/route/${r.displayShortName}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </Tabs.Content>
        <Tabs.Content className="tabContent" value="routes">
          <p className="grayHeader">List of bus routes</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 px-2 pt-4 max-h-screen overflow-auto">
            {routes.filter(r => r.directions).map((r) => (
              <RouteHeader
                key={r.displayShortName}
                {...r}
                agency={agencyData}
              />
            ))}
          </div>
        </Tabs.Content>
        <Tabs.Content className="tabContent" value="map">
          <SystemMap
            routes={allRoutes}
            stopsFc={stopsFc}
            agencySlug={pageContext.agencySlug}
            agencyName={agencyData.name}
            agencyData={agencyData}
          />
        </Tabs.Content>
      </Tabs.Root>
    </>
  );
};

export const query = graphql`
  query AgencyQuery($feedIndex: Int, $agencySlug: String) {
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
          longTrips: longestTripsList {
            tripId
            directionId
            direction
            serviceId
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
              timepoint
              stopSequence
            }
          }
        }
        feedInfo: feedInfoByFeedIndex {
          startDate: feedStartDate
          endDate: feedEndDate
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
        fareAttributes: fareAttributesByFeedIndexAndAgencyIdList(
          orderBy: [PRICE_ASC, TRANSFER_DURATION_DESC]
        ) {
          price
          transfers
          transferDuration
          currencyType
        }
      }
      stops: stopsList(condition: { feedIndex: $feedIndex }) {
        stopId
        stopCode
        stopName
        stopLat
        stopLon
      }
    }
    allSanityRoute(
      filter: { agency: { slug: { current: { eq: $agencySlug } } } }
    ) {
      edges {
        node {
          longName
          shortName
          displayShortName
          routeColor: color {
            hex
          }
          routeTextColor: textColor {
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
    allSanityAgency(filter: { slug: { current: { eq: $agencySlug } } }) {
      edges {
        node {
          name
          currentFeedIndex
          gtfsRtVehiclePositions
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
          description: _rawDescription
          fareAttributes {
            price
            transferDuration
            transfers
            currencyType
          }
          fareContent: _rawFareContent
        }
      }
    }
  }
`;

export default Agency;

export const Head = ({ data, pageContext }) => {
  const sanityAgency = data.allSanityAgency?.edges?.[0]?.node;
  const gtfsAgency = data.postgres?.agencies?.[0];
  const agencyName = sanityAgency?.name || gtfsAgency?.agencyName || "";
  const fullName = sanityAgency?.fullName || agencyName;

  // Count routes with trips
  const routes = gtfsAgency?.routes || [];
  const activeRouteCount = routes.filter(r => r.trips?.totalCount > 0).length;

  const title = `${agencyName} | transit.det.city`;
  const description = `${fullName} transit information. ${activeRouteCount} bus routes with schedules, maps, and real-time info.`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:url" content={`https://transit.det.city/${pageContext.agencySlug}/`} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <link rel="canonical" href={`https://transit.det.city/${pageContext.agencySlug}/`} />
    </>
  );
};
