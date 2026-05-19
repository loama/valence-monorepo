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
      <div className="fixed left-1/2 top-0 z-20 w-full max-w-md -translate-x-1/2 border-b border-border/20 bg-background/95 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur-md">
        <div className="flex items-center justify-between">
          <Button onClick={onBack} size="icon" type="button" variant="ghost">
            <ArrowLeft />
          </Button>
          {brand}
          <Badge variant="secondary">
            Step {stepIndex + 1} / {steps.length}
          </Badge>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.8rem)] top-[calc(env(safe-area-inset-top)+4.9rem)] mx-auto w-full max-w-md overflow-y-auto px-5">
        <div className="flex min-h-full flex-col gap-5 pb-6 pt-5">
        <div>
          <Badge variant="outline">{audience} onboarding</Badge>
          <h1 className="mt-4 text-3xl font-semibold leading-tight">
            Tell us what should shape your care
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Swipe through each card or use the buttons below. You can update
            these preferences later from your profile.
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
      </div>
      <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-border/20 bg-background/95 px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 backdrop-blur-md">
        <div className="grid grid-cols-[1fr_2fr] gap-3">
          <Button onClick={onSkipToApp} type="button" variant="outline">
            Skip
          </Button>
          <Button className="font-semibold" onClick={onNext} type="button">
            {stepIndex === steps.length - 1 ? "Open app" : "Next"}
          </Button>
        </div>
      </div>
    </>
  );
}
