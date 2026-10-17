"use client";

interface NavbarProps {
  toggleSidebar: () => void;
  activeTab: string;
  searchValue: string;
  onSearchChange: (val: string) => void;
}

export default function Navbar({
  toggleSidebar,
  activeTab,
  searchValue,
  onSearchChange,
}: NavbarProps) {
  const pageTitles: Record<string, string> = {
    DASHBOARD: "Dashboard",
    MEDICINES: "Medicines Directory",
    LOCATIONS: "Rack Locations",
    BILLING: "Customer Billing",
    PRICES: "Price & Profit Analysis",
    SALES: "Sales History",
  };

  const showSearch = ["DASHBOARD", "MEDICINES", "PRICES"].includes(activeTab);

  return (
    <header className="h-20 border-b border-gray-200 flex items-center justify-between px-8 bg-white print:hidden shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
          aria-label="Toggle Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <h1 className="text-2xl font-bold text-gray-800">{pageTitles[activeTab] || "Dashboard"}</h1>
      </div>

      {showSearch && (
        <input
          type="text"
          placeholder="Search medicine or rack..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border border-gray-300 rounded-full px-5 py-2 w-80 bg-gray-50 outline-none focus:border-teal-600 text-sm"
        />
      )}
    </header>
  );
}