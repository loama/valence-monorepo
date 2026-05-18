import { ArrowLeft, Stethoscope } from "lucide-react";
import type { ReactNode } from "react";

import { therapistWelcomeSlides } from "@/components/app-demo/entry-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function TherapistWelcomeCarousel({
  brand,
  index,
  onBack,
  onNext
}: {
  brand: ReactNode;
  index: number;
  onBack: () => void;
  onNext: () => void;
}) {
  const slide = therapistWelcomeSlides[index];
  const progress = ((index + 1) / therapistWelcomeSlides.length) * 100;

  return (
    <>
      <div className="flex items-center justify-between">
        <Button onClick={onBack} size="icon" type="button" variant="ghost">
          <ArrowLeft />
        </Button>
        {brand}
        <Badge variant="secondary">{index + 1} / 4</Badge>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-6">
        <Card className="min-h-[28rem] overflow-hidden">
          <CardContent className="flex h-full min-h-[28rem] flex-col justify-between p-6">
            <div className="flex justify-center pt-10">
              <div className="grid size-32 place-items-center rounded-[2rem] bg-[var(--role-accent-soft)] text-[var(--role-accent)] shadow-sm">
                <Stethoscope className="size-16" />
              </div>
            </div>
            <div>
              <Badge className="mb-4" variant="outline">
                Psychologist
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
        <Progress value={progress} />
      </div>
      <div className="grid grid-cols-[1fr_2fr] gap-3">
        <Button onClick={onBack} type="button" variant="outline">
          Back
        </Button>
        <Button onClick={onNext} type="button">
          {index === therapistWelcomeSlides.length - 1 ? "Continue" : "Next"}
        </Button>
      </div>
    </>
  );
}
