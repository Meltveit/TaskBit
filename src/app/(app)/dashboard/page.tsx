import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Briefcase, FileText, PlusCircle, ArrowRight } from "lucide-react";
import type { Project, Invoice } from '@/lib/definitions';
import { getProjects, getInvoices } from '@/lib/definitions';
import { ScrollArea } from "@/components/ui/scroll-area";

async function getDashboardData() {
  const allProjects = await getProjects();
  const allInvoices = await getInvoices();

  const activeProjects = allProjects.filter(p => p.status === 'active').slice(0, 5);
  const pendingInvoices = allInvoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').slice(0, 5);
  
  return { activeProjects, pendingInvoices, totalProjects: allProjects.length, totalInvoices: allInvoices.length };
}

export default async function DashboardPage() {
  const { activeProjects, pendingInvoices, totalProjects, totalInvoices } = await getDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/projects/new">
            <Button variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" /> New Project
            </Button>
          </Link>
          <Link href="/invoices/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> New Invoice
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-semibold">Active Projects</CardTitle>
            <Briefcase className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            {activeProjects.length > 0 ? (
              <ScrollArea className="h-[200px]">
                <ul className="space-y-3">
                  {activeProjects.map((project: Project) => (
                    <li key={project.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md hover:bg-muted transition-colors">
                      <div>
                        <Link href={`/projects/${project.id}`} className="font-medium text-foreground hover:underline">{project.name}</Link>
                        <p className="text-sm text-muted-foreground">{project.tasks.length} tasks</p>
                      </div>
                      <Link href={`/projects/${project.id}`}>
                        <Button variant="ghost" size="sm">View <ArrowRight className="ml-1 h-4 w-4" /></Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground">No active projects.</p>
            )}
            {totalProjects > 5 && (
              <Link href="/projects" className="block mt-4 text-sm text-primary hover:underline">
                View all {totalProjects} projects <ArrowRight className="inline h-4 w-4" />
              </Link>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-semibold">Pending Invoices</CardTitle>
            <FileText className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            {pendingInvoices.length > 0 ? (
              <ScrollArea className="h-[200px]">
                <ul className="space-y-3">
                  {pendingInvoices.map((invoice: Invoice) => (
                    <li key={invoice.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md hover:bg-muted transition-colors">
                      <div>
                        <Link href={`/invoices/${invoice.id}`} className="font-medium text-foreground hover:underline">{invoice.invoiceNumber}</Link>
                        <p className="text-sm text-muted-foreground">To: {invoice.clientName} - ${invoice.totalAmount.toFixed(2)}</p>
                      </div>
                      <Link href={`/invoices/${invoice.id}`}>
                        <Button variant="ghost" size="sm">View <ArrowRight className="ml-1 h-4 w-4" /></Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground">No pending invoices.</p>
            )}
            {totalInvoices > 5 && (
               <Link href="/invoices" className="block mt-4 text-sm text-primary hover:underline">
                View all {totalInvoices} invoices <ArrowRight className="inline h-4 w-4" />
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
