import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Briefcase, List, KanbanSquare, CheckCircle, Clock } from 'lucide-react';
import { getProjects } from '@/lib/db-models';
import { Badge } from '@/components/ui/badge';
import { DeleteProjectButton } from '@/components/delete-buttons';
import { format, isBefore } from 'date-fns';

// Loading component for Suspense
function ProjectsLoading() {
  return (
    <Card className="col-span-full py-12 shadow-md">
      <CardContent className="flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading projects...</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to determine project deadline (e.g., latest task due date)
const getProjectDeadline = (tasks: any[]): { date: string | null, isOverdue: boolean } => {
  if (!tasks || tasks.length === 0) return { date: null, isOverdue: false };

  const dueDates = tasks
    .map(task => task.dueDate ? new Date(task.dueDate).getTime() : 0)
    .filter(date => date > 0);

  if (dueDates.length === 0) return { date: null, isOverdue: false };

  const latestDueDate = new Date(Math.max(...dueDates));
  const isOverdue = isBefore(latestDueDate, new Date()) && 
                   !tasks.every(task => task.status === 'done');
                   
  return { 
    date: format(latestDueDate, 'MMM dd, yyyy'),
    isOverdue 
  };
};

// Helper function to calculate task completion
const getTasksCompleted = (tasks: any[]): { completed: number, total: number, percent: number } => {
  if (!tasks || tasks.length === 0) return { completed: 0, total: 0, percent: 0 };
  const completed = tasks.filter(task => task.status === 'done').length;
  const total = tasks.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percent };
};

// Helper to get status badge variant
const statusBadgeVariant = (status: 'active' | 'completed' | 'archived') => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
    case 'completed': return 'bg-secondary/20 text-secondary-foreground border-secondary/50 hover:bg-secondary/30';
    case 'archived': return 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200';
    default: return 'outline';
  }
};

// Main Project List Component
async function ProjectList() {
  // Fetch projects from Firestore via db-models
  const projects = await getProjects();
  
  if (projects.length === 0) {
    return (
      <Card className="col-span-full text-center py-12 shadow-md">
        <CardContent>
          <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-foreground">No Projects Yet</h3>
          <p className="text-muted-foreground mb-4">Start by creating your first project.</p>
          <Link href="/projects/new">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <PlusCircle className="mr-2 h-4 w-4" /> Create Project
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Tasks</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const { date: deadline, isOverdue } = getProjectDeadline(project.tasks);
            const { completed, total, percent } = getTasksCompleted(project.tasks);

            return (
              <TableRow key={project.id}>
                <TableCell className="font-medium">
                  <Link href={`/projects/${project.id}`} className="hover:underline text-foreground">
                    {project.name}
                  </Link>
                  <p className="text-xs text-muted-foreground truncate max-w-xs">
                    {project.description || 'No description'}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`capitalize text-xs ${statusBadgeVariant(project.status)}`}
                  >
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-secondary" />
                      <span className="text-sm text-muted-foreground">{completed}/{total}</span>
                    </div>
                    <div className="w-16 h-1 bg-muted mt-1 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-secondary rounded-full" 
                        style={{ width: `${percent}%` }} 
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {deadline ? (
                    <div className="flex items-center gap-1">
                      <Clock className={`h-3 w-3 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`} />
                      <span className={`text-sm ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                        {deadline}
                        {isOverdue && ' (Overdue)'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(project.updatedAt), 'PP')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/projects/${project.id}/edit`}>
                      <Button variant="secondary" size="sm">
                        <Edit className="mr-1 h-4 w-4" /> Edit
                      </Button>
                    </Link>
                    <DeleteProjectButton projectId={project.id} />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

// Main Projects Page
export default function ProjectsPage() {
  const currentView = 'list'; // Default to list view for now

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Projects</h1>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary">
            {currentView === 'list' ? <KanbanSquare className="mr-2 h-4 w-4" /> : <List className="mr-2 h-4 w-4" />}
            Toggle View
          </Button>
          <Link href="/projects/new">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Project
            </Button>
          </Link>
        </div>
      </div>

      <Suspense fallback={<ProjectsLoading />}>
        <ProjectList />
      </Suspense>
    </div>
  );
}