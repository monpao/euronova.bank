import React, { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  CreditCard, 
  Settings, 
  BarChart3, 
  Bell, 
  History, 
  Home,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const navigation = [
    { 
      name: 'Tableau de bord', 
      href: '/admin', 
      icon: BarChart3, 
      current: location === '/admin' 
    },
    { 
      name: 'Clients', 
      href: '/admin/clients', 
      icon: Users, 
      current: location === '/admin/clients' 
    },
    { 
      name: 'Cartes', 
      href: '/admin/cards', 
      icon: CreditCard, 
      current: location === '/admin/cards' 
    },
    { 
      name: 'Transactions', 
      href: '/admin/transactions', 
      icon: History, 
      current: location === '/admin/transactions' 
    },
    { 
      name: 'Paramètres', 
      href: '/admin/settings', 
      icon: Settings, 
      current: location === '/admin/settings' 
    },
  ];
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 border-r bg-muted/30">
        <div className="h-16 flex items-center px-6 border-b bg-background">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">E</span>
            </div>
            <span className="text-lg font-bold">EuroNova</span>
          </Link>
        </div>
        
        <div className="flex-1 overflow-auto py-4 px-3 space-y-1">
          {navigation.map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
            >
              <Button
                variant={item.current ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  item.current ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Button>
            </Link>
          ))}
        </div>
        
        <div className="p-4 border-t">
          <div className="flex items-center space-x-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Header */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="md:hidden flex items-center justify-between h-16 px-4 border-b bg-background">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">E</span>
            </div>
            <span className="text-lg font-bold">EuroNova</span>
          </Link>
          
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  Menu
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60 p-0" align="end">
                <Command>
                  <CommandInput placeholder="Rechercher..." />
                  <CommandList>
                    <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
                    <CommandGroup heading="Navigation">
                      {navigation.map((item) => (
                        <Link key={item.name} href={item.href}>
                          <CommandItem className={cn(
                            item.current && "bg-accent text-accent-foreground"
                          )}>
                            <item.icon className="h-4 w-4 mr-2" />
                            {item.name}
                          </CommandItem>
                        </Link>
                      ))}
                    </CommandGroup>
                    <CommandGroup heading="Compte">
                      <CommandItem onSelect={handleLogout} disabled={logoutMutation.isPending}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Déconnexion
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="container py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}