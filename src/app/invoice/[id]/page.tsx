"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Invoice } from "@/lib/db-store";

export default function InvoicePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const isAdmin = searchParams.get("mode") === "admin";

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [customerEmail, setCustomerEmail] = useState<string>("");
    const [customerMobile, setCustomerMobile] = useState<string>("");
    const [customerName, setCustomerName] = useState<string>("");
    const [sending, setSending] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);

    // Edit Invoice State (Full Editing)
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<any>(null); // Using any for flexible editing before save
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetch(`/api/admin/invoices/${params.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.invoice) {
                    setInvoice(data.invoice);
                    // Init editing state
                    const hasGst = (data.invoice.sgst > 0 || data.invoice.cgst > 0);
                    setEditingInvoice({
                        ...JSON.parse(JSON.stringify(data.invoice)),
                        enableGst: hasGst
                    });
                    // Fetch User Email using userId (mobile)
                    fetch(`/api/admin/users/${data.invoice.userId}`)
                        .then(uRes => uRes.json())
                        .then(uData => {
                            if (uData.user) {
                                if (uData.user.email) setCustomerEmail(uData.user.email);
                                if (uData.user.name) setCustomerName(uData.user.name);
                                if (uData.user.mobile) setCustomerMobile(uData.user.mobile);
                            }
                        });
                }
            });
    }, [params.id]);

    useEffect(() => {
        if (invoice) {
            const finalName = invoice.customerName === "Unknown" || !invoice.customerName ? customerName : invoice.customerName;
            const safeName = finalName ? finalName.replace(/\s+/g, '_') : 'Invoice';
            document.title = `${safeName}_${invoice.invoiceNumber}`;
        }
    }, [invoice, customerName]);

    // Auto-calculate totals when items change or discount changes
    useEffect(() => {
        if (!showEditModal || !editingInvoice) return;

        const subtotal = editingInvoice.items.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
        const discount = Number(editingInvoice.discount) || 0;

        // GST Logic
        let sgst = 0;
        let cgst = 0;

        if (editingInvoice.enableGst) {
            sgst = subtotal * 0.09;
            cgst = subtotal * 0.09;
        }

        const total = subtotal + sgst + cgst - discount;

        setEditingInvoice((prev: any) => ({
            ...prev,
            subtotal,
            sgst,
            cgst,
            total
        }));
    }, [editingInvoice?.items, editingInvoice?.discount, editingInvoice?.enableGst, showEditModal]);

    if (!invoice) return <div className="p-10 text-center text-gold-500">Loading Invoice...</div>;

    const balanceDue = invoice.total - invoice.paidAmount;

    const handleSaveInvoice = async () => {
        if (!editingInvoice) return;
        setUpdating(true);
        try {
            const res = await fetch(`/api/admin/invoices/${invoice?.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingInvoice)
            });
            const data = await res.json();
            if (res.ok && data.invoice) {
                setInvoice(data.invoice); // Update local state
                alert("✅ Invoice Updated Successfully!");
                setShowEditModal(false);
            } else {
                alert("❌ Update Failed");
            }
        } catch (e) {
            alert("Error updating invoice");
        } finally {
            setUpdating(false);
        }
    };



    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...editingInvoice.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setEditingInvoice({ ...editingInvoice, items: newItems });
    };

    const handleAddItem = () => {
        setEditingInvoice({
            ...editingInvoice,
            items: [...editingInvoice.items, { description: "New Service", startDate: "", endDate: "", duration: "1 Month", amount: 0 }]
        });
    };

    const handleRemoveItem = (index: number) => {
        const newItems = editingInvoice.items.filter((_: any, i: number) => i !== index);
        setEditingInvoice({ ...editingInvoice, items: newItems });
    };

    const handleSendEmail = async () => {
        if (!invoice) return;

        const targetEmail = customerEmail || "student@example.com";

        setSending(true);
        try {
            // 1. Generate PDF (Optimized for Speed)
            const { toJpeg } = await import('html-to-image');
            const jsPDF = (await import('jspdf')).default;

            const element = document.getElementById('invoice');
            if (!element) return;

            // Use JPEG & scaled down ratio for speed (similar to Joining Letter optimization)
            const dataUrl = await toJpeg(element, { quality: 0.8, pixelRatio: 1.5, backgroundColor: '#ffffff' });

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            const pdfBase64 = pdf.output('datauristring');

            // 2. Send to API
            const res = await fetch("/api/admin/invoices/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: targetEmail,
                    name: invoice.customerName,
                    invoiceNumber: invoice.invoiceNumber,
                    pdfBase64: pdfBase64
                })
            });

            const data = await res.json();

            if (data.success) {
                alert(`✅ Email Sent Successfully to ${targetEmail}!`);
                setShowEmailModal(false);
            } else {
                alert("❌ " + (data.error || "Failed to send email."));
            }
        } catch (e) {
            console.error(e);
            alert("Error sending email.");
        } finally {
            setSending(false);
        }
    };

    // Helper for word conversion 
    // (Importing for robustness, assuming previous step succeeded)
    const toWords = (amount: number) => {
        const a = [
            "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
            "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
        ];
        const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

        const num = Math.floor(amount);
        if (num === 0) return "Zero";

        const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return "";

        let str = "";
        str += (parseInt(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
        str += (parseInt(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
        str += (parseInt(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
        str += (parseInt(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
        str += (parseInt(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';

        return "Indian Rupees " + str + "Only";
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8 flex justify-center items-start text-black font-sans print:p-0 print:m-0 print:bg-white">
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: auto;
                    }
                    body {
                        margin: 0;
                    }
                }
            `}</style>
            <div className="bg-white w-full max-w-4xl shadow-2xl print:shadow-none print:w-full print:max-w-none print:block">

                {/* Actions Toolbar - Hidden on Print */}
                <div className="bg-gray-800 text-white p-4 flex justify-between items-center print:hidden border-b border-gray-700">
                    <div className="flex gap-2">
                        <button onClick={() => window.print()} className="bg-gold-500 hover:bg-gold-400 text-black font-bold py-2 px-4 rounded text-sm">
                            🖨️ PRINT
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded text-sm border border-gray-600"
                            >
                                ✏️ EDIT DETAILS
                            </button>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={async () => {
                                const btn = document.getElementById('wa-btn');
                                if (btn) btn.innerText = "Generating PDF...";

                                try {
                                    const { toPng } = await import('html-to-image');
                                    const jsPDF = (await import('jspdf')).default;

                                    const element = document.getElementById('invoice');
                                    if (!element) return;

                                    const dataUrl = await toPng(element, {
                                        quality: 0.95,
                                        backgroundColor: '#ffffff',
                                        style: { padding: '20px' } // Force compact padding for PDF generation
                                    });

                                    const pdf = new jsPDF({
                                        orientation: 'p',
                                        unit: 'mm',
                                        format: 'a4',
                                        encryption: {
                                            userPermissions: ["print"],
                                            ownerPassword: "TEJASKP_AI_SECURE_INVOICE_PROTECTION_KEY_8823",
                                            userPassword: "" // Allow opening without password
                                        }
                                    });
                                    const pdfWidth = pdf.internal.pageSize.getWidth();

                                    const img = new Image();
                                    img.src = dataUrl;
                                    await new Promise((resolve) => { img.onload = resolve; });
                                    const pdfHeight = (img.height * pdfWidth) / img.width;

                                    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);

                                    const finalName = invoice.customerName === "Unknown" || !invoice.customerName ? customerName : invoice.customerName;
                                    const safeName = finalName ? finalName.replace(/\s+/g, '_') : 'Invoice';
                                    const fileName = `${safeName}_${invoice.invoiceNumber}.pdf`;
                                    const pdfBlob = pdf.output('blob');
                                    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

                                    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                                        await navigator.share({
                                            files: [file],
                                            text: `Invoice #${invoice.invoiceNumber}`,
                                            title: 'Invoice PDF'
                                        });
                                    } else {
                                        pdf.save(fileName);
                                        const message = `Hello ${invoice.customerName},\n\nHere is your invoice #${invoice.invoiceNumber}.\n(PDF attached below)\n\nRegards,\nTejaskp AI Software`;
                                        const url = `https://wa.me/${invoice.userId}?text=${encodeURIComponent(message)}`;
                                        window.open(url, '_blank');
                                    }
                                } catch (err) {
                                    console.error(err);
                                    alert("Error generating PDF.");
                                } finally {
                                    if (btn) btn.innerText = "📱 WHATSAPP PDF";
                                }
                            }}
                            id="wa-btn"
                            className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded text-sm flex items-center gap-2"
                        >
                            <span>📱</span> WHATSAPP PDF
                        </button>
                        <button onClick={() => setShowEmailModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded text-sm">
                            ✉️ EMAIL
                        </button>
                    </div>
                </div>

                {/* INVOICE CONTENT - REFERENCE LAYOUT */}
                <div id="invoice" style={{ color: "black" }} className="p-8 bg-white text-black !text-black text-xs leading-relaxed print:px-8 print:py-2 print:leading-normal relative overflow-hidden">
                    {/* Watermark Overlay */}
                    <div className="absolute inset-0 z-0 pointer-events-none flex flex-wrap content-start justify-center opacity-[0.03] select-none" style={{ transform: 'rotate(-45deg) scale(1.5)' }}>
                        {Array.from({ length: 100 }).map((_, i) => (
                            <div key={i} className="p-10 whitespace-nowrap text-xl font-black text-gray-900">
                                TEJASKP AI SOFTWARE
                            </div>
                        ))}
                    </div>

                    {/* Header Title */}
                    <div className="text-center font-bold text-lg underline mb-2 tracking-wide uppercase text-black relative z-10">
                        TAX INVOICE
                    </div>

                    {/* Main Border Box */}
                    <div className="border border-black relative z-10">

                        {/* Top Section: Company & References */}
                        <div className="flex border-b border-black">
                            {/* Left: Company Details */}
                            <div className="w-1/2 border-r border-black p-2 flex gap-3">
                                {/* LOGO */}
                                <div className="w-16 h-16 flex-shrink-0">
                                    <img src="/logo-new.jpg" alt="Logo" className="w-full h-full object-contain" />
                                </div>

                                {/* DETAILS */}
                                <div>
                                    <div className="font-bold text-sm mb-1 uppercase">Tejaskp AI Software</div>
                                    <div className="space-y-0.5 text-[10px]">
                                        <p>Pramukh Vandana, 441/6, Makarpura GIDC,</p>
                                        <p>Makarpura, Vadodara, Gujarat 390010</p>
                                        <p>Mobile: +91 9328134074, +91 9104630598</p>
                                        <p>Email: sales@tejaskpaisoftware.com</p>
                                        <p className="font-bold mt-2">UDYAM REGISTRATION NUMBER: <span className="font-normal">UDYAM-GJ-24-0185145</span></p>
                                        <p>State Name : Gujarat, Code : 24,</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Invoice References */}
                            <div className="w-1/2 flex flex-col text-[10px]">
                                <div className="flex border-b border-black flex-1">
                                    <div className="w-1/2 p-2 border-r border-black">
                                        <p className="font-bold">Invoice No.</p>
                                        <p>{invoice.invoiceNumber}</p>
                                    </div>
                                    <div className="w-1/2 p-2">
                                        <p className="font-bold">Dated</p>
                                        <p>{new Date(invoice.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex border-b border-black flex-1">
                                    <div className="w-1/2 p-2 border-r border-black">
                                        <p className="font-bold">Delivery Note</p>
                                    </div>
                                    <div className="w-1/2 p-2">
                                        <p className="font-bold">Mode/Terms of Payment</p>
                                        <p>IMMEDIATE</p>
                                    </div>
                                </div>
                                <div className="flex border-b border-black flex-1">
                                    <div className="w-1/2 p-2 border-r border-black">
                                        <p className="font-bold">Reference No. & Date.</p>
                                    </div>
                                    <div className="w-1/2 p-2">
                                        <p className="font-bold">Other References</p>
                                    </div>
                                </div>
                                <div className="flex flex-1">
                                    <div className="w-1/2 p-2 border-r border-black">
                                        <p className="font-bold">Buyers Order No.</p>
                                    </div>
                                    <div className="w-1/2 p-2">
                                        <p className="font-bold">Dated</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-b border-black p-2 flex">
                            <div className="w-full">
                                <p className="font-bold text-[10px]">Buyer (Bill to)</p>
                                <p className="font-bold uppercase text-sm">{invoice.customerName === "Unknown" || !invoice.customerName ? customerName : invoice.customerName}</p>
                                <p className="text-[10px]">Email: {customerEmail || "N/A"}</p>
                                <p className="text-[10px]">Mobile: {customerMobile || "N/A"}</p>
                            </div>
                        </div>

                        {/* Items Table Header */}
                        <div className="border-b border-black flex font-bold text-center text-[10px] bg-gray-100">
                            <div className="w-[8%] border-r border-black py-1">SI No</div>
                            <div className="w-[30%] border-r border-black py-1">Description of Services</div>
                            <div className="w-[10%] border-r border-black py-1">Start Date</div>
                            <div className="w-[10%] border-r border-black py-1">End Date</div>
                            <div className="w-[10%] border-r border-black py-1">Duration</div>
                            <div className="w-[15%] border-r border-black py-1">Rate</div>
                            <div className="w-[15%] py-1">Amount</div>
                        </div>

                        {/* Items Rows */}
                        <div className="min-h-[200px] text-[10px] relative">
                            {/* Vertical Grid Lines Background */}
                            <div className="absolute inset-0 flex pointer-events-none">
                                <div className="w-[8%] border-r border-black h-full"></div>
                                <div className="w-[30%] border-r border-black h-full"></div>
                                <div className="w-[10%] border-r border-black h-full"></div>
                                <div className="w-[10%] border-r border-black h-full"></div>
                                <div className="w-[10%] border-r border-black h-full"></div>
                                <div className="w-[15%] border-r border-black h-full"></div>
                                <div className="w-[15%] h-full"></div>
                            </div>

                            {/* Data Rows */}
                            {invoice.items.map((item, idx) => (
                                <div key={idx} className="flex relative z-10">
                                    <div className="w-[8%] p-1 text-center">{idx + 1}</div>
                                    <div className="w-[30%] p-1">
                                        <p className="font-bold">{item.description}</p>
                                    </div>
                                    <div className="w-[10%] p-1 text-center text-[9px]">{item.startDate ? new Date(item.startDate).toLocaleDateString() : '-'}</div>
                                    <div className="w-[10%] p-1 text-center text-[9px]">{item.endDate ? new Date(item.endDate).toLocaleDateString() : '-'}</div>
                                    <div className="w-[10%] p-1 text-center font-bold text-[9px]">
                                        {/^\d+$/.test(item.duration) ? `${item.duration} Months` : item.duration}
                                    </div>
                                    <div className="w-[15%] p-1 text-right">₹ {item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                    <div className="w-[15%] p-1 text-right font-bold">₹ {item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                </div>
                            ))}

                            {/* Taxes */}
                            {invoice.sgst > 0 && (
                                <>
                                    <div className="flex relative z-10 mt-2">
                                        <div className="w-[8%]"></div>
                                        <div className="w-[60%] text-right font-bold pr-2">Subtotal</div>
                                        <div className="w-[17%]"></div>
                                        <div className="w-[15%] text-right p-1">{invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                    </div>
                                    {invoice.discount && invoice.discount > 0 ? (
                                        <div className="flex relative z-10 text-red-600">
                                            <div className="w-[8%]"></div>
                                            <div className="w-[60%] text-right font-bold pr-2">Discount</div>
                                            <div className="w-[17%]"></div>
                                            <div className="w-[15%] text-right p-1">- {invoice.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                        </div>
                                    ) : null}
                                    <div className="flex relative z-10">
                                        <div className="w-[8%]"></div>
                                        <div className="w-[60%] text-right font-bold pr-2">SGST (9%)</div>
                                        <div className="w-[17%]"></div>
                                        <div className="w-[15%] text-right p-1">{invoice.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                    </div>
                                    <div className="flex relative z-10">
                                        <div className="w-[8%]"></div>
                                        <div className="w-[60%] text-right font-bold pr-2">CGST (9%)</div>
                                        <div className="w-[17%]"></div>
                                        <div className="w-[15%] text-right p-1">{invoice.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Total Row */}
                        <div className="border-t border-b border-black flex font-bold text-[10px]">
                            <div className="w-[70%] border-r border-black px-2 py-1 text-right">
                                <p>Total</p>
                                <p className="text-green-600 font-normal">Paid Amount</p>
                                <p className="text-red-600">Balance Due</p>
                            </div>
                            <div className="w-[15%] border-r border-black px-2 py-1 text-center">
                                <p>{invoice.items.length} Services</p>
                            </div>
                            <div className="w-[15%] px-2 py-1 text-right text-sm">
                                <p>₹ {invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                <p className="text-[10px] text-green-600 font-normal">- ₹ {invoice.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                <p className="text-sm text-red-600">₹ {(invoice.total - invoice.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                <p className="text-[9px] text-gray-500 font-normal mt-1">Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'IMMEDIATE'}</p>
                            </div>
                        </div>

                        {/* Amount in Words */}
                        <div className="border-b border-black p-1 text-[10px]">
                            <span className="font-bold">Amount Chargeable (in words): </span>
                            <span className="capitalize">{toWords(invoice.total)}</span>
                        </div>

                        {/* Bottom Section */}
                        <div className="flex border-b border-black">
                            {/* Left: QR Code & Declaration */}
                            <div className="w-1/2 border-r border-black flex flex-col p-2 justify-between gap-4">
                                <div className="flex gap-4">
                                    <div className="border p-1 rounded inline-block h-fit">
                                        <img src="/payment-qr.jpg" alt="QR" className="h-20 w-20 object-contain" />
                                    </div>
                                    <div className="text-[9px]">
                                        <p className="font-bold">Scan to Pay via UPI</p>
                                        <p>UPI ID: t786kp-1@oksbi</p>
                                    </div>
                                </div>
                                <div className="text-[9px]">
                                    <p className="underline mb-1">Declaration</p>
                                    <p>We declare that this invoice shows the actual price of the services and that all particulars are true and correct.</p>
                                    <p className="mt-2 text-red-600 text-[8px] font-bold">NOTE: After due date, a penalty of ₹100/day will be charged.</p>
                                </div>
                            </div>

                            {/* Right: Bank Details & Signature */}
                            <div className="w-1/2 flex flex-col text-[10px]">
                                <div className="p-2 border-b border-black border-dashed">
                                    <p className="font-bold underline mb-1">Company's Bank Details</p>
                                    <div className="grid grid-cols-[100px_1fr] gap-y-0.5">
                                        <span>A/c Holder's Name</span>
                                        <span className="uppercase">: PATEL TEJAS KAUSHAL</span>
                                        <span>Bank Name</span>
                                        <span className="uppercase">: Axis Bank</span>
                                        <span>A/c No.</span>
                                        <span>: 923010070880325</span>
                                        <span>Branch & IFS Code</span>
                                        <span className="uppercase">: Sayajigunj,Vadodara [GJ] & UTIB0000567</span>
                                    </div>
                                </div>
                                <div className="p-2 text-right flex flex-col justify-end relative flex-1 min-h-[80px]">
                                    <p className="text-[9px] mb-8">for TEJASKP AI SOFTWARE</p>

                                    {/* Signature Image */}
                                    <div className="absolute bottom-6 right-2 w-32 mix-blend-multiply">
                                        <img src="/signature.png" alt="Signature" className="w-full object-contain" />
                                    </div>

                                    <p className="text-[9px] mt-4 font-bold border-t border-black inline-block ml-auto px-4 z-10 relative">Authorised Signatory</p>
                                </div>
                            </div>
                        </div>

                        {/* Very Bottom */}
                        <div className="flex justify-between text-[9px] p-1 bg-gray-50">
                            <div>SUBJECT TO VADODARA JURISDICTION</div>
                            <div>This is a Computer Generated Invoice</div>
                        </div>

                    </div>
                    {/* End Main Border Box */}

                </div>
                {/* End Invoice Content */}

                {/* MODALS - Keeping Existing Modals */}
                {showEmailModal && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 print:hidden">
                        <div className="bg-white p-8 rounded-xl max-w-sm w-full text-center">
                            <h3 className="text-xl font-bold mb-4">Send Invoice via Email?</h3>
                            <button onClick={handleSendEmail} disabled={sending} className="bg-blue-600 text-white font-bold py-3 rounded w-full mb-2">{sending ? "Sending..." : "Send Now"}</button>
                            <button onClick={() => setShowEmailModal(false)} className="text-gray-500 text-sm">Cancel</button>
                        </div>
                    </div>
                )}
                {showEditModal && editingInvoice && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 print:hidden p-4 overflow-y-auto">
                        <div className="bg-white p-8 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                            <h3 className="text-2xl font-bold mb-6 border-b pb-2">Edit Invoice Details</h3>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-xs text-gray-500 font-bold mb-1">Customer Name</label>
                                    <input
                                        type="text"
                                        value={editingInvoice.customerName || ""}
                                        onChange={(e) => setEditingInvoice({ ...editingInvoice, customerName: e.target.value })}
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 font-bold mb-1">Due Date</label>
                                    <input
                                        type="date"
                                        value={editingInvoice.dueDate ? new Date(editingInvoice.dueDate).toISOString().split('T')[0] : ''}
                                        onChange={(e) => setEditingInvoice({ ...editingInvoice, dueDate: new Date(e.target.value).toISOString() })}
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-xs text-gray-500 font-bold mb-2">Service Items</label>
                                <div className="space-y-3">
                                    {editingInvoice.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex gap-2 items-start bg-gray-50 p-3 rounded border">
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    type="text"
                                                    placeholder="Description"
                                                    value={item.description || ""}
                                                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                                    className="w-full border p-1 rounded text-sm font-bold"
                                                />
                                                <div className="flex gap-2">
                                                    <input
                                                        type="date"
                                                        value={item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : ''}
                                                        onChange={(e) => handleItemChange(idx, 'startDate', new Date(e.target.value).toISOString())}
                                                        className="w-1/3 border p-1 rounded text-xs"
                                                    />
                                                    <input
                                                        type="date"
                                                        value={item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : ''}
                                                        onChange={(e) => handleItemChange(idx, 'endDate', new Date(e.target.value).toISOString())}
                                                        className="w-1/3 border p-1 rounded text-xs"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Duration"
                                                        value={item.duration || ""}
                                                        onChange={(e) => handleItemChange(idx, 'duration', e.target.value)}
                                                        className="w-1/3 border p-1 rounded text-xs"
                                                    />
                                                </div>
                                            </div>
                                            <div className="w-32">
                                                <input
                                                    type="number"
                                                    placeholder="Amount"
                                                    value={item.amount || 0}
                                                    onChange={(e) => handleItemChange(idx, 'amount', Number(e.target.value))}
                                                    className="w-full border p-2 rounded text-right font-mono"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleRemoveItem(idx)}
                                                className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded text-xs"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={handleAddItem} className="mt-2 text-gold-600 text-xs font-bold hover:underline">+ Add Item</button>
                            </div>

                            <div className="grid grid-cols-2 gap-8 border-t pt-4 bg-gray-50 p-4 rounded">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm">Subtotal:</span>
                                        <span className="font-bold">₹{editingInvoice.subtotal?.toFixed(2)}</span>
                                    </div>

                                    {/* GST Toggle */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <input
                                            type="checkbox"
                                            id="gstToggle"
                                            checked={editingInvoice.enableGst || false}
                                            onChange={(e) => setEditingInvoice({ ...editingInvoice, enableGst: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        <label htmlFor="gstToggle" className="text-xs font-bold text-gray-700 cursor-pointer">Enable GST (18%)</label>
                                    </div>

                                    {editingInvoice.enableGst && (
                                        <>
                                            <div className="flex justify-between mb-2 text-xs text-gray-500">
                                                <span>SGST (9%):</span>
                                                <span>₹{editingInvoice.sgst?.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between mb-2 text-xs text-gray-500">
                                                <span>CGST (9%):</span>
                                                <span>₹{editingInvoice.cgst?.toFixed(2)}</span>
                                            </div>
                                        </>
                                    )}

                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-red-500">Discount:</span>
                                        <input
                                            type="number"
                                            value={editingInvoice.discount || 0}
                                            onChange={(e) => setEditingInvoice({ ...editingInvoice, discount: Number(e.target.value) })}
                                            className="border p-1 rounded w-24 text-right"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-4 text-lg font-bold border-b pb-2">
                                        <span>Total:</span>
                                        <span>₹{editingInvoice.total?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-green-600">Paid Amount:</span>
                                        <input
                                            type="number"
                                            value={editingInvoice.paidAmount || 0}
                                            onChange={(e) => setEditingInvoice({ ...editingInvoice, paidAmount: Number(e.target.value) })}
                                            className="border p-2 rounded w-32 text-right font-bold text-green-700 bg-green-50 border-green-200"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button onClick={() => setShowEditModal(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded">
                                    Cancel
                                </button>
                                <button onClick={handleSaveInvoice} disabled={updating} className="flex-1 bg-gold-500 hover:bg-gold-400 text-black font-bold py-3 rounded shadow-lg">
                                    {updating ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
