"use client";
import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/app/loading";

interface ProtectedPageProps {
  children: ReactNode;
}

export default function ProtectedPage({ children }: ProtectedPageProps) {
  const { account, loading, getAccessToken } = useAuth();

  if (loading) return <Loading />;

  // getAccessToken().then(data => console.log(data));

  return <>{children}</>;
}