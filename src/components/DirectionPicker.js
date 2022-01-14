import React from "react";

/**
 * Let the user choose the current direction of travel.
 * @param {Array} directions: headsignsByDirectionId; keys are directions, values are distinct headsign array
 * @param {Number} direction: from useState, the current direction value
 * @param {Function} setDirection: from useState, the setter function
 * @returns 
 */
const DirectionPicker = ({ directions, direction, setDirection }) => {
  return (
    <div className="flex items-center justify-start w-full md:w-auto">
      <span className="bg-gray-300 py-3 text-sm w-1/3 md:w-auto text-right px-4 md:text-center">
        Direction
      </span>
      <select className="w-2/3 md:w-auto" onChange={(e) => setDirection(e.target.value)}>
        {Object.keys(directions).map(dir => (
          <option value={dir} key={dir}>{directions[dir][0]}</option>
        ))}
      </select>
    </div>
  )
}

export default DirectionPicker;