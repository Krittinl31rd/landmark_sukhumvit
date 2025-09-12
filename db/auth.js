import db from "./db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function checkLogin(username, password) {
  try {
    await db.read();

    const users = db.data.users || [];

    const user = users.find((item) => item.username == username);
    if (!user) {
      return { result: { success: false, message: "User not found" } };
    }

    const match = bcrypt.compareSync(password, user.password);
    if (!match) {
      return {
        result: { success: false, message: "Invalid username or password" },
      };
    }

    const payload = {
      id: user.id,
      username: user.username,
      role_id: user.role_id,
    };

    const token = jwt.sign(payload, "archi-tronic");

    return {
      result: {
        success: true,
        token,
        user: payload,
      },
    };
  } catch (err) {
    console.error(err);
    return { result: { success: false, message: "Server error" } };
  }
}
