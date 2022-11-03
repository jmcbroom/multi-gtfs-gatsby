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
        <Link to={`/`}>
          <h1 className="py-4 text-3xl">transit.det.city</h1>
        </Link>
      </header>
      {children}
      <footer className="h-32 mt-8 bg-blue-100 p-4 text-center">{new Date().getFullYear()}</footer>
    </div>
  );
}
