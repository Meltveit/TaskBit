// src/app/(app)/time-tracking/page.tsx (only key modified functions)

// Timer stop function
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

// Updated handler for editing an entry 
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

// Updated handler for deleting an entry
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

// Modified the table cell for actions in the timesheet table
// Inside your TableRow mapping for each time entry:
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