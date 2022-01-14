import { Link } from "gatsby"
import React from "react"

/**
 * This is the layout component. It wraps everything, according to the gatsby-plugin-layout.
 * We should put header and nav stuff here, since it can persist state across pages.
 * @param {*} children 
 * @returns 
 */
export default function Layout({ children }) {
  return (
    <div style={{ margin: `0 auto`, maxWidth: 1300, padding: `0 1rem` }}>
      <header className="bg-blue-100 mb-4">
        <Link to={`/`}>
          <h1 className="py-4 text-3xl text-center" style={{fontFamily: "Shippori Antique"}}>detroit transit guide</h1>
        </Link>
      </header>
      {children}
      <footer className="h-32 mt-8 bg-blue-100 p-4 text-center">
        It is the year {new Date().getFullYear()}
      </footer>
    </div>
  )
}