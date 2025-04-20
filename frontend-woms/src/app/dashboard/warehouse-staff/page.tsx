"use client";
import useAuth from "@/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";


export default function WarehouseStaffDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user?.role !== "warehouse_staff") {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  if (loading) return <p className="text-center mt-10">Checking permissions...</p>;

  return (
    <div>
      <h1>Warehouse Staff Dashboard</h1>
      <p>Welcome to your dashboard!</p>
    </div>
  );
}
