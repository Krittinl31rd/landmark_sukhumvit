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
});

export async function initDB() {
  await db.read();
  db.data ||= { modbusConfig: [], users: [], rooms: [] };
  await db.write();
}

export default db;
