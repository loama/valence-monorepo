import { Badge } from "@/components/ui/badge";

export function SectionHeader({
  eyebrow,
  title,
  description
}: {
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-5">
      <Badge variant="outline">{eyebrow}</Badge>
      <h1 className="mt-3 text-3xl font-semibold leading-tight">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
