"use client";

import type { Invoice, Project } from "@/lib/definitions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Printer, Download, Send, Edit, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { SendInvoiceButton } from "./delete-buttons"; // Reusing this for sending
import { useToast } from "@/hooks/use-toast"; // For Stripe placeholder

interface InvoiceViewProps {
  invoice: Invoice;
  project?: Project | null; // Associated project, if any
}

export function InvoiceView({ invoice, project }: InvoiceViewProps) {
   const { toast } = useToast();

  const handlePrint = () => {
    window.print();
  };

  // Placeholder for Stripe integration
  const handlePayNow = async () => {
    console.log("Initiating Stripe Checkout for Invoice:", invoice.id);
     toast({
       title: "Redirecting to Payment...",
       description: "Connecting to Stripe checkout (placeholder).",
     });
    // In a real app:
    // 1. Call backend endpoint to create Stripe Checkout session (e.g., POST /api/invoices/:id/create-checkout)
    // 2. Receive session URL from backend
    // 3. Redirect user: window.location.href = sessionUrl;
    // Example backend call (conceptual):
    /*
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/create-checkout`, { method: 'POST' });
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Failed to get Stripe Checkout URL.');
      }
    } catch (error) {
      console.error("Stripe Checkout Error:", error);
      toast({ title: "Payment Error", description: "Could not initiate payment. Please try again later.", variant: "destructive" });
    }
    */
  };


  // Use Teal for status badges as requested
  const statusBadgeVariant = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground border-border hover:bg-muted/80';
      case 'sent': return 'bg-secondary/20 text-secondary-foreground border-secondary/50 hover:bg-secondary/30'; // Teal variant
      case 'paid': return 'bg-secondary/20 text-secondary-foreground border-secondary/50 hover:bg-secondary/30'; // Teal variant
      case 'overdue': return 'bg-destructive/20 text-destructive border-destructive/50 hover:bg-destructive/30';
      default: return 'outline';
    }
  };

  return (
    <Card className="shadow-xl print:shadow-none print:border-none w-full max-w-4xl mx-auto">
      <CardHeader className="bg-muted/30 print:bg-transparent p-6 rounded-t-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
             {/* Header uses Deep Blue */}
            <h1 className="text-3xl font-bold text-primary">INVOICE</h1>
            <p className="text-muted-foreground">{invoice.invoiceNumber}</p>
          </div>
          <div className="mt-4 sm:mt-0 text-right">
             {/* Logo remains primary */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-primary inline-block">
                <path d="M12 .75a8.25 8.25 0 00-8.25 8.25c0 1.886.646 3.599 1.707 4.954L2.97 22.441a.75.75 0 001.088.972l2.806-1.95A8.25 8.25 0 1012 .75zm0 15a6.75 6.75 0 110-13.5 6.75 6.75 0 010 13.5z" />
                <path d="M12 6.75a.75.75 0 00-.75.75v3.75H7.5a.75.75 0 000 1.5h3.75V18a.75.75 0 001.5 0v-5.25H16.5a.75.75 0 000-1.5h-3.75V7.5a.75.75 0 00-.75-.75z" />
            </svg>
            <p className="text-lg font-semibold">TaskBit Solutions</p>
            <p className="text-sm text-muted-foreground">your-email@taskbit.com</p>
            <p className="text-sm text-muted-foreground">www.taskbit.com</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end print:hidden">
             {/* Teal status badge */}
             <Badge className={`capitalize text-lg px-3 py-1 ${statusBadgeVariant(invoice.status)}`}>{invoice.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {/* Client name in Deep Blue */}
            <h3 className="font-semibold text-primary mb-1">Bill To:</h3>
            <p className="text-muted-foreground font-medium">{invoice.clientName}</p>
            <p className="text-muted-foreground">{invoice.clientEmail}</p>
            {project && (
              <>
                <h3 className="font-semibold text-primary mt-4 mb-1">Project:</h3>
                <p className="text-muted-foreground">{project.name}</p>
              </>
            )}
          </div>
          <div className="text-left md:text-right">
            <p><span className="font-semibold text-foreground">Issue Date:</span> {new Date(invoice.issueDate).toLocaleDateString()}</p>
            <p><span className="font-semibold text-foreground">Due Date:</span> {new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>
        </div>

        <Separator />

        <div>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-semibold text-foreground">Description</th>
                <th className="text-right py-2 font-semibold text-foreground">Quantity</th>
                <th className="text-right py-2 font-semibold text-foreground">Unit Price</th>
                <th className="text-right py-2 font-semibold text-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-b border-muted/50">
                  <td className="py-3 text-muted-foreground">{item.description}</td>
                  <td className="text-right py-3 text-muted-foreground">{item.quantity}</td>
                  <td className="text-right py-3 text-muted-foreground">${item.unitPrice.toFixed(2)}</td>
                  <td className="text-right py-3 text-muted-foreground">${item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Separator />

        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2">
            {/* Subtotal, Tax, etc. can be added here if needed */}
            <div className="flex justify-between items-center">
              <p className="text-lg font-semibold text-foreground">Total Amount:</p>
               {/* Teal total amount */}
              <p className="text-lg font-bold text-secondary">${invoice.totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold text-foreground mb-1">Notes:</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{invoice.notes}</p>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="p-6 bg-muted/30 print:hidden rounded-b-lg flex flex-col sm:flex-row justify-between items-center gap-4">
        { (invoice.status === 'sent' || invoice.status === 'overdue') ? (
           /* Pay Now Button (Yellow) */
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handlePayNow}>
            <CreditCard className="mr-2 h-4 w-4" /> Pay Now
          </Button>
         ) : (
           <p className="text-sm text-muted-foreground">Thank you for your business!</p>
         )}
        <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
           {/* Print Button (Teal) */}
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print / PDF
          </Button>
          {/* Send Button (Yellow, uses accent) */}
          {(invoice.status === 'draft' || invoice.status === 'sent') &&
            <SendInvoiceButton invoiceId={invoice.id} clientEmail={invoice.clientEmail} isResend={invoice.status === 'sent'} buttonProps={{ variant: "default", size: "sm"}} /> // Explicitly use default (Yellow)
          }
           {/* Edit Button (Teal) */}
          {invoice.status === 'draft' && (
             <Link href={`/invoices/${invoice.id}/edit`}>
                <Button variant="secondary">
                    <Edit className="mr-2 h-4 w-4" /> Edit Invoice
                </Button>
             </Link>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
