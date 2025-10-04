import React, { useState, useEffect } from "react";
import Authentication from "./Authentication";

const AuthWrapper = ({ children, language }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [farmerData, setFarmerData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");
      const storedFarmerData = localStorage.getItem("farmerData");

      if (token && storedFarmerData) {
        try {
          // Verify token with backend
          const response = await fetch(
            "http://localhost:8000/api/auth/profile",
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const profileData = await response.json();
            setFarmerData(profileData);
            setIsAuthenticated(true);
            console.log("✅ Refreshed farmer data on app load:", profileData);
          } else {
            // Token invalid, clear storage
            localStorage.removeItem("authToken");
            localStorage.removeItem("farmerData");
            console.log("❌ Token invalid, clearing storage");
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          localStorage.removeItem("authToken");
          localStorage.removeItem("farmerData");
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = async (authData) => {
    // Save the token and initial data
    localStorage.setItem("authToken", authData.access_token);
    localStorage.setItem("farmerData", JSON.stringify(authData.farmer_data));

    // Fetch the latest profile data from backend
    try {
      const response = await fetch("http://localhost:8000/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${authData.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const latestProfileData = await response.json();
        setFarmerData(latestProfileData);
        console.log("✅ Fresh farmer data loaded:", latestProfileData);
      } else {
        // Fallback to auth data if profile fetch fails
        setFarmerData(authData.farmer_data);
      }
    } catch (error) {
      console.error("❌ Failed to fetch latest profile:", error);
      // Fallback to auth data
      setFarmerData(authData.farmer_data);
    }

    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("farmerData");
    setIsAuthenticated(false);
    setFarmerData(null);
  };

  // Show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Krishi Saathi...</p>
        </div>
      </div>
    );
  }

  // Show authentication if not logged in
  if (!isAuthenticated) {
    return <Authentication onLogin={handleLogin} language={language} />;
  }

  // Show main app with farmer context
  return React.cloneElement(children, {
    farmerData,
    onLogout: handleLogout,
    isAuthenticated: true,
  });
};

export default AuthWrapper;
