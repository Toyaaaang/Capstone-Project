"use client";

import { useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { API_BASE_URL } from "@/lib/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";
import { toast } from "sonner";

interface ESignatureRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onSignatureFetched: () => void; // Callback to notify when the signature is fetched
}

export default function ESignatureRecorder({ isOpen, onClose, onSignatureFetched }: ESignatureRecorderProps) {
  const signaturePadRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSignature();
    }
  }, [isOpen]);

  const fetchSignature = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("User is not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/api/authentication/get-signature/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch signature");
      }

      const data = await response.json();
      console.log("Fetched signature:", data); // Debugging

      if (data.signature) {
        // Render the image in the canvas
        signaturePadRef.current?.fromDataURL(data.signature);
        onSignatureFetched();
      } else {
        toast.info("No e-signature found. Please add one.");
      }
    } catch (error) {
      console.error("Error fetching signature:", error);
      toast.error("Failed to load saved signature.");
    }
  };

  const handleClear = () => {
    signaturePadRef.current?.clear();
    toast.info("Signature cleared.");
  };

  const handleSave = async () => {
    console.log("Save button clicked"); // Debugging
    if (signaturePadRef.current?.isEmpty()) {
      toast.error("Please draw your signature first!");
      return;
    }

    const signatureBlob = await new Promise<Blob>((resolve) => {
      const dataUrl = signaturePadRef.current?.toDataURL("image/png");
      resolve(dataUrlToBlob(dataUrl!));
    });

    const formData = new FormData();
    formData.append("signature", signatureBlob, "signature.png"); // Add a filename for debugging
    console.log("FormData:", formData.get("signature")); // Debugging

    try {
      const token = localStorage.getItem("access_token");
      console.log("Authorization Token:", token); // Debugging

      const response = await fetch(`${API_BASE_URL}/api/authentication/save-signature/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to save signature");
      }

      toast.success("Signature saved successfully!");
      onSignatureFetched(); // Notify that the signature has been saved
      onClose();
    } catch (error) {
      console.error("Error saving signature:", error);
      toast.error("Failed to save signature. Please try again.");
    }
  };

  const dataUrlToBlob = (dataUrl: string) => {
    const byteString = atob(dataUrl.split(",")[1]);
    const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full h-auto">
        <DialogHeader>
          <DialogTitle>E-Signature Recorder</DialogTitle>
          <p className="text-sm text-gray-500">
            Please draw your signature below. You can save or clear it as needed.
          </p>
        </DialogHeader>
        <div className="p-4">
          <SignatureCanvas
            ref={signaturePadRef}
            penColor="black"
            canvasProps={{
              width: 600,
              height: 300,
              className: "border border-gray-300 rounded",
            }}
          />
        </div>
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClear}>
            <X className="mr-1" />
            Clear
          </Button>
          <Button onClick={handleSave} className="mr-4">
            <Save className="mr-1" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}