import React from "react";
import { graphql, Link } from "gatsby";
import RouteHeader from "../components/RouteHeader";
import AgencyHeader from "../components/AgencyHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink, faPhone } from "@fortawesome/free-solid-svg-icons";
import AgencyMap from "../components/AgencyMap";
import PortableText from "react-portable-text";
import { createAgencyData, createRouteData, createRouteFc } from "../util";
import AgencySlimHeader from "../components/AgencySlimHeader";
import * as Tabs from "@radix-ui/react-tabs";

const Agency = ({ data, pageContext }) => {
  let gtfsAgency = data.postgres.agencies[0];
  let sanityAgency = data.allSanityAgency.edges[0].node;
  let agencyData = createAgencyData(gtfsAgency, sanityAgency);

  let { agencyUrl, agencyPhone, routes, description, name, fareAttributes, fareContent } = agencyData;

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
      r = createRouteData(r, matching[0])
    }
  });

  // create a GeoJSON feature collection with all the agency's route's directional GeoJSON features.
  let allRouteFeatures = []
  routes.forEach(route => {

    route.directions.forEach(direction => {

      let feature = JSON.parse(direction.directionShape)[0]
      
      feature.properties = {
          routeColor: route.routeColor,
          routeLongName: route.routeLongName,
          routeShortName: route.routeShortName,
          routeTextColor: route.routeTextColor,
          direction: direction.directionDescription,
          directionId: direction.directionId
      }

      allRouteFeatures.push(feature)
    })
  })
  let allRouteFc = {
    type: "FeatureCollection",
    features: allRouteFeatures
  }

  // generate human-readable text for fare info
  fareAttributes = fareAttributes?.map((fare) => {
    fare.formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency', currency: fare.currencyType
    }).format(fare.price);
    
    if (fare.transfers == 0) {
      fare.formattedTransfers = 'a single ride';
    } else {
      fare.formattedTransfers = (fare.transferDuration <= 60**2 * 24) ?
        `${Math.floor(fare.transferDuration / 60**2)} hour` :
        `${Math.floor(fare.transferDuration / 60**2 / 24)} day`;
        
      fare.formattedTransfers +=
        fare.formattedTransfers.startsWith('1 ') ? '' : 's';
      
      fare.formattedTransfers += ' with ';
      
      fare.formattedTransfers += fare.transfers ?
        (fare.transfers + ' transfer' + fare.transfers == 1 ? '' : 's' ) :
        fare.transfers === 0 ?
        'no transfers' :
        'unlimited tranfers';
    }
    
    return fare;
  });

  return (
    <div>
      <AgencySlimHeader agency={agencyData} />
      <Tabs.Root className="tabRoot" defaultValue="home">
        <Tabs.List className="tabList" aria-label="Manage your account">
          <Tabs.Trigger className="tabTrigger" value="home">
            Home
          </Tabs.Trigger>
          <Tabs.Trigger className="tabTrigger" value="routes">
            Routes
          </Tabs.Trigger>
          <Tabs.Trigger className="tabTrigger" value="map">
            Map
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content className="tabContent py-4" value="home">
          <AgencyHeader agency={agencyData} />
          <PortableText content={description} />

          <h4>Fares</h4>
          {fareAttributes?.map((fare, idx) => (
            <p key={`${agencyData.agencyId}${idx}`}>
              The <span className="font-semibold">{fare.formattedPrice}</span> fare is valid for {fare.formattedTransfers}.
            </p>
          ))}
          {fareContent && <PortableText content={fareContent} />}

          <h4>Contact information</h4>
          <p>You can find {name}'s website at <a href={agencyUrl}>{agencyUrl}</a>.</p>
          <p>{name}'s customer service number is <a href={`tel:${agencyPhone}`}>{agencyPhone}</a>.</p>

        </Tabs.Content>
        <Tabs.Content className="tabContent py-4" value="routes">
          <p className="underline-title">List of bus routes</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 px-2 md:px-0 max-h-screen overflow-auto">
            {routes.map((r) => (
              <RouteHeader key={r.routeShortName} {...r} agency={agencyData} />
            ))}
          </div>
        </Tabs.Content>
        <Tabs.Content className="tabContent" value="map">
          <p className="underline-title">System map</p>
          <AgencyMap agency={agencyData} routesFc={allRouteFc} />
        </Tabs.Content>
      </Tabs.Root>
      {/* 
      <section className="flex flex-col sm:flex-row items-center justify-start gap-4 mb-4">
        <div className="flex items-center justify-between">
          <Link to={agencyUrl}>
            <FontAwesomeIcon icon={faLink} />
            <span className="ml-2">Website</span>
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <a href={`tel:+1${agencyPhone}`}>
            <FontAwesomeIcon icon={faPhone} />
            <span className="ml-2">Phone: {agencyPhone}</span>
          </a>
        </div>
      </section>
      <h3>Fare information</h3>
      <p>...</p>
      <h3>Bus routes</h3>
      */}
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
        fareAttributes: fareAttributesByFeedIndexAndAgencyIdList(orderBy: [ PRICE_ASC, TRANSFER_DURATION_DESC ]) {
          price
          transfers
          transferDuration
          currencyType
        }
      }
    }
    allSanityRoute(filter: { agency: { slug: { current: { eq: $agencySlug } } } }) {
      edges {
        node {
          longName
          shortName
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
