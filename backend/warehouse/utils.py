import os
from django.conf import settings
from django.core.files import File
from reportlab.lib.pagesizes import LETTER
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle
from reportlab.pdfgen import canvas
from io import BytesIO
from datetime import datetime


# This function generates a PDF for the requisition voucher.
def generate_rv_pdf(filename, items, requested_by, rv_number, logo_path=None):
    if logo_path is None:
        logo_path = os.path.join(settings.BASE_DIR, 'warehouse', 'static', 'po_rv', 'images', 'logo.png')

    if not os.path.exists(logo_path):
        raise FileNotFoundError(f"Logo file not found at {logo_path}")

    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=LETTER)
    width, height = LETTER

    c.drawImage(logo_path, 120, height - 90, width=50, height=50, mask='auto', preserveAspectRatio=True, anchor='c')

    # Header
    c.setFont("Helvetica-Bold", 12)
    c.drawString(180, height - 50, "QUEZON I ELECTRIC COOPERATIVE, INC.")
    c.setFont("Helvetica", 10)
    c.drawString(235, height - 65, "Brgy. Poctol, Pitogo, Quezon")
    c.setFont("Helvetica-Bold", 11)
    c.drawString(234, height - 100, "REQUISITION VOUCHER")

    # Preview watermark
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.red)
    c.drawString(width - 160, height - 100, f"No. {rv_number}")  
    c.setFillColor(colors.black)  
    
    # Date
    current_date = datetime.now().strftime("%B %d, %Y")  # Format with full month name
    c.drawString(width - 160, height - 130, f"Date: {current_date}")

    # Request description
    c.drawString(50, height - 165, "Request Approval to procure the following materials/supplies for:")

    # Create the table rows
    data = [["    ITEM", "                                 ARTICLE"
             , "   QUANTITY", "             REMARKS"]]
    for idx, item in enumerate(items, 1):
        data.append([
            str(idx),
            item.get("item_name", ""),
            str(item.get("quantity_requested", "")),
            item.get("unit", ""),  # Include unit in the remarks column
        ])

    # Fill up to 10 rows total
    while len(data) < 11:
        data.append([""] * 4)

    # Create the table
    table = Table(data, colWidths=[60, 250, 80, 130])
    table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('BACKGROUND', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ]))
    table.wrapOn(c, width, height)
    table.drawOn(c, 50, height - 380)

    # Footer/Signatories
    c.setFont("Helvetica", 10)
    c.drawString(60, height - 400, "Requested by:")
    c.drawString(60, height - 415, requested_by)  # Display the requested_by argument
    c.line(60, height - 420, 200, height - 420)  # Draw a line below the requester's name

    c.drawString(230, height - 400, "Evaluated by:")
    c.line(230, height - 420, 390, height - 420)  

    c.drawString(420, height - 400, "Recommending Approval:")
    c.line(420, height - 420, 560, height - 420)  

    c.drawString(420, height - 440, "Approved by:")   
    c.line(420, height - 460, 560, height - 460)  
    
    c.drawString(420, height - 480, "General Manager")
    c.line(420, height - 500, 560, height - 500)  

    c.save()

    buffer.seek(0)
    return File(buffer, name=filename)




# This function generates a PDF preview of the requisition voucher.
def generate_rv_pdf_preview(filename, items, requested_by, logo_path=None):
    from reportlab.lib.pagesizes import LETTER
    from reportlab.lib import colors
    from reportlab.platypus import Table, TableStyle
    from reportlab.pdfgen import canvas
    import os
    from datetime import datetime
    
    if logo_path is None:
        logo_path = os.path.join(settings.BASE_DIR, 'warehouse', 'static', 'po_rv', 'images', 'logo.png')

    if not os.path.exists(logo_path):
        raise FileNotFoundError(f"Logo file not found at {logo_path}")

    c = canvas.Canvas(filename, pagesize=LETTER)
    width, height = LETTER

    c.drawImage(logo_path, 120, height - 90, width=50, height=50, mask='auto', preserveAspectRatio=True, anchor='c')

    c.setFont("Helvetica-Bold", 12)
    c.drawString(180, height - 50, "QUEZON I ELECTRIC COOPERATIVE, INC.")
    c.setFont("Helvetica", 10)
    c.drawString(235, height - 65, "Brgy. Poctol, Pitogo, Quezon")
    c.setFont("Helvetica-Bold", 11)
    c.drawString(234, height - 100, "REQUISITION VOUCHER")

    c.setFont("Helvetica", 10)
    c.setFillColor(colors.red)
    c.drawString(width - 160, height - 100, "RV No. -- PREVIEW --")
    c.setFillColor(colors.black)  # Reset to default color
       
    current_date = datetime.now().strftime("%B %d, %Y")  # Format with full month name
    c.drawString(width - 160, height - 130, f"Date: {current_date}")

    c.drawString(50, height - 165, "Request Approval to procure the following materials/supplies for:")

    # Create the table rows
    data = [["    ITEM", "                                 ARTICLE"
             , "   QUANTITY", "             REMARKS"]]
    for idx, item in enumerate(items, 1):
        data.append([
            str(idx),
            item.get("item_name", ""),
            str(item.get("quantity_requested", "")),
            item.get("unit", ""),
            
        ])

    # Fill up to 10 rows total
    while len(data) < 11:
        data.append([""] * 4)

    table = Table(data, colWidths=[60, 250, 80, 130])
    table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('BACKGROUND', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ]))
    table.wrapOn(c, width, height)
    table.drawOn(c, 50, height - 380)

    # Footer/Signatories
    c.setFont("Helvetica", 10)
    c.drawString(60, height - 400, "Requested by:")
    c.drawString(60, height - 415, requested_by) 
    c.line(60, height - 420, 200, height - 420) 
    
    c.drawString(230, height - 400, "Evaluated by:")
    c.line(230, height - 420, 390, height - 420)  

    c.drawString(420, height - 400, "Recommending Approval:")
    c.line(420, height - 420, 560, height - 420)  

    c.drawString(420, height - 440, "Approved by:")   
    c.line(420, height - 460, 560, height - 460)  
    
    c.drawString(420, height - 480, "General Manager")
    c.line(420, height - 500, 560, height - 500)  


    c.save()