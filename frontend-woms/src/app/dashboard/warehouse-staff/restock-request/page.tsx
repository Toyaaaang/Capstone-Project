"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton from shadcn
import { API_BASE_URL } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Plus, FileScan, FileInput } from "lucide-react";

export default function RestockRequestForm() {
  type Item = {
    itemName: string;
    quantity: string;
    unit: string; // Added unit property
  };

  const [items, setItems] = useState<Item[]>([]);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [token, setToken] = useState<string | null>(null); // Use state for token
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const router = useRouter();

  // Check if the client-side environment is available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("access_token");
      setToken(storedToken); // Set token from localStorage
    }
  }, []);

  const addItem = () => {
    setItems([
      ...items,
      {
        itemName: "",
        quantity: "",
        unit: "pcs",
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof Item, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setIsLoading(true); // Start loading

    const payload = {
      items: items.map((item) => ({
        item_name: item.itemName,
        quantity_requested: parseInt(item.quantity, 10),
        unit: item.unit,
      })),
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/warehouse/restock-requests/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // assuming JWT
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Something went wrong.");
      }

      const result = await response.json();
      toast.success("Request submitted!", {
        description:
          "Your Requisition Voucher has been created and is now awaiting Budget Analyst review.",
      });

      setConfirmOpen(false);

      setTimeout(() => {
        router.push("/dashboard/warehouse-staff/track-requests");
      }, 900);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error.message);
        toast.error(error.message);
      } else {
        console.error("Unexpected error:", error);
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const handlePreview = async () => {
    setIsLoading(true); // Start loading
    try {
      const requestData = {
        items: items
          .filter(
            (item) =>
              item.itemName.trim() !== "" && item.quantity.trim() !== ""
          )
          .map((item) => ({
            item_name: item.itemName,
            quantity_requested: parseInt(item.quantity, 10),
            unit: item.unit,
          })),
      };

      const response = await fetch(
        `${API_BASE_URL}/api/requisition-voucher/preview/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestData),
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setPreviewOpen(true);
      } else {
        const errorData = await response.json();
        toast("Error generating preview", {
          description:
            errorData.detail ||
            "An error occurred while generating the RV preview.",
        });
      }
    } catch (error) {
      console.error("Error generating RV preview:", error);
      toast("An unexpected error occurred.", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Restocking Request</h2>

      {isLoading ? (
        <Skeleton className="h-10 w-full" /> // Show skeleton while loading
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setConfirmOpen(true);
          }}
          className="space-y-4"
        >
          {items.map((item, index) => (
            <Card
              key={index}
              className="relative p-4 shadow-md border border-gray-300 rounded-lg"
            >
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Input
                  type="text"
                  placeholder="Item Name"
                  value={item.itemName}
                  onChange={(e) =>
                    handleChange(index, "itemName", e.target.value)
                  }
                  required
                />
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(e) =>
                    handleChange(index, "quantity", e.target.value)
                  }
                  required
                />
                <Input
                  type="text"
                  placeholder="Unit"
                  value={item.unit || "pcs"}
                  onChange={(e) => handleChange(index, "unit", e.target.value)}
                  required
                />
              </CardContent>
              <Button
                variant="ghost"
                size="icon"
                className="mt-2 ml-15 absolute top-2 right-2 text-red-500 hover:text-red-700 "
                onClick={() => removeItem(index)}
              >
                <Trash2 size={20} />
              </Button>
            </Card>
          ))}

          <div className="flex gap-2">
            <Button type="button" onClick={addItem} variant="outline">
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
            <Button
              type="button"
              onClick={handlePreview}
              variant="outline"
              className="mr-2 bg-stone-600 text-white hover:bg-stone-700"
            >
              <FileScan className="mr-2 h-4 w-4" /> Preview Requisition Voucher
            </Button>
          </div>

          <Button type="submit" className="w-full mt-6">
            <FileInput className="mr-2 h-4 w-4" />
            Submit Request
          </Button>
        </form>
      )}

      <AlertDialog open={isConfirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Are you sure you want to submit this restocking request? This action
            cannot be undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isPreviewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-6xl h-[90vh] p-4 flex flex-col">
          <DialogHeader>
            <DialogTitle>Requisition Voucher Preview</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden mt-4">
            <iframe
              src={previewUrl}
              title="RV Preview"
              className="w-full h-full border rounded"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
