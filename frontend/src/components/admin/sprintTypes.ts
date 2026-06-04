export type KeyDate = {
  label: string;
  date: string;
};

export type SprintStatus = "Current" | "Upcoming" | "Complete" | "Draft";

export type Sprint = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  keyDates: KeyDate[];
};
