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
      <header className="bg-blue-100 mb-4 px-4">
        <div className="max-w-4xl py-2 mx-auto flex items-center">
          <div>
            <Link to={`/`}>
              <h1 className="header font-bold text-gray-600 text-xl">
                transit<span className="text-gray-400">.det.city</span>
              </h1>
            </Link>
            <p className="m-0 text-sm text-gray-600">A Detroit-area transit rider's manual</p>
          </div>
        </div>
      </header>
      <div className="max-w-4xl mx-auto pl-2 md:pl-0 pr-3 md:pr-0">
        {children}
      </div>
      <footer className="h-32 mt-8 bg-blue-100 p-4 text-center">{new Date().getFullYear()}</footer>
    </div>
  );
}
