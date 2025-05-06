import { getProjectById, getTasksByProjectId } from '@/lib/definitions';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskList } from '@/components/task-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';

export default async function ProjectDetailsPage({ params }: { params: { projectId: string } }) {
  const project = await getProjectById(params.projectId);
  
  if (!project) {
    notFound();
  }
  // Tasks are already part of the project object from getProjectById
  const tasks = project.tasks;


  const statusBadgeVariant = (status: 'active' | 'completed' | 'archived') => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'completed': return 'bg-blue-500 text-white';
      case 'archived': return 'bg-gray-500 text-white';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
          </Link>
        </Button>
        <Link href={`/projects/${project.id}/edit`}>
          <Button variant="secondary">
            <Edit className="mr-2 h-4 w-4" /> Edit Project
          </Button>
        </Link>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-3xl font-bold">{project.name}</CardTitle>
            <Badge className={`capitalize ${statusBadgeVariant(project.status)}`}>{project.status}</Badge>
          </div>
          {project.description && (
            <CardDescription className="text-md pt-2">{project.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="font-semibold">Created:</span> {new Date(project.createdAt).toLocaleDateString()}</p>
          <p><span className="font-semibold">Last Updated:</span> {new Date(project.updatedAt).toLocaleDateString()}</p>
        </CardContent>
      </Card>

      <TaskList projectId={project.id} tasks={tasks} />
    </div>
  );
}
