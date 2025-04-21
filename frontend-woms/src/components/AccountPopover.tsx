"use client";

import { UserCircle, LogOut, Signature, UserPen   } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useContext } from "react";
import AuthContext from "@/context/AuthContext";

export default function AccountPopover() {
  const { logout } = useContext(AuthContext); // Access the logout function

  const handleLogout = () => {
    setTimeout(() => {
      logout();
    }, 1000);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="p-2">
            <UserCircle style={{ height: "20px", width: "20px" }} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48">
        <ul className="space-y-2">
          <li>
            <Button variant="ghost" className="w-full justify-start">
              <UserPen className="mr-2 h-4 w-4" />
              Edit Account
            </Button>
          </li>
          <li>
            <Button variant="ghost" className="w-full justify-start">
              <Signature className="mr-2 h-4 w-4" />
              Add E-Signature
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
  );
}