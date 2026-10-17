"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddMedicinePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [quantity, setQuantity] = useState("");
  const [quality, setQuality] = useState("Good");
  const [rate, setRate] = useState("");
  const [price, setPrice] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          location,
          quantity: Number(quantity),
          quality,
          rate: Number(rate),
          price: Number(price),
          expiryDate,
        }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        alert("Failed to save medicine. Please check your inputs.");
      }
    } catch (err) {
      alert("Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F5F5] flex items-center justify-center p-6 font-sans text-gray-800">
      <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-200 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Add New Medicine</h1>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-800 border px-3 py-1.5 rounded-lg">
            Cancel
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Medicine Name</label>
            <input
              type="text"
              placeholder="e.g., Paracetamol 500mg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="border p-3 rounded-lg w-full mt-1 outline-none focus:border-teal-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Rack / Shelf Location</label>
            <input
              type="text"
              placeholder="e.g., Rack 4, Shelf B"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="border p-3 rounded-lg w-full mt-1 outline-none focus:border-teal-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Stock Quantity</label>
              <input
                type="number"
                min="1"
                placeholder="Units"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="border p-3 rounded-lg w-full mt-1 outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Condition</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="border p-3 rounded-lg w-full mt-1 outline-none focus:border-teal-600 bg-white"
              >
                <option value="Good">Good</option>
                <option value="Near Expiry">Near Expiry</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Purchase Rate (₹)</label>
              <input
                type="number"
                placeholder="Wholesale price"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                required
                className="border p-3 rounded-lg w-full mt-1 outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Selling Price MRP (₹)</label>
              <input
                type="number"
                placeholder="Retail MRP"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="border p-3 rounded-lg w-full mt-1 outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Expiry Date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
              className="border p-3 rounded-lg w-full mt-1 outline-none focus:border-teal-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-teal-600 text-white font-bold py-3.5 rounded-lg hover:bg-teal-700 transition mt-2 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Medicine"}
          </button>
        </form>
      </div>
    </div>
  );
}