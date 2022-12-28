import React, { useCallback } from "react";
import { set, unset } from "sanity";
import { Card } from "@sanity/ui";

const TimeInput = (props) => {
  const {
    ref,
    onBlur,  
    onFocus,
    readOnly
  } = props.elementProps;
  
  const {
    onChange,
    schemaType,
    value
  } = props;
  
  const handleChange = useCallback((event) => {
    onChange(event.currentTarget.value ? set(event.currentTarget.value) : unset())
  }, [onChange]);
  
  return (
    <Card border={true}>
      <input
        type="time"
        ref={ref}
        onBlur={onBlur}
        onFocus={onFocus}
        readOnly={readOnly}
        onChange={handleChange}
        schemaType={schemaType}
        value={value}
        style={{
          width: "100%",
          padding: "0.8em",
          background: "none",
          border: "none",
          boxSizing: "border-box"
        }}
      />
    </Card>
  );
};

export default TimeInput;