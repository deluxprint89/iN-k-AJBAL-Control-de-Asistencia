/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import AttendanceDashboard from './components/AttendanceDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { auth, googleProvider } from './firebase';
import { onAuthStateChanged, User, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-corporate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-corporate border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-corporate-950 flex items-center justify-center p-4 font-sans">
        <div className="bg-corporate-900 rounded-[2.5rem] shadow-2xl p-12 max-w-md w-full text-center border border-corporate-800">
          <div className="w-24 h-24 bg-blue-corporate rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-corporate/20">
            <LogIn className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tighter">Asistencia v2.0 ERP</h1>
          <p className="text-gray-500 mb-10 leading-relaxed font-medium">Bienvenido al sistema de gestión de personal. Por favor, inicie sesión para continuar.</p>
          <button
            onClick={handleLogin}
            className="w-full py-4 bg-blue-corporate text-white rounded-2xl font-black shadow-xl shadow-blue-corporate/10 hover:bg-blue-600 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
          >
            <img src="https://www.gstatic.com/firebase/builtwith/google.svg" alt="Google" className="w-5 h-5 bg-white rounded-full p-0.5" />
            Iniciar sesión con Google
          </button>
          <p className="mt-8 text-[10px] text-gray-600 uppercase tracking-[0.3em] font-black">Sistema de Gestión Empresarial</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-corporate-950">
        <AttendanceDashboard user={user} onLogout={handleLogout} />
      </div>
    </ErrorBoundary>
  );
}
