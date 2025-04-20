"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

export default function WarehouseAdminOverview() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user?.role !== "warehouse_admin") {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  if (loading) return <p className="text-center mt-10">Checking permissions...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Warehouse Admin Overview</h1>
      <p>Overview details and visualizations will be added later.</p>
    </div>
  );
}
