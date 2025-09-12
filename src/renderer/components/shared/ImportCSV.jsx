import { FileSpreadsheet } from "lucide-react";
import Papa from "papaparse";
import { useRef } from "react";

function ImportCSV({ handleCSV, onData }) {
  const fileInputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const data = result.data;
        const nestedData = convertToNested(data);
        onData(nestedData);
        handleCSV(nestedData);
        e.target.value = ""; // reset input เพื่อให้เลือกไฟล์เดิมได้อีก
      },
    });
  };

  const convertToNested = (rows) => {
    const roomsMap = {};

    rows.forEach((row) => {
      if (!roomsMap[row.id]) {
        roomsMap[row.id] = {
          id: Number(row.id),
          name: row.name,
          gateway_id: Number(row.gateway_id),
          devices: [],
        };
      }

      let room = roomsMap[row.id];
      let device = room.devices.find(
        (d) => d.device_id === Number(row.device_id)
      );

      if (!device) {
        device = {
          device_id: Number(row.device_id),
          device_name: row.device_name,
          device_type: Number(row.device_type),
          device_control: [],
        };
        room.devices.push(device);
      }

      device.device_control.push({
        control_id: Number(row.control_id),
        modbus_address: Number(row.modbus_address),
        label: row.label,
        control_value: Number(row.control_value),
      });
    });

    return Object.values(roomsMap);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        onChange={handleFile}
      />
      <button
        className="btn btn-sm btn-success"
        onClick={() => fileInputRef.current.click()}
      >
        <FileSpreadsheet className="w-4 h-4" /> Import CSV
      </button>
    </>
  );
}

export default ImportCSV;
