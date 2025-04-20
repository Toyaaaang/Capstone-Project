"use client";
import useAuth from "@/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EmployeeDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login"); // Redirect if not logged in
      } else if (user?.is_role_confirmed && user?.role !== "employee") {
        // If the user is verified but not an employee, redirect them
        router.push(`/dashboard/${user.role}`);
      }
    }
  }, [user, loading, router]);

  if (loading) return <p className="text-center mt-10">Checking permissions...</p>;

  return (
    <div>
      <h1>Employee Dashboard</h1>
      <p>Welcome to your dashboard!</p>
    </div>
  );
}
 