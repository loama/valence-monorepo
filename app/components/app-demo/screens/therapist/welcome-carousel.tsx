import { Stethoscope } from "lucide-react";
import type { ReactNode } from "react";

import { therapistWelcomeSlides } from "@/components/app-demo/entry-content";
import { WelcomeCarouselFrame } from "@/components/app-demo/welcome-carousel-frame";

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
  return (
    <WelcomeCarouselFrame
      audience="Psychologist"
      brand={brand}
      icon={Stethoscope}
      index={index}
      onBack={onBack}
      onNext={onNext}
      slides={therapistWelcomeSlides}
    />
  );
}
