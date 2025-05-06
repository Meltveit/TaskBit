
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Play, Pause, Square, Edit, Trash2, Download, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, differenceInSeconds } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Project, Task } from '@/lib/definitions'; // Use existing definitions

// Dummy Data (replace with actual API calls)
interface TimeEntry {
  id: string;
  date: string; // ISO string
  projectId: string;
  projectName: string;
  taskId?: string;
  taskName?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  durationSeconds: number;
  notes?: string;
}

const dummyProjects: Project[] = [
  { id: '1', name: 'Website Redesign', status: 'active', tasks: [{ id: 't1', name: 'Homepage Design', projectId: '1', status: 'inprogress', createdAt: '', updatedAt: '' }, { id: 't2', name: 'About Us Page', projectId: '1', status: 'todo', createdAt: '', updatedAt: '' }], createdAt: '', updatedAt: '' },
  { id: '2', name: 'Mobile App Development', status: 'active', tasks: [{ id: 't3', name: 'User Authentication', projectId: '2', status: 'todo', createdAt: '', updatedAt: '' }], createdAt: '', updatedAt: '' },
];

const dummyTimesheet: TimeEntry[] = [
  { id: 'ts1', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), projectId: '1', projectName: 'Website Redesign', taskId: 't1', taskName: 'Homepage Design', startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(), endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), durationSeconds: 7200, notes: 'Initial design concepts' },
  { id: 'ts2', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), projectId: '2', projectName: 'Mobile App Development', taskId: 't3', taskName: 'User Authentication', startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000).toISOString(), endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), durationSeconds: 14400 },
];

// Dummy report data
const dummyReportData = [
  { name: 'Website Redesign', hours: 15.5 },
  { name: 'Mobile App Development', hours: 20.0 },
  { name: 'Marketing Campaign', hours: 8.0 },
];

// Helper function to format seconds into HH:MM:SS
const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export default function TimeTrackingPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [timesheet, setTimesheet] = useState<TimeEntry[]>(dummyTimesheet);
  const [reportData, setReportData] = useState(dummyReportData);
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [reportProject, setReportProject] = useState<string | undefined>("all");

  const projects = dummyProjects; // Use dummy data for now
  const tasks = projects.find(p => p.id === selectedProjectId)?.tasks || [];

  // Timer Logic
  const startTimer = useCallback(() => {
    if (!selectedProjectId) {
      alert("Please select a project first."); // Basic validation
      return;
    }
    if (!isTimerRunning) {
      const now = new Date();
      setStartTime(now);
      setIsTimerRunning(true);
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(prevSeconds => differenceInSeconds(new Date(), now) + prevSeconds);
      }, 1000);
    }
  }, [isTimerRunning, selectedProjectId]);

  const pauseTimer = useCallback(() => {
    if (isTimerRunning && timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      setIsTimerRunning(false);
    }
  }, [isTimerRunning]);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (startTime && selectedProjectId) {
      const endTime = new Date();
      const duration = differenceInSeconds(endTime, startTime) + timerSeconds; // Use accumulated seconds
      const project = projects.find(p => p.id === selectedProjectId);
      const task = tasks.find(t => t.id === selectedTaskId);

      const newEntry: TimeEntry = {
        id: `ts${timesheet.length + 1}`,
        date: startTime.toISOString(),
        projectId: selectedProjectId,
        projectName: project?.name || 'Unknown Project',
        taskId: selectedTaskId,
        taskName: task?.name,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationSeconds: duration,
        // Add notes input later if needed
      };

      console.log("Stopping timer, saving entry:", newEntry);
      // API Call Placeholder: POST /api/time with newEntry
      setTimesheet(prev => [newEntry, ...prev]);
    }
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setStartTime(null);
    // Optionally clear selected project/task after stopping
    // setSelectedProjectId(undefined);
    // setSelectedTaskId(undefined);
  }, [startTime, timerSeconds, selectedProjectId, selectedTaskId, projects, tasks, timesheet.length]);

  useEffect(() => {
    // Cleanup interval on unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Handlers for Timesheet Actions (placeholders)
  const handleEditEntry = (id: string) => {
    console.log("Edit time entry:", id);
    // Open modal with entry details
  };

  const handleDeleteEntry = (id: string) => {
    console.log("Delete time entry:", id);
    // API Call Placeholder: DELETE /api/time/:id
    setTimesheet(prev => prev.filter(entry => entry.id !== id));
  };

  // Handlers for Report Actions (placeholders)
  const handleGenerateReport = () => {
    console.log("Generate report with filters:", { fromDate, toDate, reportProject });
    // API Call Placeholder: GET /api/time/report with filter params
    // Update reportData state with response
  };

  const handleExportTimesheet = () => {
    console.log("Export timesheet with filters:", { fromDate, toDate, reportProject });
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
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger id="project-select">
                  <SelectValue placeholder="Select project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Task Select (Optional) */}
            <div className="space-y-1">
              <label htmlFor="task-select" className="text-sm font-medium text-foreground">Task (Optional)</label>
              <Select value={selectedTaskId} onValueChange={setSelectedTaskId} disabled={!selectedProjectId || tasks.length === 0}>
                <SelectTrigger id="task-select">
                  <SelectValue placeholder="Select task..." />
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
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3" onClick={startTimer} disabled={!selectedProjectId}>
              <Play className="mr-2 h-5 w-5" /> Start
            </Button>
          ) : (
            <Button variant="secondary" className="px-6 py-3" onClick={pauseTimer}>
              <Pause className="mr-2 h-5 w-5" /> Pause
            </Button>
          )}
          <Button variant="destructive" className="px-6 py-3" onClick={stopTimer} disabled={timerSeconds === 0 && !isTimerRunning}>
            <Square className="mr-2 h-5 w-5" /> Stop
          </Button>
        </CardFooter>
      </Card>


      {/* Timesheet Table Section */}
      <Card className="shadow-lg border-muted/50">
        <CardHeader>
          <CardTitle className="text-xl">Timesheet</CardTitle>
        </CardHeader>
        <CardContent>
          {timesheet.length > 0 ? (
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
                    <TableCell>{format(new Date(entry.date), 'PP')}</TableCell>
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
              <Select value={reportProject} onValueChange={setReportProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by project..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <Button variant="secondary" onClick={handleGenerateReport}>Apply Filters</Button>
          </div>

           {/* Chart */}
          <div className="h-[300px] w-full">
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
