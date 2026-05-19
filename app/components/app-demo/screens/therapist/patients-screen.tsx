import { Search } from "lucide-react";
import { useState } from "react";

import { SectionHeader } from "@/components/app-demo/section-header";
import type {
  DemoConnectionRequest,
  DemoPatient
} from "@/components/app-demo/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  connectionRequests,
  onAcceptRequest,
  onDeclineRequest,
  onSelectPatient,
  patients
}: {
  connectionRequests: DemoConnectionRequest[];
  onAcceptRequest: (request: DemoConnectionRequest) => void;
  onDeclineRequest: (request: DemoConnectionRequest) => void;
  onSelectPatient: (patient: DemoPatient) => void;
  patients: DemoPatient[];
}) {
  const [query, setQuery] = useState("");
  const filteredPatients = patients.filter((patient) =>
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
      {connectionRequests.length > 0 ? (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Connection requests</CardTitle>
            <CardDescription>
              Patients can ask to add you as their psychologist. Review each
              request before it becomes part of your caseload.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pt-0">
            {connectionRequests.map((request) => (
              <div
                className="rounded-xl border border-border bg-background p-3"
                key={request.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{request.patientName}</p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {request.message ?? "Requested to connect on Valence."}
                    </p>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => onAcceptRequest(request)}
                    type="button"
                  >
                    Accept
                  </Button>
                  <Button
                    onClick={() => onDeclineRequest(request)}
                    type="button"
                    variant="outline"
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
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
