"use client";

import type { Task } from "@/lib/definitions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, PlusCircle, ListChecks, ListTodo, ListX } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const { toast } = useToast();
  const router = useRouter();

  const handleTaskCreatedOrUpdated = () => {
    setIsCreateModalOpen(false);
    setEditingTask(undefined);
    // Tasks will be updated via router.refresh() in TaskForm
  };
  
  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTaskAction(projectId, taskId);
      setTasks(currentTasks => currentTasks.filter(task => task.id !== taskId));
      toast({ title: "Task Deleted", description: "The task has been successfully deleted." });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error Deleting Task",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const taskStatusIcons = {
    todo: <ListTodo className="h-4 w-4 mr-2 text-yellow-500" />,
    inprogress: <ListChecks className="h-4 w-4 mr-2 text-blue-500" />,
    done: <ListX className="h-4 w-4 mr-2 text-green-500" />,
  };

  const taskStatusColors: Record<Task['status'], string> = {
    todo: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    inprogress: 'bg-blue-100 text-blue-800 border-blue-300',
    done: 'bg-green-100 text-green-800 border-green-300',
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tasks</CardTitle>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
            </DialogHeader>
            <TaskForm
              projectId={projectId}
              task={editingTask}
              onFormSubmit={handleTaskCreatedOrUpdated}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {tasks.length > 0 ? (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">{task.name}</h4>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingTask(task)}>
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Edit Task</span>
                        </Button>
                      </DialogTrigger>
                      {/* Re-use DialogContent for editing */}
                       <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Edit Task</DialogTitle>
                        </DialogHeader>
                        <TaskForm
                          projectId={projectId}
                          task={task} // Pass the current task to edit
                          onFormSubmit={() => {
                            setEditingTask(undefined); // Close this specific dialog by resetting editingTask
                          }}
                        />
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
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
                </div>
                <div className="mt-2 flex items-center">
                  <Badge variant="outline" className={`capitalize ${taskStatusColors[task.status]}`}>
                    {taskStatusIcons[task.status]}
                    {task.status}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tasks yet for this project.</p>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                    <Button variant="link" className="mt-2">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add the first task
                    </Button>
                </DialogTrigger>
                 <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                    </DialogHeader>
                    <TaskForm
                    projectId={projectId}
                    onFormSubmit={handleTaskCreatedOrUpdated}
                    />
                </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
