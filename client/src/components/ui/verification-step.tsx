import { VerificationStep } from "@shared/schema";
import { VerificationStepDetails } from "@shared/types";
import { Check, Clock, Lock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface VerificationStepItemProps {
  step: VerificationStepDetails;
  verificationId?: number;
  isAdmin?: boolean;
  onPayNow?: (stepNumber: number) => void;
  onValidate?: (stepNumber: number) => void;
}

export function VerificationStepItem({ 
  step, 
  verificationId,
  isAdmin = false,
  onPayNow,
  onValidate
}: VerificationStepItemProps) {
  const statusIcons = {
    completed: <Check className="h-4 w-4" />,
    pending: <Clock className="h-4 w-4" />,
    locked: <Lock className="h-4 w-4" />
  };
  
  const borderColors = {
    completed: "border-success",
    pending: "border-warning",
    locked: "border-neutral-300"
  };
  
  const bgColors = {
    completed: "bg-success/5",
    pending: "bg-warning/5",
    locked: "bg-neutral-50"
  };
  
  const circleColors = {
    completed: "bg-success",
    pending: "bg-warning",
    locked: "bg-neutral-400"
  };
  
  const textColors = {
    completed: "text-success",
    pending: "text-warning",
    locked: "text-neutral-500"
  };
  
  const formatDate = (date?: Date) => {
    if (!date) return "";
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: fr
    });
  };
  
  const updateStepMutation = useMutation({
    mutationFn: async (data: { [key: string]: boolean }) => {
      if (!verificationId) return null;
      const res = await apiRequest("PATCH", `/api/verification-steps/${verificationId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/verification-steps/user"] });
    }
  });
  
  const handlePayNow = () => {
    if (onPayNow) {
      onPayNow(step.number);
    } else if (verificationId) {
      const fieldName = `step${step.number}Completed`;
      updateStepMutation.mutate({ [fieldName]: true });
    }
  };
  
  const handleValidate = () => {
    if (onValidate) {
      onValidate(step.number);
    } else if (verificationId && isAdmin) {
      const fieldName = `step${step.number}Completed`;
      updateStepMutation.mutate({ [fieldName]: true });
    }
  };
  
  return (
    <div className={`border ${borderColors[step.status]} rounded-lg p-4 ${bgColors[step.status]} relative ${step.status === 'locked' ? 'opacity-60' : ''}`}>
      <div className={`absolute -left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full ${circleColors[step.status]} flex items-center justify-center text-white`}>
        {step.status === 'locked' ? (
          <span>{step.number}</span>
        ) : (
          statusIcons[step.status]
        )}
      </div>
      <div className="ml-4">
        <h4 className="font-medium mb-1">{step.name}</h4>
        {step.status === 'completed' && step.date && (
          <p className="text-sm text-neutral-600">Payé le {formatDate(step.date)}</p>
        )}
        {step.status === 'pending' && (
          <p className="text-sm text-neutral-600">En attente de paiement</p>
        )}
        {step.status === 'locked' && (
          <p className="text-sm text-neutral-600">En attente des étapes précédentes</p>
        )}
        <div className="mt-2 flex justify-between items-center">
          {step.status === 'completed' ? (
            <span className={`${textColors[step.status]} text-sm font-medium`}>Complété</span>
          ) : step.status === 'pending' ? (
            <>
              {isAdmin ? (
                <Button
                  variant="primary"
                  size="sm"
                  className="text-sm font-medium"
                  onClick={handleValidate}
                  disabled={updateStepMutation.isPending}
                >
                  {updateStepMutation.isPending ? "En cours..." : "Valider"}
                </Button>
              ) : (
                <Button
                  variant="link"
                  className="text-primary text-sm font-medium p-0 h-auto"
                  onClick={handlePayNow}
                  disabled={updateStepMutation.isPending}
                >
                  {updateStepMutation.isPending ? "En cours..." : "Payer maintenant"}
                </Button>
              )}
            </>
          ) : (
            <span className={`${textColors[step.status]} text-sm font-medium`}>Verrouillé</span>
          )}
          <span className="text-sm font-medium">{step.amount.toFixed(2)}€</span>
        </div>
      </div>
    </div>
  );
}

interface VerificationProgressProps {
  verificationStep?: VerificationStep;
  viewOnly?: boolean;
  isAdmin?: boolean;
  onPayNow?: (stepNumber: number) => void;
  onValidate?: (stepNumber: number) => void;
}

export function VerificationProgress({ 
  verificationStep,
  viewOnly = false,
  isAdmin = false,
  onPayNow,
  onValidate
}: VerificationProgressProps) {
  if (!verificationStep) {
    return <p>Aucune vérification en cours</p>;
  }
  
  // Create step details array
  const steps: VerificationStepDetails[] = [
    {
      number: 1,
      name: "Frais d'enregistrement de crédit",
      amount: verificationStep.step1Amount || 75,
      status: verificationStep.step1Completed ? "completed" : "pending",
      date: verificationStep.step1Date
    },
    {
      number: 2,
      name: "Frais de virement international",
      amount: verificationStep.step2Amount || 150,
      status: verificationStep.step1Completed 
        ? (verificationStep.step2Completed ? "completed" : "pending")
        : "locked",
      date: verificationStep.step2Date
    },
    {
      number: 3,
      name: "Frais de justice",
      amount: verificationStep.step3Amount || 225,
      status: verificationStep.step2Completed 
        ? (verificationStep.step3Completed ? "completed" : "pending")
        : "locked",
      date: verificationStep.step3Date
    },
    {
      number: 4,
      name: "Frais d'assurance",
      amount: verificationStep.step4Amount || 180,
      status: verificationStep.step3Completed 
        ? (verificationStep.step4Completed ? "completed" : "pending")
        : "locked",
      date: verificationStep.step4Date
    },
    {
      number: 5,
      name: "Frais d'autorisation de décaissement",
      amount: verificationStep.step5Amount || 95,
      status: verificationStep.step4Completed 
        ? (verificationStep.step5Completed ? "completed" : "pending")
        : "locked",
      date: verificationStep.step5Date
    }
  ];
  
  // Calculate progress
  const completedSteps = steps.filter(step => step.status === "completed").length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">Vérification de virements en attente</h3>
        <span className="px-3 py-1 rounded-full text-xs bg-warning/10 text-warning">
          {totalSteps - completedSteps} étapes restantes
        </span>
      </div>
      
      <div className="flex flex-col space-y-4">
        {steps.map(step => (
          <VerificationStepItem 
            key={step.number}
            step={step}
            verificationId={viewOnly ? undefined : verificationStep.id}
            isAdmin={isAdmin}
            onPayNow={onPayNow}
            onValidate={onValidate}
          />
        ))}
      </div>
    </div>
  );
}
