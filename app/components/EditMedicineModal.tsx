"use client";

interface EditModalProps {
  editingMed: any;
  setEditingMed: (med: any) => void;
  onSave: (e: React.FormEvent) => void;
}

export default function EditMedicineModal({ editingMed, setEditingMed, onSave }: EditModalProps) {
  if (!editingMed) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Update Medicine</h2>
        <form onSubmit={onSave} className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-gray-500">Medicine Name</label>
            <input
              type="text"
              value={editingMed.name}
              onChange={(e) => setEditingMed({ ...editingMed, name: e.target.value })}
              className="border p-2.5 rounded-lg w-full mt-1 outline-none focus:border-teal-600"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Rack / Location</label>
            <input
              type="text"
              value={editingMed.location}
              onChange={(e) => setEditingMed({ ...editingMed, location: e.target.value })}
              className="border p-2.5 rounded-lg w-full mt-1 outline-none focus:border-teal-600"
              required
            />
          </div>
          <div className="flex gap-3">
            <div className="w-1/3">
              <label className="text-xs text-gray-500">Quantity</label>
              <input
                type="number"
                value={editingMed.quantity}
                onChange={(e) => setEditingMed({ ...editingMed, quantity: e.target.value })}
                className="border p-2.5 rounded-lg w-full mt-1 outline-none focus:border-teal-600"
                required
              />
            </div>
            <div className="w-1/3">
              <label className="text-xs text-gray-500">Purchase (₹)</label>
              <input
                type="number"
                value={editingMed.rate}
                onChange={(e) => setEditingMed({ ...editingMed, rate: e.target.value })}
                className="border p-2.5 rounded-lg w-full mt-1 outline-none focus:border-teal-600"
                required
              />
            </div>
            <div className="w-1/3">
              <label className="text-xs text-gray-500">Selling MRP (₹)</label>
              <input
                type="number"
                value={editingMed.price}
                onChange={(e) => setEditingMed({ ...editingMed, price: e.target.value })}
                className="border p-2.5 rounded-lg w-full mt-1 outline-none focus:border-teal-600"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Expiry Date</label>
            <input
              type="date"
              value={editingMed.expiryDate}
              onChange={(e) => setEditingMed({ ...editingMed, expiryDate: e.target.value })}
              className="border p-2.5 rounded-lg w-full mt-1 outline-none focus:border-teal-600"
              required
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => setEditingMed(null)}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 text-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}