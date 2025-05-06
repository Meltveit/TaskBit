import { ProjectForm } from '@/components/project-form';
import { getProjectById } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { notFound } from 'next/navigation';

export default async function EditProjectPage({ params }: { params: { projectId: string } }) {
  const project = await getProjectById(params.projectId);

  if (!project) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Project: {project.name}</CardTitle>
          <CardDescription>Update the details for your project.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm project={project} />
        </CardContent>
      </Card>
    </div>
  );
}
