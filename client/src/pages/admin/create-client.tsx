import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/lib/auth.tsx";
import { CreateAccountForm } from "@/components/admin/create-account-form";

export default function CreateClient() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Header isAdmin />
      
      <div className="flex-1 container mx-auto p-4 md:p-6 md:ml-64">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Création de compte client</h2>
          
          <div className="bg-white rounded-xl shadow mb-8">
            <div className="p-6">
              <CreateAccountForm />
            </div>
          </div>
        </div>
      </div>
      
      <Sidebar isAdmin />
    </div>
  );
}
