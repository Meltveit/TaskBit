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
import { PlusCircle, Edit, Trash2, Briefcase, List, KanbanSquare } from 'lucide-react';
import { getProjects } from '@/lib/db-models';
import { Badge } from '@/components/ui/badge';
import { DeleteProjectButton } from '@/components/delete-buttons';
import { format } from 'date-fns';

// Helper function to determine project deadline (e.g., latest task due date)
const getProjectDeadline = (tasks: any[]): string | null => {
  if (!tasks || tasks.length === 0) return null;

  const dueDates = tasks
    .map(task => task.dueDate ? new Date(task.dueDate).getTime() : 0)
    .filter(date => date > 0);

  if (dueDates.length === 0) return null;

  const latestDueDate = new Date(Math.max(...dueDates));
  return format(latestDueDate, 'MMM dd, yyyy');
};

// Helper function to calculate task completion
const getTasksCompleted = (tasks: any[]): string => {
  if (!tasks || tasks.length === 0) return "0/0";
  const completed = tasks.filter(task => task.status === 'done').length;
  return `${completed}/${tasks.length}`;
};

// Helper to get status badge variant
const statusBadgeVariant = (status: 'active' | 'completed' | 'archived') => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200';
      default: return 'outline';
    }
  };

export default async function ProjectsPage() {
  const projects = await getProjects();
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

      {projects.length > 0 ? (
        <Card className="shadow-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Tasks Completed</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => {
                const deadline = getProjectDeadline(project.tasks);
                const tasksCompleted = getTasksCompleted(project.tasks);

                return (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                     <Link href={`/projects/${project.id}`} className="hover:underline text-foreground">
                        {project.name}
                     </Link>
                     <p className="text-xs text-muted-foreground truncate max-w-xs">{project.description || 'No description'}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`capitalize text-xs ${statusBadgeVariant(project.status)}`}
                    >
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">{tasksCompleted}</TableCell>
                  <TableCell className="text-muted-foreground">{deadline || 'N/A'}</TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(project.updatedAt), 'PP')}</TableCell>
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
              )})}
            </TableBody>
          </Table>
        </Card>
      ) : (
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
      )}
    </div>
  );
}