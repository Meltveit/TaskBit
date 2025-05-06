import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card'; // Keep Card for empty state
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Eye, Send, FileText as FileTextIcon } from 'lucide-react';
import type { Invoice } from '@/lib/definitions';
import { getInvoices } from '@/lib/definitions';
import { Badge } from '@/components/ui/badge';
import { DeleteInvoiceButton, SendInvoiceButton } from '@/components/delete-buttons';
import { format } from 'date-fns';

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  // Consistent status badge styling, using teal for paid/sent as requested
  const statusBadgeVariant = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground border-border hover:bg-muted/80'; // Gray for draft
      case 'sent': return 'bg-secondary/20 text-secondary-foreground border-secondary/50 hover:bg-secondary/30'; // Teal variant for sent
      case 'paid': return 'bg-secondary/20 text-secondary-foreground border-secondary/50 hover:bg-secondary/30'; // Teal variant for paid
      case 'overdue': return 'bg-destructive/20 text-destructive border-destructive/50 hover:bg-destructive/30'; // Red variant for overdue
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Invoices</h1> {/* Adjusted title size */}
        <Link href="/invoices/new">
           {/* Updated New Invoice button to use Accent color (Yellow) */}
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <PlusCircle className="mr-2 h-4 w-4" /> New Invoice
          </Button>
        </Link>
      </div>

      {invoices.length > 0 ? (
        <Card className="shadow-md"> {/* Wrap table in a Card for consistent styling */}
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Invoice #</TableHead>
                 <TableHead>Client</TableHead>
                 <TableHead className="text-right">Amount</TableHead>
                 <TableHead className="text-center">Status</TableHead>
                 <TableHead>Issue Date</TableHead>
                 <TableHead>Due Date</TableHead>
                 <TableHead className="text-right">Actions</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {invoices.map((invoice) => (
                 <TableRow key={invoice.id}>
                   <TableCell className="font-medium">
                      <Link href={`/invoices/${invoice.id}`} className="hover:underline text-foreground">
                        {invoice.invoiceNumber}
                      </Link>
                   </TableCell>
                   <TableCell className="text-muted-foreground">{invoice.clientName}</TableCell>
                   <TableCell className="text-right font-semibold text-primary">${invoice.totalAmount.toFixed(2)}</TableCell>
                   <TableCell className="text-center">
                      <Badge
                       variant="outline" // Use outline variant base
                       className={`capitalize text-xs ${statusBadgeVariant(invoice.status)}`}
                     >
                       {invoice.status}
                     </Badge>
                   </TableCell>
                   <TableCell className="text-muted-foreground">{format(new Date(invoice.issueDate), 'PP')}</TableCell>
                   <TableCell className="text-muted-foreground">{format(new Date(invoice.dueDate), 'PP')}</TableCell>
                   <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                         {/* View Button (Teal) */}
                        <Link href={`/invoices/${invoice.id}`}>
                          <Button variant="secondary" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                             <span className="sr-only">View</span>
                          </Button>
                        </Link>
                         {/* Send Button (Teal, shows for draft/sent) */}
                        {(invoice.status === 'draft' || invoice.status === 'sent') && (
                           <SendInvoiceButton invoiceId={invoice.id} clientEmail={invoice.clientEmail} buttonProps={{ variant: "secondary", size: "icon", className:"h-8 w-8"}} />
                         )}
                         {/* Edit Button (Teal, only for draft) */}
                        {invoice.status === 'draft' && (
                          <Link href={`/invoices/${invoice.id}/edit`}>
                            <Button variant="secondary" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                               <span className="sr-only">Edit</span>
                            </Button>
                          </Link>
                        )}
                         {/* Delete Button (Destructive Red) */}
                        <DeleteInvoiceButton invoiceId={invoice.id} buttonProps={{ variant: "ghost", size: "icon", className:"h-8 w-8 hover:bg-destructive/10 text-destructive"}}/>
                      </div>
                   </TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
         </Card>
      ) : (
         <Card className="col-span-full text-center py-12 shadow-md">
          <CardContent>
            <FileTextIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">No Invoices Yet</h3>
            <p className="text-muted-foreground mb-4">Create your first invoice to get started.</p>
            <Link href="/invoices/new">
               {/* Use Accent color (Yellow) for the empty state button */}
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <PlusCircle className="mr-2 h-4 w-4" /> Create Invoice
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
