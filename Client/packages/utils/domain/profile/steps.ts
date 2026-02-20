import type { ProfileStep } from "./types";

const ALL_STEPS: ProfileStep[] = [
  { id: "demographics", title: "About You" },
  { id: "housing", title: "Housing" },
  { id: "location", title: "Location" },
  { id: "communication", title: "Communication" },
  { id: "financial", title: "Finances" },
];

export const getOnboardingSteps = (): ProfileStep[] => {
  const filtered = ALL_STEPS.filter((step) => step.id !== "communication");
  const financial = filtered.find((step) => step.id === "financial");
  const others = filtered.filter((step) => step.id !== "financial");
  return [...others, ...(financial ? [financial] : [])];
};

export const getPersonalizationSteps = (): ProfileStep[] => {
  const others = ALL_STEPS.filter((step) => step.id !== "communication");
  const demographics = others.find((step) => step.id === "demographics");
  const financial = others.find((step) => step.id === "financial");
  const middle = others.filter(
    (step) => step.id !== "demographics" && step.id !== "financial",
  );
  return [
    ...(demographics ? [demographics] : []),
    ...middle,
    ...(financial ? [financial] : []),
  ];
};
