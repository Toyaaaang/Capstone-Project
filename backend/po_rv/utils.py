from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.platypus import Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.units import mm

def create_purchase_order_pdf(filename, data):
    """
    Generates and saves the final Purchase Order PDF.
    """
    c = canvas.Canvas(filename, pagesize=A4)
    width, height = A4

    # Header
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 50, "QUEZON 1 ELECTRIC COOPERATIVE, INC.")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 65, "Poctol, Pitogo, Quezon")
    
    # Purchase Order Title and Numbers
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 90, "PURCHASE ORDER")
    c.setFont("Helvetica", 10)
    c.drawString(400, height - 90, f"No: {data['po_number']}")
    c.drawString(50, height - 110, f"Supplier: {data['supplier']}")
    c.drawString(50, height - 125, f"Address: {data['address']}")
    c.drawString(400, height - 110, f"R.V. No.: {data['rv_number']}")
    c.drawString(400, height - 125, f"Date: {data['date']}")

    # Table Data
    table_data = [
        ["Item", "Unit", "Description", "Quantity", "Unit Price", "Total Price"]
    ]
    for i, item in enumerate(data['items'], 1):
        table_data.append([
            str(i), item['unit'], item['description'], str(item['quantity']),
            f"{item['unit_price']:.2f}", f"{item['total_price']:.2f}"
        ])
    
    if data.get('discount'):
        table_data.append(["", "", "Discount", "", "", f"-{data['discount']:.2f}"])

    table_data.append(["", "", "", "", "Total", f"{data['grand_total']:.2f}"])

    table = Table(table_data, colWidths=[30, 40, 180, 60, 80, 80])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('ALIGN', (3, 1), (-1, -1), 'RIGHT'),
        ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold')
    ]))

    table.wrapOn(c, width, height)
    table.drawOn(c, 50, height - 330)

    # Footer
    c.drawString(50, 100, "Order Issued and Authorized:")
    c.drawString(60, 85, "QUEZELCO I Cooperative")
    c.drawString(60, 70, f"By: {data['authorized_by']}")
    c.drawString(300, 100, "Order Received and Accepted:")
    c.drawString(310, 70, "By: __________________")

    c.save()



def generate_po_pdf_preview(filename, data):
    """
    Generates a temporary preview of the Purchase Order PDF.
    """
    c = canvas.Canvas(filename, pagesize=A4)
    width, height = A4

    # Header
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 50, "QUEZON 1 ELECTRIC COOPERATIVE, INC.")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 65, "Poctol, Pitogo, Quezon")
    
    # Purchase Order Title and Numbers
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 90, "PURCHASE ORDER - PREVIEW")
    c.setFont("Helvetica", 10)
    c.drawString(400, height - 90, f"No: {data.get('po_number', '-- PREVIEW --')}")
    c.drawString(50, height - 110, f"Supplier: {data['supplier']}")
    c.drawString(50, height - 125, f"Address: {data['address']}")
    c.drawString(400, height - 110, f"R.V. No.: {data['rv_number']}")
    c.drawString(400, height - 125, f"Date: {data['date']}")

    # Table Data
    table_data = [
        ["Item", "Unit", "Description", "Quantity", "Unit Price", "Total Price"]
    ]
    for i, item in enumerate(data['items'], 1):
        table_data.append([
            str(i), item['unit'], item['description'], str(item['quantity']),
            f"{item['unit_price']:.2f}", f"{item['total_price']:.2f}"
        ])
    
    if data.get('discount'):
        table_data.append(["", "", "Discount", "", "", f"-{data['discount']:.2f}"])

    table_data.append(["", "", "", "", "Total", f"{data['grand_total']:.2f}"])

    table = Table(table_data, colWidths=[30, 40, 180, 60, 80, 80])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('ALIGN', (3, 1), (-1, -1), 'RIGHT'),
        ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold')
    ]))

    table.wrapOn(c, width, height)
    table.drawOn(c, 50, height - 330)

    # Footer
    c.drawString(50, 100, "Order Issued and Authorized:")
    c.drawString(60, 85, "QUEZELCO I Cooperative")
    c.drawString(60, 70, "By: __________________")
    c.drawString(300, 100, "Order Received and Accepted:")
    c.drawString(310, 70, "By: __________________")

    c.save()