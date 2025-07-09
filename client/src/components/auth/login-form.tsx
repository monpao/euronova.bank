import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth.tsx";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, { message: "Veuillez saisir votre identifiant ou email" }),
  password: z.string().min(1, { message: "Veuillez saisir votre mot de passe" }),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { loginMutation } = useAuth();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      remember: false,
    },
  });
  
  const onSubmit = (data: LoginFormValues) => {
    // Essayer de se connecter avec le nom d'utilisateur tel quel d'abord
    // Si c'est un email, on tentera de récupérer le nom d'utilisateur associé côté serveur
    loginMutation.mutate({
      username: data.username,
      password: data.password,
    });
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Identifiant ou Email</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Votre identifiant client ou email"
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-gray-500 mt-1">Saisissez votre identifiant (CN-XXXX-XXXX) ou votre adresse email</p>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="remember"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="remember"
                    className="h-4 w-4 text-primary focus:ring-primary border-neutral-300 rounded"
                  />
                </FormControl>
                <label
                  htmlFor="remember"
                  className="text-sm text-neutral-600 cursor-pointer"
                >
                  Se souvenir de moi
                </label>
              </FormItem>
            )}
          />
          
          <a href="#" className="text-sm text-primary hover:underline">
            Mot de passe oublié?
          </a>
        </div>
        
        <div className="mt-8">
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-medium py-4 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              "Se connecter"
            )}
          </Button>
        </div>
        
        <div className="relative mt-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-300"></div>
          </div>
          <div className="relative px-4 text-sm bg-white text-neutral-500">
            Ou
          </div>
        </div>
        
        <p className="text-center text-sm text-neutral-600 mt-4">
          Vous n'avez pas de compte?{" "}
          <a href="#" className="text-primary font-medium hover:underline">
            Créez-en un maintenant
          </a>
        </p>
      </form>
    </Form>
  );
}
