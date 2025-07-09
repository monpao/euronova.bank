import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const supportedLanguages = [
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'ar', name: 'العربية' },
  { code: 'zh', name: '中文' },
  { code: 'ru', name: 'Русский' },
  { code: 'pt', name: 'Português' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' }
];

function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentLang, setCurrentLang] = useState(i18n.language || 'fr');

  // Mutation pour mettre à jour la langue de l'utilisateur
  const updateLanguageMutation = useMutation({
    mutationFn: async (language: string) => {
      if (user) {
        const res = await apiRequest("PATCH", `/api/users/${user.id}/language`, { language });
        return await res.json();
      }
      return null;
    },
    onError: (error: Error) => {
      toast({
        title: t('errors.languageUpdateFailed'),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Initialiser la langue avec celle de l'utilisateur s'il est connecté
  useEffect(() => {
    if (user && user.language && user.language !== currentLang) {
      setCurrentLang(user.language);
      i18n.changeLanguage(user.language);
      console.log("User language set from user profile:", user.language);
    }
  }, [user, i18n, currentLang]);

  // Force le rechargement de la langue actuelle au montage du composant
  useEffect(() => {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && savedLang !== currentLang) {
      setCurrentLang(savedLang);
      i18n.changeLanguage(savedLang);
      console.log("Language set from localStorage:", savedLang);
    }
  }, []);

  const handleLanguageChange = (value: string) => {
    console.log("Language change requested:", value, "Current:", currentLang);
    
    if (value === currentLang) {
      console.log("Language already set to", value);
      return;
    }
    
    // Mettre à jour l'état local
    setCurrentLang(value);
    
    // Changer la langue dans i18n
    i18n.changeLanguage(value);
    
    // Si l'utilisateur est connecté, stocker la préférence
    if (user) {
      updateLanguageMutation.mutate(value);
    }
    
    // Stocker aussi dans le localStorage pour les utilisateurs non connectés
    localStorage.setItem('preferredLanguage', value);
    
    // Forcer un rafraîchissement complet de la page pour s'assurer que tous les composants sont correctement traduits
    // Cette méthode est la plus simple et la plus fiable pour s'assurer que tout le contenu est correctement traduit
    window.location.reload();
  };

  return (
    <div className="flex items-center">
      <Globe className="h-4 w-4 mr-2" />
      <Select
        value={currentLang}
        onValueChange={handleLanguageChange}
      >
        <SelectTrigger className="w-[140px] bg-background text-foreground border-input">
          <SelectValue placeholder={t('settings.language')}>
            {supportedLanguages.find(lang => lang.code === currentLang)?.name || t('settings.language')}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {supportedLanguages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSwitcher;