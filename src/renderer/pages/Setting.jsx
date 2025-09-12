import { Pencil, Plus, Trash } from "lucide-react";
import React, { useEffect, useState } from "react";
import FunctionModbus from "../components/setting/FunctionModbus";
import { toast } from "react-toastify";
import Modal from "../components/shared/Modal";
import { validate } from "../../helpers/vaildate.js";

const defaultConfig = {
  id: 0,
  name: "",
  ip: "",
  port: 502,
  read_coils_start: 0,
  read_coils_length: 0,
  read_discrete_inputs_start: 0,
  read_discrete_inputs_length: 0,
  read_holding_registers_start: 0,
  read_holding_registers_length: 0,
  read_input_registers_start: 0,
  read_input_registers_length: 0,
};

const Setting = () => {
  const [modbusConfig, setModbusConfig] = useState([]);
  const [allData, setAllData] = useState({});
  const [openAdd, setOpenAdd] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selected, setSelected] = useState(null);
  const [config, setConfig] = useState(defaultConfig);

  const fetchData = async () => {
    const response = await window.api.getModbusConfig();
    if (Array.isArray(response)) {
      setModbusConfig(response);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Add
  const handleAddConfig = async () => {
    const validation = validate(config);
    if (!validation.valid) {
      toast.error(`Field "${validation.field}" must not be empty.`);
      return;
    }

    const response = await window.api.addModbusConfig(config);
    if (response?.result?.success === false) {
      toast.error(response.result.message || "Add failed.");
    } else {
      toast.success(response.result.message || "Add success.");
      setOpenAdd(false);
      setConfig(defaultConfig);
      fetchData();
    }
  };

  // Handle Update
  const handleUpdateConfig = async () => {
    if (!config.id) {
      toast.error("Invalid ID for update.");
      return;
    }

    const validation = validate(config);
    if (!validation.valid) {
      toast.error(`Field "${validation.field}" must not be empty.`);
      return;
    }
    const response = await window.api.updateModbusConfig(config);
    if (response?.result?.success === false) {
      toast.error(response.result.message || "Update failed.");
    } else {
      toast.success(response.result.message || "Update success.");
      setOpenUpdate(false);
      setSelected(null);
      setConfig(defaultConfig);
      fetchData();
    }
  };

  // Handle Delete
  const handleDeleteConfig = async () => {
    if (!selected?.id) {
      toast.error("Invalid ID for delete.");
      return;
    }
    const response = await window.api.deleteModbusConfig(selected.id);
    if (response?.result?.success === true) {
      toast.success(response.result.message || "Delete success.");
      setOpenDelete(false);
      setSelected(null);
      fetchData();
      // const reconnectResult = await window.modbusAPI.invokeModbusReconnect();
      // if (!reconnectResult.success) {
      //   toast.error(reconnectResult.message);
      // }
    } else {
      toast.error(response.result.message || "Delete failed.");
    }
  };

  // When select to update, set config from selected
  useEffect(() => {
    if (selected && openUpdate) {
      setConfig({
        id: selected.id || 0,
        name: selected.name || "",
        ip: selected.ip || "",
        port: selected.port || 502,
        read_coils_start: selected.read_coils_start || 0,
        read_coils_length: selected.read_coils_length || 0,
        read_discrete_inputs_start: selected.read_discrete_inputs_start || 0,
        read_discrete_inputs_length: selected.read_discrete_inputs_length || 0,
        read_holding_registers_start:
          selected.read_holding_registers_start || 0,
        read_holding_registers_length:
          selected.read_holding_registers_length || 0,
        read_input_registers_start: selected.read_input_registers_start || 0,
        read_input_registers_length: selected.read_input_registers_length || 0,
      });
    }
  }, [selected, openUpdate]);

  const getData = async () => {
    const response = await window.modbusAPI.getData();
    if (response) {
      setAllData(response);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    window.modbusAPI.onData((newData) => {
      setAllData((prev) => {
        const { ip, data } = newData;
        const updated = { ...prev };

        if (!updated[ip]) {
          updated[ip] = {};
        }

        data.forEach(({ address, value, fc }) => {
          if (!updated[ip][fc]) {
            updated[ip][fc] = {};
          }
          updated[ip][fc][address] = value;
        });

        return { ...updated };
      });
    });
  }, []);

  return (
    <div className="w-full h-full flex flex-col gap-4 overflow-auto">
      <div className="w-full flex items-center justify-end">
        <button
          onClick={() => {
            setConfig(defaultConfig);
            setOpenAdd(true);
          }}
          className="btn btn-sm btn-primary"
        >
          <Plus className="w-4 h-4" /> Add gateway
        </button>
      </div>

      {modbusConfig.length > 0 ? (
        modbusConfig.map((item) => (
          <div
            key={item.id}
            className="space-y-2 border border-base-300 rounded p-3"
          >
            <div className="w-full flex items-center justify-between gap-2 ">
              <h1 className="flex-1">{item.name}</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelected(item);
                    setOpenUpdate(true);
                  }}
                  className="btn btn-xs btn-warning"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setSelected(item);
                    setOpenDelete(true);
                  }}
                  className="btn btn-xs btn-error"
                  title="Delete"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="w-full flex items-center gap-2 p-2 bg-base-100 rounded-field">
              <div>
                Host: <span className="font-semibold">{item.ip}</span>
              </div>
              <div>
                Port: <span className="font-semibold">{item.port}</span>
              </div>
              <div>
                Interval: <span className="font-semibold">1000 ms</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-4 gap-2 ">
              <FunctionModbus
                ip={item.ip}
                itemName={"Coils Status"}
                itemStart={item.read_coils_start}
                itemEnd={item.read_coils_length}
                fc={1}
                dataModbus={allData}
              />
              <FunctionModbus
                ip={item.ip}
                itemName={"Discrete Status"}
                itemStart={item.read_discrete_inputs_start}
                itemEnd={item.read_discrete_inputs_length}
                fc={2}
                dataModbus={allData}
              />
              <FunctionModbus
                ip={item.ip}
                itemName={"Holding Register"}
                itemStart={item.read_holding_registers_start}
                itemEnd={item.read_holding_registers_length}
                fc={3}
                dataModbus={allData}
              />
              <FunctionModbus
                ip={item.ip}
                itemName={"Input Register"}
                itemStart={item.read_input_registers_start}
                itemEnd={item.read_input_registers_length}
                fc={4}
                dataModbus={allData}
              />
            </div>
          </div>
        ))
      ) : (
        <p className="text-center opacity-50">No data result.</p>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={openAdd}
        title="Add gateway"
        onClose={() => setOpenAdd(false)}
        actions={
          <button className="btn btn-success" onClick={handleAddConfig}>
            Confirm
          </button>
        }
      >
        <ConfigForm config={config} setConfig={setConfig} selected={null} />
      </Modal>

      {/* Update Modal */}
      <Modal
        isOpen={openUpdate}
        title={`Update gateway ${selected?.name} ${selected?.ip}`}
        onClose={() => {
          setSelected(null);
          setOpenUpdate(false);
        }}
        actions={
          <button className="btn btn-success" onClick={handleUpdateConfig}>
            Confirm
          </button>
        }
      >
        <ConfigForm config={config} setConfig={setConfig} selected={selected} />
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={openDelete}
        title="Delete gateway"
        onClose={() => {
          setSelected(null);
          setOpenDelete(false);
        }}
        actions={
          <button className="btn btn-error" onClick={handleDeleteConfig}>
            Confirm
          </button>
        }
      >
        <p>
          Are you sure to delete gateway <b>{selected?.name}</b> ({selected?.ip}
          )?
        </p>
      </Modal>
    </div>
  );
};

export default Setting;

const ConfigForm = ({ config, setConfig, selected }) => {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label htmlFor="name" className="text-xs mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            className="input input-sm"
            value={config.name}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </div>
        <div>
          <label htmlFor="ip" className="text-xs mb-1">
            IP Address
          </label>
          <input
            id="ip"
            type="text"
            className="input input-sm"
            value={config.ip}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, ip: e.target.value }))
            }
          />
        </div>
        <div>
          <label htmlFor="port" className="text-xs mb-1">
            Port
          </label>
          <input
            id="port"
            type="number"
            min={0}
            className="input input-sm"
            value={config.port}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, port: Number(e.target.value) }))
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Coils Inputs */}
        <div className="grid grid-cols-2">
          <h1 className="col-span-2 text-sm">Coils Inputs</h1>
          <div>
            <h1 className="text-xs mb-1">Start</h1>
            <input
              type="number"
              min={0}
              className="input input-sm"
              value={config.read_coils_start}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  read_coils_start: Number(e.target.value),
                }))
              }
            />
          </div>
          <div>
            <h1 className="text-xs mb-1">Length</h1>
            <input
              type="number"
              min={0}
              className="input input-sm"
              value={config.read_coils_length}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  read_coils_length: Number(e.target.value),
                }))
              }
            />
          </div>
        </div>

        {/* Discrete Inputs */}
        <div className="grid grid-cols-2">
          <h1 className="col-span-2 text-sm">Discrete Inputs</h1>
          <div>
            <h1 className="text-xs mb-1">Start</h1>
            <input
              type="number"
              min={0}
              className="input input-sm"
              value={config.read_discrete_inputs_start}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  read_discrete_inputs_start: Number(e.target.value),
                }))
              }
            />
          </div>
          <div>
            <h1 className="text-xs mb-1">Length</h1>
            <input
              type="number"
              min={0}
              className="input input-sm"
              value={config.read_discrete_inputs_length}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  read_discrete_inputs_length: Number(e.target.value),
                }))
              }
            />
          </div>
        </div>

        {/* Holding Registers */}
        <div className="grid grid-cols-2">
          <h1 className="col-span-2 text-sm">Holding Register</h1>
          <div>
            <h1 className="text-xs mb-1">Start</h1>
            <input
              type="number"
              min={0}
              className="input input-sm"
              value={config.read_holding_registers_start}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  read_holding_registers_start: Number(e.target.value),
                }))
              }
            />
          </div>
          <div>
            <h1 className="text-xs mb-1">Length</h1>
            <input
              type="number"
              min={0}
              className="input input-sm"
              value={config.read_holding_registers_length}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  read_holding_registers_length: Number(e.target.value),
                }))
              }
            />
          </div>
        </div>

        {/* Input Registers */}
        <div className="grid grid-cols-2">
          <h1 className="col-span-2 text-sm">Input Register</h1>
          <div>
            <h1 className="text-xs mb-1">Start</h1>
            <input
              type="number"
              min={0}
              className="input input-sm"
              value={config.read_input_registers_start}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  read_input_registers_start: Number(e.target.value),
                }))
              }
            />
          </div>
          <div>
            <h1 className="text-xs mb-1">Length</h1>
            <input
              type="number"
              min={0}
              className="input input-sm"
              value={config.read_input_registers_length}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  read_input_registers_length: Number(e.target.value),
                }))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};
