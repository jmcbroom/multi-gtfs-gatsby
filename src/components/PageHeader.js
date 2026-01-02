import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * A simple page header component with title and optional icon.
 * @param {string} title - The page title
 * @param {object} icon - FontAwesome icon (optional)
 */
const PageHeader = ({ title, icon }) => {
  return (
    <div className="my-2 md:my-3 px-3 md:px-0 flex items-center justify-normal">
      {icon && <FontAwesomeIcon icon={icon} className="text-sm mr-1" />}
      <h2 className="ml-1 mb-0 block text-md">{title}</h2>
    </div>
  );
};

export default PageHeader;
