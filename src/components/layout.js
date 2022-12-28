import { faBusAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "gatsby";
import React from "react";

/**
 * This is the layout component. It wraps everything, according to the gatsby-plugin-layout.
 * We should put header and nav stuff here, since it can persist state across pages.
 * @param {*} children
 * @returns
 */
export default function Layout({ children }) {
  return (
    <div>
      <header className="bg-primary bg-opacity-80 px-4">
        <div className="max-w-4xl py-2 mx-auto flex items-center justify-between">
          <Link to={`/`}>
            <h1 className="header font-bold text-gray-700 text-xl">
              transit<span className="text-gray-500">.det.city</span>
            </h1>
          </Link>
        </div>
      </header>
      <div className="px-0f md:px-4">
        <div className="max-w-4xl mx-auto">{children}</div>
      </div>
      <footer className="h-32 mt-8 bg-primary px-2 md:px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto">
          <p>It's {new Date().getFullYear()} -- time to get on the bus!</p>
        </div>
      </footer>
    </div>
  );
}
