import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/lib/auth.tsx";
import { useQuery } from "@tanstack/react-query";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { HomeIcon, CreditCard, Eye, Edit, MoreHorizontal, PlusCircle } from "lucide-react";
import { Card as CardModel } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Cards() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  
  // Fetch all cards (admin only)
  const { data: cards = [], isLoading } = useQuery<(CardModel & { user?: any })[]>({
    queryKey: ['/api/cards'],
    enabled: !!user,
  });
  
  // Filter cards based on search and active status
  const filteredCards = cards.filter(card => {
    const matchesSearch = 
      card.cardNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.cardholderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (card.user?.firstName && card.user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (card.user?.lastName && card.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesActive = showOnlyActive ? card.isActive : true;
    
    return matchesSearch && matchesActive;
  });
  
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
              <BreadcrumbLink href="/admin/cards" className="font-medium">
                Gestion des cartes
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
          
          <h2 className="text-2xl font-bold mb-6">Gestion des cartes bancaires</h2>
          
          {/* Filters */}
          <div className="bg-white rounded-xl shadow p-5 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Input
                    placeholder="Rechercher une carte par numéro, nom du titulaire..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="active-only" 
                    checked={showOnlyActive}
                    onCheckedChange={setShowOnlyActive}
                  />
                  <Label htmlFor="active-only">Cartes actives uniquement</Label>
                </div>
                
                <Button className="flex items-center">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Créer une carte
                </Button>
              </div>
            </div>
          </div>
          
          {/* Cards List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isLoading ? (
              <div className="col-span-2 py-20 text-center text-muted-foreground">
                Chargement des cartes bancaires...
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="col-span-2 py-20 text-center text-muted-foreground">
                Aucune carte bancaire trouvée
              </div>
            ) : (
              filteredCards.map(card => (
                <div key={card.id} className="bg-white rounded-xl shadow overflow-hidden">
                  <div className="p-6 bg-gradient-to-r from-primary to-primary/80 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full">
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="flex items-center">
                            <Eye className="mr-2 h-4 w-4" />
                            <span>Voir détails</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center">
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Modifier</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive flex items-center">
                            {card.isActive ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                  <line x1="9" y1="9" x2="15" y2="15"></line>
                                  <line x1="15" y1="9" x2="9" y2="15"></line>
                                </svg>
                                <span>Désactiver</span>
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                  <path d="M9 12l2 2l4-4"></path>
                                </svg>
                                <span>Activer</span>
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="mb-2">
                      <CreditCard className="h-8 w-8 mb-4" />
                      <div className="text-white/80 text-sm mb-1">Numéro de carte</div>
                      <div className="text-lg font-medium">
                        ● ● ● ●  ● ● ● ●  ● ● ● ●  {card.cardNumber.slice(-4)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <div className="text-white/80 text-sm">Titulaire</div>
                        <div className="font-medium">{card.cardholderName}</div>
                      </div>
                      <div>
                        <div className="text-white/80 text-sm">Expiration</div>
                        <div className="font-medium">{card.expiryDate}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-neutral-500">Client</p>
                      <p className="font-medium">
                        {card.user ? `${card.user.firstName} ${card.user.lastName}` : 'N/A'}
                      </p>
                    </div>
                    <Badge variant={card.isActive ? "success" : "destructive"} className="px-2 py-1">
                      {card.isActive ? 'Active' : 'Bloquée'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <Sidebar isAdmin />
    </div>
  )
}