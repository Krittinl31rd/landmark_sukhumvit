import React, { useState } from "react";
import { Lightbulb } from "lucide-react";

const brightArr = [0, 20, 40, 60, 80, 100];
const opacity = {
  0: "opacity-0",
  20: "opacity-20",
  40: "opacity-40",
  60: "opacity-60",
  80: "opacity-80",
  100: "opacity-100",
};

const LightSet = ({ handleSend }) => {
  const [bright, setBright] = useState(50);
  return (
    <div className="w-full bg-base-100 rounded-box p-2 space-y-2">
      <h1 className="font-semibold text-accent-content">Light</h1>
      <div className="flex items-center justify-center">{bright}%</div>
      <div className="w-full flex items-center justify-center">
        <input
          type="range"
          min={0}
          max={100}
          value={bright ?? 0}
          className="range range-xs range-warning w-[300px] "
          onChange={(e) => setBright(Number(e.target.value))}
          onMouseUp={(e) => handleSend(Number(e.target.value))}
        />
      </div>
      <div className="w-full flex items-center justify-center flex-wrap gap-2 mt-1">
        {brightArr.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center justify-center">
            <button
              id={`bright${item}`}
              className="btn btn-xs btn-outline w-8 h-8 rounded-full"
              onClick={() => {
                handleSend(Number(item));
                setBright(Number(item));
              }}
            >
              <Lightbulb className={`w-4 h-4 text-warning ${opacity[item]}`} />
            </button>
            <label htmlFor={`bright${item}`} className="text-xs">
              {item}%
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LightSet;
