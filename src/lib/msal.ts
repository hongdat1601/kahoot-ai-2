// MSAL Provider scaffold (commented out to avoid requiring packages before setup)
import { PublicClientApplication } from "@azure/msal-browser";

const msalConfig = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!,
    authority: process.env.NEXT_PUBLIC_AZURE_AUTHORITY!,
    redirectUri: process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI!,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);
export const msalScope = ['api://42f77964-7dc3-4774-95d4-e6266d8a5032/access'];
