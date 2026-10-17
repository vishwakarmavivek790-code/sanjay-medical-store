import { NextResponse } from "next/server";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

const MONGODB_URI = process.env.MONGODB_URI;
const salesFile = path.join(process.cwd(), "sales-data.json");

function getLocalSales() {
  try {
    if (!fs.existsSync(salesFile)) return [];
    return JSON.parse(fs.readFileSync(salesFile, "utf8"));
  } catch (err) {
    return [];
  }
}

function saveLocalSales(list) {
  fs.writeFileSync(salesFile, JSON.stringify(list, null, 2), "utf8");
}

async function connectDB() {
  if (!MONGODB_URI) throw new Error("Missing Mongo URI");
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
}

const saleSchema = new mongoose.Schema(
  {
    invoiceNo: String,
    customerName: String,
    customerPhone: String,
    items: Array,
    subTotal: Number,
    discountAmount: Number,
    grandTotal: Number,
    profit: Number,
    billedBy: String,
    dateStr: String,
  },
  { timestamps: true }
);

const Sale = mongoose.models.Sale || mongoose.model("Sale", saleSchema);

export async function GET() {
  try {
    await connectDB();
    const sales = await Sale.find().sort({ createdAt: -1 });
    return NextResponse.json({ sales }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ sales: getLocalSales() }, { status: 200 });
  }
}

export async function POST(req) {
  const body = await req.json();
  try {
    await connectDB();
    const sale = await Sale.create(body);
    return NextResponse.json({ sale }, { status: 201 });
  } catch (err) {
    const list = getLocalSales();
    const newSale = { ...body, _id: Date.now().toString(), createdAt: new Date().toISOString() };
    list.unshift(newSale);
    saveLocalSales(list);
    return NextResponse.json({ sale: newSale }, { status: 201 });
  }
}