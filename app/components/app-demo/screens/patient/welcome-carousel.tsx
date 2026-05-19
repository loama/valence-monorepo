import { HeartPulse } from "lucide-react";
import type { ReactNode } from "react";

import { patientWelcomeSlides } from "@/components/app-demo/entry-content";
import { WelcomeCarouselFrame } from "@/components/app-demo/welcome-carousel-frame";

export function PatientWelcomeCarousel({
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
      audience="Patient"
      brand={brand}
      icon={HeartPulse}
      index={index}
      onBack={onBack}
      onNext={onNext}
      slides={patientWelcomeSlides}
    />
  );
}
