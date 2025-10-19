import React, { useState, useEffect } from "react";
import AuthFlow from "./AuthFlow";
import PostLoginPasskeySetup from "./PostLoginPasskeySetup";

const AuthWrapper = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [farmerData, setFarmerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasskeySetup, setShowPasskeySetup] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

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

    // Check if this was a password login (not passkey login)
    const isPasswordLogin =
      !authData.farmer_data?.auth_method?.includes("passkey");

    if (isPasswordLogin) {
      // Check if user already has a passkey
      try {
        const token = authData.access_token;
        const passkeysResponse = await fetch(
          "http://localhost:8000/api/auth/passkey/list",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (passkeysResponse.ok) {
          const passkeysData = await passkeysResponse.json();
          const hasExistingPasskey =
            passkeysData.passkeys && passkeysData.passkeys.length > 0;

          if (!hasExistingPasskey) {
            // Show passkey setup for new password logins
            setJustLoggedIn(true);
            setShowPasskeySetup(true);
            return; // Don't set authenticated yet
          }
        }
      } catch (error) {
        console.error("Failed to check existing passkeys:", error);
      }
    }

    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("farmerData");
    setIsAuthenticated(false);
    setFarmerData(null);
    setShowPasskeySetup(false);
    setJustLoggedIn(false);
  };

  const handlePasskeySetupComplete = () => {
    setShowPasskeySetup(false);
    setJustLoggedIn(false);
    setIsAuthenticated(true);
  };

  const handleSkipPasskeySetup = () => {
    setShowPasskeySetup(false);
    setJustLoggedIn(false);
    setIsAuthenticated(true);
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

  // Show passkey setup after successful password login
  if (showPasskeySetup && justLoggedIn) {
    return (
      <PostLoginPasskeySetup
        onSetupComplete={handlePasskeySetupComplete}
        onSkip={handleSkipPasskeySetup}
      />
    );
  }

  // Show authentication if not logged in
  if (!isAuthenticated) {
    return <AuthFlow onAuthSuccess={handleLogin} />;
  }

  // Show main app with farmer context
  return React.cloneElement(children, {
    farmerData,
    onLogout: handleLogout,
    isAuthenticated: true,
  });
};

export default AuthWrapper;
