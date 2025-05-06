import { getInvoiceById, getProjectById } from '@/lib/definitions';
import { notFound } from 'next/navigation';
import { InvoiceView } from '@/components/invoice-view';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function InvoiceDetailsPage({ params }: { params: { invoiceId: string } }) {
  const invoice = await getInvoiceById(params.invoiceId);
  
  if (!invoice) {
    notFound();
  }

  let project = null;
  if (invoice.projectId) {
    project = await getProjectById(invoice.projectId);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="outline" asChild>
          <Link href="/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
          </Link>
        </Button>
        {/* Actions like Edit can be added here if needed, depending on invoice status */}
      </div>
      <InvoiceView invoice={invoice} project={project} />
    </div>
  );
}
