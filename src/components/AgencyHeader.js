import React from "react";
import { Link } from "gatsby";

/**
 * 
 * @param {agency} agency object from GraphQL 
 * @returns 
 */
const AgencyHeader = ({ agency }) => {

  const { slug, name, fullName } = agency;

  return (
    <Link to={`/${slug.current}/`}>
      <h2 className="text-lg md:text-xl mb-0">
        {name}
      </h2>
      <span className="text-sm leading-none text-gray-500 dark:text-zinc-500">{fullName}</span>
    </Link>
  )
}

export default AgencyHeader