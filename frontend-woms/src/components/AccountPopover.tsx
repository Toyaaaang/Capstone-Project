"use client";

import { useState, useEffect, useCallback } from "react";
import { UserCircle, LogOut, Signature, UserPen } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { API_BASE_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { useContext } from "react";
import AuthContext from "@/context/AuthContext";
import ESignatureRecorder from "@/components/ESignatureRecorder ";
import EditAccount from "@/components/EditAccount";

export default function AccountPopover() {
  const { logout } = useContext(AuthContext);
  const [isSignatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [isEditAccountDialogOpen, setEditAccountDialogOpen] = useState(false);
  const [hasSignature, setHasSignature] = useState(true);

  useEffect(() => {
    const fetchSignatureStatus = async () => {
      try {
        const token = localStorage.getItem("access_token"); // Retrieve the token from localStorage
        if (!token) {
          throw new Error("User is not authenticated");
        }

        const response = await fetch(`${API_BASE_URL}/api/authentication/get-signature`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the Authorization header
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch signature status");
        }

        const data = await response.json();
        setHasSignature(!!data.signature);
      } catch (error) {
        console.error("Error fetching signature status:", error);
        setHasSignature(false);
      }
    };

    fetchSignatureStatus();
  }, []);

  // Memoize the callback to prevent it from changing between renders
  const handleSignatureFetched = useCallback(() => {
    setHasSignature(true);
  }, []);

  const handleLogout = () => {
    setTimeout(() => {
      logout();
    }, 1000);
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="p-2 relative">
            <UserCircle className="h-6 w-6" />
            {!hasSignature && (
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-55">
          <ul className="space-y-2">
            <li>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setEditAccountDialogOpen(true)}
              >
                <UserPen className="mr-2 h-4 w-4" />
                Edit Account
              </Button>
            </li>
            <li>
              <Button
                variant="ghost"
                className="w-full justify-start relative"
                onClick={() => setSignatureDialogOpen(true)}
              >
                <Signature className="mr-2 h-4 w-4" />
                Add E-Signature
                {!hasSignature && (
                  <span className="absolute top-1/2 right-1 ml-8 transform -translate-y-1/2 h-2 w-2 bg-red-500 rounded-full" />
                )}
              </Button>
            </li>
            <li>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-500"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </li>
          </ul>
        </PopoverContent>
      </Popover>

      {/* E-Signature Recorder Dialog */}
      <ESignatureRecorder
        isOpen={isSignatureDialogOpen}
        onClose={() => setSignatureDialogOpen(false)}
        onSignatureFetched={handleSignatureFetched} // Pass the memoized callback
      />

      {/* Edit Account Dialog */}
      <EditAccount
        isOpen={isEditAccountDialogOpen}
        onClose={() => setEditAccountDialogOpen(false)}
      />
    </>
  );
}