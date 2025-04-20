"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}

export default function RegisterPage() {
  const { register, handleSubmit, reset, watch } = useForm<RegisterFormData>();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setSuccess(null);

    if (data.password !== data.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/authentication/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          password: data.password,
          role: data.role,
        }),
      });

      const resData = await response.json();

      if (response.ok) {
        setSuccess("Registration successful! Please wait for admin approval.");
        reset();
        setTimeout(() => router.push("/login"), 2000); // Redirect to login page
      } else {
        setError(resData.detail || JSON.stringify(resData));
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {success && <p className="text-green-500 text-sm text-center">{success}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            {...register("username", { required: true })}
            className="w-full p-2 border rounded"
          />
          <input
            type="email"
            placeholder="Email"
            {...register("email", { required: true })}
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            placeholder="Password"
            {...register("password", { required: true })}
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            {...register("confirmPassword", { required: true })}
            className="w-full p-2 border rounded"
          />
          <select {...register("role", { required: true })} className="w-full p-2 border rounded">
            <option value="">Select Role</option>
            <option value="warehouse_staff">Warehouse Staff</option>
            <option value="budget_analyst">Budget Analyst</option>
            <option value="warehouse_admin">Warehouse Admin</option>
            <option value="engineering">Engineer</option>
            <option value="operations_maintenance">Operations & Maintainance</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>

          </select>

          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
            Register
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          Already have an account? <a href="/login" className="text-blue-600">Login</a>
        </p>
      </div>
    </div>
  );
}
