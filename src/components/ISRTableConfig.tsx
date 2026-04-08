import React, { useState } from 'react';
import { Plus, Trash2, Save, RotateCcw } from 'lucide-react';
import { ISRTable, ISRRow } from '../types';
import { cn, formatCurrency } from '../lib/utils';

interface Props {
  onSave: (table: ISRTable) => void;
  initialTable?: ISRTable;
}

export default function ISRTableConfig({ onSave, initialTable }: Props) {
  const [table, setTable] = useState<ISRTable>(initialTable || {
    year: new Date().getFullYear(),
    type: 'monthly',
    rows: [
      { lowerLimit: 0.01, upperLimit: 746.04, fixedFee: 0, rate: 1.92 },
      { lowerLimit: 746.05, upperLimit: 6332.05, fixedFee: 14.32, rate: 6.40 },
    ]
  });

  const addRow = () => {
    const lastRow = table.rows[table.rows.length - 1];
    const newRow: ISRRow = {
      lowerLimit: lastRow ? lastRow.upperLimit + 0.01 : 0.01,
      upperLimit: lastRow ? lastRow.upperLimit + 1000 : 1000,
      fixedFee: 0,
      rate: 0
    };
    setTable({ ...table, rows: [...table.rows, newRow] });
  };

  const removeRow = (index: number) => {
    const newRows = table.rows.filter((_, i) => i !== index);
    setTable({ ...table, rows: newRows });
  };

  const updateRow = (index: number, field: keyof ISRRow, value: number) => {
    const newRows = [...table.rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setTable({ ...table, rows: newRows });
  };

  return (
    <div className="bg-corporate-900 border border-corporate-800 rounded-2xl shadow-2xl overflow-hidden">
      <div className="p-8 border-b border-corporate-800 flex items-center justify-between bg-corporate-900/50">
        <div className="flex items-center gap-6">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Año Fiscal</label>
            <input 
              type="number" 
              className="dark-input w-28"
              value={table.year}
              onChange={(e) => setTable({ ...table, year: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Tipo de Tabla</label>
            <select 
              className="dark-input min-w-[160px]"
              value={table.type}
              onChange={(e) => setTable({ ...table, type: e.target.value as any })}
            >
              <option value="weekly">Semanal</option>
              <option value="biweekly">Catorcenal</option>
              <option value="semi-monthly">Quincenal</option>
              <option value="monthly">Mensual</option>
            </select>
          </div>
        </div>
        <button 
          onClick={() => onSave(table)}
          className="dark-button-primary"
        >
          <Save className="w-4 h-4" />
          Guardar Cambios
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-corporate-950/50 border-b border-corporate-800">
              <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Límite Inferior</th>
              <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Límite Superior</th>
              <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Cuota Fija</th>
              <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Tasa (%)</th>
              <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-corporate-800/50">
            {table.rows.map((row, index) => (
              <tr key={index} className="hover:bg-corporate-800/20 transition-colors">
                <td className="px-8 py-4">
                  <input 
                    type="number" 
                    className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 font-black text-white"
                    value={row.lowerLimit}
                    onChange={(e) => updateRow(index, 'lowerLimit', parseFloat(e.target.value))}
                  />
                </td>
                <td className="px-8 py-4">
                  <input 
                    type="number" 
                    className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 font-black text-white"
                    value={row.upperLimit}
                    onChange={(e) => updateRow(index, 'upperLimit', parseFloat(e.target.value))}
                  />
                </td>
                <td className="px-8 py-4">
                  <input 
                    type="number" 
                    className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 font-black text-white"
                    value={row.fixedFee}
                    onChange={(e) => updateRow(index, 'fixedFee', parseFloat(e.target.value))}
                  />
                </td>
                <td className="px-8 py-4">
                  <div className="flex items-center gap-1">
                    <input 
                      type="number" 
                      className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 font-black text-blue-corporate"
                      value={row.rate}
                      onChange={(e) => updateRow(index, 'rate', parseFloat(e.target.value))}
                    />
                    <span className="text-gray-600 text-xs font-black">%</span>
                  </div>
                </td>
                <td className="px-8 py-4 text-right">
                  <button 
                    onClick={() => removeRow(index)}
                    className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-corporate-950/30 border-t border-corporate-800">
        <button 
          onClick={addRow}
          className="w-full py-4 border-2 border-dashed border-corporate-800 rounded-2xl text-xs font-black text-gray-500 hover:border-blue-corporate/50 hover:text-blue-corporate hover:bg-blue-corporate/5 transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
        >
          <Plus className="w-4 h-4" />
          Añadir Renglón de Rango
        </button>
      </div>
    </div>
  );
}
