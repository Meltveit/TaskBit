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

// Dummy data for now - replace with actual data fetching or state management
let projectsStore: Project[] = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Complete redesign of the company website.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tasks: [
      { id: 't1', projectId: '1', name: 'Homepage Design', status: 'done', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 't2', projectId: '1', name: 'About Us Page', status: 'inprogress', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
    status: 'active',
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'Develop a new mobile application for iOS and Android.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tasks: [
       { id: 't3', projectId: '2', name: 'User Authentication', status: 'todo', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
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
];


// Helper functions to interact with the dummy data
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
  return newProject;
};
export const updateProject = async (id: string, projectData: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Project | undefined> => {
  const projectIndex = projectsStore.findIndex(p => p.id === id);
  if (projectIndex === -1) return undefined;
  projectsStore[projectIndex] = { ...projectsStore[projectIndex], ...projectData, updatedAt: new Date().toISOString() };
  return projectsStore[projectIndex];
};
export const deleteProject = async (id: string): Promise<boolean> => {
  const initialLength = projectsStore.length;
  projectsStore = projectsStore.filter(p => p.id !== id);
  return projectsStore.length < initialLength;
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
  await updateProject(projectId, { tasks: project.tasks });
  return newTask;
};
export const updateTask = async (projectId: string, taskId: string, taskData: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>): Promise<Task | undefined> => {
  const project = await getProjectById(projectId);
  if (!project) return undefined;
  const taskIndex = project.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return undefined;
  project.tasks[taskIndex] = { ...project.tasks[taskIndex], ...taskData, updatedAt: new Date().toISOString() };
  await updateProject(projectId, { tasks: project.tasks });
  return project.tasks[taskIndex];
};
export const deleteTask = async (projectId: string, taskId: string): Promise<boolean> => {
  const project = await getProjectById(projectId);
  if (!project) return false;
  const initialLength = project.tasks.length;
  project.tasks = project.tasks.filter(t => t.id !== taskId);
  await updateProject(projectId, { tasks: project.tasks });
  return project.tasks.length < initialLength;
};


// Invoices
export const getInvoices = async (): Promise<Invoice[]> => invoicesStore;
export const getInvoiceById = async (id: string): Promise<Invoice | undefined> => invoicesStore.find(inv => inv.id === id);
export const createInvoice = async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>): Promise<Invoice> => {
  const newInvoice: Invoice = {
    ...invoiceData,
    id: `inv-${String(invoicesStore.length + 1).padStart(3, '0')}`,
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(invoicesStore.length + 1).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  invoicesStore.push(newInvoice);
  return newInvoice;
};
export const updateInvoice = async (id: string, invoiceData: Partial<Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>>): Promise<Invoice | undefined> => {
  const invoiceIndex = invoicesStore.findIndex(inv => inv.id === id);
  if (invoiceIndex === -1) return undefined;
  invoicesStore[invoiceIndex] = { ...invoicesStore[invoiceIndex], ...invoiceData, updatedAt: new Date().toISOString() };
  return invoicesStore[invoiceIndex];
};
export const deleteInvoice = async (id: string): Promise<boolean> => {
  const initialLength = invoicesStore.length;
  invoicesStore = invoicesStore.filter(inv => inv.id !== id);
  return invoicesStore.length < initialLength;
};
