import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * A simple page header component with title and optional icon.
 * @param {string} title - The page title
 * @param {object} icon - FontAwesome icon (optional)
 */
const PageHeader = ({ title, icon }) => {
  return (
    <div className="my-4 px-4 flex items-center justify-normal">
      {icon && <FontAwesomeIcon icon={icon} className="mr-2 md:mr-0" />}
      <h2 className="ml-2 mb-0 block">{title}</h2>
    </div>
  );
};

export default PageHeader;
