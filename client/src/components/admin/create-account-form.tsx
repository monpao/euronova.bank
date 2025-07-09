import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, insertUserSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Extend the schema for client creation
const createClientSchema = insertUserSchema.extend({
  address: z.string().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  accountType: z.string(),
  initialDeposit: z.string().transform(val => Number(val) || 0),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type CreateClientFormValues = z.infer<typeof createClientSchema>;

export function CreateAccountForm() {
  const { toast } = useToast();
  
  const form = useForm<CreateClientFormValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      username: "", // Sera automatiquement remplacé par l'ID client généré
      password: "", // Sera automatiquement généré si laissé vide
      confirmPassword: "",
      email: "",
      firstName: "",
      lastName: "",
      role: "client",
      address: "",
      phone: "",
      dateOfBirth: "",
      idType: "Carte d'identité",
      idNumber: "",
      accountType: "current",
      initialDeposit: "0",
      isActive: true
    },
  });
  
  const registerMutation = useMutation({
    mutationFn: async (data: Omit<CreateClientFormValues, 'confirmPassword' | 'accountType' | 'initialDeposit'>) => {
      const res = await apiRequest("POST", "/api/register", data);
      return await res.json();
    },
    onSuccess: (user: User) => {
      // If we have account info, create an account
      const { accountType, initialDeposit } = form.getValues();
      
      // Afficher les informations d'identification générées si présentes
      if ((user as any).generatedCredentials) {
        const credentials = (user as any).generatedCredentials;
        toast({
          title: "Identifiants générés pour le client",
          description: `
            ID Client: ${credentials.clientId || 'N/A'}
            Mot de passe: ${credentials.password || 'N/A'}
            RIB: ${credentials.accountNumber || 'N/A'}
          `,
          duration: 10000, // Durée plus longue pour avoir le temps de voir les identifiants
        });
      }
      
      if (accountType) {
        createAccountMutation.mutate({
          userId: user.id,
          accountType,
          balance: initialDeposit
        });
      } else {
        toast({
          title: "Client créé avec succès",
          description: `Le compte de ${user.firstName} ${user.lastName} a été créé`,
        });
        
        form.reset();
        
        // Refresh the users list
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de création",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const createAccountMutation = useMutation({
    mutationFn: async (data: { userId: number, accountType: string, balance: number }) => {
      // Nous devons ajouter le numéro de compte qui est obligatoire dans le schéma
      // Générer un numéro de compte au format FR76 XXXX XXXX XXXX XXXX
      const accountNumber = `FR76 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
      
      // Assurer que balance est un nombre
      const balance = typeof data.balance === 'string' ? parseFloat(data.balance) : data.balance;
      
      const res = await apiRequest("POST", "/api/accounts", {
        ...data,
        accountNumber,
        balance
      });
      return await res.json();
    },
    onSuccess: () => {
      const { firstName, lastName } = form.getValues();
      
      toast({
        title: "Client et compte créés avec succès",
        description: `Le compte de ${firstName} ${lastName} a été créé`,
      });
      
      form.reset();
      
      // Refresh the users list
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de création du compte",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const isPending = registerMutation.isPending || createAccountMutation.isPending;
  
  const onSubmit = (data: CreateClientFormValues) => {
    const { confirmPassword, accountType, initialDeposit, ...registerData } = data;
    registerMutation.mutate(registerData);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone</FormLabel>
                <FormControl>
                  <Input type="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de naissance</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="idType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de pièce d'identité</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Carte d'identité">Carte d'identité</SelectItem>
                      <SelectItem value="Passeport">Passeport</SelectItem>
                      <SelectItem value="Permis de conduire">Permis de conduire</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="idNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro de pièce d'identité</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom d'utilisateur</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmer mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="accountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de compte</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="current">Compte courant</SelectItem>
                    <SelectItem value="savings">Compte épargne</SelectItem>
                    <SelectItem value="joint">Compte joint</SelectItem>
                    <SelectItem value="business">Compte professionnel</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="initialDeposit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dépôt initial (€)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-4 mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => form.reset()}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button 
            type="submit"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              "Créer le compte"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
