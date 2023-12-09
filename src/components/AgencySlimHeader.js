import React from "react";
import { Link } from "gatsby";

/**
 *
 * @param {agency} agency object from GraphQL
 * @returns
 */
const AgencySlimHeader = ({ agency }) => {
  const { slug, name, color, textColor } = agency;

  return (
    <div className="px-3 md:px-2 py-1" style={{background: color.hex, opacity: 0.65}}>
      <Link to={`/${slug.current}/`}>
        <span className="text-left text-sm font-bold" style={{color: textColor.hex}}>
          {name}
        </span>
      </Link>
    </div>
  );
};

export default AgencySlimHeader;
