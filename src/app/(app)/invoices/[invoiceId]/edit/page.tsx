import { InvoiceForm } from '@/components/invoice-form';
import { getInvoiceById, getProjects } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { notFound } from 'next/navigation';
import { AlertTriangle } from 'lucide-react'; // Import icon for warning

export default async function EditInvoicePage({ params }: { params: { invoiceId: string } }) {
  const invoice = await getInvoiceById(params.invoiceId);
  const projects = await getProjects();

  if (!invoice) {
    notFound();
  }
  
  // Check if the invoice is editable (only drafts)
  if (invoice.status !== 'draft') {
    return (
        <div className="max-w-3xl mx-auto">
            <Card className="shadow-lg border-destructive/50"> {/* Add visual cue for error/warning */}
                <CardHeader>
                    {/* Adjusted title size */}
                    <CardTitle className="text-2xl font-bold text-primary">Edit Invoice: {invoice.invoiceNumber}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center space-y-4 py-8">
                     <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
                     <p className="text-lg font-semibold text-destructive">Editing Locked</p>
                    <p className="text-muted-foreground">
                        This invoice cannot be edited because its status is '{invoice.status}'. Only invoices in 'draft' status can be modified.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
  }


  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
           {/* Adjusted title size */}
          <CardTitle className="text-2xl font-bold text-primary">Edit Invoice: {invoice.invoiceNumber}</CardTitle>
          <CardDescription>Update the details for your invoice.</CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceForm invoice={invoice} projects={projects} />
        </CardContent>
      </Card>
    </div>
  );
}
