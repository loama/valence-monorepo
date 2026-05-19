import type { ReactNode } from "react";

import { OnboardingCarousel } from "@/components/app-demo/onboarding-carousel";
import { therapistOnboardingSteps } from "@/components/app-demo/entry-content";

export function TherapistOnboardingScreen({
  brand,
  onBack,
  onNext,
  onSkipToApp,
  onStepBack,
  onStepForward,
  stepIndex
}: {
  brand: ReactNode;
  onBack: () => void;
  onNext: () => void;
  onSkipToApp: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  stepIndex: number;
}) {
  return (
    <OnboardingCarousel
      audience="Psychologist"
      brand={brand}
      onBack={onBack}
      onNext={onNext}
      onSkipToApp={onSkipToApp}
      onStepBack={onStepBack}
      onStepForward={onStepForward}
      stepIndex={stepIndex}
      steps={therapistOnboardingSteps}
    />
  );
}
