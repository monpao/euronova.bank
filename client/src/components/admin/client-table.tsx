import { useState } from "react";
import { Link } from "wouter";
import { User } from "@shared/schema";
import { 
  Eye, 
  Edit, 
  Lock, 
  Unlock,
  Search,
  Mail,
  RefreshCw,
  CreditCard,
  Key
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ClientDetailsModal } from "./client-details-modal";

export function ClientTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const itemsPerPage = 5;
  
  // Fetch users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    refetchInterval: 5000, // Rafraîchir toutes les 5 secondes
  });
  
  // Update user status mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number, isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    }
  });
  
  const { toast } = useToast();
  
  // Mutation pour renvoyer les identifiants
  const resendCredentialsMutation = useMutation({
    mutationFn: async ({ userId, generateNewPassword }: { userId: number, generateNewPassword: boolean }) => {
      const res = await apiRequest("POST", `/api/users/${userId}/resend-credentials`, { generateNewPassword });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      if (data.emailSent) {
        toast({
          title: "Identifiants renvoyés",
          description: data.newPasswordGenerated 
            ? "Les identifiants avec un nouveau mot de passe ont été renvoyés par email."
            : "Les identifiants ont été renvoyés par email.",
          variant: "success",
        });
      } else {
        toast({
          title: "Attention",
          description: "Les identifiants ont été traités mais l'email n'a pas pu être envoyé.",
          variant: "warning",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: `Erreur lors du renvoi des identifiants : ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Filter users by search query and status
  const filteredUsers = users.filter((user: User) => {
    // Ne pas afficher l'administrateur dans la liste des clients
    if (user.role === "admin") return false;
    
    const matchesSearch = 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "active") return matchesSearch && user.isActive;
    if (statusFilter === "blocked") return matchesSearch && !user.isActive;
    
    return matchesSearch;
  });
  
  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Status toggle handler
  const toggleUserStatus = (user: User) => {
    updateUserStatusMutation.mutate({ id: user.id, isActive: !user.isActive });
  };
  
  if (isLoading) {
    return <div className="text-center p-8">Chargement des clients...</div>;
  }
  
  return (
    <div>
      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="relative flex-1">
          <Input 
            type="text" 
            placeholder="Rechercher un client..." 
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="border border-neutral-300 rounded-lg py-2 w-[140px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="blocked">Bloqué</SelectItem>
            </SelectContent>
          </Select>
          
          <Link href="/admin/create-client">
            <Button className="ml-4 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouveau client
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Client Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 border-y border-neutral-200">
              <th className="text-left py-3 px-4 font-medium text-neutral-500">Client ID</th>
              <th className="text-left py-3 px-4 font-medium text-neutral-500">Nom</th>
              <th className="text-left py-3 px-4 font-medium text-neutral-500">Email</th>
              <th className="text-left py-3 px-4 font-medium text-neutral-500">Solde</th>
              <th className="text-left py-3 px-4 font-medium text-neutral-500">Statut</th>
              <th className="text-left py-3 px-4 font-medium text-neutral-500">Moyens de paiement</th>
              <th className="text-left py-3 px-4 font-medium text-neutral-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  Aucun client trouvé
                </td>
              </tr>
            ) : (
              currentUsers.map((user: User & { balance?: number, cardCount?: number }) => (
                <tr key={user.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="py-3 px-4 font-medium">BRV-{user.id.toString().padStart(4, '0')}</td>
                  <td className="py-3 px-4">{user.firstName} {user.lastName}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4 font-medium">{user.balance ? `€${user.balance.toFixed(2)}` : 'N/A'}</td>
                  <td className="py-3 px-4">
                    <Badge variant={user.isActive ? "success" : "destructive"} className="px-2 py-1 text-xs">
                      {user.isActive ? 'Actif' : 'Bloqué'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">{user.cardCount || 0} cartes</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="p-1 text-primary hover:bg-primary/10 rounded"
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setIsDetailsModalOpen(true);
                        }}
                        title="Voir les détails (RIB, mot de passe, etc.)"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="p-1 text-primary hover:bg-primary/10 rounded"
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setIsDetailsModalOpen(true);
                        }}
                        title="Voir les détails"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="p-1 text-primary hover:bg-primary/10 rounded"
                        title="Éditer le client"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`p-1 ${user.isActive ? 'text-warning hover:bg-warning/10' : 'text-success hover:bg-success/10'} rounded`}
                        onClick={() => toggleUserStatus(user)}
                        disabled={updateUserStatusMutation.isPending}
                      >
                        {user.isActive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="p-1 text-primary hover:bg-primary/10 rounded"
                        onClick={() => resendCredentialsMutation.mutate({ userId: user.id, generateNewPassword: false })}
                        disabled={resendCredentialsMutation.isPending}
                        title="Renvoyer les identifiants"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="p-1 text-primary hover:bg-primary/10 rounded"
                        onClick={() => resendCredentialsMutation.mutate({ userId: user.id, generateNewPassword: true })}
                        disabled={resendCredentialsMutation.isPending}
                        title="Renvoyer les identifiants avec nouveau mot de passe"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-neutral-500">
            Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, filteredUsers.length)} sur {filteredUsers.length} résultats
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) handlePageChange(currentPage - 1);
                  }}
                  className={currentPage === 1 ? "opacity-50 pointer-events-none" : ""}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(totalPages, 3) }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(i + 1);
                    }}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              {totalPages > 3 && (
                <>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(totalPages);
                      }}
                      isActive={currentPage === totalPages}
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) handlePageChange(currentPage + 1);
                  }}
                  className={currentPage === totalPages ? "opacity-50 pointer-events-none" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      
      {/* Modal de détails client */}
      <ClientDetailsModal 
        userId={selectedUserId} 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
      />
    </div>
  );
}
