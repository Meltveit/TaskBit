
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Task } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import { createTaskAction, updateTaskAction } from "@/lib/actions";
import { useRouter } from "next/navigation";

// Updated schema to include optional dueDate
const taskFormSchema = z.object({
  name: z.string().min(2, {
    message: "Task name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  status: z.enum(["todo", "inprogress", "done"]),
  dueDate: z.date().optional(), // Make dueDate optional
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
      dueDate: task?.dueDate ? new Date(task.dueDate) : undefined, // Initialize date if it exists
    },
  });

  async function onSubmit(data: TaskFormValues) {
     const payload = {
      ...data,
      dueDate: data.dueDate?.toISOString(), // Convert date to ISO string if present
    };

    try {
      if (isEditing && task) {
        await updateTaskAction(projectId, task.id, payload);
        toast({ title: "Task Updated", description: "The task has been successfully updated." });
      } else {
        await createTaskAction(projectId, payload);
        toast({ title: "Task Created", description: "The new task has been successfully created." });
      }
      onFormSubmit?.();
      router.refresh(); // Refresh current page to show updated task list
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} task. Please try again. Error: ${error instanceof Error ? error.message : String(error)}`,
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col pt-0.5"> {/* Adjust alignment */}
                <FormLabel>Due Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP") // Format date nicely
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      // disabled={(date) => date < new Date("1900-01-01")} // Allow past dates if needed
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
           <Button type="button" variant="ghost" onClick={onFormSubmit}>
              Cancel
           </Button>
          {/* Use Yellow for primary action */}
          <Button type="submit" disabled={form.formState.isSubmitting} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {form.formState.isSubmitting ? (isEditing ? "Saving..." : "Adding...") : (isEditing ? "Save Changes" : "Add Task")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
