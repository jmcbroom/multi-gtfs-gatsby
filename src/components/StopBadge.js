import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBusSimple } from "@fortawesome/free-solid-svg-icons";

const StopBadge = ({ stopId, size = "small", borderColor }) => {
  if (!stopId) return null;

  const sizes = {
    xs: {
      container: "px-1.5 py-0.5 text-xs gap-1",
      icon: "text-[10px]",
      border: "border",
    },
    small: {
      container: "px-2 py-1 text-xs gap-1",
      icon: "text-xs",
      border: "border",
    },
    medium: {
      container: "px-2.5 py-1.5 text-sm gap-1.5",
      icon: "text-sm",
      border: "border-2",
    },
  };

  const sizeConfig = sizes[size] || sizes.small;

  const borderStyle = borderColor
    ? { borderColor: borderColor, borderWidth: size === "medium" ? 2 : 1 }
    : {};

  return (
    <span
      className={`
        inline-flex items-center font-mono rounded
        ${sizeConfig.container}
        bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300
        ${borderColor ? "" : "border-transparent"}
      `}
      style={borderStyle}
    >
      <FontAwesomeIcon icon={faBusSimple} className={sizeConfig.icon} />
      <span className="font-normal">stop</span>
      <span className="font-semibold">#{stopId}</span>
    </span>
  );
};

export default StopBadge;
