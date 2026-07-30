import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate } from "@/lib/utils";

interface OrderPDFData {
    order_number: string;
    placed_at?: string | null;
    created_at?: string | null;
    status: string;
    subtotal?: number | null;
    discount_total?: number | null;
    shipping_total?: number | null;
    tax_total?: number | null;
    grand_total?: number | null;
    total_amount?: number | null;
    guest_email?: string | null;
    email?: string | null;
    shipping_address?: any;
    billing_address?: any;
    carrier?: string | null;
    tracking_number?: string | null;
    items?: any[];
    order_items?: any[];
}

/**
 * Generate a high-fidelity, professional A4 Invoice PDF file for download or printing.
 */
export function generateInvoicePDF(order: OrderPDFData, filenamePrefix = "Invoice") {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const primaryColor: [number, number, number] = [17, 24, 39]; // Slate 900
    const secondaryColor: [number, number, number] = [100, 116, 139]; // Slate 500
    const accentColor: [number, number, number] = [217, 119, 6]; // Amber 600

    // Header Branding Box
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 32, "F");

    // Store Logo / Name
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.text("BK STORE", 14, 18);

    doc.setFontSize(9);
    doc.setFont("Helvetica", "normal");
    doc.text("Modern Premium eCommerce Platform", 14, 25);

    // Document Title
    doc.setFontSize(20);
    doc.setFont("Helvetica", "bold");
    doc.text("INVOICE", 196, 18, { align: "right" });

    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text(`#${order.order_number}`, 196, 25, { align: "right" });

    // Metadata Section
    let currentY = 42;

    const dateStr = formatDate(order.placed_at || order.created_at || new Date().toISOString());
    const addr = order.shipping_address || {};
    const customerName = `${addr.first_name || ""} ${addr.last_name || ""}`.trim() || order.guest_email || order.email || "Valued Customer";

    // Left Column: Billed / Shipped To
    doc.setTextColor(...primaryColor);
    doc.setFontSize(11);
    doc.setFont("Helvetica", "bold");
    doc.text("Billed & Shipped To:", 14, currentY);

    doc.setFontSize(9.5);
    doc.setFont("Helvetica", "bold");
    doc.text(customerName, 14, currentY + 6);

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(...secondaryColor);

    let addrY = currentY + 11;
    if (addr.line1) {
        doc.text(addr.line1, 14, addrY);
        addrY += 5;
    }
    if (addr.city || addr.postal_code) {
        doc.text(`${addr.city || ""}, ${addr.postal_code || ""}`, 14, addrY);
        addrY += 5;
    }
    if (addr.phone) {
        doc.text(`Phone: ${addr.phone}`, 14, addrY);
        addrY += 5;
    }
    const customerEmail = order.guest_email || order.email || "";
    if (customerEmail) {
        doc.text(`Email: ${customerEmail}`, 14, addrY);
        addrY += 5;
    }

    // Right Column: Order Details Box
    doc.setTextColor(...primaryColor);
    doc.setFontSize(11);
    doc.setFont("Helvetica", "bold");
    doc.text("Order Information:", 130, currentY);

    doc.setFontSize(9.5);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(...secondaryColor);

    doc.text(`Date: ${dateStr}`, 130, currentY + 6);
    doc.text(`Payment: Cash on Delivery (COD)`, 130, currentY + 11);
    doc.text(`Status: ${order.status.toUpperCase()}`, 130, currentY + 16);
    if (order.tracking_number) {
        doc.text(`Tracking: ${order.tracking_number}`, 130, currentY + 21);
    }

    currentY = Math.max(addrY, currentY + 28) + 6;

    // Items Table
    const items = order.items || order.order_items || [];
    const tableBody = items.map((item: any, idx: number) => {
        const pName = item.product_name || item.name || "Product Item";
        const vName = item.variant_name ? ` (${item.variant_name})` : "";
        const unitPrice = Number(item.unit_price || 0);
        const qty = Number(item.quantity || 1);
        const lineTotal = Number(item.line_total || item.total_price || (unitPrice * qty));

        return [
            (idx + 1).toString(),
            `${pName}${vName}`,
            qty.toString(),
            `PKR ${unitPrice.toLocaleString()}`,
            `PKR ${lineTotal.toLocaleString()}`,
        ];
    });

    autoTable(doc, {
        startY: currentY,
        head: [["#", "Item Description", "Qty", "Unit Price", "Total Amount"]],
        body: tableBody,
        theme: "striped",
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9.5,
        },
        styles: {
            fontSize: 9,
            cellPadding: 3.5,
        },
        columnStyles: {
            0: { cellWidth: 10, halign: "center" },
            1: { cellWidth: 95 },
            2: { cellWidth: 20, halign: "center" },
            3: { cellWidth: 30, halign: "right" },
            4: { cellWidth: 30, halign: "right" },
        },
        margin: { left: 14, right: 14 },
    });

    // Summary Box
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    const subtotal = Number(order.subtotal || order.grand_total || order.total_amount || 0);
    const shipping = Number(order.shipping_total || 0);
    const tax = Number(order.tax_total || 0);
    const grandTotal = Number(order.grand_total || order.total_amount || 0);

    const summaryX = 120;
    let sumY = finalY;

    doc.setFontSize(9.5);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(...secondaryColor);

    doc.text("Subtotal:", summaryX, sumY);
    doc.text(`PKR ${subtotal.toLocaleString()}`, 196, sumY, { align: "right" });
    sumY += 5.5;

    doc.text("Shipping Fee:", summaryX, sumY);
    doc.text(`PKR ${shipping.toLocaleString()}`, 196, sumY, { align: "right" });
    sumY += 5.5;

    if (tax > 0) {
        doc.text("Tax:", summaryX, sumY);
        doc.text(`PKR ${tax.toLocaleString()}`, 196, sumY, { align: "right" });
        sumY += 5.5;
    }

    doc.setLineWidth(0.5);
    doc.setDrawColor(...primaryColor);
    doc.line(summaryX, sumY, 196, sumY);
    sumY += 6;

    doc.setFontSize(11);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text("Grand Total:", summaryX, sumY);
    doc.text(`PKR ${grandTotal.toLocaleString()}`, 196, sumY, { align: "right" });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(150, 150, 150);

        doc.line(14, 280, 196, 280);
        doc.text("Thank you for shopping with BK Store. Support: support@bkstore.com", 14, 285);
        doc.text(`Page ${i} of ${pageCount}`, 196, 285, { align: "right" });
    }

    // Save PDF file
    doc.save(`${filenamePrefix}_${order.order_number}.pdf`);
}
