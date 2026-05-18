import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { OnboardingFields } from "@/components/app-demo/onboarding-fields";
import { therapistOnboardingSteps } from "@/components/app-demo/entry-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function TherapistOnboardingScreen({
  brand,
  onBack,
  onNext,
  onSkipToApp,
  stepIndex
}: {
  brand: ReactNode;
  onBack: () => void;
  onNext: () => void;
  onSkipToApp: () => void;
  stepIndex: number;
}) {
  const step = therapistOnboardingSteps[stepIndex];
  const progress = ((stepIndex + 1) / therapistOnboardingSteps.length) * 100;

  return (
    <>
      <div className="flex items-center justify-between">
        <Button onClick={onBack} size="icon" type="button" variant="ghost">
          <ArrowLeft />
        </Button>
        {brand}
        <Badge variant="secondary">Step {stepIndex + 1} / 5</Badge>
      </div>
      <div className="mt-8 flex flex-1 flex-col gap-6">
        <div>
          <Badge variant="outline">Psychologist onboarding</Badge>
          <h1 className="mt-4 text-3xl font-semibold leading-tight">
            {step.title}
          </h1>
          <p className="mt-2 text-base leading-7 text-muted-foreground">
            {step.description}
          </p>
        </div>
        <Progress value={progress} />
        <Card>
          <CardContent className="flex flex-col gap-5 p-5">
            <OnboardingFields step={step} />
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-[1fr_2fr] gap-3">
        <Button onClick={onSkipToApp} type="button" variant="outline">
          Skip
        </Button>
        <Button onClick={onNext} type="button">
          {stepIndex === therapistOnboardingSteps.length - 1
            ? "Open app"
            : "Continue"}
        </Button>
      </div>
    </>
  );
}
