import type { ReactNode } from "react";

import { OnboardingCarousel } from "@/components/app-demo/onboarding-carousel";
import { patientOnboardingSteps } from "@/components/app-demo/entry-content";

export function PatientOnboardingScreen({
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
      audience="Patient"
      brand={brand}
      onBack={onBack}
      onNext={onNext}
      onSkipToApp={onSkipToApp}
      onStepBack={onStepBack}
      onStepForward={onStepForward}
      stepIndex={stepIndex}
      steps={patientOnboardingSteps}
    />
  );
}
