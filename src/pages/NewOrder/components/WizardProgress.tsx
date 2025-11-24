import { Check } from "lucide-react";
import type { WizardStep } from "../hooks/useOrderWizard";

interface Step {
  id: number;
  title: string;
  description: string;
}

interface WizardProgressProps {
  steps: Step[];
  currentStep: WizardStep;
  onStepClick: (step: WizardStep) => void;
}

export function WizardProgress({ steps, currentStep, onStepClick }: WizardProgressProps) {
  const currentStepIndex = currentStep - 1;

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {/* Linha de progresso */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = index < currentStepIndex;
          const isClickable = index <= currentStepIndex;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center flex-1 cursor-pointer group"
              onClick={() => isClickable && onStepClick(step.id as WizardStep)}
            >
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                  transition-all duration-300 mb-2
                  ${isCompleted
                    ? 'bg-primary text-primary-foreground'
                    : isActive
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : 'bg-gray-200 text-gray-500'
                  }
                  ${isClickable ? 'group-hover:scale-110' : ''}
                `}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : step.id}
              </div>
              <span
                className={`
                  text-xs font-medium text-center max-w-[120px]
                  ${isActive ? 'text-primary' : 'text-muted-foreground'}
                `}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
