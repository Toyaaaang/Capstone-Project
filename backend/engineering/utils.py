from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from PyPDF2 import PdfReader, PdfWriter
import io
import os

def add_signature_to_rvpdf(input_pdf, signature_path, evaluated_by):
    """
    Adds a signature overlay to an existing PDF and replaces the original file.

    Args:
        input_pdf (str): Path to the input PDF.
        signature_path (str): Path to the PNG signature file.
        evaluated_by (str): Name of the budget analyst who evaluated the request.
    """
    # Handle input PDF
    original_pdf = PdfReader(input_pdf)

    # Step 2: Create an overlay PDF with the signature and evaluated details
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=letter)

    # Add evaluated by text
    can.setFont("Helvetica", 10)
    can.drawString(450, 360, f"{evaluated_by}")

    # Add the signature image
    try:
        can.drawImage(signature_path, 440, 380, width=100, height=50, mask='auto')  # Adjust position and size as needed
    except Exception as e:
        print(f"Failed to draw signature image: {e}")
        raise ValueError("Failed to draw signature image.")

    # Finalize the overlay
    can.save()
    packet.seek(0)

    # Step 3: Merge the overlay with the original PDF
    overlay_pdf = PdfReader(packet)
    output_pdf = PdfWriter()

    for page_number in range(len(original_pdf.pages)):
        original_page = original_pdf.pages[page_number]
        overlay_page = overlay_pdf.pages[0]
        original_page.merge_page(overlay_page)
        output_pdf.add_page(original_page)

    # Step 4: Save the modified PDF to a temporary file
    temp_pdf_path = input_pdf + ".tmp"
    with open(temp_pdf_path, "wb") as temp_file:
        output_pdf.write(temp_file)

    # Step 5: Replace the original PDF with the new one
    os.replace(temp_pdf_path, input_pdf)

    print(f"Modified PDF saved to {input_pdf}")