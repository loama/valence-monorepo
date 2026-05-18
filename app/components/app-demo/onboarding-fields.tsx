import type { OnboardingStep } from "@/components/app-demo/entry-content";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

export function OnboardingFields({ step }: { step: OnboardingStep }) {
  return (
    <>
      {step.fields.map((field) => (
        <div className="flex flex-col gap-3" key={field.label}>
          <Label>{field.label}</Label>
          {field.type === "input" ? (
            <Input className="h-12" placeholder={field.placeholder} />
          ) : null}
          {field.type === "textarea" ? (
            <Textarea
              className="min-h-28 resize-none"
              placeholder={field.placeholder}
            />
          ) : null}
          {field.type === "radio" ? (
            <RadioGroup defaultValue={field.options?.[0]}>
              {field.options?.map((option) => (
                <Label
                  className="flex min-h-12 items-center gap-3 rounded-xl border bg-background px-3 text-sm font-medium transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10"
                  key={option}
                >
                  <RadioGroupItem value={option} />
                  {option}
                </Label>
              ))}
            </RadioGroup>
          ) : null}
        </div>
      ))}
    </>
  );
}
