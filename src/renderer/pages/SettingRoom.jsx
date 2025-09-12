import React, { useState, useEffect } from "react";
import { Pencil, Plus, Trash } from "lucide-react";
import Modal from "../components/shared/Modal";
import { validate } from "../../helpers/vaildate";
import { toast } from "react-toastify";
import ImportCSV from "../components/shared/ImportCSV";

const SettingRoom = () => {
  const [roomList, setRoomList] = useState([]);
  const [CSV, setCSV] = useState([]);
  const [isAddDevices, setIsAddDevices] = useState([]);
  const [modbusConfig, setModbusConfig] = useState([]);
  const [isAdd, setIsAdd] = useState(false);

  const [roomName, setRoomName] = useState("");
  const [floorName, setFloorName] = useState("");
  const [gatewayId, setGatewayId] = useState("");
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [isDelete, setIsDelete] = useState(false);
  const [select, setSelect] = useState(null);

  const fetchRoomList = async () => {
    const response = await window.api.getRooms();
    if (Array.isArray(response)) {
      setRoomList(response);
    }
  };

  useEffect(() => {
    fetchRoomList();
  }, []);

  const fetchData = async () => {
    const response = await window.api.getModbusConfig();
    if (Array.isArray(response)) {
      setModbusConfig(response);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingRoomId(null);
    setRoomName("");
    setFloorName("");
    setGatewayId("");
    setIsAddDevices([]);
    setIsAdd(true);
  };

  const openEditModal = (room) => {
    setEditingRoomId(room.id);
    setRoomName(room.name);
    setFloorName(room.floor);
    setGatewayId(room.gateway_id);

    setIsAddDevices(room.devices || []);
    setIsAdd(true);
  };

  const openDeleteModal = (room) => {
    setSelect(room);
    setIsDelete(true);
  };

  const handleAdd = async () => {
    const payload = {
      id: editingRoomId || 0,
      name: roomName,
      floor: floorName,
      gateway_id: Number(gatewayId),
      devices: isAddDevices,
    };

    const validation = validate({
      name: payload.name,
      gateway_id: payload.gateway_id,
    });

    if (!validation.valid) {
      toast.error(`Field "${validation.field}" must not be empty.`);
      return;
    }

    // if (payload.devices.length == 0) {
    //   toast.error("Please add at least 1 device.");
    //   return;
    // }

    for (let i = 0; i < payload.devices.length; i++) {
      const device = payload.devices[i];

      if (!device.device_name.trim()) {
        toast.error(`Device #${i + 1} name must not be empty.`);
        return;
      }
      if (!device.device_type.toString().trim()) {
        toast.error(`Device #${i + 1} type must not be empty.`);
        return;
      }

      if (device.device_control && device.device_control.length > 0) {
        for (let j = 0; j < device.device_control.length; j++) {
          const ctrl = device.device_control[j];

          if (ctrl.modbus_address == -1) {
            continue;
          }
          if (ctrl.modbus_address == "") {
            toast.error(
              `Device #${i + 1} control "${ctrl.label || "Control " + ctrl.control_id}” must not be empty.`
            );
            return;
          }

          const modbusAddrStr = ctrl.modbus_address?.toString() || "";

          if (!/^\d{6}$/.test(modbusAddrStr)) {
            toast.error(
              `Device #${i + 1} control "${
                ctrl.label || "Control " + ctrl.control_id
              }" modbus_address must be 6 digits, e.g. 300100.`
            );
            return;
          }

          const functionCode = Number(modbusAddrStr.slice(0, 1));
          const address = Number(modbusAddrStr.slice(1));
          if (![1, 2, 3, 4].includes(functionCode)) {
            toast.error(
              `Device #${i + 1} control "${
                ctrl.label || "Control " + ctrl.control_id
              }" function code must be 1, 2, 3, or 4.`
            );
            return;
          }

          if (address < 0 || address > 65535) {
            toast.error(
              `Device #${i + 1} control "${
                ctrl.label || "Control " + ctrl.control_id
              }" address must be between 1 and 65535.`
            );
            return;
          }
        }
      }
    }

    let response;
    if (editingRoomId) {
      response = await window.api.updateRoom(payload);
    } else {
      response = await window.api.addRoom(payload);
    }

    if (response?.result?.success) {
      toast.success(response.result.message);
      setIsAdd(false);
      setRoomName("");
      setFloorName("");
      setGatewayId("");
      setIsAddDevices([]);
      setEditingRoomId(null);
      fetchRoomList();
      fetchData();
    } else {
      toast.error(response.result.message || "Failed");
    }
  };

  const handleDelete = async () => {
    if (!select?.id) {
      toast.error("Invalid ID for delete.");
      return;
    }
    const response = await window.api.deleteRoom(select.id);
    if (response?.result?.success === true) {
      toast.success(response.result.message || "Delete success.");
      setIsDelete(false);
      setSelect(null);
      fetchRoomList();
      fetchData();
    } else {
      toast.error(response.result.message || "Delete failed.");
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 overflow-auto">
      <div className="w-full flex items-center justify-end gap-2">
        <button
          onClick={() => openAddModal()}
          className="btn btn-sm btn-primary"
        >
          <Plus className="w-4 h-4" /> Add Room
        </button>
      </div>

      <div className="card bg-base-100 shadow-lg overflow-auto">
        <div className="card-header p-6 border-b border-base-300">
          <div className="flex items-center justify-between">
            <h2 className="card-title text-xl">Rooms List And Devices</h2>
          </div>
        </div>

        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr className="bg-base-200">
                  <th className="text-center w-16">#</th>
                  <th>Name</th>
                  <th>Floor</th>
                  <th>Gateway</th>
                  <th>Devices</th>
                  <th className="text-center w-20">Action</th>
                </tr>
              </thead>
              <tbody>
                {roomList?.length > 0 ? (
                  roomList?.map((room, index) => (
                    <tr key={room.id} className="hover">
                      <td className="text-center font-mono font-bold">
                        {String(index + 1).padStart(2, "0")}
                      </td>
                      <td>{room?.name}</td>
                      <td className={`${!room?.floor && "opacity-50"}`}>
                        {room?.floor ? room?.floor : "No floor"}
                      </td>
                      <td>
                        {modbusConfig?.find(
                          (item) => item.id == room?.gateway_id
                        )
                          ? `[${modbusConfig.find((item) => item.id == room?.gateway_id).name}] ${modbusConfig.find((item) => item.id == room?.gateway_id).ip}`
                          : "-"}
                      </td>
                      <td>{room?.devices.length} devices</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(room)}
                            className="btn btn-xs btn-warning btn-outline"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(room)}
                            className="btn btn-xs btn-error btn-outline"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center opacity-50">
                      No result found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isAdd}
        title={editingRoomId ? "Edit Room" : "Add Room"}
        onClose={() => setIsAdd(false)}
        actions={
          <button className="btn btn-success" onClick={handleAdd}>
            Confirm
          </button>
        }
      >
        <AddForm
          roomName={roomName}
          setRoomName={setRoomName}
          floorName={floorName}
          setFloorName={setFloorName}
          gatewayId={gatewayId}
          setGatewayId={setGatewayId}
          modbusConfig={modbusConfig}
          isAddDevices={isAddDevices}
          setIsAddDevices={setIsAddDevices}
        />
      </Modal>
      <Modal
        isOpen={isDelete}
        title="Delete gateway"
        onClose={() => {
          setSelect(null);
          setIsDelete(false);
        }}
        actions={
          <button className="btn btn-error" onClick={handleDelete}>
            Confirm
          </button>
        }
      >
        <p>
          Are you sure to delete <b>{select?.name}</b>?
        </p>
      </Modal>
    </div>
  );
};

export default SettingRoom;

// ---------------------- Device Types ----------------------
const deviceTypeName = [
  {
    id: 1,
    name: "Air",
  },
  {
    id: 4,
    name: "Lighting",
  },
  {
    id: 10,
    name: "Scene",
  },
  {
    id: 99,
    name: "Time and Timer",
  },
];

const deviceType = {
  1: [
    {
      control_id: 1,
      modbus_address: null,
      label: "fanspeed",
      control_value: 0,
    },
    {
      control_id: 2,
      modbus_address: null,
      label: "tempset",
      control_value: 0,
    },
    {
      control_id: 3,
      modbus_address: null,
      label: "roomtemp",
      control_value: 0,
    },
  ],
  10: [
    {
      control_id: 1,
      modbus_address: null,
      label: "status",
      control_value: 0,
    },
  ],
  4: [
    {
      control_id: 1,
      modbus_address: null,
      label: "status",
      control_value: 0,
    },
  ],
  99: [
    {
      control_id: 1,
      modbus_address: null,
      label: "timer_en",
      control_value: 0,
    },
    {
      control_id: 2,
      modbus_address: null,
      label: "timer_onoff",
      control_value: 0,
    },
    {
      control_id: 3,
      modbus_address: null,
      label: "start_hour",
      control_value: 0,
    },
    {
      control_id: 4,
      modbus_address: null,
      label: "start_min",
      control_value: 0,
    },
    {
      control_id: 5,
      modbus_address: null,
      label: "start_hour",
      control_value: 0,
    },
    {
      control_id: 6,
      modbus_address: null,
      label: "start_min",
      control_value: 0,
    },
  ],
};

const AddForm = ({
  roomName,
  setRoomName,
  floorName,
  setFloorName,
  gatewayId,
  setGatewayId,
  modbusConfig,
  isAddDevices,
  setIsAddDevices,
}) => {
  const handleAddDevice = () => {
    setIsAddDevices((prev) => [
      ...prev,
      {
        device_id: prev.length + 1,
        device_name: "",
        device_type: "",
        device_control: [],
      },
    ]);
  };

  const handleRemoveDevice = (index) => {
    setIsAddDevices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeviceNameChange = (index, value) => {
    setIsAddDevices((prev) =>
      prev.map((dev, i) => (i === index ? { ...dev, device_name: value } : dev))
    );
  };

  const handleTypeChange = (index, type) => {
    setIsAddDevices((prev) =>
      prev.map((dev, i) =>
        i === index
          ? {
              ...dev,
              device_type: type,
              device_control: deviceType[type]
                ? deviceType[type].map((c) => ({ ...c }))
                : [],
            }
          : dev
      )
    );
  };

  const handleControlChange = (devIndex, ctrlIndex, value) => {
    setIsAddDevices((prev) =>
      prev.map((dev, i) =>
        i === devIndex
          ? {
              ...dev,
              device_control: dev.device_control.map((ctrl, j) =>
                j === ctrlIndex ? { ...ctrl, modbus_address: value } : ctrl
              ),
            }
          : dev
      )
    );
  };

  return (
    <div className="space-y-2">
      {/* Room Info */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label htmlFor="name" className="text-xs mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            className="input input-sm w-full"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="floor" className="text-xs mb-1">
            Floor
          </label>
          <input
            id="floor"
            type="text"
            className="input input-sm w-full"
            value={floorName || ""}
            onChange={(e) => setFloorName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="gateway" className="text-xs mb-1">
            Gateway
          </label>
          <select
            id="gateway"
            className="select select-sm w-full"
            value={gatewayId}
            onChange={(e) => setGatewayId(e.target.value)}
          >
            <option value="">Select gateway</option>
            {modbusConfig?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.ip} [{item.name}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add Device Button */}
      <div className="w-full flex items-center justify-between">
        <h6 className="text-xs mr-1">{isAddDevices?.length} device in room</h6>
        <button onClick={handleAddDevice} className="btn btn-sm btn-primary">
          Add Device
        </button>
      </div>

      {/* Device List */}
      <div className="h-96 overflow-auto space-y-2">
        {isAddDevices.length > 0 ? (
          isAddDevices.map((dev, devIndex) => (
            <div
              key={devIndex}
              className="p-2 rounded-lg space-y-2 bg-base-100"
            >
              <div className="w-full flex items-center justify-between">
                <h1 className="text-xs">#{devIndex + 1}</h1>
                <button
                  className="btn btn-xs btn-error btn-outline"
                  onClick={() => handleRemoveDevice(devIndex)}
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label
                  htmlFor={`device_name_${devIndex}`}
                  className="text-xs mb-1"
                >
                  Device Name
                </label>
                <input
                  id={`device_name_${devIndex}`}
                  type="text"
                  className="input input-sm w-full"
                  value={dev.device_name}
                  onChange={(e) =>
                    handleDeviceNameChange(devIndex, e.target.value)
                  }
                />
              </div>
              <select
                className="select select-sm w-full"
                value={dev.device_type}
                onChange={(e) =>
                  handleTypeChange(devIndex, Number(e.target.value))
                }
              >
                <option value="">Select device type</option>
                {deviceTypeName.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {/* Controls */}
              {dev.device_control.length > 0 && (
                <>
                  <p className="text-xs opacity-50">
                    Start at 0-65535, Format is [function][address] <br></br>
                    ex.[3][00100]=[Holding Registers][ Address=100]
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {dev.device_control.map((ctrl, ctrlIndex) => (
                      <div key={ctrlIndex}>
                        <label className="text-xs">
                          {ctrl.label || `Control ${ctrl.control_id}`}
                        </label>
                        <input
                          type="number"
                          min={1}
                          className="input input-sm w-full"
                          value={ctrl.modbus_address || ""}
                          onChange={(e) =>
                            handleControlChange(
                              devIndex,
                              ctrlIndex,
                              Number(e.target.value)
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <p className="text-center opacity-50">Please add device</p>
        )}
      </div>
    </div>
  );
};
