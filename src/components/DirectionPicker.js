import React from "react";

/**
 * Let the user choose the current direction of travel.
 * @param {Array} directions: headsignsByDirectionId; keys are directions, values are distinct headsign array
 * @param {Number} direction: from useState, the current direction value
 * @param {Function} setDirection: from useState, the setter function
 * @returns 
 */
const DirectionPicker = ( {directions, direction, setDirection} ) => {
  return (
    <>
    <h2>
      Direction picker
    </h2>
    <select onChange={(e) => setDirection(e.target.value)}>
      {Object.keys(directions).map(dir => (
        <option value={dir} key={dir}>{dir}: {directions[dir].join(", ")}</option>
      ))}
    </select>
    </>
  )
}

export default DirectionPicker;