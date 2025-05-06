export type Project = {
  id: string;
  name: string;
  description?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  tasks: Task[];
  status: 'active' | 'completed' | 'archived';
};

export type Task = {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: 'todo' | 'inprogress' | 'done';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  dueDate?: string; // ISO date string - Added for deadlines
};

export type Invoice = {
  id: string;
  projectId?: string; // Optional: invoice might not be tied to a project
  clientName: string;
  clientEmail: string;
  invoiceNumber: string;
  issueDate: string; // ISO date string
  dueDate: string; // ISO date string
  items: InvoiceItem[];
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
};

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

// New type for Recent Activity
export type ActivityLog = {
    id: string;
    timestamp: string; // ISO date string
    type: 'project' | 'task' | 'invoice' | 'time'; // Added 'time' type
    action: 'created' | 'updated' | 'deleted' | 'completed' | 'sent' | 'started' | 'stopped'; // Added timer actions
    description: string; // e.g., "Started timer for Task X"
};

// New type for Time Entry
export type TimeEntry = {
  id: string;
  projectId: string;
  projectName: string;
  taskId?: string;
  taskName?: string;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  durationSeconds: number;
  notes?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
};

// --- Dummy Data Stores ---
let projectsStore: Project[] = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Complete redesign of the company website.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    tasks: [
      { id: 't1', projectId: '1', name: 'Homepage Design', status: 'done', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() }, // Due in 2 days
      { id: 't2', projectId: '1', name: 'About Us Page', status: 'inprogress', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() }, // Due in 5 days
    ],
    status: 'active',
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'Develop a new mobile application for iOS and Android.',
     createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    tasks: [
       { id: 't3', projectId: '2', name: 'User Authentication', status: 'todo', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }, // Due in 7 days
       { id: 't4', projectId: '2', name: 'API Integration', status: 'todo', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() }, // Due in 10 days
    ],
    status: 'active',
  },
   {
    id: '3',
    name: 'Marketing Campaign',
    description: 'Launch Q3 marketing campaign.',
     createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    tasks: [
       { id: 't5', projectId: '3', name: 'Create Ad Copy', status: 'done', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString() }, // Due tomorrow
    ],
    status: 'active',
  },
];

let invoicesStore: Invoice[] = [
  {
    id: 'inv-001',
    clientName: 'Acme Corp',
    clientEmail: 'contact@acme.com',
    invoiceNumber: 'INV-2024-001',
    issueDate: new Date(2024, 6, 1).toISOString(),
    dueDate: new Date(2024, 6, 15).toISOString(),
    items: [
      { id: 'item1', description: 'Consulting Services', quantity: 10, unitPrice: 100, total: 1000 },
      { id: 'item2', description: 'Software License', quantity: 1, unitPrice: 500, total: 500 },
    ],
    totalAmount: 1500,
    status: 'sent',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv-002',
    projectId: '1',
    clientName: 'Beta Solutions',
    clientEmail: 'info@beta.com',
    invoiceNumber: 'INV-2024-002',
    issueDate: new Date(2024, 5, 20).toISOString(),
    dueDate: new Date(2024, 6, 5).toISOString(),
    items: [
      { id: 'item3', description: 'Website Design Phase 1', quantity: 1, unitPrice: 2000, total: 2000 },
    ],
    totalAmount: 2000,
    status: 'paid',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv-003',
    projectId: '2',
    clientName: 'Gamma Inc',
    clientEmail: 'finance@gamma.com',
    invoiceNumber: 'INV-2024-003',
    issueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // Due in 10 days
    items: [
      { id: 'item4', description: 'App Dev Sprint 1', quantity: 1, unitPrice: 3000, total: 3000 },
    ],
    totalAmount: 3000,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock time entries store
let timeEntriesStore: TimeEntry[] = [
  { id: 'te1', projectId: '1', projectName: 'Website Redesign', taskId: 't2', taskName: 'About Us Page', startTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), endTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), durationSeconds: 7200, notes: 'Draft content', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'te2', projectId: '2', projectName: 'Mobile App Development', taskId: 't3', taskName: 'User Authentication', startTime: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(), endTime: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), durationSeconds: 10800, notes: 'Setup Firebase Auth', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];


// Mock recent activity log
let activityLogStore: ActivityLog[] = [
  { id: 'a1', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), type: 'invoice', action: 'created', description: 'Created Invoice INV-2024-003' },
  { id: 'a2', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), type: 'task', action: 'completed', description: 'Completed Task: Create Ad Copy' },
   { id: 'a6', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), type: 'time', action: 'stopped', description: 'Stopped timer for: User Authentication (3h 0m)' }, // Added time entry log
  { id: 'a3', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), type: 'project', action: 'updated', description: 'Updated Project: Mobile App Development' },
  { id: 'a4', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), type: 'invoice', action: 'sent', description: 'Sent Invoice INV-2024-001' },
  { id: 'a5', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), type: 'task', action: 'updated', description: 'Updated Task: About Us Page' },
];


// --- Helper functions to interact with the dummy data ---

// General function to add to activity log
const addActivityLog = (logEntry: Omit<ActivityLog, 'id' | 'timestamp'>) => {
  const newLog: ActivityLog = {
    ...logEntry,
    id: `a${activityLogStore.length + 1}`,
    timestamp: new Date().toISOString(),
  };
  activityLogStore.unshift(newLog); // Add to the beginning
  activityLogStore = activityLogStore.slice(0, 20); // Keep only the latest 20 activities
};


// Projects
export const getProjects = async (): Promise<Project[]> => projectsStore;
export const getProjectById = async (id: string): Promise<Project | undefined> => projectsStore.find(p => p.id === id);
export const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>): Promise<Project> => {
  const newProject: Project = {
    ...projectData,
    id: String(projectsStore.length + 1),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tasks: [],
  };
  projectsStore.push(newProject);
  addActivityLog({ type: 'project', action: 'created', description: `Created Project: ${newProject.name}` });
  return newProject;
};
export const updateProject = async (id: string, projectData: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Project | undefined> => {
  const projectIndex = projectsStore.findIndex(p => p.id === id);
  if (projectIndex === -1) return undefined;
  projectsStore[projectIndex] = { ...projectsStore[projectIndex], ...projectData, updatedAt: new Date().toISOString() };
  addActivityLog({ type: 'project', action: 'updated', description: `Updated Project: ${projectsStore[projectIndex].name}` });
  return projectsStore[projectIndex];
};
export const deleteProject = async (id: string): Promise<boolean> => {
  const project = await getProjectById(id);
  if (!project) return false;
  const initialLength = projectsStore.length;
  projectsStore = projectsStore.filter(p => p.id !== id);
   const deleted = projectsStore.length < initialLength;
   if (deleted) {
    addActivityLog({ type: 'project', action: 'deleted', description: `Deleted Project: ${project.name}` });
   }
   return deleted;
};

// Tasks
export const getTasksByProjectId = async (projectId: string): Promise<Task[]> => {
  const project = await getProjectById(projectId);
  return project ? project.tasks : [];
};
export const createTask = async (projectId: string, taskData: Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>): Promise<Task | undefined> => {
  const project = await getProjectById(projectId);
  if (!project) return undefined;
  const newTask: Task = {
    ...taskData,
    id: `t${project.tasks.length + 1}-${projectId}`,
    projectId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  project.tasks.push(newTask);
  await updateProject(projectId, { tasks: project.tasks }); // Update project's updatedAt time
  addActivityLog({ type: 'task', action: 'created', description: `Created Task: ${newTask.name} in Project ${project.name}` });
  return newTask;
};
export const updateTask = async (projectId: string, taskId: string, taskData: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>): Promise<Task | undefined> => {
  const project = await getProjectById(projectId);
  if (!project) return undefined;
  const taskIndex = project.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return undefined;
  const originalStatus = project.tasks[taskIndex].status;
  project.tasks[taskIndex] = { ...project.tasks[taskIndex], ...taskData, updatedAt: new Date().toISOString() };
  await updateProject(projectId, { tasks: project.tasks }); // Update project's updatedAt time
  const updatedTask = project.tasks[taskIndex];
  if (taskData.status && taskData.status !== originalStatus) {
     addActivityLog({ type: 'task', action: 'updated', description: `Updated Task Status: ${updatedTask.name} to ${updatedTask.status}` });
     if (taskData.status === 'done') {
       addActivityLog({ type: 'task', action: 'completed', description: `Completed Task: ${updatedTask.name}` });
     }
  } else {
      addActivityLog({ type: 'task', action: 'updated', description: `Updated Task: ${updatedTask.name}` });
  }
  return updatedTask;
};
export const deleteTask = async (projectId: string, taskId: string): Promise<boolean> => {
  const project = await getProjectById(projectId);
  if (!project) return false;
  const task = project.tasks.find(t => t.id === taskId);
  if (!task) return false;
  const initialLength = project.tasks.length;
  project.tasks = project.tasks.filter(t => t.id !== taskId);
  await updateProject(projectId, { tasks: project.tasks }); // Update project's updatedAt time
  const deleted = project.tasks.length < initialLength;
  if (deleted) {
    addActivityLog({ type: 'task', action: 'deleted', description: `Deleted Task: ${task.name} from Project ${project.name}` });
  }
  return deleted;
};


// Invoices
export const getInvoices = async (): Promise<Invoice[]> => invoicesStore;
export const getInvoiceById = async (id: string): Promise<Invoice | undefined> => invoicesStore.find(inv => inv.id === id);
export const createInvoice = async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>): Promise<Invoice> => {
  const nextId = invoicesStore.length + 1;
  const newInvoice: Invoice = {
    ...invoiceData,
    id: `inv-${String(nextId).padStart(3, '0')}`,
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(nextId).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  invoicesStore.push(newInvoice);
   addActivityLog({ type: 'invoice', action: 'created', description: `Created Invoice: ${newInvoice.invoiceNumber}` });
  return newInvoice;
};
export const updateInvoice = async (id: string, invoiceData: Partial<Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>>): Promise<Invoice | undefined> => {
  const invoiceIndex = invoicesStore.findIndex(inv => inv.id === id);
  if (invoiceIndex === -1) return undefined;
   const originalStatus = invoicesStore[invoiceIndex].status;
  invoicesStore[invoiceIndex] = { ...invoicesStore[invoiceIndex], ...invoiceData, updatedAt: new Date().toISOString() };
  const updatedInvoice = invoicesStore[invoiceIndex];
  if (invoiceData.status && invoiceData.status !== originalStatus) {
      addActivityLog({ type: 'invoice', action: 'updated', description: `Updated Invoice Status: ${updatedInvoice.invoiceNumber} to ${updatedInvoice.status}` });
  } else {
      addActivityLog({ type: 'invoice', action: 'updated', description: `Updated Invoice: ${updatedInvoice.invoiceNumber}` });
  }
  return updatedInvoice;
};
export const deleteInvoice = async (id: string): Promise<boolean> => {
  const invoice = await getInvoiceById(id);
   if (!invoice) return false;
  const initialLength = invoicesStore.length;
  invoicesStore = invoicesStore.filter(inv => inv.id !== id);
  const deleted = invoicesStore.length < initialLength;
  if (deleted) {
     addActivityLog({ type: 'invoice', action: 'deleted', description: `Deleted Invoice: ${invoice.invoiceNumber}` });
  }
  return deleted;
};


// Time Tracking Functions (New)
export const getTimeEntries = async (): Promise<TimeEntry[]> => {
  // Add sorting by date descending
  return [...timeEntriesStore].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
};

export const createTimeEntry = async (entryData: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<TimeEntry> => {
  const newEntry: TimeEntry = {
    ...entryData,
    id: `te${timeEntriesStore.length + 1}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  timeEntriesStore.push(newEntry);
  // Format duration for log message
   const durationHours = Math.floor(newEntry.durationSeconds / 3600);
   const durationMinutes = Math.floor((newEntry.durationSeconds % 3600) / 60);
   const durationFormatted = `${durationHours}h ${durationMinutes}m`;
  addActivityLog({ type: 'time', action: 'stopped', description: `Logged time for ${newEntry.taskName || newEntry.projectName} (${durationFormatted})` });
  return newEntry;
};

export const updateTimeEntry = async (id: string, entryData: Partial<Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TimeEntry | undefined> => {
  const entryIndex = timeEntriesStore.findIndex(entry => entry.id === id);
  if (entryIndex === -1) return undefined;
  timeEntriesStore[entryIndex] = { ...timeEntriesStore[entryIndex], ...entryData, updatedAt: new Date().toISOString() };
   addActivityLog({ type: 'time', action: 'updated', description: `Updated time entry for ${timeEntriesStore[entryIndex].taskName || timeEntriesStore[entryIndex].projectName}` });
  return timeEntriesStore[entryIndex];
};

export const deleteTimeEntry = async (id: string): Promise<boolean> => {
  const entry = timeEntriesStore.find(e => e.id === id);
  if (!entry) return false;
  const initialLength = timeEntriesStore.length;
  timeEntriesStore = timeEntriesStore.filter(entry => entry.id !== id);
  const deleted = timeEntriesStore.length < initialLength;
  if (deleted) {
     addActivityLog({ type: 'time', action: 'deleted', description: `Deleted time entry for ${entry.taskName || entry.projectName}` });
  }
  return deleted;
};

// Get time report data (mock implementation)
export const getTimeReport = async (filters: { fromDate?: string, toDate?: string, projectId?: string }): Promise<{ name: string, hours: number }[]> => {
  console.log("Filtering report data with:", filters);
  // In a real app, filter timeEntriesStore based on dates and projectId
  // For now, just returning dummy data
  let filteredData = [...dummyReportData]; // Use a copy
  if (filters.projectId && filters.projectId !== 'all') {
      const project = projectsStore.find(p => p.id === filters.projectId);
      if (project) {
         filteredData = dummyReportData.filter(d => d.name === project.name);
      } else {
         filteredData = []; // Project not found
      }
  }
   // Date filtering would happen here in a real app
  return Promise.resolve(filteredData);
};


// New data fetching functions for Dashboard

// Get total weekly hours (mock implementation using time entries)
export const getWeeklyHoursTracked = async (): Promise<number> => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); // Assuming week starts on Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const weeklyEntries = timeEntriesStore.filter(entry => {
        const entryDate = new Date(entry.startTime);
        return entryDate >= startOfWeek && entryDate < endOfWeek;
    });

    const totalSeconds = weeklyEntries.reduce((sum, entry) => sum + entry.durationSeconds, 0);
    return Promise.resolve(totalSeconds / 3600); // Convert seconds to hours
};

// Get upcoming tasks (due within the next 7 days, limit 3)
export const getUpcomingTasks = async (limit: number = 3): Promise<Task[]> => {
    const allTasks: Task[] = projectsStore.flatMap(p => p.tasks.filter(t => t.status !== 'done' && t.dueDate));
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcoming = allTasks
        .filter(task => {
            if (!task.dueDate) return false; // Ensure dueDate exists
            const dueDate = new Date(task.dueDate);
            return dueDate >= now && dueDate <= nextWeek;
        })
        .sort((a, b) => {
            if (!a.dueDate || !b.dueDate) return 0; // Handle undefined dueDates
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(); // Sort by soonest due date
        });

    return upcoming.slice(0, limit);
};


// Get recent activity logs
export const getRecentActivity = async (limit: number = 5): Promise<ActivityLog[]> => {
    // Assuming activityLogStore is already sorted by timestamp descending
    return Promise.resolve(activityLogStore.slice(0, limit));
};
