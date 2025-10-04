import React, { useState, useEffect, useCallback } from "react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

const AuthTest = () => {
  const [results, setResults] = useState([]);
  const [phone, setPhone] = useState("+919876543210");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");

  const addResult = (test, status, data) => {
    setResults((prev) => [
      ...prev,
      {
        test,
        status,
        data,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  // Test 1: Health Check
  const testHealthCheck = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/health");

      if (response.ok) {
        addResult("Health Check", "✅ PASS", "Backend server is running");
      } else {
        addResult("Health Check", "❌ FAIL", "Backend not responding");
      }
    } catch {
      addResult("Health Check", "❌ FAIL", "Cannot connect to backend");
    }
    setLoading(false);
  }, []);

  // Test 2: Send OTP
  const testSendOTP = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (response.ok) {
        addResult("Send OTP", "✅ PASS", `OTP: ${data.dev_otp || "Sent"}`);
        if (data.dev_otp) {
          setOtp(data.dev_otp);
        }
      } else {
        addResult("Send OTP", "❌ FAIL", data.detail || "Failed to send OTP");
      }
    } catch (error) {
      addResult("Send OTP", "❌ FAIL", error.message);
    }
    setLoading(false);
  };

  // Test 3: Verify OTP
  const testVerifyOTP = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8000/api/auth/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone,
            otp,
            farmer_name: "Test Farmer",
            district: "Kottayam",
            language: "en",
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        addResult("Verify OTP", "✅ PASS", "Login successful");
        setToken(data.access_token);
        localStorage.setItem("authToken", data.access_token);
      } else {
        addResult(
          "Verify OTP",
          "❌ FAIL",
          data.detail || "OTP verification failed"
        );
      }
    } catch (error) {
      addResult("Verify OTP", "❌ FAIL", error.message);
    }
    setLoading(false);
  };

  // Test 4: Get Profile (Protected Route)
  const testGetProfile = async () => {
    setLoading(true);
    const authToken = token || localStorage.getItem("authToken");

    if (!authToken) {
      addResult("Get Profile", "❌ FAIL", "No auth token available");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        addResult(
          "Get Profile",
          "✅ PASS",
          `Farmer: ${data.name} (${data.phone})`
        );
      } else {
        addResult(
          "Get Profile",
          "❌ FAIL",
          data.detail || "Profile fetch failed"
        );
      }
    } catch (error) {
      addResult("Get Profile", "❌ FAIL", error.message);
    }
    setLoading(false);
  };

  // Test 5: List All Farmers
  const testListFarmers = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/auth/farmers");
      const data = await response.json();

      if (response.ok) {
        addResult(
          "List Farmers",
          "✅ PASS",
          `Total farmers: ${data.total_farmers}`
        );
      } else {
        addResult("List Farmers", "❌ FAIL", "Failed to list farmers");
      }
    } catch (error) {
      addResult("List Farmers", "❌ FAIL", error.message);
    }
    setLoading(false);
  };

  // Auto-run health check on mount
  useEffect(() => {
    testHealthCheck();
  }, [testHealthCheck]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">
              🧪 Authentication System Test
            </h1>

            {/* Test Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919876543210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OTP (Auto-filled)
                </label>
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                />
              </div>
            </div>

            {/* Test Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <Button
                onClick={testHealthCheck}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                1. Health Check
              </Button>

              <Button
                onClick={testSendOTP}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                2. Send OTP
              </Button>

              <Button
                onClick={testVerifyOTP}
                disabled={loading || !otp}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                3. Verify OTP
              </Button>

              <Button
                onClick={testGetProfile}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                4. Get Profile
              </Button>

              <Button
                onClick={testListFarmers}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                5. List Farmers
              </Button>
            </div>

            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-600 mt-2">Testing...</p>
              </div>
            )}
          </div>
        </Card>

        {/* Test Results */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>

            {results.length === 0 ? (
              <p className="text-gray-500 italic">No tests run yet...</p>
            ) : (
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border-l-4 ${
                      result.status.includes("✅")
                        ? "bg-green-50 border-green-400"
                        : "bg-red-50 border-red-400"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">{result.test}</span>
                        <span className="ml-2">{result.status}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {result.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{result.data}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Quick Links */}
        <div className="mt-6 text-center space-x-4">
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            📚 API Documentation
          </a>
          <a
            href="http://localhost:8000/health"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-800 underline"
          >
            💚 Health Check
          </a>
          <a
            href="http://localhost:8000/api/auth/farmers"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:text-purple-800 underline"
          >
            👥 View Farmers
          </a>
        </div>
      </div>
    </div>
  );
};

export default AuthTest;
