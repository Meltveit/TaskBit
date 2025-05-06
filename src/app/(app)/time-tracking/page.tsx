
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Play, Pause, Square, Edit, Trash2, Download, Calendar as CalendarIcon, Loader2 } from 'lucide-react'; // Added Loader2
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, differenceInSeconds } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Project, Task, TimeEntry } from '@/lib/definitions'; // Use existing definitions
import { getProjects, getTasksByProjectId, getTimeEntries, getTimeReport } from '@/lib/definitions'; // Fetch real data definitions
import { createTimeEntryAction, updateTimeEntryAction, deleteTimeEntryAction } from '@/lib/actions'; // Import actions correctly
import { useToast } from '@/hooks/use-toast'; // For notifications

// Helper function to format seconds into HH:MM:SS
const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export default function TimeTrackingPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [timesheet, setTimesheet] = useState<TimeEntry[]>([]);
  const [reportData, setReportData] = useState<{ name: string, hours: number }[]>([]);
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [reportProject, setReportProject] = useState<string | undefined>("all-projects"); // Use non-empty value
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingTimesheet, setIsLoadingTimesheet] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isTimerActionLoading, setIsTimerActionLoading] = useState(false);

  const { toast } = useToast();

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      setIsLoadingProjects(true);
      setIsLoadingTimesheet(true);
      try {
        const fetchedProjects = await getProjects();
        setProjects(fetchedProjects);

        const fetchedTimesheet = await getTimeEntries();
        setTimesheet(fetchedTimesheet);

        // Fetch initial report data (all projects, all time)
        await handleGenerateReport(true); // Pass flag to indicate initial load

      } catch (error) {
        toast({ title: "Error Loading Data", description: "Could not fetch projects or timesheet.", variant: "destructive" });
      } finally {
        setIsLoadingProjects(false);
        setIsLoadingTimesheet(false);
      }
    }
    fetchData();
  }, [toast]); // Added toast dependency

  // Fetch tasks when project changes
  useEffect(() => {
    async function fetchTasks() {
      if (selectedProjectId) {
        try {
          const fetchedTasks = await getTasksByProjectId(selectedProjectId);
          setTasks(fetchedTasks);
          setSelectedTaskId(undefined); // Reset task selection when project changes
        } catch (error) {
          toast({ title: "Error Loading Tasks", description: "Could not fetch tasks for the selected project.", variant: "destructive" });
          setTasks([]);
        }
      } else {
        setTasks([]);
        setSelectedTaskId(undefined);
      }
    }
    fetchTasks();
  }, [selectedProjectId, toast]); // Added toast dependency

  // Timer Logic
  const startTimer = useCallback(() => {
    if (!selectedProjectId) {
      toast({ title: "Select Project", description: "Please select a project before starting the timer.", variant: "destructive" });
      return;
    }
    if (!isTimerRunning) {
      const now = new Date();
      setStartTime(now);
      setIsTimerRunning(true);
      timerIntervalRef.current = setInterval(() => {
        // Calculate elapsed time since start, add to any previously accumulated time (e.g., from pause)
        setTimerSeconds(prevSeconds => differenceInSeconds(new Date(), now) + prevSeconds);
      }, 1000);
       toast({ title: "Timer Started", description: `Tracking time for ${projects.find(p => p.id === selectedProjectId)?.name || 'selected project'}.` });
    }
  }, [isTimerRunning, selectedProjectId, projects, toast]); // Added projects, toast dependency

  const pauseTimer = useCallback(() => {
    if (isTimerRunning && timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      setIsTimerRunning(false);
       // Keep accumulated timerSeconds
       toast({ title: "Timer Paused", description: "Timer is paused. Accumulated time is saved." });
    }
  }, [isTimerRunning, toast]); // Added toast dependency

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


      const newEntryData: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'> = {
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
        setTimesheet(prev => [savedEntry, ...prev].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())); // Add and re-sort
        toast({ title: "Time Logged", description: `Successfully logged ${formatDuration(duration)}.` });
      } catch (error) {
        toast({ title: "Error Saving Time", description: "Could not save time entry.", variant: "destructive" });
      }
    } else if (timerSeconds > 0) {
       // Case where timer was paused and then stopped without restarting
       toast({ title: "Timer Stopped", description: `Timer stopped with ${formatDuration(timerSeconds)} recorded, but no active start time detected. Discarding.`, variant: "destructive" });
    }

    setIsTimerRunning(false);
    setTimerSeconds(0);
    setStartTime(null);
    setIsTimerActionLoading(false);
    // Optionally clear selected project/task after stopping
    // setSelectedProjectId(undefined);
    // setSelectedTaskId(undefined);
  }, [startTime, timerSeconds, selectedProjectId, selectedTaskId, projects, tasks, toast]); // Added toast dependency

  useEffect(() => {
    // Cleanup interval on unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Handlers for Timesheet Actions
  const handleEditEntry = (id: string) => {
    console.log("Edit time entry:", id);
    toast({ title: "Edit Feature", description: "Editing time entries is not yet implemented.", variant: "default" });
    // Open modal with entry details
  };

  const handleDeleteEntry = async (id: string) => {
    // Optimistic UI update
    const originalTimesheet = [...timesheet];
    setTimesheet(prev => prev.filter(entry => entry.id !== id));

    try {
      await deleteTimeEntryAction(id);
      toast({ title: "Entry Deleted", description: "Time entry deleted successfully." });
    } catch (error) {
      setTimesheet(originalTimesheet); // Revert UI on error
      toast({ title: "Error Deleting", description: "Could not delete time entry.", variant: "destructive" });
    }
  };

  // Handlers for Report Actions
  const handleGenerateReport = useCallback(async (initialLoad = false) => {
    if (!initialLoad) { // Don't show loading indicator on initial page load fetch
       setIsLoadingReport(true);
    }
    console.log("Generate report with filters:", { fromDate, toDate, reportProject });
    try {
      const fetchedReportData = await getTimeReport({
        fromDate: fromDate?.toISOString(),
        toDate: toDate?.toISOString(),
        // Convert "all-projects" back to undefined or handle appropriately in backend/definitions
        projectId: reportProject === "all-projects" ? undefined : reportProject,
      });
      setReportData(fetchedReportData);
       if (!initialLoad) {
         toast({ title: "Report Generated", description: "Report data updated based on filters." });
       }
    } catch (error) {
       if (!initialLoad) {
         toast({ title: "Error Generating Report", description: "Could not fetch report data.", variant: "destructive" });
       }
    } finally {
      if (!initialLoad) {
         setIsLoadingReport(false);
      }
    }
  }, [fromDate, toDate, reportProject, toast]);

  const handleExportTimesheet = () => {
    console.log("Export timesheet with filters:", { fromDate, toDate, reportProject });
     toast({ title: "Export Feature", description: "Exporting timesheets is not yet implemented.", variant: "default" });
    // API Call Placeholder: GET /api/timesheet/export with filter params
    // Trigger file download
  };


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-primary">Time Tracking</h1>

      {/* Timer Section */}
      <Card className="shadow-lg border-muted/50">
        <CardHeader>
          <CardTitle className="text-xl">Track Your Time</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Project Select */}
            <div className="space-y-1">
              <label htmlFor="project-select" className="text-sm font-medium text-foreground">Project</label>
              {isLoadingProjects ? (
                <Select disabled>
                  <SelectTrigger><SelectValue placeholder="Loading projects..." /></SelectTrigger>
                </Select>
              ) : (
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={isTimerRunning}>
                  <SelectTrigger id="project-select">
                    <SelectValue placeholder="Select project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Task Select (Optional) */}
            <div className="space-y-1">
              <label htmlFor="task-select" className="text-sm font-medium text-foreground">Task (Optional)</label>
              <Select value={selectedTaskId} onValueChange={setSelectedTaskId} disabled={!selectedProjectId || tasks.length === 0 || isTimerRunning}>
                <SelectTrigger id="task-select">
                  <SelectValue placeholder={!selectedProjectId ? "Select project first" : (tasks.length === 0 ? "No tasks available" : "Select task...")} />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map(task => (
                    <SelectItem key={task.id} value={task.id}>{task.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

             {/* Timer Display */}
            <div className={`flex items-center justify-center p-4 rounded-md ${isTimerRunning ? 'border-2 border-secondary' : 'border border-muted'}`}>
                <span className={`text-3xl font-mono font-bold ${isTimerRunning ? 'text-secondary' : 'text-foreground'}`}>
                {formatDuration(timerSeconds)}
                </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          {!isTimerRunning ? (
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3"
              onClick={startTimer}
              disabled={!selectedProjectId || isTimerActionLoading}
            >
              {isTimerActionLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
              Start
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="px-6 py-3"
              onClick={pauseTimer}
              disabled={isTimerActionLoading}
            >
              {isTimerActionLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Pause className="mr-2 h-5 w-5" />}
              Pause
            </Button>
          )}
          <Button
            variant="destructive"
            className="px-6 py-3"
            onClick={stopTimer}
            disabled={(timerSeconds === 0 && !isTimerRunning) || isTimerActionLoading}
          >
            {isTimerActionLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Square className="mr-2 h-5 w-5" />}
            Stop
          </Button>
        </CardFooter>
      </Card>


      {/* Timesheet Table Section */}
      <Card className="shadow-lg border-muted/50">
        <CardHeader>
          <CardTitle className="text-xl">Timesheet</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTimesheet ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : timesheet.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timesheet.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{format(new Date(entry.startTime), 'PP')}</TableCell> {/* Format start time date */}
                    <TableCell>{entry.projectName}</TableCell>
                    <TableCell>{entry.taskName || '-'}</TableCell>
                    <TableCell className="text-right">{formatDuration(entry.durationSeconds)}</TableCell>
                    <TableCell>{entry.notes || '-'}</TableCell>
                    <TableCell className="text-right">
                       <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-secondary hover:bg-secondary/10" onClick={() => handleEditEntry(entry.id)}>
                             <Edit className="h-4 w-4" />
                             <span className="sr-only">Edit</span>
                          </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteEntry(entry.id)}>
                             <Trash2 className="h-4 w-4" />
                             <span className="sr-only">Delete</span>
                          </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">No time entries yet. Start the timer to log your work!</p>
          )}
        </CardContent>
      </Card>

       {/* Report Section */}
      <Card className="shadow-lg border-muted/50">
        <CardHeader>
          <CardTitle className="text-xl">Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
           {/* Filters */}
          <div className="flex flex-wrap gap-4 items-end">
             {/* Date Range Picker */}
            <div className="flex gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !fromDate && "text-muted-foreground"
                        )}
                        disabled={isLoadingReport}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fromDate ? format(fromDate, "PPP") : <span>From date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus />
                    </PopoverContent>
                </Popover>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !toDate && "text-muted-foreground"
                        )}
                         disabled={isLoadingReport}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {toDate ? format(toDate, "PPP") : <span>To date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={toDate} onSelect={setToDate} initialFocus />
                    </PopoverContent>
                </Popover>
            </div>
             {/* Project Filter */}
            <div className="min-w-[200px]">
              <Select value={reportProject} onValueChange={setReportProject} disabled={isLoadingReport || isLoadingProjects}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by project..." />
                </SelectTrigger>
                <SelectContent>
                  {/* Changed value from "all" to "all-projects" */}
                  <SelectItem value="all-projects">All Projects</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <Button variant="secondary" onClick={() => handleGenerateReport(false)} disabled={isLoadingReport}>
                {isLoadingReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                Apply Filters
             </Button>
          </div>

           {/* Chart */}
          <div className="h-[300px] w-full">
             {isLoadingReport ? (
                 <div className="flex justify-center items-center h-full">
                     <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
             ) : reportData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}h`}/>
                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }}/>
                    <Bar dataKey="hours" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
             ) : (
                <p className="text-center text-muted-foreground pt-10">No report data available for the selected filters.</p>
             )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleExportTimesheet}>
            <Download className="mr-2 h-4 w-4" /> Export Timesheet (CSV/PDF)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}


    

