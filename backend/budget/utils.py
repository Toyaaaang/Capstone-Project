from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from PyPDF2 import PdfReader, PdfWriter
import io

def add_signature_to_pdf(input_pdf, output_pdf_path, signature_path, evaluated_by):
    """
    Adds a signature overlay to an existing PDF.

    Args:
        input_pdf (str): Path to the input PDF.
        output_pdf_path (str): Path to save the modified PDF.
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
    can.drawString(420, 415, f"{evaluated_by}")

    # Add the signature image
    try:
        can.drawImage(signature_path, 420, 420, width=100, height=50 , mask='auto', preserveAspectRatio=True, anchor='c')  # Adjust position and size as needed
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

    # Step 4: Save the modified PDF
    with open(output_pdf_path, "wb") as output_file:
        output_pdf.write(output_file)

    print(f"Modified PDF saved to {output_pdf_path}")