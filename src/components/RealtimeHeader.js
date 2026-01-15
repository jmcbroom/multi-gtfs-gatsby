import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWifi } from "@fortawesome/free-solid-svg-icons";

/**
 * Header component for real-time data sections.
 * Shows a title with a countdown timer and wifi indicator.
 *
 * @param {string} title - The header text (e.g., "Real-time info", "Upcoming arrivals")
 * @param {number} countdown - Seconds until next refresh (null to hide)
 * @param {boolean} enabled - Whether real-time is active (affects icon color)
 * @param {ReactNode} children - Optional extra content (e.g., play/pause controls)
 */
const RealtimeHeader = ({ title, countdown, enabled = true, children }) => {
  return (
    <div className={`grayHeader flex items-center justify-between ${!enabled ? "text-gray-400" : ""}`}>
      <span>{title}</span>
      <div className="flex items-center gap-2">
        <FontAwesomeIcon
          icon={faWifi}
          className={enabled ? "text-green-500" : "text-gray-300 dark:text-zinc-600"}
        />
        {children}
        {countdown !== undefined && countdown !== null && (
          <span className="text-xs text-gray-400 dark:text-zinc-500 font-mono tabular-nums">
            {countdown}s
          </span>
        )}
      </div>
    </div>
  );
};

export default RealtimeHeader;
