import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Link } from "gatsby";
import { ThemeProvider } from "../hooks/ThemeContext";
import React from "react";
import NavMenu from "./NavMenu";

/**
 * This is the layout component. It wraps everything, according to the gatsby-plugin-layout.
 * We should put header and nav stuff here, since it can persist state across pages.
 * @param {*} children
 * @returns
 */
export default function Layout({ children }) {
  return (
    <ThemeProvider>
      <div className="fill-page">
        <header className="bg-primary-light dark:bg-primary-dark bg-opacity-80 px-4">
          <div className="max-w-4xl py-2 mx-auto flex items-center justify-between">
            <Link to={`/`}>
              <h1 className="header font-bold text-gray-700 dark:text-gray-300 text-xl">
                transit<span className="text-gray-500 dark:text-gray-400">.det.city</span>
              </h1>
            </Link>
            <NavMenu />
          </div>
        </header>
        <div className="px-0f md:px-4">
          <div className="max-w-4xl mx-auto">{children}</div>
        </div>
        <footer className="h-32 mt-8 bg-primary-light dark:bg-primary-dark px-2 md:px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto">
            <p>{new Date().getFullYear()}</p>
            <div className="flex items-center justify-start gap-2">
              <GitHubLogoIcon />
              <p>GitHub: <a href="https://github.com/jmcbroom/multi-gtfs-gatsby">multi-gtfs-gatsby</a></p>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
  