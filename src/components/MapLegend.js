import React from "react";

const MapLegend = ({ marks, text }) => {


  let markClasses = marks.map((mark) => `${mark.size} bg-${mark.color}-500 rounded-full border-2 border-black dark:border-zinc-200`);

  console.log(markClasses);

  return (
    <div>
      <h4>Map legend</h4>
      <div className="grid grid-cols-2 gap-2 pt-2">
        {marks.map((mark, idx) => (
          <div className="flex items-center gap-2" key={mark.text}>
            <div
              className={markClasses[idx]}
              style={{
                backgroundColor: mark.color,
              }}
            ></div>
            <p>{mark.text}</p>
          </div>
        ))}
      </div>
      <p className="text-sm mt-2 p-0 dark:text-zinc-400 text-slate-600">
        {text}
      </p>
    </div>
  );
};

export default MapLegend;
