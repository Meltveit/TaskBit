import { InvoiceForm } from '@/components/invoice-form';
import { getInvoiceById, getProjects } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { notFound } from 'next/navigation';

export default async function EditInvoicePage({ params }: { params: { invoiceId: string } }) {
  const invoice = await getInvoiceById(params.invoiceId);
  const projects = await getProjects();

  if (!invoice) {
    notFound();
  }
  
  if (invoice.status !== 'draft') {
    // Optionally, redirect or show a message that only draft invoices can be edited
    return (
        <div className="max-w-3xl mx-auto">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">Edit Invoice: {invoice.invoiceNumber}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-destructive">This invoice cannot be edited as it is not in 'draft' status.</p>
                </CardContent>
            </Card>
        </div>
    );
  }


  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Invoice: {invoice.invoiceNumber}</CardTitle>
          <CardDescription>Update the details for your invoice.</CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceForm invoice={invoice} projects={projects} />
        </CardContent>
      </Card>
    </div>
  );
}
