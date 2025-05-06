"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import type { Task } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import { createTaskAction, updateTaskAction } from "@/lib/actions";
import { useRouter } from "next/navigation";

const taskFormSchema = z.object({
  name: z.string().min(2, {
    message: "Task name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  status: z.enum(["todo", "inprogress", "done"]),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  projectId: string;
  task?: Task;
  onFormSubmit?: () => void; // Callback to close dialog or refresh list
}

export function TaskForm({ projectId, task, onFormSubmit }: TaskFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const isEditing = !!task;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: task?.name || "",
      description: task?.description || "",
      status: task?.status || "todo",
    },
  });

  async function onSubmit(data: TaskFormValues) {
    try {
      if (isEditing && task) {
        await updateTaskAction(projectId, task.id, data);
        toast({ title: "Task Updated", description: "The task has been successfully updated." });
      } else {
        await createTaskAction(projectId, data);
        toast({ title: "Task Created", description: "The new task has been successfully created." });
      }
      onFormSubmit?.();
      router.refresh(); // Refresh current page to show updated task list
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} task. Please try again.`,
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Name</FormLabel>
              <FormControl>
                <Input placeholder="E.g., Design homepage mockups" {...field} />
              </FormControl>
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
                  placeholder="Add more details about the task."
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
                    <SelectValue placeholder="Select task status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="inprogress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (isEditing ? "Saving..." : "Adding...") : (isEditing ? "Save Changes" : "Add Task")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
