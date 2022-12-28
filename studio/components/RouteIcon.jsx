import React from "react";

const RouteIcon = (props) => {
  const { shortName, color, textColor } = props;
    
  return (
    <div
      style={{
        width: `100%`,
        height: `100%`,
        backgroundColor: color.hex,
        color: textColor.hex,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          display: "inline-block",
          fontWeight: "700",
          fontSize: shortName.length === 3 ? "0.8em" : "1em",
        }}
      >
        {shortName}
      </span>
    </div>
  );
};

export default RouteIcon;