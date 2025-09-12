// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require("electron");
// const { data } = require("react-router-dom");

contextBridge.exposeInMainWorld("api", {
  login: (username, password) =>
    ipcRenderer.invoke("login", { username, password }),
  getModbusConfig: () => ipcRenderer.invoke("get-modbus-config"),
  addModbusConfig: (config) => ipcRenderer.invoke("add-modbus-config", config),
  updateModbusConfig: (config) =>
    ipcRenderer.invoke("update-modbus-config", config),
  deleteModbusConfig: (id) => ipcRenderer.invoke("delete-modbus-config", id),
  getRooms: () => ipcRenderer.invoke("get-rooms"),
  getRoomById: (id) => ipcRenderer.invoke("get-room-id", id),
  addRoom: (payload) => ipcRenderer.invoke("add-room", payload),
  addRoomCSV: (payload) => ipcRenderer.invoke("add-room-csv", payload),
  updateRoom: (payload) => ipcRenderer.invoke("update-room", payload),
  deleteRoom: (id) => ipcRenderer.invoke("delete-room", id),
});

contextBridge.exposeInMainWorld("modbusAPI", {
  onData: (callback) =>
    ipcRenderer.on("modbus-data", (_, data) => callback(data)),
  onStatus: (callback) =>
    ipcRenderer.on("modbus-status", (_, data) => callback(data)),
  getData: () => ipcRenderer.invoke("getDataModbus"),
  writeData: (payload) => ipcRenderer.invoke("writeData", payload),
  onReadData: (callback) =>
    ipcRenderer.on("modbus-data2", (_, data) => callback(data)),
  offReadData: (callback) =>
    ipcRenderer.removeListener("modbus-data2", callback),
  invokeModbusReconnect: (id) => ipcRenderer.invoke("modbus-reconnect", id),
});

// contextBridge.exposeInMainWorld("api_modbus_config", {});
