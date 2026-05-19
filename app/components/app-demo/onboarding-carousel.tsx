"use client";

import { ArrowLeft } from "lucide-react";
import type { PointerEvent, ReactNode } from "react";
import { useRef } from "react";

import { OnboardingFields } from "@/components/app-demo/onboarding-fields";
import type { OnboardingStep } from "@/components/app-demo/entry-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function OnboardingCarousel({
  audience,
  brand,
  onBack,
  onNext,
  onSkipToApp,
  onStepBack,
  onStepForward,
  stepIndex,
  steps
}: {
  audience: string;
  brand: ReactNode;
  onBack: () => void;
  onNext: () => void;
  onSkipToApp: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  stepIndex: number;
  steps: OnboardingStep[];
}) {
  const startXRef = useRef<number | null>(null);
  const progress = ((stepIndex + 1) / steps.length) * 100;

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    startXRef.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const startX = startXRef.current;
    startXRef.current = null;

    if (startX === null) {
      return;
    }

    const deltaX = event.clientX - startX;

    if (Math.abs(deltaX) < 48) {
      return;
    }

    if (deltaX < 0) {
      onStepForward();
      return;
    }

    onStepBack();
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Button onClick={onBack} size="icon" type="button" variant="ghost">
          <ArrowLeft />
        </Button>
        {brand}
        <Badge variant="secondary">
          Step {stepIndex + 1} / {steps.length}
        </Badge>
      </div>
      <div className="mt-7 flex flex-1 flex-col gap-5 overflow-hidden">
        <div>
          <Badge variant="outline">{audience} onboarding</Badge>
          <h1 className="mt-4 text-3xl font-semibold leading-tight">
            Tell us what should shape your care
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Swipe through each card or use the buttons below. The form stays
            local for now and will map to your profile later.
          </p>
        </div>
        <Progress value={progress} />
        <div
          className="touch-pan-y overflow-hidden"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${stepIndex * 100}%)` }}
          >
            {steps.map((step, index) => (
              <div className="min-w-full pr-0" key={step.title}>
                <Card
                  className={cn(
                    "min-h-[22rem] overflow-hidden transition-opacity duration-300",
                    index === stepIndex ? "opacity-100" : "opacity-45"
                  )}
                >
                  <CardContent className="flex min-h-[22rem] flex-col gap-5 p-5">
                    <div>
                      <Badge variant="secondary">
                        {String(index + 1).padStart(2, "0")}
                      </Badge>
                      <h2 className="mt-3 text-2xl font-semibold leading-tight">
                        {step.title}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                    <OnboardingFields step={step} />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_2fr] gap-3">
        <Button onClick={onSkipToApp} type="button" variant="outline">
          Skip
        </Button>
        <Button className="font-semibold" onClick={onNext} type="button">
          {stepIndex === steps.length - 1 ? "Open app" : "Next"}
        </Button>
      </div>
    </>
  );
}
