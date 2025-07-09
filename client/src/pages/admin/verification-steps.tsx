import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/lib/auth.tsx";
import { VerificationForm } from "@/components/admin/verification-form";

export default function VerificationSteps() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Header isAdmin />
      
      <div className="flex-1 container mx-auto p-4 md:p-6 md:ml-64">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Validation des étapes de paiement</h2>
          
          <div className="bg-white rounded-xl shadow mb-8">
            <div className="p-6">
              <VerificationForm />
            </div>
          </div>
          
          {/* Pending Validations Overview */}
          <div className="bg-white rounded-xl shadow mb-8">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-6">Étapes de vérification en attente</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50 border-y border-neutral-200">
                      <th className="text-left py-3 px-4 font-medium text-neutral-500">Client</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-500">Étape actuelle</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-500">Progression</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-500">Montant total</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-500">Date de début</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-500">Dernière activité</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-3 px-4">Jean Dupont</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-warning/10 text-warning">Étape 3</span>
                      </td>
                      <td className="py-3 px-4">2/5 complétées</td>
                      <td className="py-3 px-4 font-medium">€725.00</td>
                      <td className="py-3 px-4">10/07/2023</td>
                      <td className="py-3 px-4">il y a 2 jours</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button className="p-1 text-primary hover:bg-primary/10 rounded">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button className="p-1 text-warning hover:bg-warning/10 rounded">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button className="p-1 text-success hover:bg-success/10 rounded">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    <tr className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-3 px-4">Marie Martin</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-warning/10 text-warning">Étape 2</span>
                      </td>
                      <td className="py-3 px-4">1/5 complétées</td>
                      <td className="py-3 px-4 font-medium">€725.00</td>
                      <td className="py-3 px-4">08/07/2023</td>
                      <td className="py-3 px-4">il y a 4 jours</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button className="p-1 text-primary hover:bg-primary/10 rounded">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button className="p-1 text-warning hover:bg-warning/10 rounded">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button className="p-1 text-success hover:bg-success/10 rounded">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    <tr className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-3 px-4">Pierre Dubois</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-warning/10 text-warning">Étape 4</span>
                      </td>
                      <td className="py-3 px-4">3/5 complétées</td>
                      <td className="py-3 px-4 font-medium">€725.00</td>
                      <td className="py-3 px-4">05/07/2023</td>
                      <td className="py-3 px-4">il y a 1 jour</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button className="p-1 text-primary hover:bg-primary/10 rounded">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button className="p-1 text-warning hover:bg-warning/10 rounded">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button className="p-1 text-success hover:bg-success/10 rounded">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    <tr className="hover:bg-neutral-50">
                      <td className="py-3 px-4">Sophie Bernard</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-success/10 text-success">Terminé</span>
                      </td>
                      <td className="py-3 px-4">5/5 complétées</td>
                      <td className="py-3 px-4 font-medium">€725.00</td>
                      <td className="py-3 px-4">01/07/2023</td>
                      <td className="py-3 px-4">il y a 3 heures</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button className="p-1 text-primary hover:bg-primary/10 rounded">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-neutral-500">
                  Affichage de 1 à 4 sur 57 résultats
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 border border-neutral-300 rounded hover:bg-neutral-50 text-neutral-500 disabled:opacity-50" disabled>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button className="px-3 py-1 border border-primary bg-primary/10 rounded text-primary font-medium">1</button>
                  <button className="px-3 py-1 border border-neutral-300 rounded hover:bg-neutral-50">2</button>
                  <button className="px-3 py-1 border border-neutral-300 rounded hover:bg-neutral-50">3</button>
                  <span className="px-1">...</span>
                  <button className="px-3 py-1 border border-neutral-300 rounded hover:bg-neutral-50">12</button>
                  <button className="p-2 border border-neutral-300 rounded hover:bg-neutral-50 text-neutral-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Sidebar isAdmin />
    </div>
  );
}
