import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import { useTranslation } from "react-i18next";
import { 
  Bell, 
  User, 
  ChevronDown, 
  LogOut, 
  Settings,
  LifeBuoy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import LanguageSwitcher from "@/components/ui/language-switcher";
import { Notification } from "@shared/schema";

interface HeaderProps {
  isAdmin?: boolean;
}

export function Header({ isAdmin = false }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const { t } = useTranslation();
  
  // Get notifications (simplified for now)
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    enabled: !!user,
  });
  
  const unreadNotificationsCount = notifications.filter((notification) => !notification.isRead).length;
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "";
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };
  
  return (
    <header className={`${isAdmin ? 'bg-slate-800 text-white' : 'bg-white text-neutral-800'} shadow-sm`}>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href={isAdmin ? "/admin" : "/"}>
            <a className="text-xl font-bold">
              <span className="text-primary">Euro</span>Nova
              {isAdmin && (
                <span className="text-sm bg-primary/20 text-primary rounded px-2 py-1 ml-2">
                  Admin
                </span>
              )}
            </a>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className={`relative ${isAdmin ? 'text-white hover:bg-blue-900' : 'hover:bg-neutral-100'}`}>
                <Bell className="h-5 w-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary"></span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>{t('notifications.title')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="py-4 px-2 text-center text-sm text-muted-foreground">
                  {t('notifications.noNotifications')}
                </div>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <DropdownMenuItem key={notification.id} className={`py-2 px-4 cursor-default ${!notification.isRead ? 'bg-primary/5' : ''}`}>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{notification.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="py-2 justify-center font-medium text-primary">
                    {t('common.viewAll')}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={`flex items-center space-x-2 ${isAdmin ? 'text-white hover:bg-blue-900' : 'hover:bg-neutral-100'}`}>
                <div className={`h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-medium`}>
                  {getUserInitials()}
                </div>
                <span className="font-medium hidden md:inline-block">
                  {user?.firstName} {user?.lastName}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('common.profile')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>{t('common.profile')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>{t('common.settings')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LifeBuoy className="mr-2 h-4 w-4" />
                <span>{t('common.support')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('common.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
