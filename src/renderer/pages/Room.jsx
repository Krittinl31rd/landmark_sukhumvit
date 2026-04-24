// import { Check, Pencil, X } from "lucide-react";
// import React, { useEffect, useState, useRef } from "react";
// import { toast } from "react-toastify";
// import { Link } from "react-router-dom";

// const Room = () => {
//   const [roomList, setRoomList] = useState([]);
//   const [isEditing, setIsEditing] = useState(false);
//   const [originalRoomList, setOriginalRoomList] = useState([]);

//   const fetchRoomList = async () => {
//     const response = await window.api.getRooms();
//     if (Array.isArray(response)) {
//       setRoomList(response);
//       setOriginalRoomList(JSON.parse(JSON.stringify(response)));
//     }
//   };

//   useEffect(() => {
//     fetchRoomList();
//   }, []);

//   useEffect(() => {
//     const handleReadData = (payload) => {
//       // updatedPayload: array of {room_id, gateway_id, device_id, control_id, , control_value }
//       const { gateway_id, room_id, device_id, control_id, control_value } =
//         payload;
//       setRoomList((prevRooms) => {
//         const newRooms = JSON.parse(JSON.stringify(prevRooms));
//         const room = newRooms.find((r) => r.id === room_id);
//         if (!room) return;
//         const device = room.devices.find((d) => d.device_id === device_id);
//         if (!device) return;
//         const control = device.device_control.find(
//           (c) => c.control_id === control_id
//         );
//         if (!control) return;
//         control.control_value = control_value;

//         return newRooms;
//       });
//     };

//     window.modbusAPI.onReadData(handleReadData);

//     return () => {
//       window.modbusAPI.offReadData(handleReadData);
//     };
//   }, []);

//   const generateChangedPayload = () => {
//     const changed = [];

//     roomList.forEach((room, roomIndex) => {
//       const originalRoom = originalRoomList[roomIndex];
//       if (!originalRoom) return;

//       room.devices.forEach((device, deviceIndex) => {
//         const originalDevice = originalRoom.devices[deviceIndex];
//         if (!originalDevice) return;

//         device.device_control.forEach((control, ctrlIndex) => {
//           const originalControl = originalDevice.device_control[ctrlIndex];
//           if (!originalControl) return;

//           if (control.control_value !== originalControl.control_value) {
//             changed.push({
//               gateway_id: room.gateway_id || "",
//               device_id: device.device_id || "",
//               control_id: control.control_id || "",
//               modbus_address: control.modbus_address || "",
//               control_value: control.control_value ?? "",
//             });
//           }
//         });
//       });
//     });

//     return changed;
//   };

//   const saveSettings = async () => {
//     const changedPayload = generateChangedPayload();

//     if (changedPayload.length === 0) {
//       toast.warning("No changes to save.");
//       return;
//     }
//     const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
//     try {
//       for (const item of changedPayload) {
//         await window.modbusAPI.writeData({
//           control_id: item.control_id,
//           control_value: item.control_value,
//           device_id: item.device_id,
//           gateway_id: item.gateway_id,
//           modbus_address: item.modbus_address,
//         });
//         await sleep(50); // 100ms delay between each write
//       }

//       toast.success("Settings saved!");
//       setIsEditing(false);
//       setOriginalRoomList(JSON.parse(JSON.stringify(roomList)));
//     } catch (error) {
//       toast.error("Failed to save settings.");
//     }
//   };

//   const updateControlValue = (
//     roomIndex,
//     deviceIndex,
//     controlIndex,
//     newValue
//   ) => {
//     setRoomList((prev) => {
//       const newList = JSON.parse(JSON.stringify(prev));
//       newList[roomIndex].devices[deviceIndex].device_control[
//         controlIndex
//       ].control_value = newValue;
//       return newList;
//     });
//   };

//   return (
//     <div className="w-full h-full flex flex-col gap-4 p-0 bg-base-200 overflow-auto">
//       <div className="w-full flex items-center justify-end gap-2">
//         <button
//           disabled={roomList.length === 0}
//           onClick={() => {
//             if (isEditing) {
//               setRoomList(JSON.parse(JSON.stringify(originalRoomList)));
//             }
//             setIsEditing(!isEditing);
//           }}
//           className="btn btn-sm btn-primary"
//         >
//           {isEditing ? (
//             <>
//               <X className="w-4 h-4" /> Cancel
//             </>
//           ) : (
//             <>
//               <Pencil className="w-4 h-4" /> Edit Setting
//             </>
//           )}
//         </button>

//         {isEditing && (
//           <button onClick={saveSettings} className="btn btn-sm btn-success">
//             <Check className="w-4 h-4" /> Save
//           </button>
//         )}
//       </div>

//       <div className="card bg-base-100 shadow-lg overflow-auto">
//         <div className="card-header p-6 border-b border-base-300">
//           <h2 className="card-title text-xl">Room Schedule Configuration</h2>
//         </div>

//         <div className="card-body p-0">
//           <div className="overflow-x-auto">
//             <table className="table table-zebra w-full">
//               <thead>
//                 <tr className="bg-base-200">
//                   <th className="text-center w-16">#</th>
//                   <th>Room Name</th>
//                   {/* <th className="text-center w-24">Enabled/Disabled</th> */}
//                   <th className="text-center w-32">Start Time</th>
//                   <th className="text-center w-32">End Time</th>
//                   <th className="text-center w-24">Use Timer</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {roomList.map((room, roomIndex) => {
//                   const timeDevice = room.devices?.find(
//                     (d) => d.device_type === 99
//                   );

//                   if (!timeDevice) {
//                     return (
//                       <tr key={room.id} className="hover">
//                         <td className="text-center font-mono font-bold">
//                           {String(roomIndex + 1).padStart(2, "0")}
//                         </td>
//                         <td>{room.name}</td>
//                         <td colSpan={3} className="text-center opacity-50">
//                           No time device
//                         </td>
//                       </tr>
//                     );
//                   }
//                   const controls = timeDevice.device_control || [];
//                   const getControlValue = (controlId) =>
//                     controls.find((c) => c.control_id === controlId)
//                       ?.control_value ?? 0;

//                   const useTimerEN = getControlValue(1);
//                   const useTimerValue = getControlValue(2) == 1;
//                   const startHour = getControlValue(3);
//                   const startMinute = getControlValue(4);
//                   const endHour = getControlValue(5);
//                   const endMinute = getControlValue(6);

//                   const toTimeString = (hour, minute) =>
//                     `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

//                   const fromTimeString = (timeStr) => {
//                     const [hh, mm] = timeStr.split(":").map(Number);
//                     return { hh, mm };
//                   };

//                   return (
//                     <tr key={room.id} className="hover">
//                       <td className="text-center font-mono font-bold">
//                         {String(roomIndex + 1).padStart(2, "0")}
//                       </td>
//                       <td>
//                         <div
//                           className="tooltip"
//                           data-tip="Click to control room"
//                         >
//                           <Link
//                             to={`/rooms_control/${room.id}`}
//                             className="underline"
//                           >
//                             {room.name}
//                           </Link>
//                         </div>
//                       </td>
//                       {/* <td className="text-center font-bold">
//                         {useTimerEN == 1 ? (
//                           <span className="text-success">{useTimerEN}</span>
//                         ) : (
//                           <span className="text-error">{useTimerEN}</span>
//                         )}
//                       </td> */}
//                       {/* Start Time */}
//                       <td className="text-center">
//                         {isEditing ? (
//                           <input
//                             type="time"
//                             className="input input-sm w-full"
//                             value={toTimeString(startHour, startMinute)}
//                             onChange={(e) => {
//                               const { hh, mm } = fromTimeString(e.target.value);
//                               updateControlValue(
//                                 roomIndex,
//                                 room.devices.indexOf(timeDevice),
//                                 controls.findIndex((c) => c.control_id === 3),
//                                 hh
//                               );
//                               updateControlValue(
//                                 roomIndex,
//                                 room.devices.indexOf(timeDevice),
//                                 controls.findIndex((c) => c.control_id === 4),
//                                 mm
//                               );
//                             }}
//                           />
//                         ) : (
//                           <div className="badge badge-outline">
//                             {toTimeString(startHour, startMinute)}
//                           </div>
//                         )}
//                       </td>
//                       {/* End Time */}
//                       <td className="text-center">
//                         {isEditing ? (
//                           <input
//                             type="time"
//                             className="input input-bordered input-sm w-full"
//                             value={toTimeString(endHour, endMinute)}
//                             onChange={(e) => {
//                               const { hh, mm } = fromTimeString(e.target.value);
//                               updateControlValue(
//                                 roomIndex,
//                                 room.devices.indexOf(timeDevice),
//                                 controls.findIndex((c) => c.control_id === 5),
//                                 hh
//                               );
//                               updateControlValue(
//                                 roomIndex,
//                                 room.devices.indexOf(timeDevice),
//                                 controls.findIndex((c) => c.control_id === 6),
//                                 mm
//                               );
//                             }}
//                           />
//                         ) : (
//                           <div className="badge badge-outline">
//                             {toTimeString(endHour, endMinute)}
//                           </div>
//                         )}
//                       </td>
//                       {/* Use Timer */}
//                       <td className="text-center">
//                         {isEditing ? (
//                           <input
//                             type="checkbox"
//                             className="toggle toggle-success toggle-sm"
//                             checked={useTimerValue}
//                             onChange={(e) =>
//                               updateControlValue(
//                                 roomIndex,
//                                 room.devices.indexOf(timeDevice),
//                                 controls.findIndex((c) => c.control_id === 2),
//                                 e.target.checked ? 1 : 0
//                               )
//                             }
//                           />
//                         ) : (
//                           <div
//                             className={`badge ${useTimerValue ? "badge-success" : "badge-error text-white"} gap-1`}
//                           >
//                             {useTimerValue ? "Active" : "Inactive"}
//                           </div>
//                         )}
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Room;

import { Check, Pencil, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const Room = () => {
  const [roomList, setRoomList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [originalRoomList, setOriginalRoomList] = useState([]);
  const [isSaving, setIsSaving] = useState(false); // 🔥 loading

  // ===== FETCH =====
  const fetchRoomList = async () => {
    const response = await window.api.getRooms();
    if (Array.isArray(response)) {
      setRoomList(response);
      setOriginalRoomList(JSON.parse(JSON.stringify(response)));
    }
  };

  useEffect(() => {
    fetchRoomList();
  }, []);

  // ===== MODBUS READ =====
  useEffect(() => {
    const handleReadData = (payload) => {
      const { room_id, device_id, control_id, control_value } = payload;

      setRoomList((prevRooms) => {
        const newRooms = JSON.parse(JSON.stringify(prevRooms));

        const room = newRooms.find((r) => r.id === room_id);
        if (!room) return prevRooms;

        const device = room.devices.find((d) => d.device_id === device_id);
        if (!device) return prevRooms;

        const control = device.device_control.find(
          (c) => c.control_id === control_id
        );
        if (!control) return prevRooms;

        control.control_value = control_value;

        return newRooms;
      });
    };

    window.modbusAPI.onReadData(handleReadData);
    return () => window.modbusAPI.offReadData(handleReadData);
  }, []);

  // ===== QUEUE SEND =====
  const sendWithQueue = async (tasks) => {
    setIsSaving(true);

    for (const task of tasks) {
      // 🔥 timeout กันค้าง
      const timeout = new Promise((resolve) => setTimeout(resolve, 2500));

      await Promise.race([window.modbusAPI.writeData(task), timeout]);

      await sleep(150); // 🔥 หน่วง (สำคัญมาก)
    }

    setIsSaving(false);
  };

  // ===== DIFF PAYLOAD =====
  const generateChangedPayload = () => {
    const changed = [];

    roomList.forEach((room, roomIndex) => {
      const originalRoom = originalRoomList[roomIndex];
      if (!originalRoom) return;

      room.devices.forEach((device, deviceIndex) => {
        const originalDevice = originalRoom.devices[deviceIndex];
        if (!originalDevice) return;

        device.device_control.forEach((control, ctrlIndex) => {
          const originalControl = originalDevice.device_control[ctrlIndex];
          if (!originalControl) return;

          if (control.control_value !== originalControl.control_value) {
            changed.push({
              gateway_id: room.gateway_id,
              device_id: device.device_id,
              control_id: control.control_id,
              modbus_address: control.modbus_address,
              control_value: control.control_value,
            });
          }
        });
      });
    });

    // 🔥 optional: sort ตาม device (ช่วยให้ modbus เสถียรขึ้น)
    return changed.sort((a, b) => a.device_id - b.device_id);
  };

  // ===== SAVE =====
  const saveSettings = async () => {
    const changedPayload = generateChangedPayload();

    if (changedPayload.length === 0) {
      toast.warning("No changes to save.");
      return;
    }

    try {
      await sendWithQueue(changedPayload);

      toast.success("Settings saved!");
      setIsEditing(false);
      setOriginalRoomList(JSON.parse(JSON.stringify(roomList)));
    } catch (error) {
      toast.error("Failed to save settings.");
    }
  };

  // ===== UPDATE UI =====
  const updateControlValue = (
    roomIndex,
    deviceIndex,
    controlIndex,
    newValue
  ) => {
    setRoomList((prev) => {
      const newList = JSON.parse(JSON.stringify(prev));
      newList[roomIndex].devices[deviceIndex].device_control[
        controlIndex
      ].control_value = newValue;
      return newList;
    });
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 bg-base-200 overflow-auto">
      {/* ===== HEADER ===== */}
      <div className="flex justify-end gap-2">
        <button
          disabled={roomList.length === 0 || isSaving}
          onClick={() => {
            if (isEditing) {
              setRoomList(JSON.parse(JSON.stringify(originalRoomList)));
            }
            setIsEditing(!isEditing);
          }}
          className="btn btn-sm btn-primary"
        >
          {isEditing ? (
            <>
              <X className="w-4 h-4" /> Cancel
            </>
          ) : (
            <>
              <Pencil className="w-4 h-4" /> Edit Setting
            </>
          )}
        </button>

        {isEditing && (
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="btn btn-sm btn-success"
          >
            {isSaving ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" /> Save
              </>
            )}
          </button>
        )}
      </div>

      {/* ===== TABLE ===== */}
      <div className="card bg-base-100 shadow-lg overflow-auto">
        <div className="card-header p-6 border-b">
          <h2 className="text-xl font-semibold">Room Schedule Configuration</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>#</th>
                <th>Room</th>
                <th>Start</th>
                <th>End</th>
                <th>Timer</th>
              </tr>
            </thead>

            <tbody>
              {roomList.map((room, roomIndex) => {
                const timeDevice = room.devices?.find(
                  (d) => d.device_type === 99
                );

                if (!timeDevice) return null;

                const controls = timeDevice.device_control;

                const getVal = (id) =>
                  controls.find((c) => c.control_id === id)?.control_value ?? 0;

                const startHour = getVal(3);
                const startMinute = getVal(4);
                const endHour = getVal(5);
                const endMinute = getVal(6);
                const useTimer = getVal(2) === 1;

                const toTime = (h, m) =>
                  `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

                const fromTime = (t) => {
                  const [hh, mm] = t.split(":").map(Number);
                  return { hh, mm };
                };

                return (
                  <tr key={room.id}>
                    <td>{roomIndex + 1}</td>

                    <td>
                      <Link
                        to={`/rooms_control/${room.id}`}
                        className="underline"
                      >
                        {room.name}
                      </Link>
                    </td>

                    {/* START */}
                    <td>
                      {isEditing ? (
                        <input
                          type="time"
                          value={toTime(startHour, startMinute)}
                          onChange={(e) => {
                            const { hh, mm } = fromTime(e.target.value);

                            updateControlValue(
                              roomIndex,
                              room.devices.indexOf(timeDevice),
                              controls.findIndex((c) => c.control_id === 3),
                              hh
                            );

                            updateControlValue(
                              roomIndex,
                              room.devices.indexOf(timeDevice),
                              controls.findIndex((c) => c.control_id === 4),
                              mm
                            );
                          }}
                          className="input input-sm"
                        />
                      ) : (
                        toTime(startHour, startMinute)
                      )}
                    </td>

                    {/* END */}
                    <td>
                      {isEditing ? (
                        <input
                          type="time"
                          value={toTime(endHour, endMinute)}
                          onChange={(e) => {
                            const { hh, mm } = fromTime(e.target.value);

                            updateControlValue(
                              roomIndex,
                              room.devices.indexOf(timeDevice),
                              controls.findIndex((c) => c.control_id === 5),
                              hh
                            );

                            updateControlValue(
                              roomIndex,
                              room.devices.indexOf(timeDevice),
                              controls.findIndex((c) => c.control_id === 6),
                              mm
                            );
                          }}
                          className="input input-sm"
                        />
                      ) : (
                        toTime(endHour, endMinute)
                      )}
                    </td>

                    {/* TIMER */}
                    <td>
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={useTimer}
                          onChange={(e) =>
                            updateControlValue(
                              roomIndex,
                              room.devices.indexOf(timeDevice),
                              controls.findIndex((c) => c.control_id === 2),
                              e.target.checked ? 1 : 0
                            )
                          }
                          className="toggle toggle-success "
                        />
                      ) : useTimer ? (
                        <div className="badge badge-success text-sm text-white w-full">
                          Active
                        </div>
                      ) : (
                        <div className="badge badge-error text-sm text-white w-full">
                          Inactive
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Room;
