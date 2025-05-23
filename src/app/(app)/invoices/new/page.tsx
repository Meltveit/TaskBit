import { InvoiceForm } from '@/components/invoice-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getProjects } from '@/lib/definitions';

export default async function NewInvoicePage() {
  const projects = await getProjects();
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          {/* Adjusted title size to match main page */}
          <CardTitle className="text-2xl font-bold text-primary">Create New Invoice</CardTitle>
          <CardDescription>Fill in the details below to generate an invoice.</CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceForm projects={projects} />
        </CardContent>
      </Card>
    </div>
  );
}
