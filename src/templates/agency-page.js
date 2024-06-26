import * as Tabs from "@radix-ui/react-tabs";
import { graphql, Link } from "gatsby";
import React from "react";
import PortableText from "react-portable-text";
import AgencyMap from "../components/AgencyMap";
import AgencySlimHeader from "../components/AgencySlimHeader";
import RouteHeader from "../components/RouteHeader";
import RouteSlim from "../components/RouteSlim";
import { createAgencyData, createRouteData } from "../util";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

const Agency = ({ data, pageContext, location }) => {

  let gtfsAgency = data.postgres.agencies[0];
  let sanityAgency = data.allSanityAgency.edges[0].node;
  let agencyData = createAgencyData(gtfsAgency, sanityAgency);


  let { startDate, endDate } = gtfsAgency.feedInfo;


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
  routes.forEach((r) => {
    // find the matching sanityRoute
    let matching = sanityRoutes.filter(
      (sr) => sr.shortName === r.routeShortName
    );

    // let's override the route attributes with those from Sanity
    if (matching.length === 1) {
      r = createRouteData(r, matching[0]);
    }
  });

  let allRoutes = Object.assign([], routes);

  // create a GeoJSON feature collection with all the agency's route's directional GeoJSON features.
  let allRouteFeatures = [];

  routes.forEach((route) => {
    if (!route.directions) {
      console.log(route);
    }
    route.directions.forEach((direction) => {
      let feature = JSON.parse(direction.directionShape)[0];

      feature.properties = {
        routeColor: route.routeColor,
        routeLongName: route.routeLongName,
        routeShortName: route.routeShortName,
        displayShortName: route.displayShortName,
        routeTextColor: route.routeTextColor,
        mapPriority: route.mapPriority,
        direction: direction.directionDescription,
        directionId: direction.directionId,
      };

      allRouteFeatures.push(feature);
    });
  });

  let allRouteFc = {
    type: "FeatureCollection",
    features: allRouteFeatures,
  };

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

  return (
    <div className="py-4">
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
                  <Link
                    to={`/${pageContext.agencySlug}/route/${r.displayShortName}`}
                    key={r.displayShortName}
                  >
                    <RouteSlim {...r} />
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4>Feed information</h4>
              <p className="ml-2">The currently published GTFS feed is valid from: <b>{startDate}</b> to <b>{endDate}</b>.</p>
              {/* if end date > today, add warning */}
              {endDate < new Date().toISOString().split("T")[0] && (
                <p className="text-red-400 font-semibold mt-3 ml-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} />{" "}
                  This schedule may be out of date.
                </p>
              )}
            </div>
          </div>
        </Tabs.Content>
        <Tabs.Content className="tabContent" value="routes">
          <p className="grayHeader">List of bus routes</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 px-2 pt-4 max-h-screen overflow-auto">
            {routes.map((r) => (
              <RouteHeader
                key={r.displayShortName}
                {...r}
                agency={agencyData}
              />
            ))}
          </div>
        </Tabs.Content>
        <Tabs.Content className="tabContent" value="map">
          <p className="grayHeader">System map</p>
          <AgencyMap agency={agencyData} routesFc={allRouteFc} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
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
