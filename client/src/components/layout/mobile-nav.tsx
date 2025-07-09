import { Link, useLocation } from "wouter";
import {
  Home,
  ArrowRightLeft,
  CreditCard,
  User
} from "lucide-react";

interface MobileNavProps {
  isAdmin?: boolean;
}

export function MobileNav({ isAdmin = false }: MobileNavProps) {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  // Client navigation items
  const clientNavItems = [
    {
      path: "/",
      label: "Accueil",
      icon: <Home className="text-xl" />
    },
    {
      path: "/payments",
      label: "Paiements",
      icon: <ArrowRightLeft className="text-xl" />
    },
    {
      path: "/cards",
      label: "Cartes",
      icon: <CreditCard className="text-xl" />
    },
    {
      path: "/profile",
      label: "Profil",
      icon: <User className="text-xl" />
    }
  ];
  
  // Admin navigation items
  const adminNavItems = [
    {
      path: "/admin",
      label: "Accueil",
      icon: <Home className="text-xl" />
    },
    {
      path: "/admin/transactions",
      label: "Transactions",
      icon: <ArrowRightLeft className="text-xl" />
    },
    {
      path: "/admin/cards",
      label: "Cartes",
      icon: <CreditCard className="text-xl" />
    },
    {
      path: "/admin/profile",
      label: "Profil",
      icon: <User className="text-xl" />
    }
  ];
  
  const navItems = isAdmin ? adminNavItems : clientNavItems;
  
  return (
    <nav className="bg-white border-t border-neutral-200 fixed inset-x-0 bottom-0 z-10 md:hidden">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <a className={`flex flex-col items-center justify-center ${
              isActive(item.path) ? 'text-primary' : 'text-neutral-500 hover:text-primary'
            }`}>
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          </Link>
        ))}
      </div>
    </nav>
  );
}
