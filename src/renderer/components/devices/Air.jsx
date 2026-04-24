// import { Fan, Wind } from "lucide-react";
// import React, { useEffect, useState } from "react";

// const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// const Air = ({ gateway_id, airDevices }) => {
//   const [temps, setTemps] = useState({});
//   const [min, setMin] = useState(21);
//   const [max, setMax] = useState(28);

//   useEffect(() => {
//     const updated = {};
//     airDevices.forEach((dev) => {
//       const ctrl = dev.device_control.find((c) => c.control_id === 2);
//       updated[dev.device_id] = ctrl ? Number(ctrl.control_value) / 10 : 0;
//     });
//     setTemps(updated);
//   }, [airDevices]);

//   // Handle ON/OFF toggle
//   const toggleOnOff = (dev, value) => {
//     const fanControl = dev?.device_control?.find(
//       (item) => item.control_id == 1
//     );
//     handleSend(dev, fanControl, value == true ? 1 : 0);
//   };

//   // Handle fan speed buttons
//   const setFanSpeed = (dev, value) => {
//     const fanControl = dev?.device_control?.find(
//       (item) => item.control_id == 1
//     );

//     setRoom((prev) => {
//       if (!prev) return prev;

//       return {
//         ...prev,
//         devices: prev.devices.map((device) => {
//           const found = formatted.find((f) => f.device_id === device.device_id);
//           if (!found) return device;

//           return {
//             ...device,
//             device_control: device.device_control.map((c) =>
//               c.control_id === found.control_id
//                 ? { ...c, control_value: found.control_value }
//                 : c
//             ),
//           };
//         }),
//       };
//     });

//     handleSend(dev, fanControl, value);
//   };

//   // Handle temperature slider
//   const setTemperature = async (dev, value) => {
//     const tempControl = dev?.device_control?.find(
//       (item) => item.control_id == 2
//     );
//     const fanControl = dev?.device_control?.find(
//       (item) => item.control_id == 1
//     );

//     if (fanControl?.control_value < 1) {
//       await handleSend(dev, fanControl, 1);
//       await sleep(300);
//     }
//     if (tempControl) {
//       await handleSend(dev, tempControl, Number(value) * 10);
//       await sleep(300);
//     }
//   };

//   const handleSend = (dev, ctrl, value) => {
//     window.modbusAPI.writeData({
//       gateway_id: gateway_id,
//       device_id: dev.device_id,
//       control_id: ctrl.control_id,
//       modbus_address: ctrl.modbus_address,
//       control_value: value,
//     });
//   };

//   return airDevices.map((item, idx) => (
//     <div
//       key={idx}
//       className="flex flex-col justify-center gap-2 w-full bg-base-100 p-2 rounded-box"
//     >
//       {/* Device Name + ON/OFF */}
//       <div className="w-full flex items-center justify-between">
//         <h1 className="font-semibold text-accent-content">
//           {item?.device_name}
//         </h1>
//         <div className="flex items-center gap-1">
//           <label htmlFor={`on_off-${idx}`} className="text-xs">
//             ON/OFF
//           </label>
//           <input
//             id={`on_off-${idx}`}
//             type="checkbox"
//             checked={
//               item?.device_control?.find((c) => c.control_id == 1)
//                 ?.control_value >= 1
//             }
//             onChange={(e) => toggleOnOff(item, e.target.checked)}
//             className="toggle toggle-xs toggle-success"
//           />
//         </div>
//       </div>

//       {/* Fan Speed Buttons */}
//       {/* <div className="w-full flex items-center justify-end gap-1">
//         <Wind className="w-4 h-4" />
//         <div className="join">
//           {[1, 2, 3].map((speed, sIdx) => (
//             <button
//               key={sIdx}
//               className={`btn btn-xs join-item ${
//                 item?.device_control?.find((c) => c.control_id == 1)
//                   ?.control_value === speed && "btn-success"
//               }`}
//               onClick={() => setFanSpeed(item, speed)}
//             >
//               {speed == 1 ? "L" : speed == 2 ? "M" : "H"}
//             </button>
//           ))}
//         </div>
//       </div> */}

//       {/* Temperature Slider */}
//       <div className="flex-1 space-y-2">
//         <div className="w-full flex items-center justify-between">
//           <div className="text-xs">
//             <span className="font-semibold text-sm">
//               {temps[item.device_id] ?? 0}
//             </span>{" "}
//             <span className="font-semibold">℃</span>
//           </div>
//           {item?.device_control?.find((c) => c.control_id == 3).modbus_address >
//             -1 && <div className="text-xs">Room temp ℃</div>}
//         </div>
//         <div className="w-full grid grid-cols-2 gap-0.5">
//           <input
//             type="range"
//             min={min}
//             max={max}
//             value={temps[item.device_id] ?? 0}
//             onChange={(e) =>
//               setTemps((prev) => ({
//                 ...prev,
//                 [item.device_id]: Number(e.target.value),
//               }))
//             }
//             onMouseUp={(e) => setTemperature(item, Number(e.target.value))}
//             className="range range-xs col-span-2"
//           />
//           <span className="text-xs text-left cursor-pointer">{min}</span>
//           <span className="text-xs text-right cursor-pointer">{max}</span>
//         </div>
//       </div>
//     </div>
//   ));
// };

// export default Air;

import { Fan } from "lucide-react";
import React, { useEffect, useState } from "react";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const Air = ({ gateway_id, airDevices, setIsSending, isSending, setRoom }) => {
  const [temps, setTemps] = useState({});
  const [loadingMap, setLoadingMap] = useState({}); //  loading รายตัว
  const [min] = useState(21);
  const [max] = useState(28);

  useEffect(() => {
    const updated = {};
    airDevices.forEach((dev) => {
      const ctrl = dev.device_control.find((c) => c.control_id === 2);
      updated[dev.device_id] = ctrl ? Number(ctrl.control_value) / 10 : 0;
    });
    setTemps(updated);
  }, [airDevices]);

  //  ส่งทีละตัว + หน่วง + timeout
  const sendWithQueue = async (tasks) => {
    setIsSending(true);

    for (const task of tasks) {
      const key = `${task.device_id}_${task.control_id}`;

      //  set loading per control
      setLoadingMap((prev) => ({ ...prev, [key]: true }));

      //  optimistic UI
      setRoom((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          devices: prev.devices.map((device) => {
            if (device.device_id !== task.device_id) return device;

            return {
              ...device,
              device_control: device.device_control.map((c) =>
                c.control_id === task.control_id
                  ? { ...c, control_value: task.control_value }
                  : c
              ),
            };
          }),
        };
      });

      //  timeout guard
      const timeout = new Promise(
        (resolve) => setTimeout(resolve, 2000) // กันค้าง
      );

      await Promise.race([window.modbusAPI.writeData(task), timeout]);

      await sleep(200); //  หน่วงแต่ละคำสั่ง
    }

    //  clear loading
    setTimeout(() => {
      setLoadingMap({});
      setIsSending(false);
    }, 1000);
  };

  // ===== ACTIONS =====

  const toggleOnOff = (dev, value) => {
    const fanControl = dev.device_control.find((c) => c.control_id == 1);

    sendWithQueue([
      {
        gateway_id,
        device_id: dev.device_id,
        control_id: fanControl.control_id,
        modbus_address: fanControl.modbus_address,
        control_value: value ? 1 : 0,
      },
    ]);
  };

  const setFanSpeed = (dev, value) => {
    const fanControl = dev.device_control.find((c) => c.control_id == 1);

    sendWithQueue([
      {
        gateway_id,
        device_id: dev.device_id,
        control_id: fanControl.control_id,
        modbus_address: fanControl.modbus_address,
        control_value: value,
      },
    ]);
  };

  const setTemperature = async (dev, value) => {
    const tempControl = dev.device_control.find((c) => c.control_id == 2);
    const fanControl = dev.device_control.find((c) => c.control_id == 1);

    const tasks = [];

    if (fanControl?.control_value < 1) {
      tasks.push({
        gateway_id,
        device_id: dev.device_id,
        control_id: fanControl.control_id,
        modbus_address: fanControl.modbus_address,
        control_value: 1,
      });
    }

    tasks.push({
      gateway_id,
      device_id: dev.device_id,
      control_id: tempControl.control_id,
      modbus_address: tempControl.modbus_address,
      control_value: Number(value) * 10,
    });

    await sendWithQueue(tasks);
  };

  // ===== UI =====

  return airDevices.map((item, idx) => {
    const fan = item.device_control.find((c) => c.control_id == 1);
    const temp = item.device_control.find((c) => c.control_id == 2);

    const fanKey = `${item.device_id}_1`;
    const tempKey = `${item.device_id}_2`;

    return (
      <div
        key={idx}
        className="flex flex-col gap-2 w-full bg-base-100 p-2 rounded-box"
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="font-semibold">{item.device_name}</h1>

          <div className="flex items-center gap-2">
            {loadingMap[fanKey] && (
              <span className="loading loading-spinner loading-xs"></span>
            )}

            <input
              type="checkbox"
              checked={fan?.control_value >= 1}
              onChange={(e) => toggleOnOff(item, e.target.checked)}
              className="toggle toggle-xs toggle-success"
              disabled={isSending}
            />
          </div>
        </div>

        {/* Temp */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>{temps[item.device_id] ?? 0}℃</span>

            {loadingMap[tempKey] && (
              <span className="loading loading-spinner loading-xs"></span>
            )}
          </div>

          <input
            type="range"
            min={min}
            max={max}
            value={temps[item.device_id] ?? 0}
            onChange={(e) =>
              setTemps((prev) => ({
                ...prev,
                [item.device_id]: Number(e.target.value),
              }))
            }
            onMouseUp={(e) => setTemperature(item, Number(e.target.value))}
            className="range range-xs"
            disabled={isSending}
          />
        </div>
      </div>
    );
  });
};

export default Air;
