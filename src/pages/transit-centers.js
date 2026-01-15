import { Link, graphql } from "gatsby";
import React from "react";
import PortableText from "react-portable-text";
import PageHeader from "../components/PageHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsUpDownLeftRight } from "@fortawesome/free-solid-svg-icons";

const TransitCentersPage = ({ data }) => {
  return (
    <>
      <PageHeader title="Transit centers" icon={faArrowsUpDownLeftRight} />
      <div className="px-3 md:px-0 py-4">
        <p className="text-gray-600 dark:text-zinc-400 mb-4">
          Major transfer points where multiple routes connect across the region.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.allSanityTransitCenter.edges.map((e) => (
            <Link
              to={`/transit-center/${e.node.slug.current}`}
              key={e.node.slug.current}
              className="bg-gray-100 dark:bg-zinc-800 p-4 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <h3 className="text-base font-semibold mb-2">{e.node.name}</h3>
              {e.node.description && (
                <div className="text-sm text-gray-600 dark:text-zinc-400 m-0 line-clamp-3">
                  <PortableText content={e.node.description} />
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export const query = graphql`
  {
    allSanityTransitCenter {
      edges {
        node {
          name
          slug {
            current
          }
          description: _rawDescription
        }
      }
    }
  }
`;

export default TransitCentersPage;

export const Head = () => {
  const title = "Transit Centers | transit.det.city";
  const description = "Major transfer points and transit hubs across the Detroit/Windsor region.";

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:url" content="https://transit.det.city/transit-centers" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <link rel="canonical" href="https://transit.det.city/transit-centers" />
    </>
  );
};
