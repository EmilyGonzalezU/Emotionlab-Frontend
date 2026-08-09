import React from "react";
import { Toaster } from "react-hot-toast";

export default function Alertas() {
  return (
    <Toaster
      position="bottom-right"
      reverseOrder={false}
      toastOptions={{
        duration: 5000,
        style: {
          borderRadius: "10px",
          background: "#FFFFFF",
          color: "#2a2a2a",
          padding: "16px",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
          fontSize: "15px",
          fontWeight: "500",
        },
        success: {
          style: { borderLeft: "5px solid #17315E" },
          iconTheme: { primary: "#17315E", secondary: "#FFFFFF" },
        },
        error: {
          style: { borderLeft: "5px solid #dc3545" },
          iconTheme: { primary: "#dc3545", secondary: "#FFFFFF" },
        },
      }}
    />
  );
}
