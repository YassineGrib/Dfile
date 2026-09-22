import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import { AuthForm } from './components/AuthForm';
import { PreviewSide } from './components/PreviewSide';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { AddProjectModal, AddClientModal, AddExpenseModal } from './components/Modals';
import { ClientsView } from './components/ClientsView';
import { ProjectsView } from './components/ProjectsView';
import { ProjectsDirectory } from './components/ProjectsDirectory';
import { CalendarView } from './components/CalendarView';
import { ContractsView } from './components/ContractsView';
import { ExpensesView } from './components/ExpensesView';
import { InvoicesView } from './components/InvoicesView';
import { PaymentsView } from './components/PaymentsView';
import { SettingsView } from './components/SettingsView';
import { AddPaymentModal } from './components/AddPaymentModal';
import { authService } from './firebase/auth';
import { firestoreService } from './firebase/services';
import { isFirebaseConfigured } from './firebase/config';
import { useTheme } from './core';
import type { Client, Project, Payment, Expense, Activity, Task, Invoice, Milestone, Contract, FreelancerProfile } from './types';

const defaultProfile = {
  name: 'Sadek Rahman',
  designation: 'Senior Full-Stack Developer & Designer',
  email: 'sadek@decabyte.space',
  phone: '+213 (0) 550 12 34 56',
  address: 'Algiers, Algeria'
};

const defaultClauses = `1. CONFIDENTIALITY: The Developer agrees to keep all proprietary client information strictly confidential.
2. SOURCE CODE DELIVERY: All source repositories will be transferred to the Client immediately upon 100% final clearance of milestones.
3. INTELLECTUAL PROPERTY: Full copyright ownership of assets transfers to the Client upon total clearance of project budget.
4. WARRANTY SUPPORT: Developer provides a standard 30-day bug fixing warranty post deployment.`;

const FONT_THEMES_MAP: Record<string, { sans: string; ar: string }> = {
  satoshi: {
    sans: "'Satoshi', 'Outfit', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    ar: "'Alexandria', 'Tajawal', system-ui, -apple-system, sans-serif"
  },
  outfit: {
    sans: "'Outfit', 'Satoshi', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    ar: "'Alexandria', 'Tajawal', system-ui, -apple-system, sans-serif"
  },
  geist: {
    sans: "'Geist', 'Satoshi', system-ui, -apple-system, sans-serif",
    ar: "'Alexandria', 'Tajawal', system-ui, -apple-system, sans-serif"
  },
  jakarta: {
    sans: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    ar: "'Tajawal', system-ui, -apple-system, sans-serif"
  }
};

const AuthAppContent: React.FC = () => {
  const { toggleLanguage, language } = useLanguage();
  const { setMode } = useTheme();
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Initialize saved typography theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('indflow_font_theme');
    if (savedTheme && FONT_THEMES_MAP[savedTheme]) {
      document.documentElement.style.setProperty('--font-sans', FONT_THEMES_MAP[savedTheme].sans);
      document.documentElement.style.setProperty('--font-ar', FONT_THEMES_MAP[savedTheme].ar);
    }
  }, []);

  // Live Cloud Firestore database state (loaded from database)
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);

  // Profile & Contract Template states
  const [freelancerProfile, setFreelancerProfile] = useState(defaultProfile);
  const [contractClauses, setContractClauses] = useState(defaultClauses);
  const [projectCategories, setProjectCategories] = useState(['Web Design', 'Development', 'SEO Optimization', 'Design Retainer']);

  // Auth state listener
  useEffect(() => {
    if (isFirebaseConfigured) {
      const unsubAuth = authService.onAuthStateChanged((user) => {
        setIsAuthenticated(Boolean(user));
      });
      return () => unsubAuth();
    }
  }, []);

  // Real-time Cloud Firestore Subscriptions (Active only when authenticated)
  useEffect(() => {
    if (isFirebaseConfigured && isAuthenticated) {
      const unsubClients = firestoreService.subscribeClients((items) => setClients(items));
      const unsubProjects = firestoreService.subscribeProjects((items) => {
        const normalized = items.map(p => {
          if (p.status === 'Completed' || p.status === 'Delivered') {
            return { ...p, progress_percentage: 100 };
          }
          return p;
        });
        setProjects(normalized);
      });
      const unsubExpenses = firestoreService.subscribeExpenses((items) => setExpenses(items));
      const unsubInvoices = firestoreService.subscribeInvoices((items) => setInvoices(items));
      const unsubTasks = firestoreService.subscribeTasks((items) => setTasks(items));
      const unsubPayments = firestoreService.subscribePayments((items) => setPayments(items));
      const unsubActivities = firestoreService.subscribeActivities((items) => setActivities(items));
      const unsubMilestones = firestoreService.subscribeMilestones((items) => setMilestones(items));
      const unsubContracts = firestoreService.subscribeContracts((items) => setContracts(items));
      const unsubSettings = firestoreService.subscribeWorkspacePreferences((prefs) => {
        if (prefs) {
          if (prefs.profile) setFreelancerProfile(prefs.profile);
          if (prefs.contract_clauses) setContractClauses(prefs.contract_clauses);
          if (prefs.categories && Array.isArray(prefs.categories) && prefs.categories.length > 0) {
            setProjectCategories(prefs.categories);
          }
          if (prefs.font_theme && FONT_THEMES_MAP[prefs.font_theme]) {
            localStorage.setItem('indflow_font_theme', prefs.font_theme);
            document.documentElement.style.setProperty('--font-sans', FONT_THEMES_MAP[prefs.font_theme].sans);
            document.documentElement.style.setProperty('--font-ar', FONT_THEMES_MAP[prefs.font_theme].ar);
          }
          if (prefs.theme_mode && (prefs.theme_mode === 'light' || prefs.theme_mode === 'dark' || prefs.theme_mode === 'system')) {
            setMode(prefs.theme_mode);
          }
        }
      });

      return () => {
        unsubClients();
        unsubProjects();
        unsubExpenses();
        unsubInvoices();
        unsubTasks();
        unsubPayments();
        unsubActivities();
        unsubMilestones();
        unsubContracts();
        unsubSettings();
      };
    }
  }, [isAuthenticated]);

  // Modal open states
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Helper log activity
  const logActivity = (textEn: string, textAr: string, type: 'project' | 'payment' | 'expense' | 'client') => {
    const act: Activity = {
      id: 'act_' + Math.random().toString(36).substr(2, 9),
      text: textEn,
      text_ar: textAr,
      type,
      timestamp: 'Just now'
    };
    setActivities(prev => [act, ...prev]);
    firestoreService.saveActivity(act);
  };

  // Add handlers
  const handleAddProject = (project: Project, tasksList: string[]) => {
    setProjects([project, ...projects]);
    firestoreService.saveProject(project);
    logActivity(
      `Project '${project.name}' created with budget ${project.price_dzd.toLocaleString()} DZ`,
      `تم إنشاء المشروع '${project.name}' بميزانية قدرها ${project.price_dzd.toLocaleString()} DZ`,
      'project'
    );
    if (tasksList.length > 0) {
      console.log('Logged tasks for project:', tasksList);
    }
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const exists = tasks.some(t => t.id === updatedTask.id);
    if (exists) {
      setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    } else {
      setTasks([...tasks, updatedTask]);
      logActivity(
        `Task '${updatedTask.name}' added to project`,
        `تم إضافة المهمة '${updatedTask.name}' للمشروع`,
        'project'
      );
    }
    firestoreService.saveTask(updatedTask);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    const isFinished = updatedProject.status === 'Completed' || updatedProject.status === 'Delivered';
    const normalizedProject: Project = {
      ...updatedProject,
      progress_percentage: isFinished ? 100 : updatedProject.progress_percentage
    };
    setProjects(prev => {
      const exists = prev.some(p => p.id === normalizedProject.id);
      if (exists) {
        return prev.map(p => p.id === normalizedProject.id ? normalizedProject : p);
      }
      // New project added via ProjectsDirectory
      return [normalizedProject, ...prev];
    });
    firestoreService.saveProject(normalizedProject);
    logActivity(
      `Project '${normalizedProject.name}' status updated to ${normalizedProject.status}`,
      `تم تحديث حالة المشروع '${normalizedProject.name}' إلى ${normalizedProject.status}`,
      'project'
    );
  };

  const handleUpdateProfile = (newProfile: FreelancerProfile) => {
    setFreelancerProfile(newProfile);
    firestoreService.saveWorkspacePreferences({ profile: newProfile });
    logActivity(`Workspace profile updated`, `تم تحديث بيانات الملف الشخصي لمساحة العمل`, 'client');
  };

  const handleUpdateClauses = (newClauses: string) => {
    setContractClauses(newClauses);
    firestoreService.saveWorkspacePreferences({ contract_clauses: newClauses });
    logActivity(`Legal contract clauses updated`, `تم تحديث البنود القانونية للعقود`, 'client');
  };

  const handleUpdateCategories = (newCategories: string[]) => {
    setProjectCategories(newCategories);
    firestoreService.saveWorkspacePreferences({ categories: newCategories });
    logActivity(`Project categories updated`, `تم تحديث تصنيفات المشاريع`, 'project');
  };

  const handleDeleteProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setProjects(prev => prev.filter(p => p.id !== projectId));
    firestoreService.deleteProject(projectId);
    if (project) {
      logActivity(
        `Project '${project.name}' was deleted`,
        `تم حذف المشروع '${project.name}'`,
        'project'
      );
    }
  };

  const handleAddClient = (
    name: string,
    email: string,
    phone: string,
    address?: string,
    notes?: string,
    social_links?: { linkedin?: string; twitter?: string; github?: string; website?: string }
  ) => {
    const client: Client = {
      id: 'cli_' + Math.random().toString(36).substr(2, 9),
      name,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      notes: notes || undefined,
      social_links,
      created_at: new Date().toISOString().split('T')[0]
    };
    setClients([client, ...clients]);
    firestoreService.saveClient(client);
    logActivity(
      `Client '${name}' added successfully`,
      `تم إضافة العميل الجديد '${name}' بنجاح`,
      'client'
    );
  };

  const handleQuickAddClient = (name: string): Client => {
    const client: Client = {
      id: 'cli_' + Math.random().toString(36).substr(2, 9),
      name,
      created_at: new Date().toISOString().split('T')[0]
    };
    setClients([client, ...clients]);
    firestoreService.saveClient(client);
    logActivity(
      `Quick added client '${name}'`,
      `تم إضافة العميل السريع '${name}'`,
      'client'
    );
    return client;
  };

  const handleEditClient = (updatedClient: Client) => {
    setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
    firestoreService.saveClient(updatedClient);
    logActivity(
      `Client profile '${updatedClient.name}' updated`,
      `تم تحديث بيانات العميل '${updatedClient.name}'`,
      'client'
    );
  };

  const handleDeleteClient = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    setClients(clients.filter(c => c.id !== clientId));
    firestoreService.deleteClient(clientId);
    logActivity(
      `Client '${client.name}' deleted`,
      `تم حذف العميل '${client.name}'`,
      'client'
    );
  };

  const handleAddExpense = (expense: Expense) => {
    setExpenses([expense, ...expenses]);
    firestoreService.saveExpense(expense);
    const linkedProj = projects.find(p => p.id === expense.project_id);
    const projDetail = linkedProj ? ` for project '${linkedProj.name}'` : '';
    const projDetailAr = linkedProj ? ` للمشروع '${linkedProj.name}'` : '';
    logActivity(
      `Logged cost of ${expense.amount.toLocaleString()} DZ under category '${expense.category}'${projDetail}`,
      `تم تسجيل مصاريف بقيمة ${expense.amount.toLocaleString()} DZ تحت بند '${expense.category}'${projDetailAr}`,
      'expense'
    );
  };

  const handleEditExpense = (updatedExpense: Expense) => {
    setExpenses(expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    firestoreService.saveExpense(updatedExpense);
    logActivity(
      `Expense outlines updated`,
      `تم تحديث بيان المصروفات`,
      'expense'
    );
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(expenses.filter(e => e.id !== expenseId));
    firestoreService.deleteExpense(expenseId);
    logActivity(
      `Expense record deleted`,
      `تم حذف سجل المصاريف`,
      'expense'
    );
  };

  const handleAddInvoice = (invoice: Invoice) => {
    setInvoices([invoice, ...invoices]);
    firestoreService.saveInvoice(invoice);
    logActivity(
      `Invoice '${invoice.invoice_number}' created for ${invoice.total_amount.toLocaleString()} DZ`,
      `تم إنشاء الفاتورة '${invoice.invoice_number}' بقيمة ${invoice.total_amount.toLocaleString()} DZ`,
      'payment'
    );
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return;
    setInvoices(invoices.filter(i => i.id !== invoiceId));
    firestoreService.deleteInvoice(invoiceId);
    logActivity(
      `Invoice '${inv.invoice_number}' deleted`,
      `تم حذف الفاتورة '${inv.invoice_number}'`,
      'payment'
    );
  };

  // Payment actions
  const handleAddPayment = (payment: Payment) => {
    setPayments(prev => [payment, ...prev]);
    firestoreService.savePayment(payment);
    const client = clients.find(c => c.id === payment.client_id);
    const clientName = client?.name || 'Client';
    logActivity(
      `Payment of ${payment.amount.toLocaleString()} DZ received from '${clientName}'`,
      `تم استلام دفعة بقيمة ${payment.amount.toLocaleString()} DZ من العميل '${clientName}'`,
      'payment'
    );
  };

  const handleDeletePayment = (paymentId: string) => {
    setPayments(prev => prev.filter(p => p.id !== paymentId));
    firestoreService.deletePayment(paymentId);
    logActivity(
      `Payment record removed`,
      `تم حذف سجل الدفعة المالية`,
      'payment'
    );
  };

  // Milestone actions
  const handleAddMilestone = (milestone: Milestone) => {
    setMilestones(prev => [milestone, ...prev]);
    firestoreService.saveMilestone(milestone);
    logActivity(
      `Milestone '${milestone.title}' registered`,
      `تم تسجيل موعد هام جديد '${milestone.title}'`,
      'project'
    );
  };

  const handleToggleMilestone = (id: string, completed: boolean) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, completed } : m));
    const item = milestones.find(m => m.id === id);
    if (item) {
      firestoreService.saveMilestone({ ...item, completed });
    }
  };

  const handleDeleteMilestone = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
    firestoreService.deleteMilestone(id);
  };

  // Contract actions
  const handleAddContract = (contract: Contract) => {
    setContracts(prev => [contract, ...prev]);
    firestoreService.saveContract(contract);
    logActivity(
      `Contract '${contract.title}' created`,
      `تم إنشاء عقد جديد '${contract.title}'`,
      'project'
    );
  };

  const handleUpdateContract = (contract: Contract) => {
    setContracts(prev => prev.map(c => c.id === contract.id ? contract : c));
    firestoreService.saveContract(contract);
  };

  const handleDeleteContract = (id: string) => {
    setContracts(prev => prev.filter(c => c.id !== id));
    firestoreService.deleteContract(id);
  };

  const handleLogout = async () => {
    await authService.signOut();
    setIsAuthenticated(false);
  };

  const handleExportBackup = () => {
    const data = {
      clients,
      projects,
      payments,
      expenses,
      invoices,
      tasks,
      freelancerProfile,
      contractClauses
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `decabyte_workspace_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    logActivity(
      `Workspace data backup exported successfully`,
      `تم تصدير نسخة احتياطية من بيانات مساحة العمل بنجاح`,
      'project'
    );
  };

  const handleLogoutAllDevices = () => {
    logActivity(
      `Terminated all other active device sessions`,
      `تم إنهاء جلسات الأجهزة النشطة الأخرى بالكامل`,
      'project'
    );
  };

  return (
    <>
      {!isAuthenticated ? (
        <div className="auth-wrapper">
          {/* Main Grid Split Layout (Illustration on Left, Auth Form on Right) */}
          <div className="auth-grid">
            <PreviewSide />
            <AuthForm onLoginSuccess={() => setIsAuthenticated(true)} />
          </div>
        </div>
      ) : (
        <div className="workspace-layout">
          {/* Sidebar Nav */}
          <Sidebar 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            onLogout={handleLogout} 
            onOpenAddProject={() => setIsProjectModalOpen(true)}
            onOpenAddClient={() => setIsClientModalOpen(true)}
            onOpenAddExpense={() => setIsExpenseModalOpen(true)}
            onOpenAddPayment={() => setIsPaymentModalOpen(true)}
            projects={projects}
            clients={clients}
            payments={payments}
          />

          {/* Main Workspace Frame */}
          <main className="workspace-main-panel">
            {/* Render views depending on active tab */}
            {activeTab === 'dashboard' && (
              <DashboardView
                clients={clients}
                projects={projects}
                payments={payments}
                expenses={expenses}
                activities={activities}
                onOpenAddProject={() => setIsProjectModalOpen(true)}
                onOpenAddClient={() => setIsClientModalOpen(true)}
                onOpenAddExpense={() => setIsExpenseModalOpen(true)}
                onOpenAddPayment={() => setIsPaymentModalOpen(true)}
              />
            )}

            {activeTab === 'projects' && (
              <ProjectsView
                projects={projects}
                clients={clients}
                tasks={tasks}
                payments={payments}
                onUpdateTask={handleUpdateTask}
                onUpdateProject={handleUpdateProject}
                onOpenAddProject={() => setIsProjectModalOpen(true)}
              />
            )}

            {activeTab === 'all-projects' && (
              <ProjectsDirectory
                projects={projects}
                clients={clients}
                payments={payments}
                expenses={expenses}
                tasks={tasks}
                onAddProject={(p) => setProjects(prev => [p, ...prev])}
                onEditProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
                onOpenAddProject={() => setIsProjectModalOpen(true)}
              />
            )}

            {activeTab === 'clients' && (
              <ClientsView
                clients={clients}
                projects={projects}
                payments={payments}
                expenses={expenses}
                onOpenAddClient={() => setIsClientModalOpen(true)}
                onEditClient={handleEditClient}
                onDeleteClient={handleDeleteClient}
              />
            )}

            {activeTab === 'calendar' && (
              <CalendarView 
                projects={projects}
                clients={clients}
                tasks={tasks}
                milestones={milestones}
                onAddMilestone={handleAddMilestone}
                onToggleMilestone={handleToggleMilestone}
                onDeleteMilestone={handleDeleteMilestone}
              />
            )}

            {activeTab === 'payments' && (
              <PaymentsView
                payments={payments}
                clients={clients}
                projects={projects}
                onOpenAddPayment={() => setIsPaymentModalOpen(true)}
                onDeletePayment={handleDeletePayment}
                freelancerName={freelancerProfile.name}
              />
            )}

            {activeTab === 'contracts' && (
              <ContractsView 
                projects={projects}
                clients={clients}
                freelancerProfile={freelancerProfile}
                contractClauses={contractClauses}
                contracts={contracts}
                onAddContract={handleAddContract}
                onUpdateContract={handleUpdateContract}
                onDeleteContract={handleDeleteContract}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpensesView 
                expenses={expenses}
                projects={projects}
                onAddExpense={handleAddExpense}
                onEditExpense={handleEditExpense}
                onDeleteExpense={handleDeleteExpense}
              />
            )}

            {activeTab === 'invoices' && (
              <InvoicesView 
                invoices={invoices}
                projects={projects}
                clients={clients}
                payments={payments}
                onAddInvoice={handleAddInvoice}
                onDeleteInvoice={handleDeleteInvoice}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView 
                profile={freelancerProfile}
                onUpdateProfile={handleUpdateProfile}
                contractClauses={contractClauses}
                onUpdateClauses={handleUpdateClauses}
                toggleLanguage={toggleLanguage}
                language={language}
                categories={projectCategories}
                onUpdateCategories={handleUpdateCategories}
                onExportBackup={handleExportBackup}
                onLogoutAllDevices={handleLogoutAllDevices}
              />
            )}
          </main>
        </div>
      )}

      {/* Wizard Modals */}
      <AddProjectModal 
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        clients={clients}
        onAddProject={handleAddProject}
        onQuickAddClient={handleQuickAddClient}
        categories={projectCategories}
      />

      <AddClientModal 
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onAddClient={handleAddClient}
      />

      <AddExpenseModal 
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        projects={projects}
        onAddExpense={handleAddExpense}
      />

      <AddPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        clients={clients}
        projects={projects}
        payments={payments}
        onAddPayment={handleAddPayment}
      />
    </>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthAppContent />
    </LanguageProvider>
  );
}

export default App;
