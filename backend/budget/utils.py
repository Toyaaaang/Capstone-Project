from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from PyPDF2 import PdfReader, PdfWriter, PageObject
import io

def add_signature_to_pdf(input_pdf_path, output_pdf_path, signature_text, evaluated_by):
    """
    Adds a signature overlay to an existing PDF.

    Args:
        input_pdf_path (str): Path to the input PDF.
        output_pdf_path (str): Path to save the modified PDF.
        signature_text (str): Text for the signature (e.g., "Approved").
        evaluated_by (str): Name of the budget analyst who evaluated the request.
    """
    # Step 1: Create an overlay PDF with the signature and evaluated details
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=letter)

    # Add signature text
    can.setFont("Helvetica-Bold", 12)
    can.drawString(100, 100, f"Signature: {signature_text}")

    # Add evaluated by text
    can.setFont("Helvetica", 10)
    can.drawString(100, 80, f"Evaluated by: {evaluated_by}")

    # Finalize the overlay
    can.save()
    packet.seek(0)

    # Step 2: Read the overlay and the original PDF
    overlay_pdf = PdfReader(packet)
    original_pdf = PdfReader(input_pdf_path)
    output_pdf = PdfWriter()

    # Step 3: Merge the overlay with each page of the original PDF
    for page_number in range(len(original_pdf.pages)):
        original_page = original_pdf.pages[page_number]
        overlay_page = overlay_pdf.pages[0]  # Use the first page of the overlay

        # Merge the overlay onto the original page
        original_page.merge_page(overlay_page)
        output_pdf.add_page(original_page)

    # Step 4: Save the modified PDF
    with open(output_pdf_path, "wb") as output_file:
        output_pdf.write(output_file)

    print(f"Modified PDF saved to {output_pdf_path}")