export enum ShiftType {
  FIRST = '1ro',
  SECOND = '2do',
  THIRD = '3ro',
  MORNING_12 = '12h Matutino',
  NIGHT_12 = '12h Nocturno',
  CUSTOM = 'Personalizado'
}

export enum WorkDays {
  MON_FRI = 'Lunes a Viernes',
  MON_SAT = 'Lunes a Sábado',
  CUSTOM = 'Personalizado'
}

export enum PaymentRegimen {
  HOURLY = 'Por Hora',
  DAILY = 'Por Día',
  WEEKLY = 'Semanal',
  BIWEEKLY = 'Catorcenal',
  SEMI_MONTHLY = 'Quincenal',
  MONTHLY = 'Mensual'
}

export interface PaymentType {
  id: string;
  name: string;
  multiplier: number; // e.g., 2 for double, 3 for triple
  description: string;
  isSundayPremium?: boolean;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  status: 'pending' | 'approved' | 'denied';
  role: 'admin' | 'user';
  createdAt: string;
}

export enum IncidenceType {
  ABSENCE = 'Falta',
  LATE = 'Retardo',
  EARLY_EXIT = 'Salida Anticipada',
  OVERTIME = 'Horas Extras',
  VACATION = 'Vacaciones',
  PERMISSION = 'Permiso',
  REPOSITION = 'Reposición de Horas',
  SICK_LEAVE = 'Incapacidad',
  HOLIDAY = 'Festivo',
  REST = 'Descanso'
}

export interface ISRRow {
  lowerLimit: number;
  upperLimit: number;
  fixedFee: number;
  rate: number;
}

export interface ISRTable {
  id?: string;
  year: number;
  type: 'weekly' | 'biweekly' | 'semi-monthly' | 'monthly';
  rows: ISRRow[];
}

export interface Employee {
  id: string;
  code: string;
  name: string;
  sbc: number; // Salario Base de Cotización
  entryDate: string;
  birthDate: string;
  shiftId: string; // Linked to ShiftDefinition
  workDays: WorkDays;
  customWorkDays?: number[]; // [0, 1, 2, 3, 4, 5, 6] where 0 is Sunday
  paymentRegimen: PaymentRegimen;
  vacationsTaken: number;
  permissionsHours: number;
  status: 'active' | 'inactive';
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  hoursWorked: number;
  overtime: number;
  deficit: number;
  incidenceId?: string;
  incidenceType?: IncidenceType;
  notes?: string;
  isPending: boolean; // Orange indicator if true
  isRestDayWorked?: boolean;
  isSundayWorked?: boolean;
  paymentTypeId?: string;
}

export interface ShiftDefinition {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  isDefault?: boolean;
}

export interface IncidenceDefinition {
  id: string;
  name: string;
  type: 'positive' | 'negative' | 'neutral';
  affectsHours: boolean;
  isOvertime?: boolean;
  isReposition?: boolean;
}

export interface VacationRequest {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Holiday {
  date: string;
  name: string;
  isFederal: boolean;
}

export interface PayrollReport {
  employeeId: string;
  period: string;
  totalDaysWorked: number;
  totalHoursWorked: number;
  totalOvertimeHours: number;
  totalDeficitHours: number;
  baseSalary: number;
  overtimePay: number;
  restDayPay: number;
  sundayPremium: number;
  grossSalary: number;
  isr: number;
  vacationPremium: number;
  netSalary: number;
  observations: string;
}
