"use client";

import React, { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

interface StepWizardContextType {
  currentStep: number;
  totalSteps: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  completedSteps: Set<number>;
  markStepComplete: (step: number) => void;
  isStepComplete: (step: number) => boolean;
}

const StepWizardContext = createContext<StepWizardContextType | undefined>(
  undefined
);

export const useStepWizard = () => {
  const context = useContext(StepWizardContext);
  if (!context) {
    throw new Error("useStepWizard must be used within a StepWizard");
  }
  return context;
};

interface StepWizardProps {
  children: React.ReactNode;
  onStepChange?: (step: number) => void;
  initialStep?: number;
}

export function StepWizard({
  children,
  onStepChange,
  initialStep = 0,
}: StepWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const steps = React.Children.toArray(children);
  const totalSteps = steps.length;

  const goToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
      onStepChange?.(step);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      markStepComplete(currentStep);
      goToStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  const markStepComplete = (step: number) => {
    setCompletedSteps((prev) => new Set(prev).add(step));
  };

  const isStepComplete = (step: number) => {
    return completedSteps.has(step);
  };

  const value: StepWizardContextType = {
    currentStep,
    totalSteps,
    goToStep,
    nextStep,
    previousStep,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === totalSteps - 1,
    completedSteps,
    markStepComplete,
    isStepComplete,
  };

  return (
    <StepWizardContext.Provider value={value}>
      <div className="space-y-6">{steps[currentStep]}</div>
    </StepWizardContext.Provider>
  );
}

interface StepProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function Step({ children, title, description }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

interface StepIndicatorProps {
  steps: { label: string; description?: string }[];
  orientation?: "horizontal" | "vertical";
}

export function StepIndicator({
  steps,
  orientation = "vertical",
}: StepIndicatorProps) {
  const { currentStep, goToStep, completedSteps } = useStepWizard();

  if (orientation === "horizontal") {
    return (
      <div className="flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = completedSteps.has(index);
          const isAccessible = index <= currentStep || isCompleted;

          return (
            <React.Fragment key={index}>
              <button
                onClick={() => isAccessible && goToStep(index)}
                disabled={!isAccessible}
                className={cn(
                  "flex flex-col items-center gap-2 transition-all",
                  isAccessible
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-50"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all",
                    isActive &&
                      "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    isCompleted &&
                      !isActive &&
                      "bg-primary text-primary-foreground",
                    !isActive &&
                      !isCompleted &&
                      "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="text-center">
                  <div
                    className={cn(
                      "text-sm font-medium",
                      isActive && "text-primary"
                    )}
                  >
                    {step.label}
                  </div>
                  {step.description && (
                    <div className="text-xs text-muted-foreground hidden sm:block">
                      {step.description}
                    </div>
                  )}
                </div>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-[2px] mx-2 transition-colors",
                    completedSteps.has(index) ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // Vertical orientation
  return (
    <div className="space-y-1">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = completedSteps.has(index);
        const isAccessible = index <= currentStep || isCompleted;

        return (
          <button
            key={index}
            onClick={() => isAccessible && goToStep(index)}
            disabled={!isAccessible}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
              isActive && "bg-primary/10 border-l-4 border-primary",
              !isActive && "hover:bg-muted/50",
              isAccessible ? "cursor-pointer" : "cursor-not-allowed opacity-50"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all flex-shrink-0",
                isActive && "bg-primary text-primary-foreground",
                isCompleted &&
                  !isActive &&
                  "bg-primary text-primary-foreground",
                !isActive && !isCompleted && "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  "text-sm font-medium truncate",
                  isActive && "text-primary font-semibold"
                )}
              >
                {step.label}
              </div>
              {step.description && (
                <div className="text-xs text-muted-foreground truncate">
                  {step.description}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface StepNavigationProps {
  onPrevious?: () => void;
  onNext?: () => void;
  onComplete?: () => void;
  nextLabel?: string;
  previousLabel?: string;
  completeLabel?: string;
  showPrevious?: boolean;
  showNext?: boolean;
  disableNext?: boolean;
  disablePrevious?: boolean;
}

export function StepNavigation({
  onPrevious,
  onNext,
  onComplete,
  nextLabel = "Next",
  previousLabel = "Previous",
  completeLabel = "Complete",
  showPrevious = true,
  showNext = true,
  disableNext = false,
  disablePrevious = false,
}: StepNavigationProps) {
  const { isFirstStep, isLastStep, nextStep, previousStep } = useStepWizard();

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
    } else {
      previousStep();
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else {
      nextStep();
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="flex items-center justify-between pt-6 border-t">
      <div>
        {showPrevious && !isFirstStep && (
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={disablePrevious}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {previousLabel}
          </Button>
        )}
      </div>
      <div>
        {showNext && !isLastStep && (
          <Button type="button" onClick={handleNext} disabled={disableNext}>
            {nextLabel}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
        {isLastStep && (
          <Button type="button" onClick={handleComplete} disabled={disableNext}>
            {completeLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
