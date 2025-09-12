import React from "react";

const FunctionModbus = ({
  itemName,
  itemStart,
  itemEnd,
  fc,
  dataModbus,
  ip,
}) => {
  const start = itemStart || 0;
  const length = itemEnd || 0;
  const Indexes = Array.from({ length }, (_, i) => start + i);
  return (
    <div className="w-full bg-base-300 rounded-field p-2">
      <div>
        <h1 className="font-semibold">{itemName}</h1>
        <div className="text-sm">Start : {itemStart}</div>
        <div className="text-sm">Length : {itemEnd}</div>
      </div>
      <div className="w-full h-96 bg-base-100 overflow-auto p-2 rounded-field cursor-default">
        <ul className="text-sm">
          {Indexes.map((addr) => {
            const value = dataModbus?.[ip]?.[fc]?.[addr] ?? "-";
            return (
              <li key={addr}>
                <div className="flex items-center justify-between font-mono">
                  {/* Address */}
                  <div className="min-w-20 text-left">
                    {String(addr).padStart(5, "0")} :
                  </div>
                  {/* Value */}
                  <div className="min-w-20 text-end">{`< ${value} >`}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default FunctionModbus;
