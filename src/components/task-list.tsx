
"use client";

import type { Task } from "@/lib/definitions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Keep Card, CardHeader, CardTitle
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, PlusCircle, ListChecks, ListTodo, CheckCircle } from "lucide-react"; // Adjusted icons
import {
  Dialog,
  DialogContent,
  DialogDescription, // Added DialogDescription
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TaskForm } from "./task-form";
import { useState } from "react";
import { deleteTaskAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TaskListProps {
  projectId: string;
  tasks: Task[];
}

export function TaskList({ projectId, tasks: initialTasks }: TaskListProps) {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const { toast } = useToast();
  const router = useRouter();

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsFormModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingTask(undefined); // Ensure we are creating, not editing
    setIsFormModalOpen(true);
  }

  const handleFormSubmit = () => {
    setIsFormModalOpen(false);
    setEditingTask(undefined);
    // Tasks will be updated via router.refresh() in TaskForm
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTaskAction(projectId, taskId);
      setTasks(currentTasks => currentTasks.filter(task => task.id !== taskId));
      toast({ title: "Task Deleted", description: "The task has been successfully deleted." });
      router.refresh(); // Re-sync state if needed
    } catch (error) {
      toast({
        title: "Error Deleting Task",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const taskStatusIcons = {
    todo: <ListTodo className="h-4 w-4 mr-1.5" />,
    inprogress: <ListChecks className="h-4 w-4 mr-1.5" />,
    done: <CheckCircle className="h-4 w-4 mr-1.5" />,
  };

  const taskStatusColors: Record<Task['status'], string> = {
    todo: 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200',
    inprogress: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200',
    done: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200',
  };

  return (
    <Card className="shadow-lg border border-border/60">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
        <CardTitle className="text-xl text-foreground">Tasks</CardTitle>
        <Button variant="secondary" size="sm" onClick={openCreateModal}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </CardHeader>
      <CardContent className="p-4">
        {tasks.length > 0 ? (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="p-4 border border-border/50 rounded-lg bg-card hover:shadow-md transition-shadow flex items-start justify-between gap-4"
              >
                <div className="flex-grow">
                  <h4 className="font-semibold text-foreground">{task.name}</h4>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                  )}
                   <div className="mt-2 flex items-center">
                    <Badge variant="outline" className={`capitalize text-xs ${taskStatusColors[task.status]}`}>
                      {taskStatusIcons[task.status]}
                      {task.status === 'inprogress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1">
                  {/* Edit Button (Opens Dialog) */}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-secondary" onClick={() => openEditModal(task)}>
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Edit Task</span>
                  </Button>

                  {/* Delete Button (Opens Alert Dialog) */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Task</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the task "{task.name}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteTask(task.id)} className="bg-destructive hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <ListChecks className="mx-auto h-12 w-12 mb-4" />
            <p>No tasks found for this project.</p>
            <Button variant="link" className="mt-2 text-primary" onClick={openCreateModal}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add the first task
            </Button>
          </div>
        )}
      </CardContent>

      {/* Shared Dialog for Create/Edit */}
       <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
              <DialogDescription>
                {editingTask ? "Update the details of this task." : "Fill in the details to add a new task to the project."}
              </DialogDescription>
            </DialogHeader>
            <TaskForm
              projectId={projectId}
              task={editingTask}
              onFormSubmit={handleFormSubmit}
            />
          </DialogContent>
        </Dialog>
    </Card>
  );
}
