"use client";
import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { PublicClientApplication, AccountInfo } from "@azure/msal-browser";
import { useMsal } from "@azure/msal-react";
import { msalInstance, msalScope } from "@/lib/msal";

interface AuthContextProps {
  account: AccountInfo | undefined;
  loading: boolean;
  logout: () => void;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [account, setAccount] = useState<AccountInfo | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const {instance} = useMsal();

  useEffect(() => {
    const handleRedirect = async () => {
      try
      {
        await instance.initialize();
        let response = await instance.handleRedirectPromise();
        if (response) {
          setAccount(response.account);
          setLoading(false);
        }
        else {
          const accounts = instance.getAllAccounts();

          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setLoading(false);
          }
          else {
            await instance.loginRedirect({ scopes: msalScope });
          }
        }

      }
      catch (err) {
        console.error("MSAL redirect error:", err);
        // setLoading(false);
      }
    }
    handleRedirect();
  }, []);

  const logout = async () => {
    await instance.logoutRedirect();
  };

  const getAccessToken = async (): Promise<string | null> => {
    if (!account) return null;
    try {
      const response = await msalInstance.acquireTokenSilent({
        scopes: msalScope,
        account,
      });
      return response.accessToken;
    } catch (err) {
      console.error("Silent token failed, redirecting...", err);
      await msalInstance.acquireTokenRedirect({ scopes: msalScope });
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ account, loading, logout, getAccessToken}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};