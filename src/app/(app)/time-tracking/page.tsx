"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Stop, Clock, Edit, Trash2, FileText } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { getProjects, getTimeEntries } from "@/lib/db-models";
import { createTimeEntryAction, deleteTimeEntryAction } from "@/lib/actions";
import type { Project, Task, TimeEntry } from "@/lib/db-models";

export default function TimeTrackingPage() {
  const { toast } = useToast();
  
  // State for projects, tasks, and timesheet
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timesheet, setTimesheet] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Timer state
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isTimerActionLoading, setIsTimerActionLoading] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectsData = await getProjects();
        setProjects(projectsData);
        
        const timesheetData = await getTimeEntries();
        setTimesheet(timesheetData);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching time tracking data:", error);
        toast({ 
          title: "Error", 
          description: "Failed to load time tracking data.", 
          variant: "destructive" 
        });
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  // Update tasks when project selection changes
  useEffect(() => {
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId);
      if (project) {
        setTasks(project.tasks);
      } else {
        setTasks([]);
      }
    } else {
      setTasks([]);
    }
    // Clear task selection when project changes
    setSelectedTaskId("");
  }, [selectedProjectId, projects]);

  // Timer interval
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning]);

  // Format duration for display
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (e) {
      return "Invalid date";
    }
  };

  // Start timer
  const startTimer = () => {
    if (!selectedProjectId) {
      toast({ 
        title: "Project Required", 
        description: "Please select a project before starting the timer.", 
        variant: "destructive" 
      });
      return;
    }
    
    setIsTimerRunning(true);
    if (!startTime) {
      setStartTime(new Date());
    }
  };

  // Pause timer
  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  // Stop timer
  const stopTimer = useCallback(async () => {
    setIsTimerActionLoading(true);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (startTime && selectedProjectId) {
      const endTime = new Date();
      // Use current timerSeconds value which includes time since last pause/start
      const duration = timerSeconds;
      const project = projects.find(p => p.id === selectedProjectId);
      const task = tasks.find(t => t.id === selectedTaskId);

      if (duration <= 0) {
        toast({ title: "Timer Stopped", description: "No time was recorded.", variant: "default" });
        setIsTimerRunning(false);
        setTimerSeconds(0);
        setStartTime(null);
        setIsTimerActionLoading(false);
        return;
      }

      const newEntryData: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt' | 'uid'> = {
        projectId: selectedProjectId,
        projectName: project?.name || 'Unknown Project',
        taskId: selectedTaskId,
        taskName: task?.name,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationSeconds: duration,
        // Add notes input later if needed
      };

      try {
        const savedEntry = await createTimeEntryAction(newEntryData);
        setTimesheet(prev => [savedEntry, ...prev].sort((a, b) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        )); 
        toast({ title: "Time Logged", description: `Successfully logged ${formatDuration(duration)}.` });
      } catch (error) {
        toast({ title: "Error Saving Time", description: "Could not save time entry.", variant: "destructive" });
      }
    } else if (timerSeconds > 0) {
      // Case where timer was paused and then stopped without restarting
      toast({ 
        title: "Timer Stopped", 
        description: `Timer stopped with ${formatDuration(timerSeconds)} recorded, but no active start time detected. Discarding.`, 
        variant: "destructive" 
      });
    }

    setIsTimerRunning(false);
    setTimerSeconds(0);
    setStartTime(null);
    setIsTimerActionLoading(false);
  }, [startTime, timerSeconds, selectedProjectId, selectedTaskId, projects, tasks, toast]);

  // Handle edit entry
  const handleEditEntry = (entry: TimeEntry) => {
    if (!entry.projectId) {
      toast({ 
        title: "Error", 
        description: "Cannot edit entry without project ID.", 
        variant: "destructive" 
      });
      return;
    }
    
    console.log("Edit time entry:", entry.id, "from project:", entry.projectId);
    toast({ 
      title: "Edit Feature", 
      description: "Editing time entries is not yet implemented.", 
      variant: "default" 
    });
    // Open modal with entry details
  };

  // Handle delete entry
  const handleDeleteEntry = async (entry: TimeEntry) => {
    if (!entry.projectId) {
      toast({ 
        title: "Error", 
        description: "Cannot delete entry without project ID.", 
        variant: "destructive" 
      });
      return;
    }
    
    // Optimistic UI update
    const originalTimesheet = [...timesheet];
    setTimesheet(prev => prev.filter(item => item.id !== entry.id));

    try {
      await deleteTimeEntryAction(entry.projectId, entry.id);
      toast({ title: "Entry Deleted", description: "Time entry deleted successfully." });
    } catch (error) {
      setTimesheet(originalTimesheet); // Revert UI on error
      toast({ 
        title: "Error Deleting", 
        description: "Could not delete time entry.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-primary">Time Tracking</h1>

      {/* Timer Card */}
      <Card className="shadow-lg border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-xl">
            <Clock className="mr-2 h-5 w-5 text-primary" /> Time Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Project Select */}
            <div>
              <label className="text-sm font-medium mb-1 block">Project</label>
              <Select 
                value={selectedProjectId} 
                onValueChange={setSelectedProjectId}
                disabled={isTimerRunning || isTimerActionLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Task Select */}
            <div>
              <label className="text-sm font-medium mb-1 block">Task (Optional)</label>
              <Select 
                value={selectedTaskId} 
                onValueChange={setSelectedTaskId}
                disabled={!selectedProjectId || isTimerRunning || isTimerActionLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific task</SelectItem>
                  {tasks.map(task => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center">
            {/* Timer Display */}
            <div className="text-4xl font-bold tabular-nums mb-4">
              {formatDuration(timerSeconds)}
            </div>
            
            {/* Timer Controls */}
            <div className="flex gap-2">
              {!isTimerRunning ? (
                <Button 
                  variant="secondary" 
                  onClick={startTimer} 
                  disabled={!selectedProjectId || isTimerActionLoading}
                >
                  <Play className="mr-2 h-4 w-4" /> Start
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={pauseTimer} 
                  disabled={isTimerActionLoading}
                >
                  <Pause className="mr-2 h-4 w-4" /> Pause
                </Button>
              )}
              <Button 
                className="bg-accent hover:bg-accent/90 text-accent-foreground" 
                onClick={stopTimer} 
                disabled={(timerSeconds === 0 && !isTimerRunning) || isTimerActionLoading}
              >
                <Stop className="mr-2 h-4 w-4" /> 
                {isTimerActionLoading ? "Saving..." : "Stop & Save"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timesheet Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Time Entries</h2>
        {timesheet.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project / Task</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timesheet.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="font-medium">{entry.projectName}</div>
                      {entry.taskName && (
                        <div className="text-xs text-muted-foreground">{entry.taskName}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDate(entry.startTime)}
                    </TableCell>
                    <TableCell>
                      {formatDuration(entry.durationSeconds)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-secondary hover:bg-secondary/10" 
                          onClick={() => handleEditEntry(entry)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                          onClick={() => handleDeleteEntry(entry)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : isLoading ? (
          <div className="text-center p-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading time entries...</p>
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">No Time Entries</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking time by selecting a project and clicking the Start button.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}