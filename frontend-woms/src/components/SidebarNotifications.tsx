"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, Trash2 } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns"; // Import the function

interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string; // Assuming there's a created_at field
  related_url?: string;
}

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const fetchNotifications = async () => {
    if (!accessToken) return;
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/notification/list/", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Sort notifications to display latest first
      const sortedNotifications = res.data.sort((a: Notification, b: Notification) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(sortedNotifications);
      setUnreadCount(sortedNotifications.filter((n: Notification) => !n.is_read).length);
    } catch (error) {
      console.error("Error fetching notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [accessToken]);

  const markAsRead = async (id: number, url?: string) => {
    try {
      await axios.patch(
        `http://127.0.0.1:8000/api/notification/${id}/mark_as_read/`, // Change to PATCH
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => prev - 1);
      if (url) router.push(url);
    } catch (error) {
      console.error("Error marking notification as read", error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/notification/${id}/delete/`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error deleting notification", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative">
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-100 p-2">
        {notifications.length === 0 ? (
          <DropdownMenuItem disabled className="text-gray-500">
            No notifications
          </DropdownMenuItem>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`flex items-center justify-between space-x-2 p-2 rounded-md ${
                notification.is_read ? "text-gray-500" : "font-bold"
              }`}
            >
              <div
                className="flex items-center space-x-2 flex-grow cursor-pointer"
                onClick={() =>
                  markAsRead(notification.id, notification.related_url)
                }
              >
                {!notification.is_read && (
                  <span className="h-2 w-2 bg-red-500 rounded-full flex-shrink-0"></span>
                )}
                <span>{notification.message}</span>
              </div>
              <div className="text-xs text-gray-400">
                {/* Display the time passed since creation */}
                {formatDistanceToNow(new Date(notification.created_at))} ago
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-red-100 p-1"
                onClick={() => deleteNotification(notification.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
