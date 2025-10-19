import { useState, useEffect } from "react";
import { inventoryService } from "../services/api";
import { Card } from "./ui/Card";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Button } from "./ui/Button";
import { getMultilingualOptions } from "../utils/languageOptions";

function InventoryManagement({ language }) {
  // Get multilingual options
  const languageOptions = getMultilingualOptions(language);
  const categoryOptions = languageOptions.categories;
  const sortOptions = languageOptions.sortOptions;

  const [inventoryData, setInventoryData] = useState({
    summary: {
      totalValue: 0,
      totalItems: 0,
      lowStockCount: 0,
      expiringCount: 0,
    },
    items: [],
    recentTransactions: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filter states
  const [filters, setFilters] = useState({
    category: "all", // all, inputs, produce
    search: "",
    sortBy: "name", // name, quantity, expiry, value
    showLowStock: false,
    showExpiring: false,
  });

  // Add item modal
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "inputs",
    subcategory: "",
    quantity: "",
    unit: "",
    pricePerUnit: "",
    expiryDate: "",
    minStockLevel: "",
    supplier: "",
    location: "",
  });

  // Load inventory data on component mount
  useEffect(() => {
    fetchInventoryData();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchInventoryData = async () => {
    setLoading(true);
    setError("");

    try {
      // Load inventory items
      const response = await inventoryService.getInventory(filters);

      // Load recent transactions
      const transactionsResponse = await inventoryService.getTransactions(
        "",
        10
      );

      // Extract the nested data structure from backend response
      if (response.success && response.data) {
        setInventoryData({
          summary: {
            totalValue: response.data.summary.total_value || 0,
            totalItems: response.data.summary.total_items || 0,
            lowStockCount: response.data.summary.low_stock_count || 0,
            expiringCount: response.data.summary.expiring_count || 0,
          },
          items: response.data.items || [],
          recentTransactions: transactionsResponse.success
            ? transactionsResponse.data || []
            : [],
        });
      }
    } catch (err) {
      setError(
        language === "hi"
          ? "इन्वेंटरी डेटा लोड करने में असफल"
          : language === "ml"
          ? "ഇൻവെന്ററി വിവരങ്ങൾ കണ്ടെത്താൻ കഴിഞ്ഞില്ല"
          : "Failed to fetch inventory data"
      );
      console.error("Error fetching inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddItem = async () => {
    if (
      !newItem.name ||
      !newItem.quantity ||
      !newItem.pricePerUnit ||
      !newItem.category ||
      !newItem.unit
    ) {
      alert(
        language === "hi"
          ? "कृपया आवश्यक फ़ील्ड भरें (नाम, मात्रा, मूल्य, श्रेणी, इकाई)"
          : language === "ml"
          ? "ആവശ്യമായ ഫീൽഡുകൾ പൂരിപ്പിക്കുക (പേര്, അളവ്, വില, വിഭാഗം, യൂണിറ്റ്)"
          : "Please fill required fields (name, quantity, price, category, unit)"
      );
      return;
    }

    try {
      // Map frontend fields to backend model
      const itemData = {
        name: newItem.name,
        category: newItem.category,
        quantity: parseInt(newItem.quantity),
        unit: newItem.unit,
        price: parseFloat(newItem.pricePerUnit), // Map pricePerUnit to price
        supplier: newItem.supplier || null,
        expiry_date: newItem.expiryDate || null,
        location: newItem.location || null,
        minimum_stock: parseInt(newItem.minStockLevel) || 10,
      };

      await inventoryService.addItem(itemData);
      setNewItem({
        name: "",
        category: "inputs",
        subcategory: "",
        quantity: "",
        unit: "",
        pricePerUnit: "",
        expiryDate: "",
        minStockLevel: "",
        supplier: "",
        location: "",
      });
      setShowAddItem(false);
      fetchInventoryData();
      alert(
        language === "hi"
          ? "आइटम सफलतापूर्वक जोड़ा गया!"
          : language === "ml"
          ? "വസ്തു ചേർത്തു!"
          : "Item added successfully!"
      );
    } catch (err) {
      console.error("Error adding item:", err);
      alert(
        language === "hi"
          ? "आइटम जोड़ने में असफल"
          : language === "ml"
          ? "വസ്തു ചേർക്കാൻ കഴിഞ്ഞില്ല"
          : "Failed to add item"
      );
    }
  };

  const updateStock = async (itemId, newQuantity, type = "adjustment") => {
    try {
      await inventoryService.updateStock(itemId, newQuantity, type);
      fetchInventoryData();
    } catch (err) {
      console.error("Error updating stock:", err);
      alert(
        language === "hi"
          ? "स्टॉक अपडेट करने में असफल"
          : language === "ml"
          ? "സ്റ്റോക്ക് അപ്‌ഡേറ്റ് ചെയ്യാൻ കഴിഞ്ഞില്ല"
          : "Failed to update stock"
      );
    }
  };

  const getStatusColor = (item) => {
    const daysToExpiry = item.daysToExpiry;
    if (daysToExpiry <= 7 && daysToExpiry >= 0) return "text-red-600";
    if (daysToExpiry <= 30 && daysToExpiry > 7) return "text-yellow-600";
    if (item.quantity <= item.minStockLevel) return "text-orange-600";
    return "text-green-600";
  };

  const getStatusIcon = (item) => {
    const daysToExpiry = item.daysToExpiry;
    if (daysToExpiry <= 7 && daysToExpiry >= 0) return "⚠️";
    if (daysToExpiry <= 30 && daysToExpiry > 7) return "🟡";
    if (item.quantity <= item.minStockLevel) return "📉";
    return "✅";
  };

  const formatCurrency = (amount = 0) => {
    return `₹${Number(amount).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {language === "hi"
            ? "इन्वेंटरी प्रबंधन"
            : language === "ml"
            ? "ഇൻവെന്ററി മാനേജ്മെന്റ്"
            : "Inventory Management"}
        </h1>
        <p className="text-gray-600">
          {language === "hi"
            ? "अपनी कृषि सामग्री और उत्पादन की सूची का ट्रैक रखें"
            : language === "ml"
            ? "നിങ്ങളുടെ കാർഷിക സാമഗ്രികളും ഉൽപ്പാദനങ്ങളും ട്രാക്ക് ചെയ്യുക"
            : "Track your farm inputs and produce inventory"}
        </p>
      </div>

      {/* Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {language === "hi"
                    ? "कुल मूल्य"
                    : language === "ml"
                    ? "മൊത്തം മൂല്യം"
                    : "Total Value"}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(inventoryData.summary.totalValue)}
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {language === "hi"
                    ? "कुल आइटम"
                    : language === "ml"
                    ? "മൊത്തം ഇനങ്ങൾ"
                    : "Total Items"}
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {inventoryData.summary.totalItems}
                </p>
              </div>
              <div className="text-3xl">📦</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {language === "hi"
                    ? "कम स्टॉक"
                    : language === "ml"
                    ? "കുറഞ്ഞ സ്റ്റോക്ക്"
                    : "Low Stock"}
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {inventoryData.summary.lowStockCount}
                </p>
              </div>
              <div className="text-3xl">📉</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {language === "hi"
                    ? "जल्द समाप्त"
                    : language === "ml"
                    ? "കാലഹരണപ്പെടുന്നവ"
                    : "Expiring Soon"}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {inventoryData.summary.expiringCount}
                </p>
              </div>
              <div className="text-3xl">⏰</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold">
              {language === "hi"
                ? "इन्वेंटरी आइटम"
                : language === "ml"
                ? "ഇൻവെന്ററി ഇനങ്ങൾ"
                : "Inventory Items"}
            </h2>
            <Button onClick={() => setShowAddItem(true)}>
              +{" "}
              {language === "hi"
                ? "नया आइटम जोड़ें"
                : language === "ml"
                ? "പുതിയ ഇനം ചേർക്കുക"
                : "Add New Item"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Category Filter */}
            <div>
              <Label htmlFor="category">
                {language === "hi"
                  ? "श्रेणी"
                  : language === "ml"
                  ? "വിഭാഗം"
                  : "Category"}
              </Label>
              <select
                id="category"
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categoryOptions.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <Label htmlFor="search">
                {language === "hi"
                  ? "खोजें"
                  : language === "ml"
                  ? "തിരയുക"
                  : "Search"}
              </Label>
              <Input
                type="text"
                id="search"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder={
                  language === "hi"
                    ? "आइटम का नाम..."
                    : language === "ml"
                    ? "ഇനത്തിന്റെ പേര്"
                    : "Item name..."
                }
              />
            </div>

            {/* Sort By */}
            <div>
              <Label htmlFor="sortBy">
                {language === "hi"
                  ? "क्रमबद्ध करें"
                  : language === "ml"
                  ? "ക്രമീകരിക്കുക"
                  : "Sort By"}
              </Label>
              <select
                id="sortBy"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOptions.map((sort) => (
                  <option key={sort.value} value={sort.value}>
                    {sort.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-col space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.showLowStock}
                  onChange={(e) =>
                    handleFilterChange("showLowStock", e.target.checked)
                  }
                  className="rounded"
                />
                <span className="text-sm">
                  {language === "hi"
                    ? "केवल कम स्टॉक"
                    : language === "ml"
                    ? "കുറഞ്ഞ സ്റ്റോക്ക്"
                    : "Low Stock Only"}
                </span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.showExpiring}
                  onChange={(e) =>
                    handleFilterChange("showExpiring", e.target.checked)
                  }
                  className="rounded"
                />
                <span className="text-sm">
                  {language === "hi"
                    ? "जल्द समाप्त"
                    : language === "ml"
                    ? "കാലഹരണപ്പെടുന്നവ"
                    : "Expiring Soon"}
                </span>
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Inventory Items */}
      {inventoryData.items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
          {inventoryData.items.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 flex items-center space-x-2">
                      <span>{item.name}</span>
                      <span className="text-lg">{getStatusIcon(item)}</span>
                    </h3>
                    <p className="text-sm text-gray-600">
                      {item.subcategory} •{" "}
                      {item.category === "inputs"
                        ? language === "hi"
                          ? "सामग्री"
                          : language === "ml"
                          ? "സാമഗ്രികൾ"
                          : "Inputs"
                        : language === "hi"
                        ? "उत्पादन"
                        : language === "ml"
                        ? "ഉൽപ്പാദനങ്ങൾ"
                        : "Produce"}
                    </p>
                  </div>
                </div>

                {/* Quantity and Value */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      {language === "hi"
                        ? "मात्रा"
                        : language === "ml"
                        ? "അളവ്"
                        : "Quantity"}
                    </p>
                    <p className="font-semibold">
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {language === "hi"
                        ? "मूल्य"
                        : language === "ml"
                        ? "മൂല്യം"
                        : "Value"}
                    </p>
                    <p className="font-semibold">
                      {formatCurrency(item.totalValue)}
                    </p>
                  </div>
                </div>

                {/* Expiry Date */}
                {item.expiryDate && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      {language === "hi"
                        ? "समाप्ति तिथि"
                        : language === "ml"
                        ? "കാലാവധി"
                        : "Expiry Date"}
                    </p>
                    <p className={`font-semibold ${getStatusColor(item)}`}>
                      {formatDate(item.expiryDate)}
                      {item.daysToExpiry >= 0 && (
                        <span className="text-sm ml-2">
                          ({item.daysToExpiry}{" "}
                          {language === "hi"
                            ? "दिन"
                            : language === "ml"
                            ? "ദിവസം"
                            : "days"}
                          )
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {/* Stock Level */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>
                      {language === "hi"
                        ? "स्टॉक स्तर"
                        : language === "ml"
                        ? "സ്റ്റോക്ക് നില"
                        : "Stock Level"}
                    </span>
                    <span>
                      {item.quantity}/{item.minStockLevel} min
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        item.quantity <= item.minStockLevel
                          ? "bg-red-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.max(
                          (item.quantity / (item.minStockLevel * 2)) * 100,
                          10
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newQty = prompt(
                        language === "hi"
                          ? "नई मात्रा दर्ज करें:"
                          : language === "ml"
                          ? "പുതിയ അളവ് നൽകുക:"
                          : "Enter new quantity:",
                        item.quantity
                      );
                      if (newQty && !isNaN(newQty)) {
                        updateStock(item.id, parseInt(newQty), "adjustment");
                      }
                    }}
                  >
                    {language === "hi"
                      ? "अपडेट"
                      : language === "ml"
                      ? "അപ്‌ഡേറ്റ്"
                      : "Update"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const addQty = prompt(
                        language === "hi"
                          ? "जोड़ने के लिए मात्रा:"
                          : language === "ml"
                          ? "ചേർക്കാനുള്ള അളവ്:"
                          : "Quantity to add:",
                        "0"
                      );
                      if (addQty && !isNaN(addQty)) {
                        updateStock(
                          item.id,
                          item.quantity + parseInt(addQty),
                          "purchase"
                        );
                      }
                    }}
                  >
                    +{" "}
                    {language === "hi"
                      ? "जोड़ें"
                      : language === "ml"
                      ? "ചേർക്കുക"
                      : "Add"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Transactions */}
      {inventoryData.recentTransactions.length > 0 && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {language === "hi"
                ? "हाल की लेनदेन"
                : language === "ml"
                ? "സമീപകാല ഇടപാടുകൾ"
                : "Recent Transactions"}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2">
                      {language === "hi"
                        ? "वस्तु"
                        : language === "ml"
                        ? "ഇനം"
                        : "Item"}
                    </th>
                    <th className="text-left py-2">
                      {language === "hi"
                        ? "प्रकार"
                        : language === "ml"
                        ? "തരം"
                        : "Type"}
                    </th>
                    <th className="text-left py-2">
                      {language === "hi"
                        ? "मात्रा"
                        : language === "ml"
                        ? "അളവ്"
                        : "Quantity"}
                    </th>
                    <th className="text-left py-2">
                      {language === "hi"
                        ? "दिनांक"
                        : language === "ml"
                        ? "തീയതി"
                        : "Date"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryData.recentTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-gray-100"
                    >
                      <td className="py-2">{transaction.itemName}</td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            transaction.type === "purchase"
                              ? "bg-green-100 text-green-700"
                              : transaction.type === "sale"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {transaction.type === "purchase"
                            ? language === "hi"
                              ? "खरीद"
                              : language === "ml"
                              ? "വാങ്ങൽ"
                              : "Purchase"
                            : transaction.type === "sale"
                            ? language === "hi"
                              ? "बिक्री"
                              : language === "ml"
                              ? "വിൽപ്പന"
                              : "Sale"
                            : language === "hi"
                            ? "समायोजन"
                            : language === "ml"
                            ? "ക്രമീകരണം"
                            : "Adjustment"}
                        </span>
                      </td>
                      <td className="py-2">
                        {transaction.type === "sale" ||
                        transaction.type === "usage"
                          ? "-"
                          : "+"}
                        {transaction.quantity} {transaction.unit}
                      </td>
                      <td className="py-2">{formatDate(transaction.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {language === "hi"
                  ? "नया आइटम जोड़ें"
                  : language === "ml"
                  ? "പുതിയ ഇനം ചേർക്കുക"
                  : "Add New Item"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="itemName">
                    {language === "hi"
                      ? "वस्तु का नाम"
                      : language === "ml"
                      ? "ഇനത്തിന്റെ പേര്"
                      : "Item Name"}{" "}
                    *
                  </Label>
                  <Input
                    type="text"
                    id="itemName"
                    value={newItem.name}
                    onChange={(e) =>
                      setNewItem((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder={
                      language === "hi"
                        ? "वस्तु का नाम दर्ज करें"
                        : language === "ml"
                        ? "ഇനത്തിന്റെ പേര്"
                        : "Enter item name"
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="itemCategory">
                    {language === "hi"
                      ? "श्रेणी"
                      : language === "ml"
                      ? "വിഭാഗം"
                      : "Category"}{" "}
                    *
                  </Label>
                  <select
                    id="itemCategory"
                    value={newItem.category}
                    onChange={(e) =>
                      setNewItem((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="inputs">
                      {language === "hi"
                        ? "कृषि सामग्री"
                        : language === "ml"
                        ? "കാർഷിക സാമഗ്രികൾ"
                        : "Farm Inputs"}
                    </option>
                    <option value="produce">
                      {language === "hi"
                        ? "कृषि उत्पादन"
                        : language === "ml"
                        ? "കാർഷിക ഉൽപ്പാദനങ്ങൾ"
                        : "Farm Produce"}
                    </option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="subcategory">
                    {language === "hi"
                      ? "उपश्रेणी"
                      : language === "ml"
                      ? "ഉപവിഭാഗം"
                      : "Subcategory"}
                  </Label>
                  <Input
                    type="text"
                    id="subcategory"
                    value={newItem.subcategory}
                    onChange={(e) =>
                      setNewItem((prev) => ({
                        ...prev,
                        subcategory: e.target.value,
                      }))
                    }
                    placeholder={
                      language === "hi"
                        ? "उदा: बीज, खाद"
                        : language === "ml"
                        ? "ഉദാ: വിത്തുകൾ, വളം"
                        : "e.g: Seeds, Fertilizer"
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="quantity">
                    {language === "hi"
                      ? "मात्रा"
                      : language === "ml"
                      ? "അളവ്"
                      : "Quantity"}{" "}
                    *
                  </Label>
                  <Input
                    type="number"
                    id="quantity"
                    value={newItem.quantity}
                    onChange={(e) =>
                      setNewItem((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="unit">
                    {language === "hi"
                      ? "इकाई"
                      : language === "ml"
                      ? "യൂണിറ്റ്"
                      : "Unit"}{" "}
                    *
                  </Label>
                  <Input
                    type="text"
                    id="unit"
                    value={newItem.unit}
                    onChange={(e) =>
                      setNewItem((prev) => ({ ...prev, unit: e.target.value }))
                    }
                    placeholder={
                      language === "hi"
                        ? "किलो, लीटर, बैग"
                        : language === "ml"
                        ? "കിലോ, ലിറ്റർ, ബാഗ്"
                        : "kg, ltr, bags"
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="pricePerUnit">
                    {language === "hi"
                      ? "प्रति यूनिट कीमत"
                      : language === "ml"
                      ? "യൂണിറ്റ് വില"
                      : "Price per Unit"}{" "}
                    *
                  </Label>
                  <Input
                    type="number"
                    id="pricePerUnit"
                    value={newItem.pricePerUnit}
                    onChange={(e) =>
                      setNewItem((prev) => ({
                        ...prev,
                        pricePerUnit: e.target.value,
                      }))
                    }
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="expiryDate">
                    {language === "hi"
                      ? "समाप्ति तिथि"
                      : language === "ml"
                      ? "കാലാവധി"
                      : "Expiry Date"}
                  </Label>
                  <Input
                    type="date"
                    id="expiryDate"
                    value={newItem.expiryDate}
                    onChange={(e) =>
                      setNewItem((prev) => ({
                        ...prev,
                        expiryDate: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="minStockLevel">
                    {language === "hi"
                      ? "न्यूनतम स्टॉक स्तर"
                      : language === "ml"
                      ? "കുറഞ്ഞ സ്റ്റോക്ക് ലെവൽ"
                      : "Min Stock Level"}
                  </Label>
                  <Input
                    type="number"
                    id="minStockLevel"
                    value={newItem.minStockLevel}
                    onChange={(e) =>
                      setNewItem((prev) => ({
                        ...prev,
                        minStockLevel: e.target.value,
                      }))
                    }
                    placeholder="10"
                  />
                </div>

                <div>
                  <Label htmlFor="supplier">
                    {language === "hi"
                      ? "आपूर्तिकर्ता"
                      : language === "ml"
                      ? "വിതരണക്കാരൻ"
                      : "Supplier"}
                  </Label>
                  <Input
                    type="text"
                    id="supplier"
                    value={newItem.supplier}
                    onChange={(e) =>
                      setNewItem((prev) => ({
                        ...prev,
                        supplier: e.target.value,
                      }))
                    }
                    placeholder={
                      language === "hi"
                        ? "आपूर्तिकर्ता का नाम"
                        : language === "ml"
                        ? "വിതരണക്കാരന്റെ പേര്"
                        : "Supplier name"
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="location">
                    {language === "hi"
                      ? "भंडारण स्थान"
                      : language === "ml"
                      ? "സ്ഥലം"
                      : "Storage Location"}
                  </Label>
                  <Input
                    type="text"
                    id="location"
                    value={newItem.location}
                    onChange={(e) =>
                      setNewItem((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    placeholder={
                      language === "hi"
                        ? "भंडारण स्थान"
                        : language === "ml"
                        ? "സംഭരണ സ്ഥലം"
                        : "Storage location"
                    }
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button onClick={handleAddItem}>
                  {language === "hi"
                    ? "वस्तु जोड़ें"
                    : language === "ml"
                    ? "ചേർക്കുക"
                    : "Add Item"}
                </Button>
                <Button variant="outline" onClick={() => setShowAddItem(false)}>
                  {language === "hi"
                    ? "रद्द करें"
                    : language === "ml"
                    ? "റദ്ദാക്കുക"
                    : "Cancel"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">
              {language === "hi"
                ? "इन्वेंटरी लोड हो रही है..."
                : language === "ml"
                ? "ഇൻവെന്ററി ലോഡ് ചെയ്യുന്നു..."
                : "Loading inventory..."}
            </p>
          </div>
        </Card>
      )}

      {/* No Data State */}
      {!loading && inventoryData.items.length === 0 && !error && (
        <Card>
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <span className="text-6xl">📦</span>
            </div>
            <p className="text-gray-500 mb-4">
              {language === "hi"
                ? "इन्वेंटरी में कोई वस्तुएं नहीं हैं"
                : language === "ml"
                ? "ഇൻവെന്ററിയിൽ ഇനങ്ങളൊന്നുമില്ല"
                : "No items in inventory"}
            </p>
            <Button onClick={() => setShowAddItem(true)}>
              {language === "hi"
                ? "पहला आइटम जोड़ें"
                : language === "ml"
                ? "ആദ്യത്തെ ഇനം ചേർക്കുക"
                : "Add First Item"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default InventoryManagement;
