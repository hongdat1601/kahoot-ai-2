"use client";
import React from "react";
import { FinalResultProvider } from "@/context/FinalResultContext";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "@/lib/msal";



export default function ClientProviders({ children }: { children: React.ReactNode }) {

  return (
    <FinalResultProvider>
      {/* <MsalProvider instance={msalInstance}> */}
      {children}
      {/* </MsalProvider> */}
    </FinalResultProvider>
  );
}
