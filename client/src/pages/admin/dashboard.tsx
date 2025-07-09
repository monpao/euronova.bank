import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/lib/auth.tsx";
import { ClientTable } from "@/components/admin/client-table";
import { useQuery } from "@tanstack/react-query";
import { User, Transaction, Account } from "@shared/schema";
import { 
  UserCircle, 
  ArrowLeftRight, 
  CreditCard, 
  Timer, 
  ArrowUp 
} from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { user } = useAuth();
  
  // Fetch users for stats
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: !!user,
  });
  
  // Fetch accounts for stats
  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
    enabled: !!user,
  });
  
  // Calculate stats
  const clientCount = users.filter(u => u.role === 'client').length;
  
  // Calculate total transaction volume (placeholder)
  const totalTransactions = 347892; // This would be calculated from transaction data
  
  // Calculate active cards count (placeholder)
  const activeCardsCount = 1845; // This would be calculated from cards data
  
  // Calculate pending verifications count (placeholder)
  const pendingVerifications = 57; // This would be calculated from verification data
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Header isAdmin />
      
      <div className="flex-1 container mx-auto p-4 md:p-6 md:ml-64">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Administration</h2>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between mb-4">
                <div>
                  <p className="text-neutral-500 text-sm">Clients</p>
                  <h3 className="text-2xl font-bold">{clientCount}</h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <UserCircle className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-success flex items-center">+12 <ArrowUp className="ml-1 h-3 w-3" /></span>
                <span className="text-xs text-neutral-500 ml-2">depuis hier</span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between mb-4">
                <div>
                  <p className="text-neutral-500 text-sm">Transactions</p>
                  <h3 className="text-2xl font-bold">€{totalTransactions.toLocaleString()}</h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                  <ArrowLeftRight className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-success flex items-center">+3.7% <ArrowUp className="ml-1 h-3 w-3" /></span>
                <span className="text-xs text-neutral-500 ml-2">ce mois</span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between mb-4">
                <div>
                  <p className="text-neutral-500 text-sm">Cartes actives</p>
                  <h3 className="text-2xl font-bold">{activeCardsCount}</h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-success flex items-center">+24 <ArrowUp className="ml-1 h-3 w-3" /></span>
                <span className="text-xs text-neutral-500 ml-2">cette semaine</span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between mb-4">
                <div>
                  <p className="text-neutral-500 text-sm">Virements en attente</p>
                  <h3 className="text-2xl font-bold">{pendingVerifications}</h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center text-warning">
                  <Timer className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-error flex items-center">+8 <ArrowUp className="ml-1 h-3 w-3" /></span>
                <span className="text-xs text-neutral-500 ml-2">depuis hier</span>
              </div>
            </div>
          </div>
          
          {/* Client Management */}
          <div className="bg-white rounded-xl shadow mb-8">
            <div className="border-b border-neutral-200">
              <nav className="flex overflow-x-auto -mb-px">
                <button 
                  className="py-4 px-6 border-b-2 border-primary text-primary font-medium"
                >
                  Gestion des clients
                </button>
                <Link href="/admin/transactions">
                  <a className="py-4 px-6 text-neutral-500 font-medium hover:text-neutral-800 hover:border-b-2 hover:border-primary/50">
                    Gestion des virements
                  </a>
                </Link>
                <Link href="/admin/verifications">
                  <a className="py-4 px-6 text-neutral-500 font-medium hover:text-neutral-800 hover:border-b-2 hover:border-primary/50">
                    Validation des étapes
                  </a>
                </Link>
                <Link href="/admin/reports">
                  <a className="py-4 px-6 text-neutral-500 font-medium hover:text-neutral-800 hover:border-b-2 hover:border-primary/50">
                    Rapports
                  </a>
                </Link>
              </nav>
            </div>
            
            <div className="p-6">
              <ClientTable />
            </div>
          </div>
        </div>
      </div>
      
      <Sidebar isAdmin />
    </div>
  );
}
