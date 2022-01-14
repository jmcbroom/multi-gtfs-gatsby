import React from "react";

export const views = [
  'Timetable',
  'List of trips',
]

/**
 * Let the user choose how they want to view the timetable.
 * @param {*} view: current value from useState hook
 * @param {*} setView: setter from useState hook
 * @returns
 */
export const RouteViewPicker = ({ view, setView }) => {
  return (
    <div className="flex items-center justify-start w-full md:w-auto">
      <span className="bg-gray-300 py-3 text-sm w-1/3 text-right px-4 md:text-center">
        View
      </span>
      <select className="w-2/3 md:w-auto" value={view} onChange={(e) => setView(e.target.value)}>
        {views.map(v => (
          <option value={v} key={v}>{v}</option>
        ))}
      </select>
    </div>
  );
};
