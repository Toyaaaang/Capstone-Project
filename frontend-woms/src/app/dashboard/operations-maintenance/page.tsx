"use client";
import useAuth from "@/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OperationsMaintenanceDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user?.role !== "operations_maintenance") {
        router.push("/unauthorized");
      }
    }
  }, [user, loading, router]);

  if (loading) return <p className="text-center mt-10">Checking permissions...</p>;

  return (
    <div>
      <h1>Operations & Maintenance Dashboard</h1>
      <p>Welcome to your dashboard! Here you can manage maintenance requests and track equipment.</p>
    </div>
  );
}
