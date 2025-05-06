
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project } from "@/lib/definitions";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createProjectAction, updateProjectAction } from "@/lib/actions";

const projectFormSchema = z.object({
  name: z.string().min(2, {
    message: "Project name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  status: z.enum(["active", "completed", "archived"]),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  project?: Project;
}

export function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!project;

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: project?.name || "",
      description: project?.description || "",
      status: project?.status || "active",
    },
  });

  async function onSubmit(data: ProjectFormValues) {
    try {
      if (isEditing && project) {
        await updateProjectAction(project.id, data);
        toast({ title: "Project Updated", description: "The project details have been successfully updated." });
      } else {
        await createProjectAction(data);
        toast({ title: "Project Created", description: "The new project has been successfully created." });
      }
      router.push("/projects");
      router.refresh(); // Ensure data is re-fetched on the projects page
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} project. Please try again. Error: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input placeholder="E.g., New Marketing Campaign" {...field} />
              </FormControl>
              <FormDescription>
                The name of your project.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide a brief description of the project."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
           {/* Use ghost variant for Cancel button */}
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          {/* Use accent (Yellow) for primary action */}
          <Button type="submit" disabled={form.formState.isSubmitting} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {form.formState.isSubmitting ? (isEditing ? "Saving..." : "Creating...") : (isEditing ? "Save Changes" : "Create Project")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
