import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Eye, Send, FileText as FileTextIcon } from 'lucide-react';
import type { Invoice } from '@/lib/definitions';
import { getInvoices } from '@/lib/definitions';
import { Badge } from '@/components/ui/badge';
import { DeleteInvoiceButton, SendInvoiceButton } from '@/components/delete-buttons'; // Assuming SendInvoiceButton exists or will be created

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  const statusBadgeVariant = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-500 text-white';
      case 'sent': return 'bg-blue-500 text-white';
      case 'paid': return 'bg-green-500 text-white';
      case 'overdue': return 'bg-red-500 text-white';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Invoices</h1>
        <Link href="/invoices/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Invoice
          </Button>
        </Link>
      </div>

      {invoices.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{invoice.invoiceNumber}</CardTitle>
                  <Badge 
                    variant='default'
                    className={`capitalize ${statusBadgeVariant(invoice.status)}`}
                  >
                    {invoice.status}
                  </Badge>
                </div>
                <CardDescription>
                  Client: {invoice.clientName}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-lg font-semibold text-primary">${invoice.totalAmount.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  Issue Date: {new Date(invoice.issueDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Due Date: {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </CardContent>
              <CardFooter className="flex flex-wrap justify-end gap-2 border-t pt-4">
                <Link href={`/invoices/${invoice.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="mr-1 h-4 w-4" /> View
                  </Button>
                </Link>
                {invoice.status === 'draft' && (
                  <Link href={`/invoices/${invoice.id}/edit`}>
                    <Button variant="secondary" size="sm">
                      <Edit className="mr-1 h-4 w-4" /> Edit
                    </Button>
                  </Link>
                )}
                {(invoice.status === 'draft' || invoice.status === 'sent') && (
                  <SendInvoiceButton invoiceId={invoice.id} clientEmail={invoice.clientEmail} />
                )}
                <DeleteInvoiceButton invoiceId={invoice.id} />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
         <Card className="col-span-full text-center py-12">
          <CardContent>
            <FileTextIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Invoices Yet</h3>
            <p className="text-muted-foreground mb-4">Create your first invoice to get started.</p>
            <Link href="/invoices/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Invoice
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
