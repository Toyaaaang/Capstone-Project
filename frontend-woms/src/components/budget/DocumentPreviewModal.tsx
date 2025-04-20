import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { toast } from "sonner"; 

interface DocumentPreviewModalProps {
  open: boolean;
  onClose: () => void;
  documentUrl: string;
  title?: string;
  token: string;
  po_id?: number;
}

export function DocumentPreviewModal({ open, onClose, documentUrl, title, po_id }: DocumentPreviewModalProps) {
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [pdfDocumentUrl, setPdfDocumentUrl] = useState(documentUrl);
  const [fields, setFields] = useState({
    unit_price_0: "",
    total_0: "",
    // other fields...
  });

  // Update pdfDocumentUrl when documentUrl prop changes
  useEffect(() => {
    if (documentUrl !== pdfDocumentUrl) {
      setPdfDocumentUrl(documentUrl);
    }
  }, [documentUrl]);
  
  const handleSaveDraft = async () =>{
    const token = localStorage.getItem('access_token');
    const draftPoId = po_id;
    if (!token) {
      toast.error("No authentication token found.");
      return;
    }

    if (!po_id) {
      toast.error("PO ID is missing.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/po_rv/po/save-draft/${po_id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fillable_fields: fields,  // Send the form data
        }),
      });

      if (res.ok) {
        const responseData = await res.json();
        setFields(responseData.fillable_fields);  // Update frontend state with the saved data
        toast.success("Draft saved successfully.");

        // Optionally, regenerate the PDF after save (backend logic)
        const newPdfUrl = `http://localhost:8000/api/po_rv/preview/${draftPoId}/?t=${Date.now()}`;
        setPdfDocumentUrl(newPdfUrl);
        
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save draft.");
      }
    } catch (error) {
      toast.error("An error occurred while saving.");
      console.error(error);
    }
  };

  const handleApproveSubmit = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error("No authentication token found.");
      return;
    }

    if (!po_id) {
      toast.error("PO ID is missing.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/po_rv/po/finalize/${po_id}/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (res.ok) {
        const responseData = await res.json();
        toast.success(`PO finalized successfully!`);
        onClose();
        setIsApproveDialogOpen(false);
      } else {
        const err = await res.json();
        toast.error(err.error || "Something went wrong.");
      }
    } catch (error) {
      toast.error("Failed to finalize PO.");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title || "Document Preview"}</DialogTitle>
          <DialogDescription>Review the document below before submitting or downloading.</DialogDescription>
        </DialogHeader>
        {/* PDF Preview */}
        <div className="flex justify-center flex-grow overflow-auto">
          {pdfDocumentUrl && (
            <iframe
              src={pdfDocumentUrl}
              title="PDF Preview"
              className="w-full max-w-4xl border rounded shadow mt-2"
              style={{ height: '100%' }}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="outline" onClick={handleSaveDraft}>Save Draft</Button>

          <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button onClick={() => setIsApproveDialogOpen(true)}>Approve & Submit</Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to approve and submit this document? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsApproveDialogOpen(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleApproveSubmit}>Confirm</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  );
}
