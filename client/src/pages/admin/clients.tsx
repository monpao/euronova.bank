import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { ClientTable } from "@/components/admin/client-table";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { HomeIcon } from "lucide-react";

export default function Clients() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Header isAdmin />
      
      <div className="flex-1 container mx-auto p-4 md:p-6 md:ml-64">
        <div className="mb-8">
          <Breadcrumb className="mb-6">
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin" className="flex items-center">
                <HomeIcon className="h-4 w-4 mr-2" />
                Administration
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/clients" className="font-medium">
                Gestion des clients
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
          
          <h2 className="text-2xl font-bold mb-6">Gestion des clients</h2>
          
          {/* Client Table */}
          <div className="bg-white rounded-xl shadow p-5">
            <ClientTable />
          </div>
        </div>
      </div>
      
      <Sidebar isAdmin />
    </div>
  )
}