import mongoose, { Schema } from "mongoose";

const medicineSchema = new Schema(
  {
    name: String,
    location: String,
    quantity: Number,
    quality: String,
    rate: Number,
    price: Number,
    expiryDate: Date,
  },
  { timestamps: true }
);

const Medicine = mongoose.models.Medicine || mongoose.model("Medicine", medicineSchema);
export default Medicine;