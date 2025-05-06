import { getProjectById } from '@/lib/definitions'; // Removed getTasksByProjectId as tasks are included
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskList } from '@/components/task-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';
import { format } from 'date-fns'; // Import format for dates

export default async function ProjectDetailsPage({ params }: { params: { projectId: string } }) {
  const project = await getProjectById(params.projectId);

  if (!project) {
    notFound();
  }
  // Tasks are already part of the project object from getProjectById
  const tasks = project.tasks;

  // Helper to get status badge variant
  const statusBadgeVariant = (status: 'active' | 'completed' | 'archived') => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Back Button */}
        <Button variant="outline" asChild>
          <Link href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
          </Link>
        </Button>
        {/* Edit Button */}
        <Link href={`/projects/${project.id}/edit`}>
          <Button variant="secondary"> {/* Use Teal for secondary action */}
            <Edit className="mr-2 h-4 w-4" /> Edit Project
          </Button>
        </Link>
      </div>

      <Card className="shadow-xl border border-border/60">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            {/* Use CardTitle component */}
             <CardTitle className="text-2xl font-bold text-primary">{project.name}</CardTitle>
             <Badge variant="outline" className={`capitalize text-sm ${statusBadgeVariant(project.status)}`}>{project.status}</Badge>
          </div>
          {project.description && (
            // Use CardDescription component
            <CardDescription className="text-md pt-2 text-muted-foreground">{project.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p><span className="font-semibold text-foreground">Created:</span> {format(new Date(project.createdAt), 'PPP')}</p>
          <p><span className="font-semibold text-foreground">Last Updated:</span> {format(new Date(project.updatedAt), 'PPP')}</p>
        </CardContent>
      </Card>

      {/* TaskList remains the same */}
      <TaskList projectId={project.id} tasks={tasks} />
    </div>
  );
}
