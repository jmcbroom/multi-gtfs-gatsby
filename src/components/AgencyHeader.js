import React from "react";
import { Link } from "gatsby";
import config from "../config";

/**
 * 
 * @param {agency} agency object from GraphQL 
 * @returns 
 */
const AgencyHeader = ({ agency }) => {

  const {feedIndexes} = config;
  const { feedIndex, agencyName } = agency;

  return (
    <Link to={`/${feedIndexes[feedIndex]}/`}>
      <h2 className="mb-2 font-bold text-lg">
        {agencyName}
      </h2>
    </Link>
  )
}

export default AgencyHeader