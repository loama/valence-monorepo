export type WelcomeSlide = {
  body: string;
  title: string;
};

export type OnboardingStep = {
  description: string;
  fields: Array<{
    label: string;
    options?: string[];
    placeholder?: string;
    type: "input" | "radio" | "textarea";
  }>;
  title: string;
};

export const patientWelcomeSlides: WelcomeSlide[] = [
  {
    title: "Care that stays organized",
    body: "Keep sessions, exercises, and messages in one calm place."
  },
  {
    title: "Know what comes next",
    body: "See upcoming appointments and what to practice before them."
  },
  {
    title: "Use exercises between visits",
    body: "Try short guided activities and track what feels helpful."
  },
  {
    title: "Message without losing context",
    body: "See how private chat will look once backend messages are live."
  }
];

export const therapistWelcomeSlides: WelcomeSlide[] = [
  {
    title: "A clean clinical workspace",
    body: "Manage sessions, patient context, and notes without visual noise."
  },
  {
    title: "Patients stay within reach",
    body: "Search your active list and open patient details from a drawer."
  },
  {
    title: "Sessions are easy to review",
    body: "Open details, prepare focus areas, and keep the next step clear."
  },
  {
    title: "Messages remain contextual",
    body: "Use the chat drawer while staying in the current screen."
  }
];

export const patientOnboardingSteps: OnboardingStep[] = [
  {
    title: "About you",
    description: "A few basics help shape your demo experience.",
    fields: [
      { label: "Preferred name", placeholder: "Olivia", type: "input" },
      {
        label: "What brings you here?",
        options: ["Anxiety", "Relationships", "Sleep", "Work stress"],
        type: "radio"
      }
    ]
  },
  {
    title: "Session preferences",
    description: "Choose how you would like sessions to work.",
    fields: [
      {
        label: "Preferred format",
        options: ["Video", "In person", "Either"],
        type: "radio"
      },
      { label: "Best days", placeholder: "Tuesday evenings", type: "input" }
    ]
  },
  {
    title: "Current goals",
    description: "Name the areas you want to focus on first.",
    fields: [
      {
        label: "Primary goal",
        placeholder: "Sleep better and feel less anxious at night",
        type: "textarea"
      }
    ]
  },
  {
    title: "Check-in style",
    description: "Pick the amount of structure that feels comfortable.",
    fields: [
      {
        label: "Reminders",
        options: ["Gentle", "Structured", "Only before sessions"],
        type: "radio"
      },
      { label: "Anything to avoid?", placeholder: "Optional", type: "input" }
    ]
  },
  {
    title: "Ready to explore",
    description: "You can change this later from profile.",
    fields: [
      {
        label: "What would make Valence useful this week?",
        placeholder: "A simple way to prepare for my next session",
        type: "textarea"
      }
    ]
  }
];

export const therapistOnboardingSteps: OnboardingStep[] = [
  {
    title: "Practice profile",
    description: "Set the name and modality shown in the demo.",
    fields: [
      { label: "Display name", placeholder: "Dr. Emma Lin", type: "input" },
      {
        label: "Session format",
        options: ["Virtual", "In person", "Both"],
        type: "radio"
      }
    ]
  },
  {
    title: "Clinical approach",
    description: "Choose what your profile should highlight.",
    fields: [
      {
        label: "Therapy style",
        options: ["CBT", "ACT", "Psychodynamic", "Integrative"],
        type: "radio"
      },
      { label: "Specialty", placeholder: "Anxiety and trauma", type: "input" }
    ]
  },
  {
    title: "Availability",
    description: "Make the schedule feel realistic for the demo.",
    fields: [
      { label: "Clinic hours", placeholder: "Mon to Thu, 10 AM to 6 PM", type: "input" },
      {
        label: "New patients",
        options: ["Accepting", "Waitlist", "Not right now"],
        type: "radio"
      }
    ]
  },
  {
    title: "Patient intake",
    description: "Configure what you want to capture first.",
    fields: [
      {
        label: "Required intake",
        options: ["Goals", "Symptoms", "History", "Consent"],
        type: "radio"
      },
      {
        label: "Intake note",
        placeholder: "Ask about sleep and support system",
        type: "textarea"
      }
    ]
  },
  {
    title: "Workspace defaults",
    description: "Pick the first thing you want to see after login.",
    fields: [
      {
        label: "Default screen",
        options: ["Home", "Sessions", "Patients"],
        type: "radio"
      }
    ]
  }
];
