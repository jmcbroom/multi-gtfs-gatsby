import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * A simple page header component with title and optional icon.
 * @param {string} title - The page title
 * @param {object} icon - FontAwesome icon (optional)
 * @param {React.ReactNode} children - Optional additional content (right side)
 * @param {string} className - Optional additional classes
 */
const PageHeader = ({ title, icon, children, className = "" }) => {
  return (
    <div className={`py-2 px-3 flex items-center justify-between gap-4 ${className}`}>
      <div className="flex items-center flex-shrink-0">
        {icon && <FontAwesomeIcon icon={icon} className="text-sm mr-1" />}
        <h2 className="ml-1 mb-0 block text-md whitespace-nowrap">{title}</h2>
      </div>
      {children && <div className="min-w-0 overflow-x-auto">{children}</div>}
    </div>
  );
};

export default PageHeader;
