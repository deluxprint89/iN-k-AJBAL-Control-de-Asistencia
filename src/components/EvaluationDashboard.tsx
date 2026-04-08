import React, { useMemo, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  UserCheck, 
  Calendar, 
  User,
  ChevronDown,
  ChevronUp,
  Award,
  Zap,
  Target
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  Employee, 
  AttendanceRecord, 
  ShiftDefinition, 
  IncidenceType 
} from '../types';
import { cn, formatHours } from '../lib/utils';

interface EvaluationDashboardProps {
  employees: Employee[];
  records: AttendanceRecord[];
  shifts: ShiftDefinition[];
}

export default function EvaluationDashboard({ employees, records, shifts }: EvaluationDashboardProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | 'all'>('all');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  const timeToMinutes = (timeStr?: string) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const stats = useMemo(() => {
    const filteredRecords = records.filter(r => {
      if (selectedEmployeeId !== 'all' && r.employeeId !== selectedEmployeeId) return false;
      
      const recordDate = new Date(r.date);
      const now = new Date();
      if (timeRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return recordDate >= weekAgo;
      }
      if (timeRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return recordDate >= monthAgo;
      }
      return true;
    });

    let early = 0;
    let justInTime = 0;
    let late = 0;
    let absences = 0;
    let permissions = 0;
    let overtimeCount = 0;
    let totalOvertime = 0;

    const overtimeByDay: Record<string, number> = {
      'Lunes': 0, 'Martes': 0, 'Miércoles': 0, 'Jueves': 0, 'Viernes': 0, 'Sábado': 0, 'Domingo': 0
    };

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    filteredRecords.forEach(r => {
      const employee = employees.find(e => e.id === r.employeeId);
      const shift = shifts.find(s => s.id === employee?.shiftId);

      if (r.incidenceType === IncidenceType.ABSENCE) absences++;
      if (r.incidenceType === IncidenceType.PERMISSION) permissions++;
      
      if (r.checkIn && shift) {
        const checkInMin = timeToMinutes(r.checkIn);
        const startMin = timeToMinutes(shift.startTime);
        
        if (checkInMin <= startMin - 10) early++;
        else if (checkInMin > startMin - 5 && checkInMin <= startMin) justInTime++;
        else if (checkInMin > startMin + 10) late++;
      }

      if (r.overtime > 0) {
        overtimeCount++;
        totalOvertime += r.overtime;
        const day = dayNames[new Date(r.date).getUTCDay()];
        overtimeByDay[day] += r.overtime;
      }
    });

    const arrivalData = [
      { name: 'Temprano', value: early, color: '#10b981' },
      { name: 'Justo', value: justInTime, color: '#3b82f6' },
      { name: 'Tarde', value: late, color: '#ef4444' },
    ];

    const overtimeChartData = Object.entries(overtimeByDay).map(([name, value]) => ({ name, value }));

    return {
      early,
      justInTime,
      late,
      absences,
      permissions,
      overtimeCount,
      totalOvertime,
      arrivalData,
      overtimeChartData,
      totalRecords: filteredRecords.length
    };
  }, [records, employees, shifts, selectedEmployeeId, timeRange]);

  const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6'];

  return (
    <div className="p-6 lg:p-10 space-y-8 overflow-y-auto h-full pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">Evaluación de Desempeño</h2>
          <p className="text-gray-500 font-medium">Dashboard didáctico de rendimiento y puntualidad</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <select 
            className="dark-input py-2 text-xs min-w-[200px]"
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
          >
            <option value="all">Todos los Empleados</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name} ({emp.code})</option>
            ))}
          </select>

          <div className="flex bg-corporate-800 rounded-xl p-1 border border-corporate-700">
            {(['week', 'month', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  timeRange === range 
                    ? "bg-blue-corporate text-white shadow-lg shadow-blue-corporate/20" 
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                {range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : 'Año'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="dark-card p-6 border-l-4 border-l-emerald-500"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl">
              <UserCheck className="w-6 h-6 text-emerald-500" />
            </div>
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full uppercase tracking-widest">Excelente</span>
          </div>
          <p className="text-3xl font-black text-white mb-1">{stats.early}</p>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Entradas Temprano</p>
          <p className="text-[10px] text-gray-600 mt-2 font-medium">10+ min antes de su turno</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="dark-card p-6 border-l-4 border-l-blue-500"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-1 rounded-full uppercase tracking-widest">Puntual</span>
          </div>
          <p className="text-3xl font-black text-white mb-1">{stats.justInTime}</p>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Entradas Justas</p>
          <p className="text-[10px] text-gray-600 mt-2 font-medium">Faltando menos de 5 min</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="dark-card p-6 border-l-4 border-l-red-500"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-500/10 rounded-2xl">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-2 py-1 rounded-full uppercase tracking-widest">Crítico</span>
          </div>
          <p className="text-3xl font-black text-white mb-1">{stats.late}</p>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Entradas Tarde</p>
          <p className="text-[10px] text-gray-600 mt-2 font-medium">10+ min después de su turno</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="dark-card p-6 border-l-4 border-l-amber-500"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-amber-500" />
            </div>
            <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full uppercase tracking-widest">Productivo</span>
          </div>
          <p className="text-3xl font-black text-white mb-1">{formatHours(stats.totalOvertime)}</p>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Horas Extras Totales</p>
          <p className="text-[10px] text-gray-600 mt-2 font-medium">Acumulado en el periodo</p>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Arrival Distribution */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="dark-card p-8"
        >
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-corporate" />
            Distribución de Puntualidad
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.arrivalData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.arrivalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Overtime by Day */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="dark-card p-8"
        >
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Intensidad de Horas Extras por Día
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.overtimeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight="bold" />
                <YAxis stroke="#64748b" fontSize={10} fontWeight="bold" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-corporate-800/50 border border-corporate-700 rounded-[2rem] p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{stats.absences}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Faltas Registradas</p>
          </div>
        </div>

        <div className="bg-corporate-800/50 border border-corporate-700 rounded-[2rem] p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{stats.permissions}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Permisos Solicitados</p>
          </div>
        </div>

        <div className="bg-corporate-800/50 border border-corporate-700 rounded-[2rem] p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
            <Award className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{stats.overtimeCount}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Días con Horas Extras</p>
          </div>
        </div>
      </div>

      {/* Top Performers (Only if General) */}
      {selectedEmployeeId === 'all' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="dark-card p-8"
        >
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Cuadro de Honor (Puntualidad)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map(emp => {
              const empRecords = records.filter(r => r.employeeId === emp.id);
              const earlyCount = empRecords.filter(r => {
                const shift = shifts.find(s => s.id === emp.shiftId);
                if (!r.checkIn || !shift) return false;
                return timeToMinutes(r.checkIn) <= timeToMinutes(shift.startTime) - 10;
              }).length;

              return { emp, earlyCount };
            })
            .sort((a, b) => b.earlyCount - a.earlyCount)
            .slice(0, 3)
            .map(({ emp, earlyCount }, idx) => (
              <div key={emp.id} className="flex items-center gap-4 p-4 bg-corporate-800 rounded-2xl border border-corporate-700">
                <div className="w-10 h-10 bg-blue-corporate/10 rounded-xl flex items-center justify-center text-blue-corporate font-black">
                  #{idx + 1}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{emp.name}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{earlyCount} Entradas Temprano</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
