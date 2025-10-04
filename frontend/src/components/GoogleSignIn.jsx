import React, { useEffect, useCallback, useRef } from "react";
import { Button } from "./ui/Button";
import { FcGoogle } from "react-icons/fc";

const GoogleSignIn = ({ onGoogleLogin, language = "en" }) => {
  const isInitialized = useRef(false);
  const isScriptLoaded = useRef(false);

  const translations = {
    en: {
      signInWithGoogle: "Sign in with Google",
      loading: "Loading...",
    },
    hi: {
      signInWithGoogle: "Google के साथ साइन इन करें",
      loading: "लोड हो रहा है...",
    },
  };

  const t = translations[language] || translations.en;

  const handleGoogleCallback = useCallback(
    (response) => {
      console.log("✅ Google Sign-In Response:", response);

      if (response.credential) {
        // Decode JWT token to get user info
        try {
          const base64Url = response.credential.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );

          const userData = JSON.parse(jsonPayload);
          console.log("👤 Decoded User Data:", userData);

          const googleUser = {
            id: userData.sub,
            email: userData.email,
            name: userData.name,
            picture: userData.picture,
            email_verified: userData.email_verified,
            credential: response.credential,
          };

          onGoogleLogin(googleUser);
        } catch (error) {
          console.error("❌ Error decoding Google credential:", error);
          alert("Failed to process Google Sign-In. Please try again.");
        }
      } else {
        console.error("❌ No credential in Google response");
        alert("Google Sign-In failed. Please try again.");
      }
    },
    [onGoogleLogin]
  );

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    console.log("🔍 Google Client ID:", clientId ? "✅ Found" : "❌ Missing");

    if (!clientId || clientId === "YOUR_GOOGLE_CLIENT_ID") {
      console.error("❌ Google Client ID not configured properly");
      return;
    }

    // Check if script is already loaded
    if (
      document.querySelector('script[src*="accounts.google.com/gsi/client"]')
    ) {
      console.log("ℹ️ Google script already exists");
      isScriptLoaded.current = true;

      // Initialize if window.google is available
      if (window.google?.accounts?.id && !isInitialized.current) {
        initializeGoogleSignIn(clientId);
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log("✅ Google Sign-In script loaded");
      isScriptLoaded.current = true;

      if (window.google?.accounts?.id) {
        initializeGoogleSignIn(clientId);
      } else {
        console.error("❌ window.google.accounts.id not available");
      }
    };

    script.onerror = (error) => {
      console.error("❌ Failed to load Google Sign-In script:", error);
      isScriptLoaded.current = false;
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove script on cleanup to avoid reloading
      isInitialized.current = false;
    };
  }, [handleGoogleCallback]);

  const initializeGoogleSignIn = (clientId) => {
    if (isInitialized.current) {
      console.log("ℹ️ Google Sign-In already initialized");
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      isInitialized.current = true;
      console.log("✅ Google Sign-In initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing Google Sign-In:", error);
      isInitialized.current = false;
    }
  };

  const handleGoogleSignIn = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    console.log("🔘 Google Sign-In button clicked");
    console.log("📋 Client ID exists:", !!clientId);
    console.log("📋 Script loaded:", isScriptLoaded.current);
    console.log("📋 Initialized:", isInitialized.current);
    console.log("📋 Google object:", !!window.google?.accounts?.id);

    if (!clientId || clientId === "YOUR_GOOGLE_CLIENT_ID") {
      alert(
        "Google Sign-In not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file."
      );
      return;
    }

    if (!isScriptLoaded.current) {
      alert(
        "Google Sign-In is still loading. Please wait a moment and try again."
      );
      return;
    }

    if (!window.google?.accounts?.id) {
      console.error("❌ Google Sign-In not available");
      alert(
        "Google Sign-In service is not available. Please refresh and try again."
      );
      return;
    }

    if (!isInitialized.current) {
      console.log("⚠️ Not initialized, attempting to initialize now...");
      initializeGoogleSignIn(clientId);

      // Wait a bit for initialization
      setTimeout(() => {
        if (isInitialized.current) {
          triggerGooglePrompt();
        } else {
          alert(
            "Failed to initialize Google Sign-In. Please refresh the page."
          );
        }
      }, 500);
      return;
    }

    triggerGooglePrompt();
  };

  const triggerGooglePrompt = () => {
    try {
      console.log("🚀 Triggering Google Sign-In prompt...");
      window.google.accounts.id.prompt((notification) => {
        console.log("📢 Prompt notification:", notification);

        if (notification.isNotDisplayed()) {
          console.warn(
            "⚠️ Prompt not displayed:",
            notification.getNotDisplayedReason()
          );

          // Fallback: Show one-tap UI
          const parent = document.getElementById("google-signin-button");
          if (parent) {
            window.google.accounts.id.renderButton(parent, {
              theme: "outline",
              size: "large",
              width: 250,
            });
          }
        } else if (notification.isSkippedMoment()) {
          console.warn("⚠️ Prompt skipped:", notification.getSkippedReason());
        }
      });
    } catch (error) {
      console.error("❌ Error showing Google Sign-In prompt:", error);
      alert("Failed to show Google Sign-In. Please try again.");
    }
  };

  return (
    <div className="w-full space-y-4">
      <Button
        onClick={handleGoogleSignIn}
        variant="outline"
        className="w-full flex items-center justify-center gap-2 py-6 text-base font-medium hover:bg-gray-50 transition-all"
        type="button"
      >
        <FcGoogle className="w-6 h-6" />
        <span>{isScriptLoaded.current ? t.signInWithGoogle : t.loading}</span>
      </Button>

      {/* Hidden container for Google One Tap fallback */}
      <div id="google-signin-button" className="hidden"></div>

      {/* Debug info (remove in production) */}
      {import.meta.env.DEV && (
        <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
          <div>Script: {isScriptLoaded.current ? "✅" : "❌"}</div>
          <div>Initialized: {isInitialized.current ? "✅" : "❌"}</div>
          <div>Google API: {window.google?.accounts?.id ? "✅" : "❌"}</div>
        </div>
      )}
    </div>
  );
};

export default GoogleSignIn;
