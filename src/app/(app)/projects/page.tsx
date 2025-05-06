import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
import type { Project } from '@/lib/definitions';
import { getProjects } from '@/lib/definitions';
import { Badge } from '@/components/ui/badge';
import { DeleteProjectButton } from '@/components/delete-buttons';

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Projects</h1>
        <Link href="/projects/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Project
          </Button>
        </Link>
      </div>

      {projects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <Badge 
                    variant={project.status === 'active' ? 'default' : project.status === 'completed' ? 'secondary' : 'outline'}
                    className={`capitalize ${project.status === 'active' ? 'bg-green-500 text-white' : project.status === 'completed' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'}`}
                  >
                    {project.status}
                  </Badge>
                </div>
                <CardDescription className="h-12 overflow-hidden text-ellipsis">
                  {project.description || 'No description provided.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  Tasks: {project.tasks.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  Last Updated: {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                 <Link href={`/projects/${project.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="mr-1 h-4 w-4" /> View
                  </Button>
                </Link>
                <Link href={`/projects/${project.id}/edit`}>
                  <Button variant="secondary" size="sm">
                    <Edit className="mr-1 h-4 w-4" /> Edit
                  </Button>
                </Link>
                <DeleteProjectButton projectId={project.id} />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="col-span-full text-center py-12">
          <CardContent>
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
            <p className="text-muted-foreground mb-4">Start by creating your first project.</p>
            <Link href="/projects/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Project
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Briefcase(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}
