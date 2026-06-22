import { join } from "path";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const file = join(process.cwd(), "db.json");
console.log("DB JSON path:", file);
const adapter = new JSONFile(file);
const db = new Low(adapter, {
  modbusConfig: [],
  users: [
    {
      id: 1,
      username: "admin",
      password: "$2b$10$CzytELGPwtdLhKgxZy0Y3eWgG8D2R01xfwNfgOs..9IniaWAoquAm",
      role_id: 1,
    },
  ],
  rooms: [],
  clockMaster: [
    {
      gateway_id: 1,
      controls: [
        {
          control_id: 1,
          modbus_address: 300599,
          label: "date",
          control_value: 0,
        },
        {
          control_id: 2,
          modbus_address: 300600,
          label: "month",
          control_value: 0,
        },
        {
          control_id: 3,
          modbus_address: 300601,
          label: "year",
          control_value: 0,
        },
        {
          control_id: 4,
          modbus_address: 300602,
          label: "hour",
          control_value: 0,
        },
        {
          control_id: 5,
          modbus_address: 300603,
          label: "min",
          control_value: 0,
        },
      ],
    },
  ],
});

export async function initDB() {
  await db.read();
  db.data ||= { modbusConfig: [], users: [], rooms: [], clockMaster: [] };
  await db.write();
}

export default db;
