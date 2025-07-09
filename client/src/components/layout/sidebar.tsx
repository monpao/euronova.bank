import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import { 
  Home, 
  ArrowRightLeft, 
  CreditCard, 
  DollarSign, 
  LineChart, 
  HeadphonesIcon, 
  Settings, 
  LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isAdmin?: boolean;
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const [location] = useLocation();
  const { logoutMutation, user } = useAuth();
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Client navigation links
  const clientLinks = [
    {
      path: "/",
      label: "Tableau de bord",
      icon: <Home className="mr-3 text-lg" />,
    },
    {
      path: "/payments",
      label: "Paiements",
      icon: <ArrowRightLeft className="mr-3 text-lg" />,
    },
    {
      path: "/cards",
      label: "Cartes et Comptes",
      icon: <CreditCard className="mr-3 text-lg" />,
    },
    {
      path: "/investments",
      label: "Investissements",
      icon: <DollarSign className="mr-3 text-lg" />,
    },
    {
      path: "/analytics",
      label: "Analyse financière",
      icon: <LineChart className="mr-3 text-lg" />,
    },
  ];
  
  // Admin navigation links
  const adminLinks = [
    {
      path: "/admin",
      label: "Tableau de bord",
      icon: <Home className="mr-3 text-lg" />,
    },
    {
      path: "/admin/clients",
      label: "Clients",
      icon: <Home className="mr-3 text-lg" />,
    },
    {
      path: "/admin/transactions",
      label: "Transactions",
      icon: <ArrowRightLeft className="mr-3 text-lg" />,
    },
    {
      path: "/admin/cards",
      label: "Cartes",
      icon: <CreditCard className="mr-3 text-lg" />,
    },
    {
      path: "/admin/verifications",
      label: "Validations",
      icon: <Settings className="mr-3 text-lg" />,
    },
    {
      path: "/admin/settings",
      label: "Paramètres système",
      icon: <Settings className="mr-3 text-lg" />,
    },
  ];
  
  const links = isAdmin ? adminLinks : clientLinks;
  const serviceLinks = [
    {
      path: "/support",
      label: "Support",
      icon: <HeadphonesIcon className="mr-3 text-lg" />,
    },
    {
      path: "/settings",
      label: "Paramètres",
      icon: <Settings className="mr-3 text-lg" />,
    },
  ];
  
  return (
    <div className={`fixed inset-y-0 left-0 ${isAdmin ? 'bg-slate-800 text-white' : 'bg-white text-neutral-800'} border-r border-neutral-200 w-64 hidden md:block shadow-sm`}>
      <div className="flex flex-col h-full">
        <div className="p-6">
          <h1 className="text-xl font-bold">
            <span className="text-primary">Euro</span>Nova
            {isAdmin && (
              <span className="text-sm bg-primary/20 text-primary rounded px-2 py-1 ml-2">
                Admin
              </span>
            )}
          </h1>
        </div>
        
        <nav className="flex-1 px-4 py-2">
          <div className="space-y-1">
            {links.map((link) => (
              <Link key={link.path} href={link.path}>
                <a
                  className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive(link.path)
                      ? isAdmin
                        ? 'text-white bg-red-900'
                        : 'text-white bg-primary'
                      : isAdmin
                      ? 'text-white hover:bg-red-900 hover:text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </a>
              </Link>
            ))}
          </div>
          
          <div className="mt-8 pt-4 border-t border-neutral-200">
            <h3 className={`px-4 text-xs font-semibold ${isAdmin ? 'text-gray-300' : 'text-neutral-500'} uppercase tracking-wider mb-2`}>
              Services
            </h3>
            <div className="space-y-1">
              {serviceLinks.map((link) => (
                <Link key={link.path} href={link.path}>
                  <a
                    className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${
                      isActive(link.path)
                        ? isAdmin
                          ? 'text-white bg-red-900'
                          : 'text-white bg-primary'
                        : isAdmin
                        ? 'text-white hover:bg-red-900 hover:text-white'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </a>
                </Link>
              ))}
            </div>
          </div>
        </nav>
        
        <div className={`p-4 border-t ${isAdmin ? 'border-slate-700' : 'border-neutral-200'}`}>
          <Button
            variant="ghost"
            className={`flex items-center px-4 py-2 rounded-lg w-full ${
              isAdmin
                ? 'text-white hover:bg-red-900 hover:text-white'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
            onClick={handleLogout}
          >
            <LogOut className="mr-3 text-lg" />
            <span>Déconnexion</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
