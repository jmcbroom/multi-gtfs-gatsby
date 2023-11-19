import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Link } from "gatsby";
import React from "react";
import { Helmet } from "react-helmet";
import { ThemeProvider } from "../hooks/ThemeContext";
import NavMenu from "./NavMenu";
import { useStaticQuery, graphql } from "gatsby"

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
        }
      }
    }
  }
    `)


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
                transit<span className="text-gray-500 dark:text-gray-400">.det.city</span>
              </h1>
            </Link>
            <NavMenu />
          </div>
        </header>

        <div className="px-0 md:px-4">
          <div className="max-w-5xl mx-auto">{children}</div>
        </div>

        <footer className="mt-8 bg-primary-light dark:bg-primary-dark px-2 md:px-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto gap-8 md:gap-0">
            <div className="flex flex-col justify-start gap-2">
              <h4>
                Transit agencies
              </h4>
              {
                data.allSanityAgency.edges.map((a) => (
                  <Link to={`/${a.node.slug.current}`}>
                    {a.node.name}
                  </Link>
                ))
              }
            </div>
            <div className="flex flex-col justify-start gap-2">
              <Link to={`/about`}>
                About this site
              </Link>
              <Link to={`/contact-us`}>
              <p>Feedback, comments, questions?</p>
                </Link>
              <div className="flex items-center justify-start gap-2">
                <GitHubLogoIcon />
                <span>GitHub: <a href="https://github.com/jmcbroom/multi-gtfs-gatsby" target="_blank">multi-gtfs-gatsby</a></span>
              </div>
            </div>
          </div>
          <div className="w-full text-center mt-6 mb-4 text-gray-400">&copy; {new Date().getFullYear()}</div>
        </footer>

      </div>
    </ThemeProvider>
  );
}
  