import { Check, Pencil, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const Room = () => {
  const [roomList, setRoomList] = useState([]);
  const [clock, setClock] = useState([]);
  const [isSyncingClock, setIsSyncingClock] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalRoomList, setOriginalRoomList] = useState([]);
  const [isSaving, setIsSaving] = useState(false); // loading
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedDay, setSelectedDay] = useState("mon");
  const selectedRoom = roomList.find((r) => r.id === selectedRoomId);

  // ===== FETCH =====
  const fetchRoomList = async () => {
    const response = await window.api.getRooms();
    if (Array.isArray(response)) {
      setRoomList(response);
      setOriginalRoomList(JSON.parse(JSON.stringify(response)));
    }
  };

  const fetchClockMaster = async () => {
    const response = await window.api.getClockMaster();
    // console.log(response);
    if (Array.isArray(response)) {
      setClock(response);
    }
  };

  useEffect(() => {
    fetchRoomList();
    fetchClockMaster();
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
      // await Promise.race([window.modbusAPI.writeDataMulti(task), timeout]);

      await sleep(250); // 🔥 หน่วง (สำคัญมาก)
    }

    setIsSaving(false);
  };

  const generateChangedPayload = () => {
    const changed = [];

    roomList.forEach((room, roomIndex) => {
      const originalRoom = originalRoomList[roomIndex];
      if (!originalRoom) return;

      let roomChanged = false;

      // ตรวจว่าห้องมีการเปลี่ยนแปลงไหม
      room.devices.forEach((device, deviceIndex) => {
        const originalDevice = originalRoom.devices[deviceIndex];
        if (!originalDevice) return;

        device.device_control.forEach((control, ctrlIndex) => {
          const originalControl = originalDevice.device_control[ctrlIndex];
          if (!originalControl) return;

          if (control.control_value !== originalControl.control_value) {
            roomChanged = true;
          }
        });
      });

      if (!roomChanged) return;

      // ส่งเฉพาะ Timer Device
      const timeDevice = room.devices.find(
        (device) => device.device_type === 99
      );

      if (!timeDevice) return;

      timeDevice.device_control.forEach((control) => {
        if (control.control_id === 1) return;

        changed.push({
          gateway_id: room.gateway_id,
          room_id: room.id,
          device_id: timeDevice.device_id,
          control_id: control.control_id,
          modbus_address: control.modbus_address,
          control_value: control.control_value,
        });
      });
    });

    return changed.sort((a, b) => a.modbus_address - b.modbus_address);
  };

  // const generateChangedPayload = () => {
  //   const changed = [];

  //   roomList.forEach((room, roomIndex) => {
  //     const originalRoom = originalRoomList[roomIndex];
  //     if (!originalRoom) return;

  //     const timeDevice = room.devices.find((d) => d.device_type === 99);

  //     const originalTimeDevice = originalRoom.devices.find(
  //       (d) => d.device_type === 99
  //     );

  //     if (!timeDevice || !originalTimeDevice) return;

  //     let hasChange = false;

  //     const values = [];

  //     timeDevice.device_control.forEach((control, i) => {
  //       if (i > 1) {
  //         const original = originalTimeDevice.device_control[i];
  //         if (!original) return;

  //         if (control.control_value !== original.control_value) {
  //           hasChange = true;
  //         }

  //         values.push(control.control_value);
  //       }
  //     });

  //     if (!hasChange) return;

  //     const baseAddress = Math.min(
  //       ...timeDevice.device_control.map((c) => c.modbus_address)
  //     );

  //     changed.push({
  //       fc: 16,
  //       gateway_id: room.gateway_id,
  //       room_id: room.id,
  //       device_id: timeDevice.device_id,
  //       address: baseAddress,
  //       values,
  //     });
  //   });

  //   return changed;
  // };

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

  const getClockValue = (label) => {
    return clock?.[0]?.controls?.find((c) => c.label === label).control_value;
  };

  // const generateClockPayload = () => {
  //   if (!clock.length) return null;

  //   const now = new Date();

  //   const controls = [...clock[0].controls].sort(
  //     (a, b) => a.modbus_address - b.modbus_address
  //   );

  //   return {
  //     fc: 16,
  //     gateway_id: clock[0].gateway_id,
  //     address: controls[0].modbus_address,
  //     values: [
  //       now.getDate(),
  //       now.getMonth() + 1,
  //       now.getFullYear() % 100, // 2026 -> 26
  //       now.getHours(),
  //       now.getMinutes(),
  //     ],
  //   };
  // };

  const generateClockPayload = () => {
    if (!clock.length) return [];

    const now = new Date();

    return clock[0].controls.map((control) => {
      let value = 0;

      switch (control.label) {
        case "date":
          value = now.getDate();
          break;
        case "month":
          value = now.getMonth() + 1;
          break;
        case "year":
          value = now.getFullYear() % 100;
          break;
        case "hour":
          value = now.getHours();
          break;
        case "min":
          value = now.getMinutes();
          break;
      }

      return {
        gateway_id: clock[0].gateway_id,
        control_id: control.control_id,
        modbus_address: control.modbus_address,
        control_value: value,
      };
    });
  };

  // const syncClock = async () => {
  //   try {
  //     setIsSyncingClock(true);

  //     const payload = generateClockPayload();

  //     if (!payload) {
  //       toast.error("Clock config not found");
  //       return;
  //     }
  //     // console.log(payload);
  //     await window.modbusAPI.writeDataMulti(payload);

  //     setClock((prev) => {
  //       if (!prev.length) return prev;

  //       const newClock = structuredClone(prev);

  //       newClock[0].controls.forEach((control, index) => {
  //         control.control_value = payload.values[index];
  //       });

  //       return newClock;
  //     });

  //     toast.success("Clock synchronized");
  //   } catch (error) {
  //     toast.error("Failed to sync clock");
  //   } finally {
  //     setIsSyncingClock(false);
  //   }
  // };

  const syncClock = async () => {
    try {
      setIsSyncingClock(true);

      const payloads = generateClockPayload();

      if (!payloads.length) {
        toast.error("Clock config not found");
        return;
      }

      await sendWithQueue(payloads);

      setClock((prev) => {
        if (!prev.length) return prev;

        const newClock = structuredClone(prev);

        payloads.forEach((payload) => {
          const control = newClock[0].controls.find(
            (c) => c.control_id === payload.control_id
          );

          if (control) {
            control.control_value = payload.control_value;
          }
        });

        return newClock;
      });

      toast.success("Clock synchronized");
    } catch (error) {
      toast.error("Failed to sync clock");
    } finally {
      setIsSyncingClock(false);
    }
  };

  const saveWeeklySchedule = async () => {
    try {
      for (const room of roomList) {
        await window.api.updateRoomSchedule({
          roomId: room.id,
          schedule: room.schedule,
        });
      }

      toast.success("Weekly schedule saved");
    } catch (error) {
      toast.error("Failed to save schedule");
    }
  };

  const syncTodaySchedule = async () => {
    const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

    const today = days[new Date().getDay()];

    const cloned = structuredClone(roomList);

    cloned.forEach((room) => {
      const sch = room.schedule?.[today];

      if (!sch) return;

      const timerDevice = room.devices?.find((d) => d.device_type === 99);

      if (!timerDevice) return;

      const [startHour, startMinute] = sch.start.split(":").map(Number);

      const [endHour, endMinute] = sch.end.split(":").map(Number);

      timerDevice.device_control.forEach((control) => {
        switch (control.control_id) {
          case 2:
            control.control_value = sch.enable ? 1 : 0;
            break;
          case 3:
            control.control_value = startHour;
            break;
          case 4:
            control.control_value = startMinute;
            break;
          case 5:
            control.control_value = endHour;
            break;
          case 6:
            control.control_value = endMinute;
            break;
        }
      });
    });

    setRoomList(cloned);

    toast.success("Today's schedule loaded. Click Save to write Modbus.");
  };

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col gap-4 bg-base-200 overflow-auto">
      <div className="flex items-center justify-between p-4 bg-base-100 border rounded-lg">
        <div className="flex flex-col text-sm">
          <div>
            <span className="font-semibold">Gateway Time:</span>{" "}
            {getClockValue("date")}/{getClockValue("month")}/
            {String(getClockValue("year")).padStart(2, "0")}{" "}
            {String(getClockValue("hour")).padStart(2, "0")}:
            {String(getClockValue("min")).padStart(2, "0")}
          </div>
        </div>

        <button
          className="btn btn-sm btn-primary"
          onClick={syncClock}
          disabled={isSyncingClock}
        >
          {isSyncingClock ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              Syncing...
            </>
          ) : (
            "Sync Clock"
          )}
        </button>
      </div>

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
          <>
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
            <button
              className="btn btn-sm btn-warning"
              onClick={syncTodaySchedule}
            >
              Sync Today To Modbus
            </button>
          </>
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

      {/* ===== WEEKLY SCHEDULE ===== */}
      <div className="card bg-base-100 shadow-lg overflow-auto">
        <div className="card-header p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Weekly Schedule Configuration
            </h2>

            <div className="flex gap-2">
              <button
                className="btn btn-sm btn-success"
                onClick={saveWeeklySchedule}
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Room</th>
                <th>Mon</th>
                <th>Tue</th>
                <th>Wed</th>
                <th>Thu</th>
                <th>Fri</th>
                <th>Sat</th>
                <th>Sun</th>
              </tr>
            </thead>

            <tbody>
              {roomList.map((room) => (
                <tr key={`schedule-${room.id}`}>
                  <td>{room.name}</td>

                  {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map(
                    (day) => {
                      const sch = room.schedule?.[day];

                      return (
                        <td key={day}>
                          <button
                            className="btn btn-xs btn-outline"
                            onClick={() => {
                              setSelectedRoomId(room.id);
                              setSelectedDay(day);
                              document
                                .getElementById("schedule_modal")
                                ?.showModal();
                            }}
                          >
                            {sch?.enable ? `${sch.start}-${sch.end}` : "OFF"}
                          </button>
                        </td>
                      );
                    }
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <dialog id="schedule_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">
            {selectedRoom?.name} - {selectedDay.toUpperCase()}
          </h3>

          <div className="form-control mb-3">
            <label className="label cursor-pointer">
              <span className="label-text">Enable</span>

              <input
                type="checkbox"
                className="toggle toggle-success"
                checked={selectedRoom?.schedule?.[selectedDay]?.enable || false}
                onChange={(e) => {
                  setRoomList((prev) =>
                    prev.map((room) => {
                      if (room.id !== selectedRoom.id) return room;

                      return {
                        ...room,
                        schedule: {
                          ...room.schedule,
                          [selectedDay]: {
                            ...room.schedule[selectedDay],
                            enable: e.target.checked,
                          },
                        },
                      };
                    })
                  );
                }}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="time"
              className="input input-bordered"
              value={selectedRoom?.schedule?.[selectedDay]?.start || "08:00"}
              onChange={(e) => {
                setRoomList((prev) =>
                  prev.map((room) => {
                    if (room.id !== selectedRoom.id) return room;

                    return {
                      ...room,
                      schedule: {
                        ...room.schedule,
                        [selectedDay]: {
                          ...room.schedule[selectedDay],
                          start: e.target.value,
                        },
                      },
                    };
                  })
                );
              }}
            />

            <input
              type="time"
              className="input input-bordered"
              value={selectedRoom?.schedule?.[selectedDay]?.end || "17:00"}
              onChange={(e) => {
                setRoomList((prev) =>
                  prev.map((room) => {
                    if (room.id !== selectedRoom.id) return room;

                    return {
                      ...room,
                      schedule: {
                        ...room.schedule,
                        [selectedDay]: {
                          ...room.schedule[selectedDay],
                          end: e.target.value,
                        },
                      },
                    };
                  })
                );
              }}
            />
          </div>

          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default Room;
