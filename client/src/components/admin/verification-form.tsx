import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { VerificationStep, User } from "@shared/schema";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { VerificationProgress } from "@/components/ui/verification-step";

const verificationFormSchema = z.object({
  transferId: z.string().optional(),
  clientReference: z.string().optional(),
  adminNote: z.string().optional(),
});

type VerificationFormValues = z.infer<typeof verificationFormSchema>;

export function VerificationForm() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [verificationStep, setVerificationStep] = useState<VerificationStep | null>(null);
  
  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationFormSchema),
    defaultValues: {
      transferId: "",
      clientReference: "",
      adminNote: "",
    },
  });
  
  // Lookup client verification steps
  const lookupClient = async () => {
    const clientReference = form.getValues("clientReference");
    
    if (!clientReference) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une référence client",
        variant: "destructive",
      });
      return;
    }
    
    // Extract user ID from CN-XXXX-XXXX format
    let userId: number;
    if (clientReference.startsWith("CN-") && clientReference.length >= 10) {
      // Format CN-XXXX-XXXX
      const userIdMatch = clientReference.match(/^CN-(\d+)-(\d+)$/);
      if (userIdMatch) {
        userId = parseInt(userIdMatch[1]);
      } else {
        userId = parseInt(clientReference);
      }
    } else {
      userId = parseInt(clientReference);
    }
    
    if (isNaN(userId)) {
      toast({
        title: "Erreur",
        description: "Référence client invalide",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Fetch user
      const userRes = await apiRequest("GET", `/api/users/${userId}`);
      const user = await userRes.json();
      
      // Fetch verification steps
      const verificationRes = await apiRequest("GET", `/api/verification-steps/user/${userId}`);
      const verification = await verificationRes.json();
      
      setSelectedUser(user);
      setVerificationStep(verification);
      
      if (!verification) {
        toast({
          title: "Information",
          description: "Aucune vérification en cours pour ce client",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la recherche du client",
        variant: "destructive",
      });
    }
  };
  
  // Mutation to update a verification step
  const updateStepMutation = useMutation({
    mutationFn: async ({ id, step, completed }: { id: number, step: number, completed: boolean }) => {
      const fieldName = `step${step}Completed`;
      const data = { [fieldName]: completed };
      
      const res = await apiRequest("PATCH", `/api/verification-steps/${id}`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      setVerificationStep(data);
      
      toast({
        title: "Étape mise à jour",
        description: "L'étape de vérification a été mise à jour avec succès",
      });
      
      // Refresh verification data
      queryClient.invalidateQueries({ queryKey: [`/api/verification-steps/user/${selectedUser?.id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to send a reminder
  const sendReminderMutation = useMutation({
    mutationFn: async ({ userId, stepNumber }: { userId: number, stepNumber: number }) => {
      // In a real app, this would be an API call to send a reminder
      // For now, we'll simulate it with a simple notification
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Rappel envoyé",
        description: "Un rappel a été envoyé au client",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to unlock all steps
  const unlockAllMutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      // This would approve all remaining steps
      const data = {
        step1Completed: true,
        step2Completed: true,
        step3Completed: true,
        step4Completed: true,
        step5Completed: true,
      };
      
      const res = await apiRequest("PATCH", `/api/verification-steps/${id}`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      setVerificationStep(data);
      
      toast({
        title: "Déblocage complet",
        description: "Toutes les étapes ont été validées et le virement est maintenant disponible",
      });
      
      // Refresh verification data
      queryClient.invalidateQueries({ queryKey: [`/api/verification-steps/user/${selectedUser?.id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleValidateStep = (stepNumber: number) => {
    if (!verificationStep || !verificationStep.id) return;
    
    updateStepMutation.mutate({
      id: verificationStep.id,
      step: stepNumber,
      completed: true
    });
  };
  
  const handleSendReminder = () => {
    if (!selectedUser) return;
    
    // Determine which step to remind about
    let stepToRemind = 1;
    if (verificationStep) {
      if (verificationStep.step1Completed) stepToRemind = 2;
      if (verificationStep.step2Completed) stepToRemind = 3;
      if (verificationStep.step3Completed) stepToRemind = 4;
      if (verificationStep.step4Completed) stepToRemind = 5;
    }
    
    sendReminderMutation.mutate({
      userId: selectedUser.id,
      stepNumber: stepToRemind
    });
  };
  
  const handleUnlockAll = () => {
    if (!verificationStep || !verificationStep.id) return;
    
    unlockAllMutation.mutate({
      id: verificationStep.id
    });
  };
  
  const onSubmit = (data: VerificationFormValues) => {
    // This form primarily uses action buttons, not submit
    lookupClient();
  };
  
  // Save admin note
  const saveNoteMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number, notes: string }) => {
      const res = await apiRequest("PATCH", `/api/verification-steps/${id}`, { notes });
      return await res.json();
    },
    onSuccess: (data) => {
      setVerificationStep(data);
      
      toast({
        title: "Note enregistrée",
        description: "La note a été enregistrée avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const saveNote = () => {
    if (!verificationStep || !verificationStep.id) return;
    
    const adminNote = form.getValues("adminNote");
    
    saveNoteMutation.mutate({
      id: verificationStep.id,
      notes: adminNote
    });
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="transferId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID du virement</FormLabel>
                <FormControl>
                  <Input placeholder="ex: TRF-78912" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="clientReference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Référence client</FormLabel>
                <FormControl>
                  <Input placeholder="ex: CN-1234-5678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end">
          <Button 
            type="button" 
            onClick={lookupClient}
            disabled={updateStepMutation.isPending || unlockAllMutation.isPending}
          >
            Rechercher
          </Button>
        </div>
        
        {selectedUser && (
          <div className="p-4 border rounded-md bg-muted/20">
            <p className="font-medium">Client trouvé:</p>
            <p>Nom: {selectedUser.firstName} {selectedUser.lastName}</p>
            <p>Email: {selectedUser.email}</p>
            <p>Statut: {selectedUser.isActive ? 'Actif' : 'Bloqué'}</p>
          </div>
        )}
        
        {verificationStep && (
          <div className="space-y-6">
            <VerificationProgress 
              verificationStep={verificationStep}
              isAdmin={true}
              onValidate={handleValidateStep}
            />
            
            <FormField
              control={form.control}
              name="adminNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note administrative</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={3} 
                      placeholder="Ajouter une note concernant ce virement..."
                      defaultValue={verificationStep.notes || ""}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={saveNote}
                disabled={saveNoteMutation.isPending}
              >
                {saveNoteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer la note"
                )}
              </Button>
              <Button
                type="button"
                variant="warning"
                className="bg-warning hover:bg-warning/90 text-white"
                onClick={handleSendReminder}
                disabled={sendReminderMutation.isPending}
              >
                {sendReminderMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  "Envoyer un rappel"
                )}
              </Button>
              <Button
                type="button"
                variant="success"
                className="bg-success hover:bg-success/90 text-white"
                onClick={handleUnlockAll}
                disabled={unlockAllMutation.isPending}
              >
                {unlockAllMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Autorisation...
                  </>
                ) : (
                  "Autoriser déblocage total"
                )}
              </Button>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}
