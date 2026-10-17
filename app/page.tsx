"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import EditMedicineModal from "./components/EditMedicineModal";
import AuthPortal from "./components/authportal";

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("DASHBOARD");

  const [medicines, setMedicines] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "LOW" | "NEAR_EXPIRY" | "EXPIRED">("ALL");
  const [selectedRack, setSelectedRack] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [editingMed, setEditingMed] = useState<any | null>(null);

  const [selectedMedId, setSelectedMedId] = useState("");
  const [buyQty, setBuyQty] = useState(1);
  const [cart, setCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [billDate, setBillDate] = useState("");
  const [processingSale, setProcessingSale] = useState(false);

  const loadMedicines = async () => {
    try {
      const res = await fetch("/api/medicines");
      const data = await res.json();
      setMedicines(data.medicines || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSales = async () => {
    try {
      const res = await fetch("/api/sales");
      const data = await res.json();
      setSales(data.sales || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setCurrentTime(Date.now());
    const stored = localStorage.getItem("sanjay_med_user");
    if (stored) setCurrentUser(JSON.parse(stored));

    setInvoiceNo("INV-" + Math.floor(100000 + Math.random() * 900000));
    setBillDate(new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }));
    loadMedicines();
    loadSales();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("sanjay_med_user");
    setCurrentUser(null);
  };

  const updateStock = async (med: any, delta: number) => {
    const nextQty = Math.max(0, Number(med.quantity) + delta);
    setMedicines((prev) => prev.map((item) => (item._id === med._id ? { ...item, quantity: nextQty } : item)));

    await fetch("/api/medicines", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: med._id, quantity: nextQty }),
    });
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMed) return;

    await fetch("/api/medicines", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingMed._id, ...editingMed }),
    });
    setEditingMed(null);
    loadMedicines();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this medicine from inventory?")) return;
    await fetch(`/api/medicines?id=${id}`, { method: "DELETE" });
    loadMedicines();
  };

  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedId) return alert("Please select a medicine.");

    const med = medicines.find((m) => m._id === selectedMedId);
    if (!med) return;

    const existing = cart.find((item) => item._id === med._id);
    const requested = (existing ? existing.buyQty : 0) + Number(buyQty);

    if (requested > Number(med.quantity)) {
      return alert(`Insufficient stock. Only ${med.quantity} units available.`);
    }

    if (existing) {
      setCart(
        cart.map((item) =>
          item._id === med._id
            ? { ...item, buyQty: requested, total: requested * Number(med.price) }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          _id: med._id,
          name: med.name,
          rate: Number(med.rate || 0),
          price: Number(med.price),
          availableStock: Number(med.quantity),
          buyQty: Number(buyQty),
          total: Number(buyQty) * Number(med.price),
        },
      ]);
    }
    setSelectedMedId("");
    setBuyQty(1);
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item._id !== id));
  };

  const subTotal = cart.reduce((acc, item) => acc + item.total, 0);
  const discountAmount = Math.round((subTotal * Number(discountPercent)) / 100);
  const grandTotal = subTotal - discountAmount;
  const totalCost = cart.reduce((acc, item) => acc + item.rate * item.buyQty, 0);
  const netProfit = grandTotal - totalCost;

  const handleCompleteSale = async (printInvoice: boolean) => {
    if (cart.length === 0) return alert("Please add items to the bill first.");
    setProcessingSale(true);

    try {
      for (const item of cart) {
        const remaining = Math.max(0, item.availableStock - item.buyQty);
        await fetch("/api/medicines", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item._id, quantity: remaining }),
        });
      }

      await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNo,
          customerName: customerName || "Walk-in Customer",
          customerPhone,
          items: cart,
          subTotal,
          discountAmount,
          grandTotal,
          profit: netProfit,
          billedBy: currentUser?.name || "Admin",
          dateStr: new Date().toLocaleString("en-IN"),
        }),
      });

      if (printInvoice) {
        window.print();
      } else {
        alert(`Sale recorded (${invoiceNo}). Inventory stock has been updated.`);
      }

      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setDiscountPercent(0);
      setInvoiceNo("INV-" + Math.floor(100000 + Math.random() * 900000));
      loadMedicines();
      loadSales();
    } finally {
      setProcessingSale(false);
    }
  };

  const totalMedicines = medicines.length;
  const lowStockCount = medicines.filter((m) => Number(m.quantity) <= 5).length;

  const nearExpiryCount = currentTime
    ? medicines.filter((m) => {
        const days = Math.ceil((new Date(m.expiryDate).getTime() - currentTime) / 86400000);
        return days >= 0 && days <= 30;
      }).length
    : 0;

  const expiredCount = currentTime
    ? medicines.filter((m) => new Date(m.expiryDate).getTime() < currentTime).length
    : 0;

  const totalStockSellingValue = medicines.reduce((acc, m) => acc + Number(m.price || 0) * Number(m.quantity || 0), 0);
  const totalStockPurchaseCost = medicines.reduce((acc, m) => acc + Number(m.rate || 0) * Number(m.quantity || 0), 0);
  const totalExpectedProfit = totalStockSellingValue - totalStockPurchaseCost;

  const totalRevenueGenerated = sales.reduce((acc, s) => acc + Number(s.grandTotal || 0), 0);
  const totalRealizedProfit = sales.reduce((acc, s) => acc + Number(s.profit || 0), 0);

  const uniqueRacks = Array.from(new Set(medicines.map((m) => m.location?.trim()).filter(Boolean)));

  const filteredMedicines = medicines.filter((m) => {
    const matches =
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.location?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matches) return false;
    if (filterType === "LOW") return Number(m.quantity) <= 5;
    if (filterType === "NEAR_EXPIRY") {
      if (!currentTime) return false;
      const days = Math.ceil((new Date(m.expiryDate).getTime() - currentTime) / 86400000);
      return days >= 0 && days <= 30;
    }
    if (filterType === "EXPIRED") return currentTime ? new Date(m.expiryDate).getTime() < currentTime : false;
    return true;
  });

  const getExpiryBadge = (expiryDate: string) => {
    if (!currentTime) return { label: "Good", style: "bg-green-100 text-green-700", rowBg: "bg-white", sub: "" };
    const days = Math.ceil((new Date(expiryDate).getTime() - currentTime) / 86400000);
    if (days < 0) return { label: "Expired", style: "bg-red-100 text-red-700", rowBg: "bg-red-50/30", sub: "Expired" };
    if (days <= 30) return { label: "Near Expiry", style: "bg-amber-100 text-amber-800", rowBg: "bg-amber-50/40", sub: `${days} days left` };
    return { label: "Good", style: "bg-green-100 text-green-700", rowBg: "bg-white", sub: `${days} days left` };
  };

  if (!currentUser) {
    return <AuthPortal onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="flex h-screen bg-[#F0F5F5] text-gray-800 font-sans">
      <Sidebar
        isOpen={isSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setFilterType={setFilterType}
        totalMedicines={totalMedicines}
        totalExpectedProfit={totalExpectedProfit}
        uniqueRacksCount={uniqueRacks.length}
        salesCount={sales.length}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col overflow-hidden print:overflow-visible print:bg-white">
        <Navbar
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          activeTab={activeTab}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="p-8 overflow-y-auto flex-1 print:p-0">
          {activeTab === "DASHBOARD" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div
                  onClick={() => setFilterType("ALL")}
                  className={`bg-white p-6 rounded-2xl border shadow-sm cursor-pointer transition ${
                    filterType === "ALL" ? "ring-2 ring-teal-500" : "hover:border-teal-300"
                  }`}
                >
                  <p className="text-gray-500 text-sm font-medium">Total Medicines</p>
                  <p className="text-4xl font-bold text-gray-800 mt-2">{totalMedicines}</p>
                  <p className="text-xs text-gray-400 mt-1">{uniqueRacks.length} active rack locations</p>
                </div>

                <div
                  onClick={() => setFilterType("LOW")}
                  className={`bg-white p-6 rounded-2xl border shadow-sm cursor-pointer transition ${
                    filterType === "LOW" ? "ring-2 ring-orange-500" : "hover:border-orange-300"
                  }`}
                >
                  <p className="text-gray-500 text-sm font-medium">Low Stock (≤5)</p>
                  <p className="text-4xl font-bold text-orange-600 mt-2">{lowStockCount}</p>
                  <p className="text-xs text-gray-400 mt-1">Requires restocking</p>
                </div>

                <div
                  onClick={() => setFilterType("NEAR_EXPIRY")}
                  className={`bg-white p-6 rounded-2xl border shadow-sm cursor-pointer transition ${
                    filterType === "NEAR_EXPIRY" ? "ring-2 ring-amber-500" : "hover:border-amber-300"
                  }`}
                >
                  <p className="text-gray-500 text-sm font-medium">Near Expiry (≤30 Days)</p>
                  <p className="text-4xl font-bold text-amber-600 mt-2">{nearExpiryCount}</p>
                  <p className="text-xs text-gray-400 mt-1">Expiring within a month</p>
                </div>

                <div
                  onClick={() => setFilterType("EXPIRED")}
                  className={`bg-white p-6 rounded-2xl border shadow-sm cursor-pointer transition ${
                    filterType === "EXPIRED" ? "ring-2 ring-red-500" : "hover:border-red-300"
                  }`}
                >
                  <p className="text-gray-500 text-sm font-medium">Expired Stock</p>
                  <p className="text-4xl font-bold text-red-600 mt-2">{expiredCount}</p>
                  <p className="text-xs text-gray-400 mt-1">Remove from shelves</p>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Filter:</span>
                  <span className="text-sm font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full">
                    {filterType === "ALL"
                      ? "All Inventory"
                      : filterType === "LOW"
                      ? "Low Stock"
                      : filterType === "NEAR_EXPIRY"
                      ? "Near Expiry"
                      : "Expired"}
                  </span>
                  {filterType !== "ALL" && (
                    <button onClick={() => setFilterType("ALL")} className="text-xs text-blue-600 underline ml-2">
                      Reset
                    </button>
                  )}
                </div>

                <Link href="/add-medicine" className="bg-[#4E8E8E] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-teal-700 shadow-sm">
                  + Add New Medicine
                </Link>
              </div>

              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                {loading ? (
                  <p className="p-6 text-center text-gray-500">Loading inventory...</p>
                ) : filteredMedicines.length === 0 ? (
                  <p className="p-6 text-center text-gray-500">No matching medicines found.</p>
                ) : (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b text-gray-500">
                        <th className="p-4">Medicine Name</th>
                        <th className="p-4">Location</th>
                        <th className="p-4">Expiry Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Stock Count</th>
                        <th className="p-4">Purchase Price</th>
                        <th className="p-4">Selling MRP</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMedicines.map((med) => {
                        const status = getExpiryBadge(med.expiryDate);
                        const isLow = Number(med.quantity) <= 5;
                        return (
                          <tr key={med._id} className={`border-b border-gray-100 ${status.rowBg} hover:bg-gray-50`}>
                            <td className="p-4 font-medium capitalize">{med.name}</td>
                            <td className="p-4 text-gray-600">{med.location}</td>
                            <td className="p-4">
                              <div>{new Date(med.expiryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                              <div className="text-xs text-gray-400">{status.sub}</div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded text-xs font-semibold ${status.style}`}>{status.label}</span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <button onClick={() => updateStock(med, -1)} className="w-7 h-7 rounded bg-gray-200 hover:bg-red-100 font-bold">-</button>
                                <span className={`font-bold min-w-[24px] text-center ${isLow ? "text-red-600" : "text-gray-800"}`}>
                                  {med.quantity}
                                </span>
                                <button onClick={() => updateStock(med, 1)} className="w-7 h-7 rounded bg-gray-200 hover:bg-teal-100 font-bold">+</button>
                              </div>
                            </td>
                            <td className="p-4 text-gray-600">₹{med.rate}</td>
                            <td className="p-4 font-bold">₹{med.price}</td>
                            <td className="p-4 flex gap-3">
                              <button
                                onClick={() => setEditingMed({ ...med, expiryDate: new Date(med.expiryDate).toISOString().split("T")[0] })}
                                className="text-blue-600 hover:underline text-xs font-semibold"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(med._id)}
                                className="text-red-600 hover:underline text-xs font-semibold"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {activeTab === "MEDICINES" && (
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-teal-600 text-white">
                    <th className="p-4">#</th>
                    <th className="p-4">Medicine Name</th>
                    <th className="p-4">Rack Location</th>
                    <th className="p-4">Available Stock</th>
                    <th className="p-4 text-right">Unit Selling Price (MRP)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedicines.map((med, i) => (
                    <tr key={med._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 text-gray-400">{i + 1}</td>
                      <td className="p-4 font-bold text-base capitalize">{med.name}</td>
                      <td className="p-4 text-gray-600">{med.location}</td>
                      <td className="p-4 font-semibold">{med.quantity} units</td>
                      <td className="p-4 text-right font-bold text-teal-700 text-lg">₹{med.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "LOCATIONS" && (
            <div>
              <div className="flex gap-2 mb-6 flex-wrap">
                <button
                  onClick={() => setSelectedRack("ALL")}
                  className={`px-4 py-2 rounded-xl border font-medium text-sm transition ${
                    selectedRack === "ALL" ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-700"
                  }`}
                >
                  All Locations ({medicines.length})
                </button>
                {uniqueRacks.map((rack: any) => (
                  <button
                    key={rack}
                    onClick={() => setSelectedRack(rack)}
                    className={`px-4 py-2 rounded-xl border font-medium text-sm transition ${
                      selectedRack === rack ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-700"
                    }`}
                  >
                    {rack}
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-2xl border overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b text-gray-500">
                      <th className="p-4">Rack / Shelf</th>
                      <th className="p-4">Medicine Name</th>
                      <th className="p-4">Available Stock</th>
                      <th className="p-4">Selling Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicines
                      .filter((m) => selectedRack === "ALL" || m.location?.trim() === selectedRack)
                      .map((med) => (
                        <tr key={med._id} className="border-b hover:bg-gray-50">
                          <td className="p-4 font-bold text-teal-700">{med.location}</td>
                          <td className="p-4 capitalize font-medium">{med.name}</td>
                          <td className="p-4">{med.quantity} units</td>
                          <td className="p-4 font-bold">₹{med.price}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "BILLING" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 flex flex-col gap-6 print:hidden">
                <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col gap-3">
                  <h2 className="font-bold text-gray-800">Customer Details</h2>
                  <input
                    type="text"
                    placeholder="Customer Name (Optional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="border p-3 rounded-lg outline-none focus:border-teal-600"
                  />
                  <input
                    type="text"
                    placeholder="Phone Number (Optional)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="border p-3 rounded-lg outline-none focus:border-teal-600"
                  />
                </div>

                <form onSubmit={handleAddToCart} className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col gap-4">
                  <h2 className="font-bold text-gray-800">Add Medicine to Bill</h2>
                  <select
                    value={selectedMedId}
                    onChange={(e) => setSelectedMedId(e.target.value)}
                    className="border p-3 rounded-lg bg-white outline-none focus:border-teal-600"
                  >
                    <option value="">Select Medicine</option>
                    {medicines.map((m) => (
                      <option key={m._id} value={m._id} disabled={Number(m.quantity) <= 0}>
                        {m.name} — ₹{m.price} (Stock: {m.quantity} | {m.location})
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-3">
                    <div className="w-1/2">
                      <label className="text-xs text-gray-500">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={buyQty}
                        onChange={(e) => setBuyQty(Number(e.target.value))}
                        className="border p-3 rounded-lg w-full mt-1"
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="text-xs text-gray-500">Discount (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(Number(e.target.value))}
                        className="border p-3 rounded-lg w-full mt-1"
                      />
                    </div>
                  </div>
                  <button type="submit" className="bg-[#4E8E8E] text-white font-bold py-3 rounded-lg hover:bg-teal-700 transition">
                    + Add to Bill
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 print:col-span-12 bg-white p-8 rounded-2xl border shadow-sm">
                <div className="flex justify-between border-b pb-4">
                  <div>
                    <h1 className="text-xl font-bold text-teal-700">SANJAY MEDICAL STORE</h1>
                    <p className="text-xs text-gray-500">Chemist & Druggist • New Delhi</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold text-sm">Invoice: {invoiceNo}</p>
                    <p className="text-gray-500">Date: {billDate}</p>
                    <p className="text-gray-400">Billed By: {currentUser.name}</p>
                  </div>
                </div>

                <div className="py-3 border-b flex justify-between text-xs">
                  <div>
                    <span className="text-gray-400 block">CUSTOMER:</span>
                    <span className="font-bold text-sm text-gray-800">{customerName || "Walk-in Customer"}</span>
                  </div>
                  {customerPhone && (
                    <div className="text-right">
                      <span className="text-gray-400 block">PHONE:</span>
                      <span className="font-semibold text-sm">{customerPhone}</span>
                    </div>
                  )}
                </div>

                <table className="w-full text-left text-sm my-6">
                  <thead>
                    <tr className="border-b text-gray-500">
                      <th className="py-2">#</th>
                      <th className="py-2">Medicine</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">MRP</th>
                      <th className="py-2 text-right">Total</th>
                      <th className="py-2 text-center print:hidden">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400">
                          No items added to bill yet.
                        </td>
                      </tr>
                    ) : (
                      cart.map((item, idx) => (
                        <tr key={item._id} className="border-b">
                          <td className="py-2.5 text-gray-400">{idx + 1}</td>
                          <td className="py-2.5 font-medium capitalize">{item.name}</td>
                          <td className="py-2.5 text-center">{item.buyQty}</td>
                          <td className="py-2.5 text-right">₹{item.price}</td>
                          <td className="py-2.5 text-right font-bold">₹{item.total}</td>
                          <td className="py-2.5 text-center print:hidden">
                            <button onClick={() => removeFromCart(item._id)} className="text-red-500 font-bold">✕</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <div className="border-t pt-4 flex flex-col items-end gap-1 text-sm">
                  <div className="flex justify-between w-52 text-gray-600">
                    <span>Subtotal:</span>
                    <span>₹{subTotal}</span>
                  </div>
                  {discountPercent > 0 && (
                    <div className="flex justify-between w-52 text-green-600">
                      <span>Discount ({discountPercent}%):</span>
                      <span>- ₹{discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between w-52 font-bold text-lg text-gray-900 border-t pt-2 mt-1">
                    <span>Grand Total:</span>
                    <span>₹{grandTotal}</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3 print:hidden">
                  <button
                    onClick={() => setCart([])}
                    disabled={cart.length === 0}
                    className="px-4 py-2.5 rounded-lg border text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-sm"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => handleCompleteSale(false)}
                    disabled={cart.length === 0 || processingSale}
                    className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-emerald-700 shadow-sm disabled:opacity-50 text-sm"
                  >
                    Complete Sale (No Print)
                  </button>
                  <button
                    onClick={() => handleCompleteSale(true)}
                    disabled={cart.length === 0 || processingSale}
                    className="bg-teal-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-teal-700 shadow-sm disabled:opacity-50 text-sm"
                  >
                    Sale & Print Invoice
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "PRICES" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                <div className="bg-white p-5 rounded-2xl border shadow-sm">
                  <p className="text-xs font-bold text-teal-600 uppercase">Total Stock Value (MRP)</p>
                  <p className="text-3xl font-bold text-teal-700 mt-2">₹{totalStockSellingValue}</p>
                  <p className="text-xs text-gray-400 mt-1">Retail value of available stock</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase">Total Purchase Cost</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">₹{totalStockPurchaseCost}</p>
                  <p className="text-xs text-gray-400 mt-1">Wholesale inventory cost</p>
                </div>

                <div className="bg-green-50 p-5 rounded-2xl border border-green-200 shadow-sm">
                  <p className="text-xs font-bold text-green-700 uppercase">Expected Stock Profit</p>
                  <p className="text-3xl font-bold text-green-700 mt-2">+₹{totalExpectedProfit}</p>
                  <p className="text-xs text-green-600 mt-1">Projected margin on current stock</p>
                </div>

                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 shadow-sm">
                  <p className="text-xs font-bold text-blue-700 uppercase">Total Sales Completed</p>
                  <p className="text-3xl font-bold text-blue-800 mt-2">₹{totalRevenueGenerated}</p>
                  <p className="text-xs text-blue-600 font-semibold mt-1">
                    {sales.length} Invoices • Profit Earned: +₹{totalRealizedProfit}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-b text-xs uppercase text-gray-600">
                      <th className="p-4">Medicine Name</th>
                      <th className="p-4">Unit Purchase Price</th>
                      <th className="p-4">Unit Selling MRP</th>
                      <th className="p-4">Unit Margin</th>
                      <th className="p-4 text-center">Available Stock</th>
                      <th className="p-4">Total Stock Value</th>
                      <th className="p-4">Total Stock Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMedicines.map((med) => {
                      const qty = Number(med.quantity || 0);
                      const unitProfit = Number(med.price) - Number(med.rate);
                      return (
                        <tr key={med._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-4 font-bold capitalize">{med.name}</td>
                          <td className="p-4 text-gray-600">₹{med.rate}</td>
                          <td className="p-4 font-bold">₹{med.price}</td>
                          <td className="p-4 text-green-700 font-semibold">+₹{unitProfit}</td>
                          <td className="p-4 text-center font-bold">{qty}</td>
                          <td className="p-4 font-bold text-teal-800">₹{Number(med.price) * qty}</td>
                          <td className="p-4 font-bold text-green-700">+₹{unitProfit * qty}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "SALES" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                  <p className="text-sm text-gray-500 font-medium">Total Invoices</p>
                  <p className="text-4xl font-bold text-gray-800 mt-2">{sales.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                  <p className="text-sm text-gray-500 font-medium">Total Sales Revenue</p>
                  <p className="text-4xl font-bold text-teal-700 mt-2">₹{totalRevenueGenerated}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                  <p className="text-sm text-gray-500 font-medium">Net Realized Profit</p>
                  <p className="text-4xl font-bold text-green-600 mt-2">+₹{totalRealizedProfit}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border overflow-hidden">
                {sales.length === 0 ? (
                  <p className="p-8 text-center text-gray-400">No sales transactions recorded yet.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b text-gray-500">
                        <th className="p-4">Invoice No</th>
                        <th className="p-4">Date & Time</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Items Sold</th>
                        <th className="p-4">Billed By</th>
                        <th className="p-4">Total Amount</th>
                        <th className="p-4">Net Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((s) => (
                        <tr key={s._id} className="border-b hover:bg-gray-50">
                          <td className="p-4 font-bold text-teal-700">{s.invoiceNo}</td>
                          <td className="p-4 text-gray-500">{s.dateStr}</td>
                          <td className="p-4 font-medium">{s.customerName}</td>
                          <td className="p-4 text-gray-600">
                            {s.items?.map((i: any) => `${i.name} (x${i.buyQty})`).join(", ")}
                          </td>
                          <td className="p-4">{s.billedBy}</td>
                          <td className="p-4 font-bold">₹{s.grandTotal}</td>
                          <td className="p-4 font-bold text-green-600">+₹{s.profit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <EditMedicineModal editingMed={editingMed} setEditingMed={setEditingMed} onSave={handleEditSave} />
    </div>
  );
}