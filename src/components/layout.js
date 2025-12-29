import { Link } from "gatsby";
import React from "react";
import { Helmet } from "react-helmet";
import { ThemeProvider } from "../hooks/ThemeContext";
import NavMenu from "./NavMenu";
import InstallPrompt from "./InstallPrompt";
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
        
        {/* PWA Meta Tags */}
        <meta name="application-name" content="transit.det.city" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="transit.det.city" />
        <meta name="description" content="Real-time transit information for Detroit and Southeast Michigan" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#1f2937" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#1f2937" />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/touch-icon-iphone.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/touch-icon-ipad.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/touch-icon-iphone-retina.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/touch-icon-ipad-retina.png" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* Splashscreen */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-2048-2732.jpg" sizes="2048x2732" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1668-2224.jpg" sizes="1668x2224" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1536-2048.jpg" sizes="1536x2048" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1125-2436.jpg" sizes="1125x2436" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1242-2208.jpg" sizes="1242x2208" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-750-1334.jpg" sizes="750x1334" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-640-1136.jpg" sizes="640x1136" />
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
        
        {/* PWA Install Prompt */}
        <InstallPrompt />
      </div>
    </ThemeProvider>
  );
}
