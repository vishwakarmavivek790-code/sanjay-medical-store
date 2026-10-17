import { NextResponse } from "next/server";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

const MONGODB_URI = process.env.MONGODB_URI;
const usersFile = path.join(process.cwd(), "users-data.json");

function getLocalUsers() {
  try {
    if (!fs.existsSync(usersFile)) return [];
    return JSON.parse(fs.readFileSync(usersFile, "utf8"));
  } catch (err) {
    return [];
  }
}

function saveLocalUsers(list) {
  fs.writeFileSync(usersFile, JSON.stringify(list, null, 2), "utf8");
}

async function connectDB() {
  if (!MONGODB_URI) throw new Error("Missing Mongo URI");
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    role: { type: String, default: "Admin" },
    password: { type: String, required: true },
    recoveryPin: { type: String, required: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export async function POST(req) {
  const { action, name, phone, role, password, recoveryPin, newPassword } = await req.json();
  const cleanPhone = (phone || "").trim();

  if (action === "REGISTER") {
    try {
      await connectDB();
      const exists = await User.findOne({ phone: cleanPhone });
      if (exists) {
        return NextResponse.json({ error: "Phone number already registered" }, { status: 400 });
      }
      const user = await User.create({
        name: name.trim(),
        phone: cleanPhone,
        role: role || "Admin",
        password,
        recoveryPin: recoveryPin.trim(),
      });
      return NextResponse.json({ user: { name: user.name, phone: user.phone, role: user.role } });
    } catch (err) {
      const users = getLocalUsers();
      if (users.some((u) => u.phone === cleanPhone)) {
        return NextResponse.json({ error: "Phone number already registered" }, { status: 400 });
      }
      const newUser = {
        _id: Date.now().toString(),
        name: name.trim(),
        phone: cleanPhone,
        role: role || "Admin",
        password,
        recoveryPin: recoveryPin.trim(),
      };
      users.push(newUser);
      saveLocalUsers(users);
      return NextResponse.json({ user: { name: newUser.name, phone: newUser.phone, role: newUser.role } });
    }
  }

  if (action === "LOGIN") {
    try {
      await connectDB();
      const user = await User.findOne({ phone: cleanPhone, password });
      if (!user) {
        return NextResponse.json({ error: "Invalid mobile number or password" }, { status: 401 });
      }
      return NextResponse.json({ user: { name: user.name, phone: user.phone, role: user.role } });
    } catch (err) {
      const user = getLocalUsers().find((u) => u.phone === cleanPhone && u.password === password);
      if (!user) {
        return NextResponse.json({ error: "Invalid mobile number or password" }, { status: 401 });
      }
      return NextResponse.json({ user: { name: user.name, phone: user.phone, role: user.role } });
    }
  }

  if (action === "RESET_PASSWORD") {
    try {
      await connectDB();
      const user = await User.findOne({ phone: cleanPhone });
      if (!user) {
        return NextResponse.json({ error: "Account not found with this number" }, { status: 404 });
      }
      const validPin =
        user.recoveryPin === recoveryPin.trim() ||
        user.name.toLowerCase() === recoveryPin.trim().toLowerCase();

      if (!validPin) {
        return NextResponse.json({ error: "Incorrect security PIN" }, { status: 401 });
      }
      user.password = newPassword;
      await user.save();
      return NextResponse.json({ message: "Password updated successfully" });
    } catch (err) {
      const users = getLocalUsers();
      const index = users.findIndex((u) => u.phone === cleanPhone);
      if (index === -1) {
        return NextResponse.json({ error: "Account not found with this number" }, { status: 404 });
      }
      const validPin =
        users[index].recoveryPin === recoveryPin.trim() ||
        users[index].name.toLowerCase() === recoveryPin.trim().toLowerCase();

      if (!validPin) {
        return NextResponse.json({ error: "Incorrect security PIN" }, { status: 401 });
      }
      users[index].password = newPassword;
      saveLocalUsers(users);
      return NextResponse.json({ message: "Password updated successfully" });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}