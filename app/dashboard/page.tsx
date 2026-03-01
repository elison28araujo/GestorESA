'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { 
  Tv, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut, 
  Search, 
  Plus, 
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  Calendar
} from 'lucide-react';
import DashboardHome from '@/components/dashboard/DashboardHome';
import ClientsSection from '@/components/dashboard/ClientsSection';
import ServersSection from '@/components/dashboard/ServersSection';
import FinanceSection from '@/components/dashboard/FinanceSection';
import SettingsSection from '@/components/dashboard/SettingsSection';
import PlansSection from '@/components/dashboard/PlansSection';
import { supabase } from '@/lib/supabase';


export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [activeSection, setActiveSection] = useState('dashboard');
  const [customers, setCustomers] = useState<any[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: customersData, error: customersErr } = await supabase
          .from('customers')
          .select('*');

        if (customersErr) throw customersErr;
        setCustomers(customersData ?? []);

        const { data: serversData, error: serversErr } = await supabase
          .from('servers')
          .select('*');

        if (serversErr) throw serversErr;
        setServers(serversData ?? []);

        const { data: transactionsData, error: transactionsErr } = await supabase
          .from('transactions')
          .select('*');

        if (transactionsErr) throw transactionsErr;
        setTransactions(transactionsData ?? []);
      } catch (error) {
        console.error('Error fetching data from Supabase:', error);
      }
    };

    fetchData();
  }, []);

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    if (isMobile) setSidebarOpen(false);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardHome customers={customers} setCustomers={setCustomers} StatusBadge={StatusBadge} />;
      case 'clients':
        return <ClientsSection customers={customers} setCustomers={setCustomers} servers={servers} StatusBadge={StatusBadge} />;
      case 'servers':
        return <ServersSection servers={servers} setServers={setServers} />;
      case 'finance':
        return <FinanceSection transactions={transactions} setTransactions={setTransactions} />;
      case 'plans':
        return <PlansSection />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <DashboardHome customers={customers} setCustomers={setCustomers} StatusBadge={StatusBadge} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'}
        ${sidebarOpen ? 'w-64' : 'w-0 lg:w-20'} 
        bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col overflow-hidden
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg text-white shrink-0">
              <Tv className="w-6 h-6" />
            </div>
            {(sidebarOpen || isMobile) && <span className="font-bold text-xl text-slate-900 dark:text-white truncate">IPTV Control</span>}
          </div>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500">
              <Plus className="w-5 h-5 rotate-45" />
            </button>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem 
            icon={Activity} 
            label="Dashboard" 
            active={activeSection === 'dashboard'} 
            sidebarOpen={sidebarOpen || isMobile} 
            onClick={() => handleSectionChange('dashboard')}
          />
          <SidebarItem 
            icon={Users} 
            label="Clientes" 
            active={activeSection === 'clients'}
            sidebarOpen={sidebarOpen || isMobile} 
            onClick={() => handleSectionChange('clients')}
          />
          <SidebarItem 
            icon={Tv} 
            label="Servidores" 
            active={activeSection === 'servers'}
            sidebarOpen={sidebarOpen || isMobile} 
            onClick={() => handleSectionChange('servers')}
          />
          <SidebarItem 
            icon={CreditCard} 
            label="Financeiro" 
            active={activeSection === 'finance'}
            sidebarOpen={sidebarOpen || isMobile} 
            onClick={() => handleSectionChange('finance')}
          />
          <SidebarItem 
            icon={Calendar} 
            label="Planos" 
            active={activeSection === 'plans'}
            sidebarOpen={sidebarOpen || isMobile} 
            onClick={() => handleSectionChange('plans')}
          />
          <SidebarItem 
            icon={Settings} 
            label="Configurações" 
            active={activeSection === 'settings'}
            sidebarOpen={sidebarOpen || isMobile} 
            onClick={() => handleSectionChange('settings')}
          />
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {(sidebarOpen || isMobile) && <span className="font-medium">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header */}
        <header className="h-16 lg:h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
            >
              <Activity className="w-5 h-5" />
            </button>
            <div className="relative w-full hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border-2 border-white dark:border-slate-700 relative">
              <Image 
                src="https://picsum.photos/seed/admin/40/40" 
                alt="Admin" 
                fill 
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderSection()}
          </div>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active = false, sidebarOpen, onClick }: { icon: any, label: string, active?: boolean, sidebarOpen: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {sidebarOpen && <span className="font-medium truncate">{label}</span>}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    'Ativo': 'bg-emerald-100 text-emerald-600 border-emerald-200',
    'Vencendo': 'bg-amber-100 text-amber-600 border-amber-200',
    'Inativo': 'bg-red-100 text-red-600 border-red-200',
  }[status] || 'bg-slate-100 text-slate-600 border-slate-200';

  const Icon = {
    'Ativo': CheckCircle2,
    'Vencendo': Clock,
    'Inativo': AlertCircle,
  }[status] || AlertCircle;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${styles}`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  );
}