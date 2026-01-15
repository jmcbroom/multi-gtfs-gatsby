import React from "react";
import { graphql, Link } from "gatsby";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

const About = ({ data }) => {
  // Match Sanity agencies with PostgreSQL agencies to get feed info
  const sanityAgencies = data.allSanityAgency.edges.map(e => e.node);
  const gtfsAgencies = data.postgres.agencies;

  // Create merged agency list with feed info
  const agenciesWithFeedInfo = sanityAgencies.map(sanityAgency => {
    const gtfsAgency = gtfsAgencies.find(
      ga => ga.feedIndex === sanityAgency.currentFeedIndex
    );
    return {
      ...sanityAgency,
      feedInfo: gtfsAgency?.feedInfo,
    };
  })
    .filter(a => a.feedInfo) // Only include agencies with feed info
    .sort((a, b) => {
      // Sort by sortOrder (agencies without sortOrder go to the end)
      if (a.sortOrder === null || a.sortOrder === undefined) return 1;
      if (b.sortOrder === null || b.sortOrder === undefined) return -1;
      return a.sortOrder - b.sortOrder;
    });

  return (
    <div className="my-6 p-2 leading-6">
      <h3>About this site</h3>
      <p>
        We're creating a web site which publishes information about the public
        transit systems in the Detroit-Windsor region for use by current and
        potential transit users. We utilize schedule data from each regional
        agency in a common machine-readable format, the{" "}
        <a href="https://gtfs.org">General Transit Feed Specification (GTFS)</a>, and
        augment with real-time API access whenever possible.
      </p>

      <h4 className="grayHeader mt-6">GTFS Feed Information</h4>
      <div className="overflow-x-auto mt-4 -mx-2 md:mx-0">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b-2 dark:border-gray-600">
              <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm">Agency</th>
              <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm">Feed Start</th>
              <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm">Feed End</th>
              <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm">Status</th>
            </tr>
          </thead>
          <tbody>
            {agenciesWithFeedInfo.map(agency => {
              const { startDate, endDate } = agency.feedInfo;
              const isOutdated = endDate < new Date().toISOString().split("T")[0];
              const bgColor = agency.color?.hex || '#666666';
              const textColor = agency.textColor?.hex || '#ffffff';

              return (
                <tr key={agency.slug.current} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-800">
                  <td className="py-2 md:py-3 px-2 md:px-4">
                    <Link to={`/${agency.slug.current}`} className="hover:underline inline-flex items-center">
                      <span
                        className="px-2 md:px-3 py-0.5 md:py-1 rounded font-semibold text-xs md:text-sm"
                        style={{
                          backgroundColor: bgColor,
                          color: textColor
                        }}
                      >
                        {agency.name}
                      </span>
                    </Link>
                  </td>
                  <td className="py-2 md:py-3 px-2 md:px-4 font-mono text-xs md:text-sm">{startDate}</td>
                  <td className="py-2 md:py-3 px-2 md:px-4 font-mono text-xs md:text-sm">{endDate}</td>
                  <td className="py-2 md:py-3 px-2 md:px-4">
                    {isOutdated ? (
                      <span className="text-red-500 dark:text-red-400 font-semibold text-xs md:text-sm">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-xs md:text-sm" />
                        <span className="hidden md:inline"> Outdated</span>
                      </span>
                    ) : (
                      <span className="text-green-600 dark:text-green-400 text-xs md:text-sm">
                        <span className="hidden md:inline">Current</span>
                        <span className="md:hidden">✓</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const query = graphql`
  {
    allSanityBikeshare {
      edges {
        node {
          id
          fullName
          feedUrl
          name
          slug {
            current
          }
          textColor {
            hex
          }
          color {
            hex
          }
        }
      }
    }
    allSanityAgency {
      edges {
        node {
          name
          currentFeedIndex
          sortOrder
          slug {
            current
          }
          color {
            hex
          }
          textColor {
            hex
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
        feedInfo: feedInfoByFeedIndex {
          startDate: feedStartDate
          endDate: feedEndDate
        }
      }
    }
  }
`;

export default About;

export const Head = () => {
  const title = "About | transit.det.city";
  const description = "About transit.det.city - real-time transit info for Detroit/Windsor.";
  const url = "https://transit.det.city/about";

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <link rel="canonical" href={url} />
    </>
  );
};
