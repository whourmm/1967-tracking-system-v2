import type {
  ActivityItem,
  Assignment,
  FellowProfile,
  Resource,
  Sprint,
} from "../types";

export const currentFellow: FellowProfile = {
  name: "Sirada Wong",
  role: "Fellow",
  team: "Team Mekong",
  cohort: "Cohort 2026",
  university: "Chulalongkorn University",
  avatarInitials: "SW",
};

export const currentSprint: Sprint = {
  id: 4,
  name: "Sprint 4 · Market Validation",
  description:
    "Validate your problem statement with real users and synthesize findings into an insight report.",
  startsOn: "2026-05-26",
  deadline: "2026-06-12",
  isCurrent: true,
};

export const assignments: Assignment[] = [
  {
    id: 101,
    title: "Customer Interview Synthesis",
    description:
      "Submit a synthesis of at least 8 customer interviews including key pain points and quotes.",
    sprint: "Sprint 4",
    deadline: "2026-06-12",
    status: "pending",
    formUrl: "#",
  },
  {
    id: 102,
    title: "Problem Statement v2",
    description:
      "Refine your problem statement based on mentor feedback from the last review.",
    sprint: "Sprint 4",
    deadline: "2026-06-08",
    status: "pending",
    formUrl: "#",
  },
  {
    id: 103,
    title: "Competitive Landscape Map",
    description:
      "Map at least 5 competitors across two axes relevant to your market.",
    sprint: "Sprint 3",
    deadline: "2026-05-30",
    status: "overdue",
    formUrl: "#",
  },
  {
    id: 104,
    title: "Lean Canvas Draft",
    description: "Complete the first draft of your Lean Canvas for review.",
    sprint: "Sprint 3",
    deadline: "2026-05-22",
    status: "graded",
    submittedAt: "2026-05-21",
    grade: "A",
    formUrl: "#",
  },
  {
    id: 105,
    title: "Team Charter",
    description: "Agree on roles, working norms, and a communication plan.",
    sprint: "Sprint 2",
    deadline: "2026-05-10",
    status: "submitted",
    submittedAt: "2026-05-09",
    formUrl: "#",
  },
  {
    id: 106,
    title: "Problem Discovery Brief",
    description: "Document the problem space and your initial hypotheses.",
    sprint: "Sprint 1",
    deadline: "2026-04-28",
    status: "graded",
    submittedAt: "2026-04-27",
    grade: "A-",
    formUrl: "#",
  },
];

export const resources: Resource[] = [
  {
    id: 201,
    type: "CASE",
    name: "Grab: Building a Super App in Southeast Asia",
    description:
      "How Grab expanded from ride-hailing into payments, food, and financial services across the region.",
    duration: "25 min read",
    author: "Harvard Business Review",
    tag: "Scaling",
    progress: 100,
  },
  {
    id: 202,
    type: "LECTURE",
    name: "Finding Product–Market Fit",
    description:
      "A practical framework for measuring and reaching product–market fit for early-stage startups.",
    duration: "48 min",
    author: "Anchalee P.",
    tag: "Product",
    progress: 60,
  },
  {
    id: 203,
    type: "ARTICLE",
    name: "How to Run Great Customer Interviews",
    description:
      "Avoid leading questions and learn to extract honest, actionable insight from your users.",
    duration: "12 min read",
    author: "The Mom Test",
    tag: "Research",
    progress: 0,
  },
  {
    id: 204,
    type: "LECTURE",
    name: "Pitching to Investors",
    description:
      "Structure a compelling narrative and a deck that holds attention from slide one.",
    duration: "55 min",
    author: "Visit V.",
    tag: "Fundraising",
    progress: 0,
  },
  {
    id: 205,
    type: "CASE",
    name: "Gojek vs. Grab: The Battle for Indonesia",
    description:
      "A comparative look at two super-app strategies competing in the largest ASEAN market.",
    duration: "30 min read",
    author: "INSEAD",
    tag: "Strategy",
    progress: 0,
  },
  {
    id: 206,
    type: "ARTICLE",
    name: "Lean Canvas, Explained",
    description:
      "Break down your business model into nine blocks you can validate in a week.",
    duration: "9 min read",
    author: "Ash Maurya",
    tag: "Strategy",
    progress: 100,
  },
];

export const recentActivity: ActivityItem[] = [
  {
    id: 1,
    text: "Your submission for “Lean Canvas Draft” was graded A.",
    time: "2 hours ago",
    kind: "submission",
  },
  {
    id: 2,
    text: "New lecture added: “Pitching to Investors”.",
    time: "Yesterday",
    kind: "resource",
  },
  {
    id: 3,
    text: "Mentor left feedback on your Problem Statement.",
    time: "2 days ago",
    kind: "announcement",
  },
  {
    id: 4,
    text: "Naphat joined Team Mekong.",
    time: "4 days ago",
    kind: "team",
  },
];

export const teamMembers = [
  { name: "Sirada Wong", role: "Product", initials: "SW" },
  { name: "Naphat Tan", role: "Engineering", initials: "NT" },
  { name: "Mali Chen", role: "Design", initials: "MC" },
  { name: "Arthit Kul", role: "Business", initials: "AK" },
];
