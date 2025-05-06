
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock Data - Replace with API calls
const currentPlan = {
  name: "Pro",
  price: "$20/month",
  features: ["Unlimited Projects", "Time Tracking", "Invoicing", "Client Portal", "Priority Support"],
};

const billingHistory = [
  { id: "bh-001", date: "2024-07-01", amount: 20.00, status: "Paid", invoiceUrl: "#" },
  { id: "bh-002", date: "2024-06-01", amount: 20.00, status: "Paid", invoiceUrl: "#" },
  { id: "bh-003", date: "2024-05-01", amount: 10.00, status: "Paid", invoiceUrl: "#" }, // Example of previous plan
];

// Placeholder for Stripe integration component
const StripePaymentElement = () => (
   <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
     <CreditCard className="mx-auto h-8 w-8 mb-3" />
     <p>Payment Method Integration Area</p>
     <p className="text-xs">(Stripe Elements would go here)</p>
     <Button variant="secondary" size="sm" className="mt-4">Add Payment Method</Button>
   </div>
);

export function BillingSettings() {
    const { toast } = useToast();

    const handleUpgrade = () => {
        console.log("Initiating upgrade process...");
        // API Call Placeholder: POST /api/billing/upgrade
        // Redirect to Stripe checkout or show upgrade modal
        toast({
            title: "Upgrade Initiated (Placeholder)",
            description: "Redirecting to upgrade page...",
        });
    };

    const handleDownloadInvoice = (invoiceUrl: string) => {
        console.log("Downloading billing invoice:", invoiceUrl);
        // Navigate to the invoice URL or trigger download
        toast({
            title: "Invoice Download (Placeholder)",
            description: "Starting invoice download...",
        });
    };

  return (
    <div className="space-y-6">
      {/* Current Plan Section */}
      <Card className="shadow-md border-border/60">
        <CardHeader>
          <CardTitle className="text-xl">Current Plan</CardTitle>
          <CardDescription>Your current subscription details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
           <div className="flex justify-between items-baseline">
            <p className="text-2xl font-semibold text-primary">{currentPlan.name} Plan</p>
            <p className="text-lg font-medium text-foreground">{currentPlan.price}</p>
           </div>
           <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm pl-2">
                {currentPlan.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                ))}
           </ul>
        </CardContent>
        <CardFooter className="flex justify-end border-t border-border/60 pt-4">
          <Button onClick={handleUpgrade} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Upgrade Plan
          </Button>
        </CardFooter>
      </Card>

      {/* Payment Method Section */}
      <Card className="shadow-md border-border/60">
        <CardHeader>
          <CardTitle className="text-xl">Payment Method</CardTitle>
          <CardDescription>Manage your payment information.</CardDescription>
        </CardHeader>
        <CardContent>
          <StripePaymentElement />
           {/* In a real app, display stored card info if available */}
           {/* e.g., <p>Card ending in **** 1234</p> <Button variant="outline" size="sm">Update Card</Button> */}
        </CardContent>
      </Card>

      {/* Billing History Section */}
      <Card className="shadow-md border-border/60">
        <CardHeader>
          <CardTitle className="text-xl">Billing History</CardTitle>
          <CardDescription>View your past payments and download invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          {billingHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell className="font-medium">${item.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground border-secondary/50">{item.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleDownloadInvoice(item.invoiceUrl)}>
                        <Download className="mr-2 h-4 w-4" /> Invoice
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-6">No billing history found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
