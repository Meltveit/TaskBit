
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, Eye, CreditCard } from "lucide-react";
import type { Project, Task, Invoice } from '@/lib/definitions';
import { getProjectsForClient, getTasksForClient, getInvoicesForClient } from '@/lib/definitions'; // These need to be implemented
import { format } from "date-fns";

// Mock Client ID - replace with actual dynamic ID from route/session
const MOCK_CLIENT_ID = 'client-acme'; // Example client ID

export default async function ClientPortalPage() {
  // Fetch data specific to the client
  // Note: These functions need implementation in definitions.ts
  const projects = await getProjectsForClient(MOCK_CLIENT_ID);
  const tasks = await getTasksForClient(MOCK_CLIENT_ID);
  const invoices = await getInvoicesForClient(MOCK_CLIENT_ID);

  // Placeholder actions
  const handleViewProject = (projectId: string) => {
    console.log("View Project Details:", projectId);
    // Navigate or expand details
  };

  const handleApproveTask = (taskId: string) => {
    console.log("Approve Task:", taskId);
    // API Call: PATCH /api/tasks/:id/approve
    alert(`Approving Task ${taskId} (placeholder)`);
  };

  const handlePayInvoice = (invoiceId: string) => {
    console.log("Pay Invoice:", invoiceId);
    // API Call: POST /api/invoices/:id/pay -> Redirect to Stripe
    alert(`Redirecting to pay Invoice ${invoiceId} (placeholder)`);
  };

  // Task status colors (using teal variants)
  const taskStatusColors: Record<Task['status'], string> = {
    todo: 'bg-muted text-muted-foreground border-border',
    inprogress: 'bg-blue-100 text-blue-800 border-blue-300',
    done: 'bg-secondary/20 text-secondary-foreground border-secondary/50', // Teal for done
  };

   // Invoice status colors (using teal variants for paid/sent)
  const invoiceStatusVariant = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground border-border'; // Should not appear for client
      case 'sent': return 'bg-yellow-100 text-yellow-800 border-yellow-300'; // Yellow for sent/pending
      case 'paid': return 'bg-secondary/20 text-secondary-foreground border-secondary/50'; // Teal variant for paid
      case 'overdue': return 'bg-destructive/20 text-destructive border-destructive/50'; // Red variant for overdue
      default: return 'outline';
    }
  };

  // Mock client name - should match layout or be fetched
  const clientName = "Acme Corp";

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section>
        <h1 className="text-3xl font-bold text-primary mb-2">Welcome, {clientName}!</h1>
        <p className="text-muted-foreground">Here's an overview of your projects, tasks, and invoices.</p>
      </section>

      {/* Project Overview Section */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Your Projects</h2>
        {projects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const totalTasks = project.tasks.length;
              const completedTasks = project.tasks.filter(t => t.status === 'done').length;
              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
              return (
                 <Card key={project.id} className="shadow-lg border-border hover:shadow-teal transition-shadow duration-300">
                   <CardHeader>
                     <CardTitle className="text-xl text-primary">{project.name}</CardTitle>
                     {project.description && <CardDescription className="text-sm">{project.description}</CardDescription>}
                   </CardHeader>
                   <CardContent>
                     <Progress value={progress} className="h-2 bg-muted" indicatorClassName="bg-secondary" />
                     <p className="text-xs text-muted-foreground mt-2">{completedTasks} / {totalTasks} tasks completed ({progress}%)</p>
                   </CardContent>
                   <CardContent className="pt-0">
                      {/* Teal Button */}
                     <Button variant="secondary" size="sm" onClick={() => handleViewProject(project.id)} className="w-full">
                       <Eye className="mr-2 h-4 w-4" /> View Details
                     </Button>
                   </CardContent>
                 </Card>
              );
            })}
          </div>
        ) : (
           <Card className="text-center py-12 border-dashed border-border">
            <CardContent>
               <p className="text-muted-foreground">You currently have no active projects assigned.</p>
            </CardContent>
           </Card>
        )}
      </section>

      {/* Tasks Requiring Approval Section */}
       <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Tasks Overview</h2>
         {tasks.length > 0 ? (
         <Card className="shadow-md border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Name</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.name}</TableCell>
                   <TableCell className="text-muted-foreground">{projects.find(p => p.id === task.projectId)?.name || 'N/A'}</TableCell>
                  <TableCell>
                     <Badge variant="outline" className={`capitalize text-xs ${taskStatusColors[task.status]}`}>
                        {task.status === 'inprogress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{task.dueDate ? format(new Date(task.dueDate), 'PP') : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    {/* Show Approve button only if task is 'inprogress' or 'todo' and requires approval (logic TBD) */}
                    {(task.status === 'inprogress' || task.status === 'todo') && (
                       <Button variant="secondary" size="sm" onClick={() => handleApproveTask(task.id)}>
                         <Check className="mr-2 h-4 w-4" /> Approve
                       </Button>
                    )}
                      {task.status === 'done' && (
                         <span className="text-xs text-secondary">Completed</span>
                      )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
         </Card>
         ) : (
            <Card className="text-center py-12 border-dashed border-border">
                <CardContent>
                <p className="text-muted-foreground">No tasks assigned or requiring attention.</p>
                </CardContent>
            </Card>
         )}
       </section>

      {/* Invoices Section */}
       <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Your Invoices</h2>
         {invoices.length > 0 ? (
          <Card className="shadow-md border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
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
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell className="text-right font-semibold text-primary">${invoice.totalAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                     <Badge variant="outline" className={`capitalize text-xs ${invoiceStatusVariant(invoice.status)}`}>
                       {invoice.status}
                     </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(invoice.issueDate), 'PP')}</TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(invoice.dueDate), 'PP')}</TableCell>
                  <TableCell className="text-right">
                    {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                       <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" size="sm" onClick={() => handlePayInvoice(invoice.id)}>
                         <CreditCard className="mr-2 h-4 w-4" /> Pay Now
                       </Button>
                    )}
                     {invoice.status === 'paid' && (
                         <span className="text-xs text-secondary font-medium">Paid</span>
                     )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
         </Card>
         ) : (
           <Card className="text-center py-12 border-dashed border-border">
            <CardContent>
               <p className="text-muted-foreground">You have no invoices at the moment.</p>
            </CardContent>
           </Card>
         )}
       </section>
    </div>
  );
}
