import { Search } from "lucide-react";
import { useState } from "react";

import { demoPatients } from "@/components/app-demo/data";
import { SectionHeader } from "@/components/app-demo/section-header";
import type { DemoPatient } from "@/components/app-demo/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

export function TherapistPatientsScreen({
  onSelectPatient
}: {
  onSelectPatient: (patient: DemoPatient) => void;
}) {
  const [query, setQuery] = useState("");
  const filteredPatients = demoPatients.filter((patient) =>
    `${patient.name} ${patient.focus}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );

  return (
    <section>
      <SectionHeader
        description="Search patients and open details without leaving the list."
        eyebrow="Patients"
        title="Patient list"
      />
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-12 pl-10"
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Search by name or focus"
          value={query}
        />
      </div>
      <div className="grid gap-3">
        {filteredPatients.map((patient) => (
          <Card
            className="cursor-pointer transition-transform active:scale-[0.99]"
            key={patient.id}
            onClick={() => onSelectPatient(patient)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">{patient.name}</CardTitle>
                  <CardDescription>{patient.focus}</CardDescription>
                </div>
                <Badge variant={patient.risk === "Low" ? "secondary" : "outline"}>
                  {patient.risk}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2 pt-0">
              <Progress value={patient.progress} />
              <p className="text-sm text-muted-foreground">
                Last seen {patient.lastSeen}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
