import React, { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/Button";

const PasskeyManagement = ({ language = "en" }) => {
  const [passkeys, setPasskeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const translations = {
    en: {
      title: "Manage Passkeys",
      noPasskeys: "No passkeys registered",
      device: "Device",
      createdOn: "Created on",
      deleteButton: "Delete",
      confirmDelete: "Are you sure you want to delete this passkey?",
      deleteSuccess: "Passkey deleted successfully",
      loadError: "Failed to load passkeys",
      deleteError: "Failed to delete passkey",
      loading: "Loading...",
      deleting: "Deleting...",
    },
    hi: {
      title: "पासकी प्रबंधित करें",
      noPasskeys: "कोई पासकी पंजीकृत नहीं",
      device: "डिवाइस",
      createdOn: "बनाया गया",
      deleteButton: "हटाएं",
      confirmDelete: "क्या आप वाकई इस पासकी को हटाना चाहते हैं?",
      deleteSuccess: "पासकी सफलतापूर्वक हटाई गई",
      loadError: "पासकी लोड करने में विफल",
      deleteError: "पासकी हटाने में विफल",
      loading: "लोड हो रहा है...",
      deleting: "हटा रहा है...",
    },
  };

  const t = translations[language] || translations.en;

  const loadPasskeys = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("Please login first");
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/passkey/list`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setPasskeys(data.passkeys || []);
      } else {
        throw new Error(data.detail || t.loadError);
      }
    } catch (error) {
      console.error("❌ Error loading passkeys:", error);
      setError(error.message || t.loadError);
    } finally {
      setLoading(false);
    }
  }, [t.loadError]);

  const deletePasskey = async (credentialId) => {
    if (!window.confirm(t.confirmDelete)) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("Please login first");
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/auth/passkey/delete/${credentialId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(t.deleteSuccess);
        // Reload the passkey list
        await loadPasskeys();
      } else {
        throw new Error(data.detail || t.deleteError);
      }
    } catch (error) {
      console.error("❌ Error deleting passkey:", error);
      setError(error.message || t.deleteError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPasskeys();
  }, [loadPasskeys]);

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.title}</h3>

      {/* Success Message */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm">
          {success}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && passkeys.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>{t.loading}</p>
        </div>
      )}

      {/* Passkey List */}
      {!loading && passkeys.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl mb-2 block">🔐</span>
          <p>{t.noPasskeys}</p>
        </div>
      )}

      {passkeys.length > 0 && (
        <div className="space-y-3">
          {passkeys.map((passkey) => (
            <div
              key={passkey.credential_id}
              className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">🔑</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    {passkey.device_name || t.device}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t.createdOn}: {formatDate(passkey.created_at)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 font-mono truncate max-w-xs">
                    ID: {passkey.credential_id.substring(0, 16)}...
                  </p>
                </div>
              </div>
              <Button
                onClick={() => deletePasskey(passkey.credential_id)}
                disabled={loading}
                variant="outline"
                className="ml-4 px-4 py-2 text-red-600 border-red-300 hover:bg-red-50 disabled:opacity-50"
              >
                {loading ? t.deleting : t.deleteButton}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      {passkeys.length > 0 && (
        <div className="mt-4 text-center">
          <Button
            onClick={loadPasskeys}
            disabled={loading}
            variant="outline"
            className="text-sm"
          >
            🔄 Refresh List
          </Button>
        </div>
      )}
    </div>
  );
};

export default PasskeyManagement;
