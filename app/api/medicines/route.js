import { NextResponse } from "next/server";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

const MONGODB_URI = process.env.MONGODB_URI;
const dataFile = path.join(process.cwd(), "medicines-data.json");

function getLocalMedicines() {
  try {
    if (!fs.existsSync(dataFile)) return [];
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch (err) {
    return [];
  }
}

function saveLocalMedicines(list) {
  fs.writeFileSync(dataFile, JSON.stringify(list, null, 2), "utf8");
}

async function connectDB() {
  if (!MONGODB_URI) throw new Error("Missing Mongo URI");
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
}

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    quantity: { type: Number, default: 0 },
    quality: { type: String, default: "Good" },
    rate: { type: Number, required: true },
    price: { type: Number, required: true },
    expiryDate: { type: Date, required: true },
  },
  { timestamps: true }
);

const Medicine = mongoose.models.Medicine || mongoose.model("Medicine", medicineSchema);

export async function GET() {
  try {
    await connectDB();
    const medicines = await Medicine.find().sort({ createdAt: -1 });
    return NextResponse.json({ medicines }, { status: 200 });
  } catch (err) {
    const medicines = getLocalMedicines();
    return NextResponse.json({ medicines }, { status: 200 });
  }
}

export async function POST(req) {
  const body = await req.json();
  const payload = {
    name: body.name,
    location: body.location,
    quantity: Number(body.quantity),
    quality: body.quality || "Good",
    rate: Number(body.rate),
    price: Number(body.price),
    expiryDate: body.expiryDate,
  };

  try {
    await connectDB();
    const created = await Medicine.create(payload);
    return NextResponse.json({ medicine: created }, { status: 201 });
  } catch (err) {
    const list = getLocalMedicines();
    const newEntry = { ...payload, _id: Date.now().toString(), createdAt: new Date().toISOString() };
    list.unshift(newEntry);
    saveLocalMedicines(list);
    return NextResponse.json({ medicine: newEntry }, { status: 201 });
  }
}

export async function PUT(req) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (updates.quantity !== undefined) updates.quantity = Number(updates.quantity);
  if (updates.rate !== undefined) updates.rate = Number(updates.rate);
  if (updates.price !== undefined) updates.price = Number(updates.price);

  try {
    await connectDB();
    const updated = await Medicine.findByIdAndUpdate(id, updates, { new: true });
    return NextResponse.json({ medicine: updated }, { status: 200 });
  } catch (err) {
    const list = getLocalMedicines().map((item) => (item._id === id ? { ...item, ...updates } : item));
    saveLocalMedicines(list);
    return NextResponse.json({ message: "Updated" }, { status: 200 });
  }
}

export async function DELETE(req) {
  const id = req.nextUrl.searchParams.get("id");
  try {
    await connectDB();
    await Medicine.findByIdAndDelete(id);
    return NextResponse.json({ message: "Deleted" }, { status: 200 });
  } catch (err) {
    const list = getLocalMedicines().filter((item) => item._id !== id);
    saveLocalMedicines(list);
    return NextResponse.json({ message: "Deleted" }, { status: 200 });
  }
}