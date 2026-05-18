import { SectionHeader } from "@/components/app-demo/section-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const exercises = [
  ["Breathing reset", "Six minutes to slow down before sleep.", 35],
  ["Thought record", "Capture a thought and gently test it.", 62],
  ["Grounding", "Use senses to return to the room.", 18]
] as const;

export function PatientExercisesScreen() {
  return (
    <section>
      <SectionHeader
        description="A patient-only area for simple guided practices."
        eyebrow="Exercises"
        title="Practice library"
      />
      <div className="grid gap-3">
        {exercises.map(([title, description, progress]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Progress value={progress} />
              <Button type="button" variant="outline">
                Open exercise
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
