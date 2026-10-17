"use client";

import Link from "next/link";

interface SidebarProps {
  isOpen: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setFilterType: (filter: "ALL" | "LOW" | "NEAR_EXPIRY" | "EXPIRED") => void;
  totalMedicines: number;
  totalExpectedProfit: number;
  uniqueRacksCount: number;
  salesCount: number;
  currentUser: any;
  onLogout: () => void;
}

export default function Sidebar({
  isOpen,
  activeTab,
  setActiveTab,
  setFilterType,
  totalMedicines,
  totalExpectedProfit,
  uniqueRacksCount,
  salesCount,
  currentUser,
  onLogout,
}: SidebarProps) {
  return (
    <aside
      className={`${
        isOpen ? "w-72" : "w-20"
      } bg-white border-r border-gray-200 flex flex-col justify-between transition-all duration-200 print:hidden shrink-0`}
    >
      <div>
        <div className="h-20 px-5 border-b border-gray-200 flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold text-lg shrink-0">
            +
          </div>
          {isOpen && (
            <span className="font-bold text-base text-gray-800 tracking-tight whitespace-nowrap">
              Sanjay Medical Store
            </span>
          )}
        </div>

        <nav className="p-3 flex flex-col gap-1.5 mt-2">
          <button
            onClick={() => {
              setActiveTab("DASHBOARD");
              setFilterType("ALL");
            }}
            className={`flex items-center ${
              isOpen ? "justify-between px-4" : "justify-center px-2"
            } py-3 rounded-lg font-medium text-sm transition ${
              activeTab === "DASHBOARD" ? "bg-teal-50 text-teal-700" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-base">⊞</span>
              {isOpen && <span>Dashboard</span>}
            </div>
          </button>

          <Link
            href="/add-medicine"
            className={`flex items-center ${
              isOpen ? "px-4 gap-3" : "justify-center px-2"
            } py-3 rounded-lg font-medium text-sm text-gray-600 hover:bg-gray-50 transition`}
          >
            <span className="font-bold text-base">＋</span>
            {isOpen && <span>Add Medicine</span>}
          </Link>

          <button
            onClick={() => setActiveTab("MEDICINES")}
            className={`flex items-center ${
              isOpen ? "justify-between px-4" : "justify-center px-2"
            } py-3 rounded-lg font-medium text-sm transition ${
              activeTab === "MEDICINES" ? "bg-teal-50 text-teal-700" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-base">◈</span>
              {isOpen && <span>Medicines</span>}
            </div>
            {isOpen && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold">
                {totalMedicines}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("LOCATIONS")}
            className={`flex items-center ${
              isOpen ? "justify-between px-4" : "justify-center px-2"
            } py-3 rounded-lg font-medium text-sm transition ${
              activeTab === "LOCATIONS" ? "bg-teal-50 text-teal-700" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-base">⌖</span>
              {isOpen && <span>Locations</span>}
            </div>
            {isOpen && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold">
                {uniqueRacksCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("BILLING")}
            className={`flex items-center ${
              isOpen ? "justify-between px-4" : "justify-center px-2"
            } py-3 rounded-lg font-medium text-sm transition ${
              activeTab === "BILLING" ? "bg-teal-50 text-teal-700" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-base">▤</span>
              {isOpen && <span>Billing</span>}
            </div>
          </button>

          <button
            onClick={() => setActiveTab("PRICES")}
            className={`flex items-center ${
              isOpen ? "justify-between px-4" : "justify-center px-2"
            } py-3 rounded-lg font-medium text-sm transition ${
              activeTab === "PRICES" ? "bg-teal-50 text-teal-700" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-base">₹</span>
              {isOpen && <span>Price & Profit</span>}
            </div>
            {isOpen && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-semibold">
                +₹{totalExpectedProfit}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("SALES")}
            className={`flex items-center ${
              isOpen ? "justify-between px-4" : "justify-center px-2"
            } py-3 rounded-lg font-medium text-sm transition ${
              activeTab === "SALES" ? "bg-teal-50 text-teal-700" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-base">◷</span>
              {isOpen && <span>Sales History</span>}
            </div>
            {isOpen && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-semibold">
                {salesCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          {isOpen && (
            <div className="truncate">
              <p className="text-sm font-bold leading-tight truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-500">{currentUser.role}</p>
            </div>
          )}
        </div>

        {isOpen && (
          <button
            onClick={onLogout}
            className="text-xs bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-red-100 shrink-0"
          >
            Logout
          </button>
        )}
      </div>
    </aside>
  );
}