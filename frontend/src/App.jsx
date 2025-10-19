import React from "react";
import Layout from "./components/Layout";
import AuthWrapper from "./components/AuthWrapper";
import AuthTest from "./components/AuthTest";

function App() {
  // Check if we're in test mode (you can toggle this for testing)
  if (window.location.pathname === "/auth-test") {
    return <AuthTest />;
  }

  return (
    <div className="min-h-screen">
      <AuthWrapper>
        <Layout />
      </AuthWrapper>
    </div>
  );
}

export default App;
