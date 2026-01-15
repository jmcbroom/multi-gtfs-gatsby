import { Link, graphql } from "gatsby";
import React from "react";
import PortableText from "react-portable-text";
import AgencySlimHeader from "../components/AgencySlimHeader";
import { TripPlannerBox } from "../components/TripPlanner";
import { createRouteData } from "../util";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCompass, faPlane } from "@fortawesome/free-solid-svg-icons";

/**
 * The home page.
 * @param {*} data: GraphQL query
 */
const IndexPage = ({ data }) => {
  let { agencies } = data.postgres;
  let sanityAgencies = data.allSanityAgency.edges.map((e) => e.node);

  let merged = sanityAgencies.map((sa) => {
    let filtered = agencies.filter(
      (ag) => ag.feedIndex === sa.currentFeedIndex
    )[0];
    return { ...sa, ...filtered };
  }).sort((a, b) => {
    // Sort by sortOrder (agencies without sortOrder go to the end)
    if (a.sortOrder === null || a.sortOrder === undefined) return 1;
    if (b.sortOrder === null || b.sortOrder === undefined) return -1;
    return a.sortOrder - b.sortOrder;
  });

  let sanityRoutes = data.allSanityRoute.edges.map((e) => e.node);
  // loop thru agencies
  merged.forEach((a) => {
    // loop thru those agencies' routes (if they exist)
    if (!a.routes) return;
    a.routes.forEach((r) => {
      r.agencyData = a;

      // find the matching sanityRoute
      let matching = sanityRoutes.filter(
        (sr) =>
          sr.agency.currentFeedIndex === r.feedIndex &&
          sr.shortName === r.routeShortName
      );

      // let's override the route attributes with those from Sanity
      if (matching.length === 1) {
        r = createRouteData(r, matching[0]);
      }
    });
  });

  let otherServices = merged.filter((a) => a.agencyType !== "local-bus");

  merged = merged.filter((a) => a.agencyType === "local-bus");

  return (
    <div className="py-4 flex flex-col gap-4 md:gap-6">

      {/* Trip planner box */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-3 md:px-0">
          <FontAwesomeIcon icon={faCompass} className="text-gray-500 dark:text-zinc-400" />
          <h2 className="mb-0">Plan a trip</h2>
        </div>
        <div className="px-3 md:px-0">
          <TripPlannerBox />
        </div>
      </div>

      <div>
        <h2 className="pl-3 md:pl-0">Local bus systems</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {merged.map((a) => (
            <div className="bg-gray-100 dark:bg-zinc-800" key={a.name}>
              <AgencySlimHeader agency={a} />
              <div className="p-3 md:p-4">
                <Link to={`/${a.slug.current}`} key={a.slug.current}>
                  <h3>{a.name}</h3>
                </Link>
                <PortableText content={a.description} className="" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="pl-3 md:pl-0">Downtown transit services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
          {otherServices
            .filter(
              (a) => ["qline", "people-mover"].indexOf(a.slug.current) > -1
            )
            .map((a) => (
              <div className="bg-gray-100 dark:bg-zinc-800" key={a.name}>
                <AgencySlimHeader agency={a} />
                <div className="px-4 py-4">
                  <Link to={`/${a.slug.current}`} key={a.slug.current}>
                    <h3>{a.name}</h3>
                  </Link>
                  <PortableText content={a.description} className="" />
                </div>
              </div>
            ))}
        </div>
      </div>
      <div>
        <h2 className="pl-3 md:pl-0">Regional bus services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
          {otherServices
            .filter((a) => ["d2a2"].indexOf(a.slug.current) > -1)
            .map((a) => (
              <div className="bg-gray-100 dark:bg-zinc-800" key={a.name}>
                <AgencySlimHeader agency={a} />
                <div className="px-4 py-4">
                  <Link to={`/${a.slug.current}`} key={a.slug.current}>
                    <h3>{a.name}</h3>
                  </Link>
                  <PortableText content={a.description} className="" />
                </div>
              </div>
            ))}
          <div className="bg-gray-100 dark:bg-zinc-800">
            <AgencySlimHeader
              agency={{
                slug: { current: "dax" },
                name: "Detroit Air Xpress",
                description:
                  "The Detroit Air Xpress service provides service between Downtown Detroit and Detroit Metro airport (DTW).",
                agencyType: "other",
                agencyUrl: "https://www.dax-bus.com/",
                agencyLang: "en",
                agencyPhone: "517-333-0400",
                agencyFareUrl: "https://www.dax-bus.com/ride?scrollto=fares",
                agencyEmail: "",
                color: { hex: "#19A8AF" },
                textColor: { hex: "#FFF" },
              }}
            />
            <div className="p-4">
              <Link to={`/dax`} key="dax">
                <h3>Detroit Air Xpress <FontAwesomeIcon icon={faPlane} size="1x" className="mx-1" /></h3>
              </Link>
              <p>
              The Detroit Air Xpress provides service between 
              Downtown Detroit and Detroit Metro airport (DTW).
              </p>
            </div>
          </div>
          <div className="bg-gray-100 dark:bg-zinc-800">
            <AgencySlimHeader
              agency={{
                slug: { current: "michigan-flyer" },
                name: "Michigan Flyer",
                description:
                  "The Michigan Flyer-AirRide bus service provides motorcoach transportation between Ann Arbor, East Lansing, and Detroit Metro airport (DTW).",
                agencyType: "other",
                agencyUrl: "https://michiganflyer.com/",
                agencyLang: "en",
                agencyPhone: "517-333-0400",
                agencyFareUrl: "https://michiganflyer.com/fares",
                agencyEmail: "",
                color: { hex: "#674A72" },
                textColor: { hex: "#ffffff" },
              }}
            />
            <div className="p-4">
              <Link to={`/michigan-flyer`} key="michigan-flyer">
                <h3>Michigan Flyer</h3>
              </Link>
              <p>
                The Michigan Flyer bus provides service between Ann Arbor, East
                Lansing, and Detroit Metro airport (DTW).
              </p>
            </div>
          </div>
        </div>
      </div>
      <div>
        <h2 className="pl-3 md:pl-0">Bikeshare services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">

        {data.allSanityBikeshare.edges.map((e) => (
          <div className="bg-gray-100 dark:bg-zinc-800" key={e.node.name}>
            <AgencySlimHeader agency={e.node} />
            <div className="px-4 py-4">
              <Link to={`/${e.node.slug.current}`} key={e.node.slug.current}>
                <h3>{e.node.name}</h3>
              </Link>
              {e.node.description && <PortableText content={e.node.description} className="" />}
            </div>
          </div>
        ))}
        </div>
      </div>

    </div>
  );
};

export const query = graphql`
  {
    indexPage: sanityIndexPage(_id: { eq: "index-page-content" }) {
      indexPageContent: _rawHomepageContent
    }
    allSanityAgency {
      edges {
        node {
          currentFeedIndex
          name
          fullName
          sortOrder
          color {
            hex
          }
          textColor {
            hex
          }
          description: _rawDescription
          agencyType
          stopIdentifierField
          slug {
            current
          }
        }
      }
    }
    allSanityBikeshare {
      edges {
        node {
          name
          fullName
          color {
            hex
          }
          textColor {
            hex
          }
          description: _rawDescription
          slug {
            current
          }
        }
      }
    }
    allSanityRoute {
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
          agency {
            currentFeedIndex
            slug {
              current
            }
          }
        }
      }
    }
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
        routes: routesByFeedIndexAndAgencyIdList(
          orderBy: ROUTE_SORT_ORDER_ASC
        ) {
          feedIndex
          routeShortName
          routeLongName
          routeColor
          routeTextColor
          implicitSort
          trips: tripsByFeedIndexAndRouteId {
            totalCount
          }
        }
      }
    }
  }
`;

export default IndexPage;

export const Head = () => {
  const title = "Detroit/Windsor transit information | transit.det.city";
  const description = "Real-time info, schedules, and maps for DDOT, SMART, TheRide, and Transit Windsor. Plan your trip across the greater Detroit/Windsor area.";

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:url" content="https://transit.det.city/" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <link rel="canonical" href="https://transit.det.city/" />
    </>
  );
};
