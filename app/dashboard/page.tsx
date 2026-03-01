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

const initialCustomers = [
  { id: 1, name: 'João Silva', email: 'joao@exemplo.com', plan: 'Premium 4K', status: 'Ativo', expiry: '20/03/2024', image: 'https://picsum.photos/seed/joao/40/40', server_id: null, login: '', password: '' },
  { id: 2, name: 'Maria Oliveira', email: 'maria@exemplo.com', plan: 'Standard HD', status: 'Vencendo', expiry: '02/03/2024', image: 'https://picsum.photos/seed/maria/40/40', server_id: null, login: '', password: '' },
  { id: 3, name: 'Pedro Santos', email: 'pedro@exemplo.com', plan: 'Basic SD', status: 'Inativo', expiry: '15/02/2024', image: 'https://picsum.photos/seed/pedro/40/40', server_id: null, login: '', password: '' },
  { id: 4, name: 'Ana Costa', email: 'ana@exemplo.com', plan: 'Premium 4K', status: 'Ativo', expiry: '12/04/2024', image: 'https://picsum.photos/seed/ana/40/40', server_id: null, login: '', password: '' },
  { id: 5, name: 'Lucas Lima', email: 'lucas@exemplo.com', plan: 'Standard HD', status: 'Ativo', expiry: '28/03/2024', image: 'https://picsum.photos/seed/lucas/40/40', server_id: null, login: '', password: '' },
];

const initialServers = [
  { id: 1, name: 'Servidor Principal', login: 'admin', password: 'password123', max_clients_per_user: 3, status: 'Online' },
];

const initialTransactions = [
  { id: 1, customer: 'João Silva', type: 'Receita', amount: 'R$ 49,90', date: '28/02/2024', method: 'Pix', status: 'Concluído' },
  { id: 2, customer: 'Servidor AWS', type: 'Despesa', amount: 'R$ 850,00', date: '27/02/2024', method: 'Cartão', status: 'Concluído' },
  { id: 3, customer: 'Maria Oliveira', type: 'Receita', amount: 'R$ 35,00', date: '27/02/2024', method: 'Boleto', status: 'Pendente' },
  { id: 4, customer: 'Lucas Lima', type: 'Receita', amount: 'R$ 49,90', date: '26/02/2024', method: 'Pix', status: 'Concluído' },
  { id: 5, customer: 'Cloudflare Inc', type: 'Despesa', amount: 'R$ 120,00', date: '25/02/2024', method: 'Cartão', status: 'Concluído' },
];

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [customers, setCustomers] = useState<any[]>(initialCustomers);
  const [servers, setServers] = useState<any[]>(initialServers);
  const [transactions, setTransactions] = useState<any[]>(initialTransactions);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: customersData } = await supabase.from('customers').select('*');
        if (customersData && customersData.length > 0) setCustomers(customersData);

        const { data: serversData } = await supabase.from('servers').select('*');
        if (serversData && serversData.length > 0) setServers(serversData);

        const { data: transactionsData } = await supabase.from('transactions').select('*');
        if (transactionsData && transactionsData.length > 0) setTransactions(transactionsData);
      } catch (error) {
        console.error('Error fetching data from Supabase:', error);
      }
    };

    fetchData();
  }, []);

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
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col`}>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg text-white shrink-0">
            <Tv className="w-6 h-6" />
          </div>
          {sidebarOpen && <span className="font-bold text-xl text-slate-900 dark:text-white truncate">IPTV Control</span>}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem 
            icon={Activity} 
            label="Dashboard" 
            active={activeSection === 'dashboard'} 
            sidebarOpen={sidebarOpen} 
            onClick={() => setActiveSection('dashboard')}
          />
          <SidebarItem 
            icon={Users} 
            label="Clientes" 
            active={activeSection === 'clients'}
            sidebarOpen={sidebarOpen} 
            onClick={() => setActiveSection('clients')}
          />
          <SidebarItem 
            icon={Tv} 
            label="Servidores" 
            active={activeSection === 'servers'}
            sidebarOpen={sidebarOpen} 
            onClick={() => setActiveSection('servers')}
          />
          <SidebarItem 
            icon={CreditCard} 
            label="Financeiro" 
            active={activeSection === 'finance'}
            sidebarOpen={sidebarOpen} 
            onClick={() => setActiveSection('finance')}
          />
          <SidebarItem 
            icon={Calendar} 
            label="Planos" 
            active={activeSection === 'plans'}
            sidebarOpen={sidebarOpen} 
            onClick={() => setActiveSection('plans')}
          />
          <SidebarItem 
            icon={Settings} 
            label="Configurações" 
            active={activeSection === 'settings'}
            sidebarOpen={sidebarOpen} 
            onClick={() => setActiveSection('settings')}
          />
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar em todo o sistema..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors md:hidden"
            >
              <Activity className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border-2 border-white dark:border-slate-700 relative">
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
        <div className="flex-1 overflow-y-auto p-8">
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
