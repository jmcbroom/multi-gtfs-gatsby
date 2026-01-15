import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * A simple page header component with title and optional icon.
 * @param {string} title - The page title
 * @param {object} icon - FontAwesome icon (optional)
 * @param {React.ReactNode} children - Optional additional content (right side)
 * @param {string} className - Optional additional classes
 * @param {boolean} fullWidth - If true, keeps horizontal padding on all screen sizes
 */
const PageHeader = ({ title, icon, children, className = "", fullWidth = false }) => {
  return (
    <div className={`py-1.5 md:py-2 ${fullWidth ? 'px-3' : 'px-3 md:px-0'} flex items-center justify-between gap-2 md:gap-4 ${className}`}>
      <div className="flex items-center flex-shrink-0 gap-1.5">
        {icon && <FontAwesomeIcon icon={icon} className="text-xs md:text-sm text-gray-500 dark:text-zinc-400" />}
        <h2 className="mb-0 text-sm md:text-base font-semibold whitespace-nowrap">{title}</h2>
      </div>
      {children && <div className="min-w-0 overflow-x-auto">{children}</div>}
    </div>
  );
};

export default PageHeader;
