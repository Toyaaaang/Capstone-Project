"use client";
import useAuth from "@/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EngineeringDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login"); // Redirect if not logged in
      } else if (user?.role !== "engineering") {
        router.push("/unauthorized"); // Redirect to unauthorized page
      }
    }
  }, [user, loading, router]);

  if (loading) return <p className="text-center mt-10">Checking permissions...</p>;

  return (
    <div>
      <h1>Engineering Dashboard</h1>
      <p>Welcome to the Engineering Dashboard!</p>
    </div>
  );
}
