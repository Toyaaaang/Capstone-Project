"use client";

import useAuth from "@/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ManagerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login"); // Redirect to login if not authenticated
      } else if (user?.role !== "manager") {
        router.push("/unauthorized"); // Redirect unauthorized users
      }
    }
  }, [user, loading, router]);

  if (loading) return <p className="text-center mt-10">Checking permissions...</p>;

  return (
    <div>
      <h1>Manager Dashboard</h1>
      <p>Welcome to the Manager Dashboard!</p>
    </div>
  );
}
