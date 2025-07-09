import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/lib/auth.tsx";
import { TransactionForm } from "@/components/admin/transaction-form";

export default function ManageTransactions() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Header isAdmin />
      
      <div className="flex-1 container mx-auto p-4 md:p-6 md:ml-64">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Gestion des transactions</h2>
          
          <div className="bg-white rounded-xl shadow mb-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Effectuer une transaction</h3>
                <div className="flex space-x-4">
                  <button className="px-4 py-2 bg-success hover:bg-success/90 text-white font-medium rounded-lg transition-all flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Créditer
                  </button>
                  <button className="px-4 py-2 bg-error hover:bg-error/90 text-white font-medium rounded-lg transition-all flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                    Débiter
                  </button>
                </div>
              </div>
              
              <TransactionForm />
            </div>
          </div>
          
          {/* Recent Transactions Section */}
          <div className="bg-white rounded-xl shadow mb-8">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-6">Transactions récentes</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50 border-y border-neutral-200">
                      <th className="text-left py-3 px-4 font-medium text-neutral-500">ID</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-500">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-500">Client</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-500">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-500">Description</th>
                      <th className="text-right py-3 px-4 font-medium text-neutral-500">Montant</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-500">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-3 px-4 font-medium">TRF-12345</td>
                      <td className="py-3 px-4">15/07/2023</td>
                      <td className="py-3 px-4">Jean Dupont</td>
                      <td className="py-3 px-4">Crédit</td>
                      <td className="py-3 px-4">Dépôt</td>
                      <td className="py-3 px-4 text-right text-success font-medium">+€520.00</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-success/10 text-success">Complété</span>
                      </td>
                    </tr>
                    
                    <tr className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-3 px-4 font-medium">TRF-12344</td>
                      <td className="py-3 px-4">14/07/2023</td>
                      <td className="py-3 px-4">Marie Martin</td>
                      <td className="py-3 px-4">Débit</td>
                      <td className="py-3 px-4">Frais bancaires</td>
                      <td className="py-3 px-4 text-right font-medium">-€64.35</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-success/10 text-success">Complété</span>
                      </td>
                    </tr>
                    
                    <tr className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-3 px-4 font-medium">TRF-12343</td>
                      <td className="py-3 px-4">12/07/2023</td>
                      <td className="py-3 px-4">Pierre Dubois</td>
                      <td className="py-3 px-4">Crédit</td>
                      <td className="py-3 px-4">Salaire</td>
                      <td className="py-3 px-4 text-right text-success font-medium">+€2,450.00</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-success/10 text-success">Complété</span>
                      </td>
                    </tr>
                    
                    <tr className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-3 px-4 font-medium">TRF-12342</td>
                      <td className="py-3 px-4">10/07/2023</td>
                      <td className="py-3 px-4">Sophie Bernard</td>
                      <td className="py-3 px-4">Virement</td>
                      <td className="py-3 px-4">Paiement international</td>
                      <td className="py-3 px-4 text-right font-medium">-€850.00</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-warning/10 text-warning">En attente</span>
                      </td>
                    </tr>
                    
                    <tr className="hover:bg-neutral-50">
                      <td className="py-3 px-4 font-medium">TRF-12341</td>
                      <td className="py-3 px-4">08/07/2023</td>
                      <td className="py-3 px-4">Lucas Petit</td>
                      <td className="py-3 px-4">Débit</td>
                      <td className="py-3 px-4">Transport</td>
                      <td className="py-3 px-4 text-right font-medium">-€37.80</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-success/10 text-success">Complété</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-end mt-6">
                <button className="text-primary text-sm font-medium hover:underline">
                  Voir toutes les transactions
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Sidebar isAdmin />
    </div>
  );
}
