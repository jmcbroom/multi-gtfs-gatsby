import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const BusIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 16c0 1.1.9 2 2 2h1v3c0 .6.4 1 1 1h1c.6 0 1-.4 1-1v-3h4v3c0 .6.4 1 1 1h1c.6 0 1-.4 1-1v-3h1c1.1 0 2-.9 2-2V6c0-3.5-3.6-4-8-4S4 2.5 4 6v10zm3.5 0c-.8 0-1.5-.7-1.5-1.5S6.7 13 7.5 13s1.5.7 1.5 1.5S8.3 16 7.5 16zm9 0c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zM18 10H6V6h12v4z" />
  </svg>
);

const VehicleBadge = ({ vehicleId, busNumber, vehicleType, size = "small", showIcon = true, active = true, notTracking = false }) => {
  const id = vehicleId || busNumber;
  if (!id) return null;

  const sizes = {
    xs: {
      container: "px-1.5 py-0.5 text-xs gap-1",
      icon: "w-2.5 h-2.5",
    },
    small: {
      container: "px-2 py-1 text-xs gap-1",
      icon: "w-3 h-3",
    },
    medium: {
      container: "px-2.5 py-1.5 text-sm gap-1.5",
      icon: "w-3.5 h-3.5",
    },
  };

  const sizeConfig = sizes[size] || sizes.small;

  return (
    <span
      className={`
        inline-flex items-center font-mono font-semibold rounded
        ${sizeConfig.container}
        ${active
          ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200"
          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 opacity-60"
        }
      `}
      title={notTracking ? "Vehicle not reporting location" : undefined}
    >
      {showIcon && <BusIcon className={sizeConfig.icon} />}
      {vehicleType && <span className="font-normal">{vehicleType}</span>}
      {id}
      {notTracking && <FontAwesomeIcon icon={faEyeSlash} className="text-red-400 dark:text-red-500" />}
    </span>
  );
};

export default VehicleBadge;