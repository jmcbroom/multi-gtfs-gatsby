import { Link } from "gatsby";
import React from "react";
import { Helmet } from "react-helmet";
import { ThemeProvider } from "../hooks/ThemeContext";
import NavMenu from "./NavMenu";
import { useStaticQuery, graphql } from "gatsby";
import SiteFooter from "./SiteFooter";

/**
 * This is the layout component. It wraps everything, according to the gatsby-plugin-layout.
 * We should put header and nav stuff here, since it can persist state across pages.
 * @param {*} children
 * @returns
 */
export default function Layout({ children }) {
  const data = useStaticQuery(graphql`
    query {
      allSanityAgency {
        edges {
          node {
            currentFeedIndex
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
            agencyType
          }
        }
      }
    }
  `);

  return (
    <ThemeProvider>
      <Helmet>
        <meta charSet="utf-8" />
        <title>transit.det.city</title>
        <link rel="canonical" href="https://transit.det.city" />
      </Helmet>

      <div className="fill-page">
        <header className="bg-primary-light dark:bg-primary-dark bg-opacity-80 px-4">
          <div className="max-w-5xl py-2 mx-auto flex items-center justify-between">
            <Link to={`/`}>
              <h1 className="header font-bold text-gray-700 dark:text-gray-300 text-xl m-0">
                transit
                <span className="text-gray-500 dark:text-gray-400">
                  .det.city
                </span>
              </h1>
            </Link>
            <NavMenu />
          </div>
        </header>

        <div className="px-0 md:px-4 mb-12">
          <div className="max-w-5xl mx-auto">{children}</div>
        </div>

        <SiteFooter data={data} />
      </div>
    </ThemeProvider>
  );
}
