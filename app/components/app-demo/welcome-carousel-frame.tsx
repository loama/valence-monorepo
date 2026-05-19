"use client";

import { ArrowLeft, type LucideIcon } from "lucide-react";
import type { PointerEvent, ReactNode } from "react";
import { useRef } from "react";

import type { WelcomeSlide } from "@/components/app-demo/entry-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function WelcomeCarouselFrame({
  audience,
  brand,
  icon: Icon,
  index,
  onBack,
  onNext,
  slides
}: {
  audience: string;
  brand: ReactNode;
  icon: LucideIcon;
  index: number;
  onBack: () => void;
  onNext: () => void;
  slides: WelcomeSlide[];
}) {
  const startXRef = useRef<number | null>(null);
  const progress = ((index + 1) / slides.length) * 100;

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

    if (Math.abs(deltaX) < 44) {
      return;
    }

    if (deltaX < 0) {
      onNext();
      return;
    }

    onBack();
  }

  return (
    <>
      <div className="fixed left-1/2 top-0 z-20 w-full max-w-md -translate-x-1/2 bg-background/85 px-5 pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur-md">
        <div className="flex items-center justify-between">
          <Button onClick={onBack} size="icon" type="button" variant="ghost">
            <ArrowLeft />
          </Button>
          {brand}
          <Badge variant="secondary">
            {index + 1} / {slides.length}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-5 overflow-hidden pb-24 pt-24">
        <div
          className="touch-pan-y overflow-visible"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((slide, slideIndex) => (
              <div className="min-w-full px-0" key={slide.title}>
                <Card
                  className={cn(
                    "min-h-[28rem] overflow-hidden transition-all duration-300",
                    slideIndex === index
                      ? "scale-100 opacity-100"
                      : "scale-[0.96] opacity-50"
                  )}
                >
                  <CardContent className="flex h-full min-h-[28rem] flex-col justify-between p-6">
                    <div className="flex justify-center pt-10">
                      <div className="grid size-32 place-items-center rounded-[2rem] bg-[var(--role-accent-soft)] text-[var(--role-accent)]">
                        <Icon className="size-16" />
                      </div>
                    </div>
                    <div>
                      <Badge className="mb-4" variant="outline">
                        {audience}
                      </Badge>
                      <h1 className="text-4xl font-semibold leading-tight">
                        {slide.title}
                      </h1>
                      <p className="mt-3 text-base leading-7 text-muted-foreground">
                        {slide.body}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
        <Progress value={progress} />
      </div>

      <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 bg-background/85 px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 backdrop-blur-md">
        <div className="grid grid-cols-[1fr_2fr] gap-3">
          <Button onClick={onBack} type="button" variant="outline">
            Back
          </Button>
          <Button onClick={onNext} type="button">
            {index === slides.length - 1 ? "Continue" : "Next"}
          </Button>
        </div>
      </div>
    </>
  );
}
