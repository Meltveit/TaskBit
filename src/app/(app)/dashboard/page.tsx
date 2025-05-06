import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Briefcase, FileText, PlusCircle, ArrowRight, Clock, CalendarCheck2, List, AlertTriangle, Bell } from "lucide-react";
import type { Project, Invoice, Task, ActivityLog } from '@/lib/definitions';
import { getProjects, getInvoices, getWeeklyHoursTracked, getUpcomingTasks, getRecentActivity } from '@/lib/definitions';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress"; // Import Progress component
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from 'date-fns';

// Fetch all necessary data for the dashboard
async function getDashboardData() {
  const allProjects = await getProjects();
  const allInvoices = await getInvoices();
  const weeklyHours = await getWeeklyHoursTracked();
  const upcomingTasks = await getUpcomingTasks(3); // Limit to 3 upcoming tasks
  const recentActivity = await getRecentActivity(5); // Limit to 5 recent activities

  const activeProjects = allProjects.filter(p => p.status === 'active');
  const pendingInvoices = allInvoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue');
  const pendingInvoicesTotal = pendingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  // Calculate overall project progress (simplified example)
  const totalTasks = activeProjects.reduce((sum, p) => sum + p.tasks.length, 0);
  const completedTasks = activeProjects.reduce((sum, p) => sum + p.tasks.filter(t => t.status === 'done').length, 0);
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;


  return {
    activeProjectsCount: activeProjects.length,
    pendingInvoicesTotal,
    pendingInvoicesCount: pendingInvoices.length,
    weeklyHours,
    upcomingTasks,
    recentActivity,
    overallProgress,
  };
}

// Helper to format relative time
const formatRelativeTime = (dateString: string): string => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return "Invalid date";
  }
};

export default async function DashboardPage() {
  const {
    activeProjectsCount,
    pendingInvoicesTotal,
    pendingInvoicesCount,
    weeklyHours,
    upcomingTasks,
    recentActivity,
    overallProgress,
  } = await getDashboardData();

  return (
    <div className="space-y-8">
      {/* Header is now part of AppLayout */}

      {/* Overview Section */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Overview</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Active Projects Card */}
          <Card className="shadow-lg border-border hover:shadow-teal transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
              <Briefcase className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{activeProjectsCount}</div>
              <Progress value={overallProgress} className="mt-2 h-2 bg-muted" indicatorClassName="bg-secondary" />
              <p className="text-xs text-muted-foreground mt-1">{overallProgress}% completion (overall)</p>
               <Link href="/projects" className="block mt-3 text-sm text-secondary hover:underline">
                View All Projects <ArrowRight className="inline h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          {/* Pending Invoices Card */}
          <Card className="shadow-lg border-border hover:shadow-teal transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Invoices</CardTitle>
              <FileText className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">${pendingInvoicesTotal.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">{pendingInvoicesCount} invoice(s) pending</p>
               <Link href="/invoices?status=pending" className="block mt-3">
                 <Button variant="default" size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto">
                    View Pending
                 </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Hours Tracked Card */}
           <Card className="shadow-lg border-border hover:shadow-teal transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hours Tracked (This Week)</CardTitle>
              <Clock className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{weeklyHours.toFixed(1)}h</div>
               <p className="text-xs text-muted-foreground mt-1">Based on manual entries</p>
               {/* Link to Time Tracking Page - uncomment when ready */}
               {/* <Link href="/time-tracking" className="block mt-3"> */}
                 <Button variant="secondary" size="sm" className="mt-3 w-full sm:w-auto" disabled> {/* Button disabled until page exists */}
                    Track Time
                 </Button>
              {/* </Link> */}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines Card */}
          <Card className="shadow-lg border-border hover:shadow-teal transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Deadlines</CardTitle>
              <CalendarCheck2 className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
               {upcomingTasks.length > 0 ? (
                <ul className="space-y-2">
                  {upcomingTasks.map((task: Task) => (
                    <li key={task.id} className="text-sm">
                      <Link href={`/projects/${task.projectId}`} className="font-medium text-foreground hover:underline">{task.name}</Link>
                      <p className="text-xs text-muted-foreground">
                        Due: {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming deadlines within 7 days.</p>
              )}
              <Link href="/projects?view=calendar" className="block mt-3 text-sm text-secondary hover:underline">
                View Calendar <ArrowRight className="inline h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Activity Section */}
       <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Recent Activity</h2>
         <Card className="shadow-md border-border">
            <CardContent className="p-0">
            {recentActivity.length > 0 ? (
                 <ScrollArea className="h-[250px]">
                    <ul className="divide-y divide-border">
                        {recentActivity.map((activity: ActivityLog) => (
                        <li key={activity.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                           <div className="flex items-center gap-3">
                             <div className="p-2 bg-muted rounded-full">
                                {activity.type === 'project' && <Briefcase className="h-4 w-4 text-muted-foreground" />}
                                {activity.type === 'task' && <List className="h-4 w-4 text-muted-foreground" />}
                                {activity.type === 'invoice' && <FileText className="h-4 w-4 text-muted-foreground" />}
                             </div>
                             <div>
                                <p className="text-sm font-medium text-foreground">{activity.description}</p>
                                <p className="text-xs text-muted-foreground">{formatRelativeTime(activity.timestamp)}</p>
                             </div>
                           </div>
                           {/* Optional: Add an action button or link */}
                         </li>
                        ))}
                    </ul>
                 </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-[250px] text-center p-6">
                  <Bell className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No recent activity to display.</p>
                   <p className="text-xs text-muted-foreground mt-1">Start working on projects or invoices!</p>
                </div>
              )}
            </CardContent>
         </Card>
       </section>

        {/* Optional: Quick Actions */}
       <section>
         <div className="flex flex-wrap gap-4">
            <Link href="/projects/new">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <PlusCircle className="mr-2 h-4 w-4" /> New Project
              </Button>
            </Link>
            <Link href="/invoices/new">
              <Button variant="secondary">
                <PlusCircle className="mr-2 h-4 w-4" /> New Invoice
              </Button>
            </Link>
              {/* Add more quick actions as needed */}
         </div>
       </section>
    </div>
  );
}

// Define Progress indicatorClassName type explicitly if needed, or rely on inference
interface ProgressProps extends React.ComponentPropsWithoutRef<typeof Progress> {
  indicatorClassName?: string;
}

const CustomProgress = ({ indicatorClassName, ...props }: ProgressProps) => (
  <Progress {...props} />
);
