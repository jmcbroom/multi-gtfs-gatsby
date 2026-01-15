import React from "react";

const RouteBadge = ({ route, size="small" }) => {
  if (!route) return null;

  let { displayShortName, routeColor, routeTextColor } = route;

  // Handle missing displayShortName
  if (!displayShortName) {
    displayShortName = '?';
  }

  let widths = {
    xxs: {
      1: "w-4",
      2: "w-4",
      3: "w-6",
      4: "w-7",
      5: "w-8",
    },
    xs: {
      1: "w-6",
      2: "w-6",
      3: "w-7",
      4: "w-8",
      5: "w-8",
    },
    small: {
      1: "w-6",
      2: "w-6",
      3: "w-8",
      4: "w-10",
      5: "w-10",
    },
    medium: {
      1: 'w-8',
      2: 'w-8',
      3: 'w-10',
      4: 'w-12',
      5: 'w-14',
    },
    large: {
      1: 'w-10',
      2: 'w-10',
      3: 'w-12',
      4: 'w-16',
      5: 'w-20',
    },
  };

  let classes = {
    xxs: `font-bold text-center py-0 text-xxs font-semibold bg-white tracking-tighter tabular-nums ` + widths[size][displayShortName.length],
    xs: `font-bold text-center py-1 text-xs font-semibold bg-white tracking-tighter tabular-nums ` + widths[size][displayShortName.length],
    small: `font-bold text-center py-1.5 text-xs bg-white tabular-nums ` + widths[size][displayShortName.length],
    medium: `font-bold text-center py-2 text-sm bg-white tabular-nums ` + widths[size][displayShortName.length],
    large: `font-bold text-center py-3 text-base bg-white tabular-nums ` + widths[size][displayShortName.length],
  }

  return (
    <span
      className={classes[size]}
      style={{
        background: `${routeColor}`,
        color: `${routeTextColor}`,
      }}
    >
      {displayShortName}
    </span>
  );
};

export default RouteBadge;
