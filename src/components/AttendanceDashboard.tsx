import React, { useState, useEffect } from 'react';
import { 
  Users, 
  User,
  Calendar, 
  Clock, 
  FileText, 
  Settings, 
  Plus, 
  Download, 
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Printer,
  Edit,
  Trash2,
  Calculator,
  RotateCcw,
  DollarSign,
  ExternalLink,
  TrendingUp,
  LogOut as LogOutIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn, formatCurrency, formatHours } from '../lib/utils';
import { 
  Employee, 
  AttendanceRecord, 
  ShiftType, 
  WorkDays, 
  IncidenceType,
  ISRTable,
  Holiday,
  ShiftDefinition,
  IncidenceDefinition,
  PaymentType,
  AppUser
} from '../types';
import { CalendarService } from '../services/calendarService';
import { PayrollService } from '../services/payrollService';
import { ReportService } from '../services/reportService';
import { GeminiService } from '../services/geminiService';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, setDoc } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

import EmployeeForm from './EmployeeForm';
import AttendanceRecordForm from './AttendanceRecordForm';
import ShiftCronogram from './ShiftCronogram';
import ISRTableConfig from './ISRTableConfig';
import HolidayConfig from './HolidayConfig';
import PayrollReportGenerator from './PayrollReportGenerator';
import EvaluationDashboard from './EvaluationDashboard';

interface DashboardProps {
  user: FirebaseUser;
  onLogout: () => void;
}

export default function AttendanceDashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('attendance');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isrTables, setIsrTables] = useState<ISRTable[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [shifts, setShifts] = useState<ShiftDefinition[]>([]);
  const [incidences, setIncidences] = useState<IncidenceDefinition[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [currentUserData, setCurrentUserData] = useState<AppUser | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showAttendanceForm, setShowAttendanceForm] = useState<Employee | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Real-time listeners
  useEffect(() => {
    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'employees'));

    const unsubRecords = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      setRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'attendance'));

    const unsubISR = onSnapshot(collection(db, 'isrTables'), (snapshot) => {
      setIsrTables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as ISRTable)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'isrTables'));

    const unsubHolidays = onSnapshot(collection(db, 'holidays'), (snapshot) => {
      setHolidays(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Holiday)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'holidays'));

    const unsubShifts = onSnapshot(collection(db, 'shifts'), (snapshot) => {
      setShifts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShiftDefinition)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'shifts'));

    const unsubIncidences = onSnapshot(collection(db, 'incidences'), (snapshot) => {
      setIncidences(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IncidenceDefinition)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'incidences'));

    const unsubPaymentTypes = onSnapshot(collection(db, 'paymentTypes'), (snapshot) => {
      setPaymentTypes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentType)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'paymentTypes'));

    const unsubCurrentUser = onSnapshot(doc(db, 'appUsers', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const userData = { uid: snapshot.id, ...snapshot.data() } as AppUser;
        setCurrentUserData(userData);
      } else {
        // Register new user as approved
        const newUser: AppUser = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Usuario Nuevo',
          status: 'approved',
          role: 'user',
          createdAt: new Date().toISOString()
        };
        setDoc(doc(db, 'appUsers', user.uid), newUser)
          .then(() => {
            setCurrentUserData(newUser);
          })
          .catch(err => handleFirestoreError(err, OperationType.CREATE, 'appUsers'));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `appUsers/${user.uid}`));

    return () => {
      unsubEmployees();
      unsubRecords();
      unsubISR();
      unsubHolidays();
      unsubShifts();
      unsubIncidences();
      unsubPaymentTypes();
      unsubCurrentUser();
    };
  }, [user.uid]);

  // Admin-only listener for all users
  useEffect(() => {
    if (currentUserData?.role !== 'admin' && user.email !== 'proyectosinterno@gmail.com') return;

    const unsubAppUsers = onSnapshot(collection(db, 'appUsers'), (snapshot) => {
      setAppUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'appUsers'));

    return () => unsubAppUsers();
  }, [currentUserData?.role, user.email]);

  const handleSaveEmployee = async (emp: Employee) => {
    try {
      if (emp.id) {
        const { id, ...data } = emp;
        await updateDoc(doc(db, 'employees', id), data as any);
      } else {
        await addDoc(collection(db, 'employees'), emp);
      }
      setShowEmployeeForm(false);
      setEditingEmployee(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'employees');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'employees', id));
      setShowDeleteConfirm(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'employees');
    }
  };

  const handleSaveAttendance = async (record: Partial<AttendanceRecord>) => {
    try {
      if (record.id) {
        const { id, ...data } = record;
        await updateDoc(doc(db, 'attendance', id), data as any);
      } else {
        await addDoc(collection(db, 'attendance'), record);
      }
      setShowAttendanceForm(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'attendance');
    }
  };

  const handleSaveISR = async (table: ISRTable) => {
    try {
      if (table.id) {
        const { id, ...data } = table;
        await updateDoc(doc(db, 'isrTables', id), data as any);
      } else {
        await addDoc(collection(db, 'isrTables'), table);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'isrTables');
    }
  };

  const handleSaveShift = async (shift: ShiftDefinition) => {
    try {
      if (shift.id) {
        const { id, ...data } = shift;
        await updateDoc(doc(db, 'shifts', id), data as any);
      } else {
        await addDoc(collection(db, 'shifts'), shift);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'shifts');
    }
  };

  const handleSaveIncidence = async (incidence: IncidenceDefinition) => {
    try {
      if (incidence.id) {
        const { id, ...data } = incidence;
        await updateDoc(doc(db, 'incidences', id), data as any);
      } else {
        await addDoc(collection(db, 'incidences'), incidence);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'incidences');
    }
  };

  const handleSavePaymentType = async (paymentType: PaymentType) => {
    try {
      if (paymentType.id) {
        const { id, ...data } = paymentType;
        await updateDoc(doc(db, 'paymentTypes', id), data as any);
      } else {
        await addDoc(collection(db, 'paymentTypes'), paymentType);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'paymentTypes');
    }
  };

  const handleUpdateUser = async (uid: string, data: Partial<AppUser>) => {
    try {
      await updateDoc(doc(db, 'appUsers', uid), data as any);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'appUsers');
    }
  };

  const handleSaveHolidays = async (newHolidays: Holiday[]) => {
    try {
      // For simplicity, we'll add new ones. In a real app, we might sync.
      for (const h of newHolidays) {
        if (!holidays.find(existing => existing.date === h.date)) {
          await addDoc(collection(db, 'holidays'), h);
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'holidays');
    }
  };

  const tabs = [
    { id: 'attendance', label: 'Asistencia', icon: Clock },
    { id: 'employees', label: 'Empleados', icon: Users },
    { id: 'cronogram', label: 'Roles de Turno', icon: Calendar },
    { id: 'payroll', label: 'Nómina e ISR', icon: FileText },
    { id: 'evaluation', label: 'Evaluación', icon: TrendingUp },
    { id: 'config', label: 'Configuración', icon: Settings },
  ];

  if (currentUserData?.role === 'admin') {
    tabs.push({ id: 'admin', label: 'Usuarios', icon: User });
  }

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    emp.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-corporate-950 text-gray-200 font-sans overflow-hidden relative">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-corporate-900 border-r border-corporate-800 flex flex-col shadow-2xl z-40 transition-transform duration-300 lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-corporate rounded-2xl flex items-center justify-center shadow-lg shadow-blue-corporate/20">
              <Clock className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white">ASISTENCIA <span className="text-blue-corporate">v2.0</span></h1>
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">ERP Corporativo</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "sidebar-item w-full relative group",
                activeTab === tab.id ? "sidebar-item-active" : "sidebar-item-inactive"
              )}
            >
              <tab.icon className={cn(
                "w-5 h-5 transition-transform group-hover:scale-110",
                activeTab === tab.id ? "text-blue-corporate" : "text-gray-500"
              )} />
              <span className="text-sm font-bold tracking-tight">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute left-0 w-1 h-6 bg-blue-corporate rounded-r-full"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-corporate-800">
          <div className="bg-corporate-800/50 rounded-2xl p-4 flex items-center justify-between border border-corporate-700">
            <div className="truncate mr-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Sesión Activa</p>
              <p className="text-sm font-bold text-white truncate">{user.displayName || user.email}</p>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
              title="Cerrar Sesión"
            >
              <LogOutIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-corporate-950">
        {/* Header */}
        <header className="h-20 bg-corporate-900/50 backdrop-blur-xl border-b border-corporate-800 flex items-center justify-between px-4 lg:px-10 z-10">
          <div className="flex items-center gap-4 flex-1 max-w-2xl">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-gray-500 hover:text-white lg:hidden"
            >
              <Filter className="w-6 h-6" />
            </button>
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-corporate transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar por nombre, código o departamento..."
                className="w-full pl-12 pr-4 py-3 bg-corporate-800/50 border-corporate-700 border focus:bg-corporate-800 focus:border-blue-corporate focus:ring-4 focus:ring-blue-corporate/5 rounded-2xl text-sm font-medium transition-all outline-none text-white placeholder:text-gray-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-3 text-gray-500 hover:text-white hover:bg-corporate-800 rounded-2xl transition-all relative">
              <div className="absolute top-3 right-3 w-2 h-2 bg-blue-corporate rounded-full border-2 border-corporate-900"></div>
              <Settings className="w-5 h-5" />
            </button>
            <div className="h-8 w-px bg-corporate-800 mx-2"></div>
            <button 
              onClick={() => setShowEmployeeForm(true)}
              className="dark-button-primary"
            >
              <Plus className="w-5 h-5" />
              Nuevo Empleado
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto"
            >
              {activeTab === 'attendance' && (
                <AttendanceView 
                  employees={filteredEmployees} 
                  records={records} 
                  incidences={incidences}
                  shifts={shifts}
                  paymentTypes={paymentTypes}
                  onClockIn={(emp) => setShowAttendanceForm(emp)}
                />
              )}
              {activeTab === 'employees' && (
                <EmployeesView 
                  employees={filteredEmployees} 
                  onEdit={(emp) => {
                    setEditingEmployee(emp);
                    setShowEmployeeForm(true);
                  }}
                  onDelete={(id) => setShowDeleteConfirm(id)}
                />
              )}
              {activeTab === 'cronogram' && (
                <CronogramView 
                  employees={employees} 
                  year={selectedYear} 
                  holidays={holidays}
                  attendanceRecords={records}
                  shifts={shifts}
                  incidences={incidences}
                  paymentTypes={paymentTypes}
                  onYearChange={setSelectedYear}
                />
              )}
              {activeTab === 'payroll' && (
                <PayrollReportGenerator 
                  employees={employees} 
                  records={records} 
                  isrTables={isrTables}
                  holidays={holidays}
                />
              )}
              {activeTab === 'evaluation' && (
                <EvaluationDashboard 
                  employees={employees}
                  records={records}
                  shifts={shifts}
                />
              )}
              {activeTab === 'config' && (
                <ConfigView 
                  isrTables={isrTables} 
                  holidays={holidays}
                  shifts={shifts}
                  incidences={incidences}
                  paymentTypes={paymentTypes}
                  year={selectedYear}
                  onSaveISR={handleSaveISR}
                  onSaveHolidays={handleSaveHolidays}
                  onSaveShift={handleSaveShift}
                  onSaveIncidence={handleSaveIncidence}
                  onSavePaymentType={handleSavePaymentType}
                />
              )}
              {activeTab === 'admin' && (
                <AdminView 
                  appUsers={appUsers}
                  onUpdateUser={handleUpdateUser}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      {showEmployeeForm && (
        <EmployeeForm 
          onClose={() => { setShowEmployeeForm(false); setEditingEmployee(undefined); }}
          onSave={handleSaveEmployee}
          initialData={editingEmployee}
          shifts={shifts}
        />
      )}

      {showAttendanceForm && (
        <div className="fixed inset-0 bg-corporate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="dark-card w-full max-w-4xl p-8"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-corporate/10 rounded-2xl flex items-center justify-center">
                  <Clock className="text-blue-corporate w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Registro de Asistencia</h2>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{showAttendanceForm.name}</p>
                </div>
              </div>
              <button onClick={() => setShowAttendanceForm(null)} className="p-2 text-gray-500 hover:text-white hover:bg-corporate-800 rounded-xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            <AttendanceRecordForm 
              employee={showAttendanceForm}
              onClose={() => setShowAttendanceForm(null)}
              onSave={handleSaveAttendance}
              incidences={incidences}
              shifts={shifts}
              paymentTypes={paymentTypes}
              record={records.find(r => r.employeeId === showAttendanceForm.id && r.date === new Date().toISOString().split('T')[0])}
              date={new Date().toISOString().split('T')[0]}
            />
          </motion.div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-corporate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="dark-card p-8 w-full max-w-sm text-center"
          >
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">¿Eliminar Registro?</h3>
            <p className="text-gray-500 text-sm mb-8 font-medium">Esta acción eliminará permanentemente al empleado y no se puede deshacer.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 dark-button-secondary"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDeleteEmployee(showDeleteConfirm)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg shadow-red-500/20"
              >
                Eliminar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Sub-components

function AttendanceView({ 
  employees, 
  records, 
  incidences,
  shifts,
  paymentTypes,
  onClockIn 
}: { 
  employees: Employee[], 
  records: AttendanceRecord[], 
  incidences: IncidenceDefinition[],
  shifts: ShiftDefinition[],
  paymentTypes: PaymentType[],
  onClockIn: (emp: Employee) => void 
}) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Control de Asistencia</h2>
          <p className="text-gray-500 text-sm font-medium">Registro de entradas, salidas e incidencias diarias.</p>
        </div>
        <div className="flex gap-3 bg-corporate-900 p-1.5 rounded-2xl border border-corporate-800 shadow-xl">
          <input 
            type="date" 
            className="dark-input border-none bg-transparent"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="dark-card p-6">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6">Seleccionar Colaborador</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
              {employees.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp)}
                  className={cn(
                    "w-full p-4 rounded-xl flex items-center gap-4 transition-all border",
                    selectedEmployee?.id === emp.id 
                      ? "bg-blue-corporate/10 border-blue-corporate/50 text-white" 
                      : "bg-corporate-800/50 border-corporate-700 text-gray-400 hover:border-gray-500"
                  )}
                >
                  <div className="w-10 h-10 bg-corporate-800 rounded-lg flex items-center justify-center font-black text-xs">
                    {emp.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black tracking-tight">{emp.name}</p>
                    <p className="text-[10px] font-bold opacity-50 uppercase">{emp.code}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedEmployee ? (
            <div className="dark-card p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-blue-corporate/10 rounded-2xl flex items-center justify-center text-blue-corporate">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">{selectedEmployee.name}</h3>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Registro para el {date}</p>
                </div>
              </div>

              <AttendanceRecordForm 
                employee={selectedEmployee}
                date={date}
                record={records.find(a => a.employeeId === selectedEmployee.id && a.date === date)}
                incidences={incidences}
                shifts={shifts}
                paymentTypes={paymentTypes}
                onSave={(a) => {
                  onClockIn(selectedEmployee);
                }}
                onClose={() => setSelectedEmployee(null)}
              />
            </div>
          ) : (
            <div className="dark-card h-full flex items-center justify-center flex-col p-12 text-center border-dashed">
              <div className="w-20 h-20 bg-corporate-800 rounded-full flex items-center justify-center mb-6 mx-auto">
                <User className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Sin Selección</h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">Seleccione un colaborador del panel izquierdo para gestionar su asistencia.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmployeesView({ employees, onEdit, onDelete }: { employees: Employee[], onEdit: (emp: Employee) => void, onDelete: (id: string) => void }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Gestión de Personal</h2>
          <p className="text-gray-500 text-sm font-medium">Administre la información del personal y su antigüedad.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {employees.map(emp => (
          <div key={emp.id} className="dark-card p-8 hover:border-blue-corporate/50 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-corporate/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="w-14 h-14 bg-corporate-800 rounded-2xl flex items-center justify-center text-gray-400 font-black text-xl group-hover:bg-blue-corporate group-hover:text-white transition-all shadow-inner">
                {emp.name.charAt(0)}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => onDelete(emp.id!)}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                  emp.status === 'active' 
                    ? "bg-green-500/10 text-green-500 border-green-500/20" 
                    : "bg-red-500/10 text-red-500 border-red-500/20"
                )}>
                  {emp.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
            
            <div className="relative z-10">
              <h3 className="font-black text-xl text-white mb-1 group-hover:text-blue-corporate transition-colors">{emp.name}</h3>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">{emp.code}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-corporate-800/50 p-3 rounded-xl border border-corporate-700/50">
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">SBC Diario</p>
                  <p className="text-sm font-black text-white">{formatCurrency(emp.sbc)}</p>
                </div>
                <div className="bg-corporate-800/50 p-3 rounded-xl border border-corporate-700/50">
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Régimen</p>
                  <p className="text-sm font-black text-white">{emp.paymentRegimen}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => onEdit(emp)}
                  className="flex-1 dark-button-secondary py-2 text-xs"
                >
                  <Edit className="w-3 h-3" />
                  Editar Perfil
                </button>
                <button className="p-2 bg-corporate-800 text-gray-400 hover:text-white hover:bg-corporate-700 rounded-xl transition-all border border-corporate-700">
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CronogramView({ 
  employees, 
  year, 
  holidays, 
  attendanceRecords,
  shifts,
  incidences,
  paymentTypes,
  onYearChange 
}: { 
  employees: Employee[], 
  year: number, 
  holidays: Holiday[], 
  attendanceRecords: AttendanceRecord[],
  shifts: ShiftDefinition[],
  incidences: IncidenceDefinition[],
  paymentTypes: PaymentType[],
  onYearChange: (y: number) => void 
}) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Roles de Turno {year}</h2>
          <p className="text-gray-500 text-sm font-medium">Cronograma anual de turnos, descansos y vacaciones.</p>
        </div>
        <div className="flex gap-2 bg-corporate-900 p-1.5 rounded-2xl border border-corporate-800 shadow-xl">
          <button 
            onClick={() => onYearChange(year - 1)}
            className="p-2.5 text-gray-400 hover:text-white hover:bg-corporate-800 rounded-xl transition-all"
          ><ChevronLeft className="w-5 h-5" /></button>
          <div className="px-6 flex items-center justify-center">
            <span className="text-lg font-black text-white tracking-tighter">{year}</span>
          </div>
          <button 
            onClick={() => onYearChange(year + 1)}
            className="p-2.5 text-gray-400 hover:text-white hover:bg-corporate-800 rounded-xl transition-all"
          ><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>
      
      <div className="dark-card p-1 overflow-hidden">
        <ShiftCronogram 
          employees={employees} 
          year={year} 
          customHolidays={holidays} 
          attendanceRecords={attendanceRecords}
          shifts={shifts}
          incidences={incidences}
          paymentTypes={paymentTypes}
        />
      </div>
    </div>
  );
}

function ShiftConfig({ shifts, onSave }: { shifts: ShiftDefinition[], onSave: (s: ShiftDefinition) => void }) {
  const [editingShift, setEditingShift] = useState<Partial<ShiftDefinition> | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-white">Definición de Turnos</h3>
        <button 
          onClick={() => setEditingShift({ name: '', startTime: '09:00', endTime: '18:00', totalHours: 8 })}
          className="dark-button-primary py-2 text-xs"
        >
          <Plus className="w-4 h-4" />
          Agregar Turno
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shifts.map(shift => (
          <div key={shift.id} className="bg-corporate-800/50 border border-corporate-700 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="font-bold text-white">{shift.name}</p>
              <p className="text-xs text-gray-500">{shift.startTime} - {shift.endTime} ({shift.totalHours}h)</p>
            </div>
            <button 
              onClick={() => setEditingShift(shift)}
              className="p-2 text-gray-400 hover:text-blue-corporate hover:bg-blue-corporate/10 rounded-lg transition-all"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {editingShift && (
        <div className="fixed inset-0 bg-corporate-950/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="dark-card p-8 w-full max-w-md"
          >
            <h3 className="text-xl font-black text-white mb-6">Configurar Turno</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Nombre del Turno</label>
                <input 
                  type="text" 
                  className="dark-input w-full"
                  value={editingShift.name}
                  onChange={e => setEditingShift({ ...editingShift, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Entrada</label>
                  <input 
                    type="time" 
                    className="dark-input w-full"
                    value={editingShift.startTime}
                    onChange={e => setEditingShift({ ...editingShift, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Salida</label>
                  <input 
                    type="time" 
                    className="dark-input w-full"
                    value={editingShift.endTime}
                    onChange={e => setEditingShift({ ...editingShift, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Horas Totales</label>
                <input 
                  type="number" 
                  className="dark-input w-full"
                  value={editingShift.totalHours}
                  onChange={e => setEditingShift({ ...editingShift, totalHours: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setEditingShift(null)}
                className="flex-1 dark-button-secondary"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  onSave(editingShift as ShiftDefinition);
                  setEditingShift(null);
                }}
                className="flex-1 dark-button-primary"
              >
                Guardar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function IncidenceConfig({ incidences, onSave }: { incidences: IncidenceDefinition[], onSave: (i: IncidenceDefinition) => void }) {
  const [editingIncidence, setEditingIncidence] = useState<Partial<IncidenceDefinition> | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-white">Catálogo de Incidencias</h3>
        <button 
          onClick={() => setEditingIncidence({ name: '', type: 'neutral', affectsHours: true })}
          className="dark-button-primary py-2 text-xs"
        >
          <Plus className="w-4 h-4" />
          Nueva Incidencia
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {incidences.map(inc => (
          <div key={inc.id} className="bg-corporate-800/50 border border-corporate-700 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="font-bold text-white">{inc.name}</p>
              <div className="flex gap-2 mt-1">
                <span className={cn(
                  "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                  inc.type === 'positive' ? "bg-green-500/10 text-green-500" : 
                  inc.type === 'negative' ? "bg-red-500/10 text-red-500" : "bg-gray-500/10 text-gray-500"
                )}>
                  {inc.type}
                </span>
                {inc.affectsHours && <span className="px-2 py-0.5 bg-blue-500/10 text-blue-corporate rounded text-[8px] font-black uppercase tracking-widest">Afecta Horas</span>}
              </div>
            </div>
            <button 
              onClick={() => setEditingIncidence(inc)}
              className="p-2 text-gray-400 hover:text-blue-corporate hover:bg-blue-corporate/10 rounded-lg transition-all"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {editingIncidence && (
        <div className="fixed inset-0 bg-corporate-950/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="dark-card p-8 w-full max-w-md"
          >
            <h3 className="text-xl font-black text-white mb-6">Configurar Incidencia</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Nombre de la Incidencia</label>
                <input 
                  type="text" 
                  className="dark-input w-full"
                  value={editingIncidence.name}
                  onChange={e => setEditingIncidence({ ...editingIncidence, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Tipo de Impacto</label>
                <select 
                  className="dark-input w-full"
                  value={editingIncidence.type}
                  onChange={e => setEditingIncidence({ ...editingIncidence, type: e.target.value as any })}
                >
                  <option value="positive">Positivo (Extra)</option>
                  <option value="negative">Negativo (Falta/Retardo)</option>
                  <option value="neutral">Neutral (Permiso/Vacaciones)</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="affectsHours"
                  className="w-4 h-4 rounded border-corporate-700 bg-corporate-800 text-blue-corporate focus:ring-blue-corporate"
                  checked={editingIncidence.affectsHours}
                  onChange={e => setEditingIncidence({ ...editingIncidence, affectsHours: e.target.checked })}
                />
                <label htmlFor="affectsHours" className="text-sm font-bold text-gray-300">Afecta el cálculo de horas</label>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="isOvertime"
                  className="w-4 h-4 rounded border-corporate-700 bg-corporate-800 text-blue-corporate focus:ring-blue-corporate"
                  checked={editingIncidence.isOvertime}
                  onChange={e => setEditingIncidence({ ...editingIncidence, isOvertime: e.target.checked })}
                />
                <label htmlFor="isOvertime" className="text-sm font-bold text-gray-300">Es considerada Hora Extra</label>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setEditingIncidence(null)}
                className="flex-1 dark-button-secondary"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  onSave(editingIncidence as IncidenceDefinition);
                  setEditingIncidence(null);
                }}
                className="flex-1 dark-button-primary"
              >
                Guardar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
function PaymentTypeConfig({ paymentTypes, onSave }: { paymentTypes: PaymentType[], onSave: (p: PaymentType) => void }) {
  const [editingPaymentType, setEditingPaymentType] = useState<Partial<PaymentType> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ text: string, sources: { title: string, uri: string }[] } | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const result = await GeminiService.searchLaborLaw(searchQuery);
    setSearchResult(result);
    setIsSearching(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-white">Tipos de Pago (LFT)</h3>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Configura los multiplicadores según la ley</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowSearchModal(true)}
            className="dark-button-secondary py-2 text-xs"
          >
            <Search className="w-4 h-4" />
            Consultar LFT
          </button>
          <button 
            onClick={() => setEditingPaymentType({ name: '', multiplier: 1, description: '' })}
            className="dark-button-primary py-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            Nuevo Tipo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentTypes.map(pt => (
          <div key={pt.id} className="bg-corporate-800/50 border border-corporate-700 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="font-bold text-white">{pt.name}</p>
              <p className="text-[10px] text-gray-500 font-medium">{pt.description}</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-corporate rounded text-[8px] font-black uppercase tracking-widest">
                  Factor: x{pt.multiplier}
                </span>
                {pt.isSundayPremium && <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded text-[8px] font-black uppercase tracking-widest">Prima Dominical</span>}
              </div>
            </div>
            <button 
              onClick={() => setEditingPaymentType(pt)}
              className="p-2 text-gray-400 hover:text-blue-corporate hover:bg-blue-corporate/10 rounded-lg transition-all"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {showSearchModal && (
          <div className="fixed inset-0 bg-corporate-950/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="dark-card p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white">Consulta Legal (Gemini + LFT)</h3>
                <button onClick={() => setShowSearchModal(false)} className="text-gray-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex gap-2 mb-6">
                <input 
                  type="text"
                  className="dark-input flex-1"
                  placeholder="Ej: ¿Cómo se pagan las horas extras?"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <button 
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="dark-button-primary"
                >
                  {isSearching ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Buscar
                </button>
              </div>

              {searchResult && (
                <div className="space-y-6">
                  <div className="prose prose-invert max-w-none bg-corporate-800/50 p-6 rounded-xl border border-corporate-700">
                    <ReactMarkdown>{searchResult.text}</ReactMarkdown>
                  </div>

                  {searchResult.sources.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Fuentes y Referencias</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {searchResult.sources.map((source, idx) => (
                          <a 
                            key={idx}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 bg-corporate-800 hover:bg-corporate-700 rounded-lg border border-corporate-700 transition-all group"
                          >
                            <span className="text-xs font-bold text-gray-300 group-hover:text-blue-corporate">{source.title}</span>
                            <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-blue-corporate" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {editingPaymentType && (
        <div className="fixed inset-0 bg-corporate-950/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="dark-card p-8 w-full max-w-md"
          >
            <h3 className="text-xl font-black text-white mb-6">Configurar Tipo de Pago</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Nombre</label>
                <input 
                  type="text" 
                  className="dark-input w-full"
                  value={editingPaymentType.name}
                  onChange={e => setEditingPaymentType({ ...editingPaymentType, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Multiplicador (LFT)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="dark-input w-full"
                  value={editingPaymentType.multiplier}
                  onChange={e => setEditingPaymentType({ ...editingPaymentType, multiplier: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Descripción</label>
                <textarea 
                  className="dark-input w-full h-20"
                  value={editingPaymentType.description}
                  onChange={e => setEditingPaymentType({ ...editingPaymentType, description: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="isSundayPremium"
                  className="w-4 h-4 rounded border-corporate-700 bg-corporate-800 text-blue-corporate focus:ring-blue-corporate"
                  checked={editingPaymentType.isSundayPremium}
                  onChange={e => setEditingPaymentType({ ...editingPaymentType, isSundayPremium: e.target.checked })}
                />
                <label htmlFor="isSundayPremium" className="text-sm font-bold text-gray-300">Es Prima Dominical (25%)</label>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setEditingPaymentType(null)}
                className="flex-1 dark-button-secondary"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  onSave(editingPaymentType as PaymentType);
                  setEditingPaymentType(null);
                }}
                className="flex-1 dark-button-primary"
              >
                Guardar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function AdminView({ appUsers, onUpdateUser }: { appUsers: AppUser[], onUpdateUser: (uid: string, data: Partial<AppUser>) => void }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight">Administración de Usuarios</h2>
        <p className="text-gray-500 text-sm font-medium">Autoriza o deniega el acceso a la plataforma.</p>
      </div>

      <div className="dark-card overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-corporate-900/50 border-b border-corporate-800">
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Usuario</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Email</th>
              <th className="px-6 py-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">Estado</th>
              <th className="px-6 py-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">Rol</th>
              <th className="px-6 py-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-corporate-800/50">
            {appUsers.map(user => (
              <tr key={user.uid} className="hover:bg-corporate-800/20 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-black text-white tracking-tight">{user.displayName}</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Creado: {new Date(user.createdAt).toLocaleDateString()}</p>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-300">{user.email}</td>
                <td className="px-6 py-4 text-center">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    user.status === 'approved' ? "bg-green-500/10 text-green-500" :
                    user.status === 'denied' ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"
                  )}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <select 
                    className="dark-input text-[10px] py-1"
                    value={user.role}
                    onChange={(e) => onUpdateUser(user.uid, { role: e.target.value as any })}
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2">
                    {user.status !== 'approved' && (
                      <button 
                        onClick={() => onUpdateUser(user.uid, { status: 'approved' })}
                        className="p-2 text-green-500 hover:bg-green-500/10 rounded-xl transition-all"
                        title="Aprobar"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    {user.status !== 'denied' && (
                      <button 
                        onClick={() => onUpdateUser(user.uid, { status: 'denied' })}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Denegar"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConfigView({ 
  isrTables, 
  holidays, 
  shifts,
  incidences,
  paymentTypes,
  year, 
  onSaveISR, 
  onSaveHolidays,
  onSaveShift,
  onSaveIncidence,
  onSavePaymentType
}: { 
  isrTables: ISRTable[], 
  holidays: Holiday[], 
  shifts: ShiftDefinition[],
  incidences: IncidenceDefinition[],
  paymentTypes: PaymentType[],
  year: number, 
  onSaveISR: (t: ISRTable) => void, 
  onSaveHolidays: (h: Holiday[]) => void,
  onSaveShift: (s: ShiftDefinition) => void,
  onSaveIncidence: (i: IncidenceDefinition) => void,
  onSavePaymentType: (p: PaymentType) => void
}) {
  const [configTab, setConfigTab] = useState<'isr' | 'holidays' | 'shifts' | 'incidences' | 'paymentTypes'>('isr');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAutoUpdateISR = async () => {
    setIsUpdating(true);
    try {
      const table = await GeminiService.fetchOfficialISRTable(year, 'monthly');
      if (table) onSaveISR(table);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAutoUpdateHolidays = async () => {
    setIsUpdating(true);
    try {
      const newHolidays = await GeminiService.fetchOfficialHolidays(year);
      if (newHolidays.length > 0) onSaveHolidays(newHolidays);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const configTabs = [
    { id: 'isr', label: 'Tablas ISR', icon: Calculator },
    { id: 'holidays', label: 'Días Festivos', icon: Calendar },
    { id: 'shifts', label: 'Turnos', icon: Clock },
    { id: 'incidences', label: 'Incidencias', icon: AlertTriangle },
    { id: 'paymentTypes', label: 'Tipos de Pago', icon: DollarSign },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Configuración</h2>
          <p className="text-gray-500 text-sm font-medium">Ajustes globales del sistema ERP.</p>
        </div>
        <div className="flex gap-3">
          {configTab === 'isr' && (
            <button 
              onClick={handleAutoUpdateISR}
              disabled={isUpdating}
              className="dark-button-secondary"
            >
              <RotateCcw className={cn("w-4 h-4", isUpdating && "animate-spin")} />
              Actualizar ISR (IA)
            </button>
          )}
          {configTab === 'holidays' && (
            <button 
              onClick={handleAutoUpdateHolidays}
              disabled={isUpdating}
              className="dark-button-secondary"
            >
              <RotateCcw className={cn("w-4 h-4", isUpdating && "animate-spin")} />
              Actualizar Festivos (IA)
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 bg-corporate-900/50 p-1.5 rounded-2xl border border-corporate-800 w-fit">
        {configTabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setConfigTab(tab.id as any)}
            className={cn(
              "px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2",
              configTab === tab.id 
                ? "bg-blue-corporate text-white shadow-lg shadow-blue-corporate/20 border border-blue-corporate/50" 
                : "text-gray-500 hover:text-gray-300"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {configTab === 'isr' && (
          <div className="dark-card p-8">
            <ISRTableConfig 
              onSave={onSaveISR} 
              initialTable={isrTables[0]} 
            />
          </div>
        )}
        {configTab === 'holidays' && (
          <div className="dark-card p-8">
            <HolidayConfig 
              year={year} 
              initialHolidays={holidays} 
              onSave={onSaveHolidays} 
            />
          </div>
        )}
        {configTab === 'shifts' && (
          <div className="dark-card p-8">
            <ShiftConfig 
              shifts={shifts}
              onSave={onSaveShift}
            />
          </div>
        )}
        {configTab === 'incidences' && (
          <div className="dark-card p-8">
            <IncidenceConfig 
              incidences={incidences}
              onSave={onSaveIncidence}
            />
          </div>
        )}
        {configTab === 'paymentTypes' && (
          <div className="dark-card p-8">
            <PaymentTypeConfig 
              paymentTypes={paymentTypes}
              onSave={onSavePaymentType}
            />
          </div>
        )}
      </div>
    </div>
  );
}
