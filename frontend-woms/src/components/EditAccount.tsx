"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";

interface EditAccountProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditAccount({ isOpen, onClose }: EditAccountProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAccountDetails();
    }
  }, [isOpen]);

  const fetchAccountDetails = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("User is not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/api/authentication/account/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch account details");
      }

      const data = await response.json();
      setFirstName(data.first_name || "");
      setLastName(data.last_name || "");
    } catch (error) {
      console.error("Error fetching account details:", error);
      toast.error("Failed to load account details.");
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("User is not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/api/authentication/account/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update account details");
      }

      toast.success("Account details updated successfully!");
      onClose();
    } catch (error) {
      console.error("Error updating account details:", error);
      toast.error("Failed to update account details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <Input
              id="first_name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
            />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <Input
              id="last_name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
            />
          </div>
        </div>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}