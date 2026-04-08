import React, { useState } from 'react';
import { User, Briefcase, Calendar, DollarSign, Clock, Save, X, Wallet } from 'lucide-react';
import { Employee, WorkDays, PaymentRegimen, ShiftDefinition } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface Props {
  onSave: (employee: Employee) => void;
  onClose: () => void;
  initialData?: Employee;
  shifts: ShiftDefinition[];
}

export default function EmployeeForm({ onSave, onClose, initialData, shifts }: Props) {
  const [formData, setFormData] = useState<Partial<Employee>>(initialData || {
    code: '',
    name: '',
    sbc: 0,
    entryDate: new Date().toISOString().split('T')[0],
    birthDate: '1990-01-01',
    shiftId: shifts[0]?.id || '',
    workDays: WorkDays.MON_FRI,
    customWorkDays: [1, 2, 3, 4, 5],
    paymentRegimen: PaymentRegimen.SEMI_MONTHLY,
    vacationsTaken: 0,
    permissionsHours: 0,
    status: 'active',
  });

  const daysOfWeek = [
    { label: 'D', value: 0 },
    { label: 'L', value: 1 },
    { label: 'M', value: 2 },
    { label: 'M', value: 3 },
    { label: 'J', value: 4 },
    { label: 'V', value: 5 },
    { label: 'S', value: 6 },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as Employee);
  };

  const toggleDay = (day: number) => {
    const current = formData.customWorkDays || [];
    if (current.includes(day)) {
      setFormData({ ...formData, customWorkDays: current.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, customWorkDays: [...current, day].sort() });
    }
  };

  return (
    <div className="fixed inset-0 bg-corporate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="dark-card w-full max-w-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-corporate-800 flex justify-between items-center bg-corporate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-corporate/10 rounded-2xl flex items-center justify-center">
              <User className="text-blue-corporate w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {initialData ? 'Editar Colaborador' : 'Nuevo Colaborador'}
              </h2>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Información de Contratación</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-corporate-800 rounded-xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-thin">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Basic Info */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Briefcase className="w-3 h-3" /> Datos Generales
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Código de Empleado</label>
                  <input
                    type="text"
                    required
                    className="dark-input w-full"
                    placeholder="E-001"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    className="dark-input w-full"
                    placeholder="Nombre del colaborador"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Fecha de Ingreso</label>
                    <input
                      type="date"
                      required
                      className="dark-input w-full"
                      value={formData.entryDate}
                      onChange={e => setFormData({ ...formData, entryDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Nacimiento</label>
                    <input
                      type="date"
                      required
                      className="dark-input w-full"
                      value={formData.birthDate}
                      onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payroll & Shift */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Wallet className="w-3 h-3" /> Nómina y Horarios
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">SBC (Salario Diario)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="dark-input w-full pl-8"
                      value={formData.sbc}
                      onChange={e => setFormData({ ...formData, sbc: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Régimen de Pago</label>
                  <select
                    className="dark-input w-full"
                    value={formData.paymentRegimen}
                    onChange={e => setFormData({ ...formData, paymentRegimen: e.target.value as PaymentRegimen })}
                  >
                    {Object.values(PaymentRegimen).map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Turno Asignado</label>
                  <select
                    className="dark-input w-full"
                    value={formData.shiftId}
                    onChange={e => setFormData({ ...formData, shiftId: e.target.value })}
                  >
                    {shifts.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.startTime}-{s.endTime})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Días de Trabajo</label>
                  <select
                    className="dark-input w-full mb-3"
                    value={formData.workDays}
                    onChange={e => setFormData({ ...formData, workDays: e.target.value as WorkDays })}
                  >
                    {Object.values(WorkDays).map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>

                  {formData.workDays === WorkDays.CUSTOM && (
                    <div className="flex justify-between gap-1">
                      {daysOfWeek.map(day => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={cn(
                            "w-8 h-8 rounded-lg text-[10px] font-black transition-all border",
                            formData.customWorkDays?.includes(day.value)
                              ? "bg-blue-corporate text-white border-blue-corporate shadow-lg shadow-blue-corporate/20"
                              : "bg-corporate-800 text-gray-500 border-corporate-700 hover:border-gray-500"
                          )}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-8 border-t border-corporate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 dark-button-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 dark-button-primary"
            >
              <Save className="w-5 h-5" />
              {initialData ? 'Actualizar' : 'Registrar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
