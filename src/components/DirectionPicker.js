import * as RadioGroup from "@radix-ui/react-radio-group";
import React from "react";

/**
 * Let the user choose the current direction of travel.
 * @param {Array} directions: headsignsByDirectionId; keys are directions, values are distinct headsign array
 * @param {Number} direction: from useState, the current direction value
 * @param {Function} setDirection: from useState, the setter function
 * @returns
 */
const DirectionPicker = ({ directions, direction, setDirection }) => {
  let display = {
    northbound: `Northbound`,
    southbound: `Southbound`,
    eastbound: `Eastbound`,
    westbound: `Westbound`,
  };

  return (
    <>
      <RadioGroup.Root
        className="radioGroupRoot"
        defaultValue={direction ? direction : Object.keys(directions)[0]}
        onValueChange={(e) => setDirection(e)}
      >
        {Object.keys(directions).map((dir) => (
          <div className="flex items-center" key={dir}>
            <RadioGroup.Item
              className="radioGroupItem"
              value={dir}
              id={dir}
              key={dir}
            >
              <RadioGroup.Indicator className="radioGroupIndicator" />
            </RadioGroup.Item>
            <label className="radioGroupLabel" htmlFor={dir}>
              <span className="font-semibold">
                {display[directions[dir].description]}
              </span>
              <span className="text-sm leading-none text-gray-600 dark:text-zinc-500">
                to {directions[dir].headsigns[0]}
              </span>
            </label>
          </div>
        ))}
      </RadioGroup.Root>
    </>
  );
};

export default DirectionPicker;
