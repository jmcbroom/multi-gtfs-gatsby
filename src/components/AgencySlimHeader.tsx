import React from "react";
import { Link } from "gatsby";
import { AgencyType } from "../types/AgencyType";

/**
 *
 * @param {agency} agency object from GraphQL
 * @returns
 */
const AgencySlimHeader = ({ agency }: { agency: AgencyType }) => {
  const { slug, name, color, textColor } = agency;

  return (
    <div className="px-3 md:px-2 py-0 sm:py-1" style={{background: color.hex, opacity: 0.65}}>
      <Link to={`/${slug.current}/`}>
        <span className="text-left text-xs sm:text-sm font-bold" style={{color: textColor.hex}}>
          {name}
        </span>
      </Link>
    </div>
  );
};

export default AgencySlimHeader;