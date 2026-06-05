import type {
  ActivityItem,
  Assignment,
  FellowProfile,
  LearningBlock,
  Resource,
  SpecialCurriculum,
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

// Assignments are the Google Forms tied to each learning block. `block` maps
// them back to the block they belong to, so the Learning System page can show
// them under "Submit" while the Assignments page tracks their status.
export const assignments: Assignment[] = [
  {
    id: 101,
    title: "Block A Reflection",
    description:
      "Reflect on the founder's mindset videos and what 'thinking like a founder' means to you.",
    block: "A",
    deadline: "2026-04-28",
    status: "graded",
    submittedAt: "2026-04-27",
    grade: "A-",
    formUrl: "https://forms.gle/example-a1",
  },
  {
    id: 102,
    title: "Self-Assessment Survey",
    description: "A short survey to baseline your skills before the program begins.",
    block: "A",
    deadline: "2026-04-28",
    status: "submitted",
    submittedAt: "2026-04-26",
    formUrl: "https://forms.gle/example-a2",
  },
  {
    id: 103,
    title: "Customer Interview Notes",
    description:
      "Submit notes from at least 8 customer interviews, including key pain points and quotes.",
    block: "B",
    deadline: "2026-05-12",
    status: "overdue",
    formUrl: "https://forms.gle/example-b1",
  },
  {
    id: 104,
    title: "Lean Canvas Draft",
    description: "Complete the first draft of your Lean Canvas for review.",
    block: "C",
    deadline: "2026-06-08",
    status: "pending",
    formUrl: "https://forms.gle/example-c1",
  },
  {
    id: 105,
    title: "Experiment Plan",
    description: "Design your first validation experiment and define a success metric.",
    block: "C",
    deadline: "2026-06-12",
    status: "pending",
    formUrl: "https://forms.gle/example-c2",
  },
  {
    id: 106,
    title: "Pitch Deck Submission",
    description: "Submit your pitch deck draft ahead of the mentor review session.",
    block: "D",
    deadline: "2026-06-20",
    status: "pending",
    formUrl: "https://forms.gle/example-d1",
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

// Standalone curriculum that doesn't belong to any block.
export const specialCurriculum: SpecialCurriculum[] = [
  {
    title: "The Startup Mindset Book",
    description:
      "Recommended reading for every fellow. Available as an English draft PDF and a Thai edition on MEB.",
    links: [
      {
        label: "English Version — Draft PDF",
        url: "https://drive.google.com/file/d/1HJqIT4hw_lgzVuur_N2Js_xookcOTRDF/view?usp=sharing",
        kind: "pdf",
        meta: "Google Drive",
      },
      {
        label: "Thai Version on MEB",
        url: "https://www.mebmarket.com/ebook-398897-THE-STARTUP-MINDSET",
        kind: "external",
        meta: "Thai · MEB",
      },
    ],
  },
];

// The core curriculum, grouped into blocks. Blocks are flexible: a block may
// have only videos, only articles, or only assignments.
export const learningBlocks: LearningBlock[] = [
  {
    id: "A",
    title: "Foundations of the Startup Mindset",
    description:
      "Why founders think differently, and the core principles you'll build on all program.",
    videos: [
      {
        label: "What is a Startup? (Intro)",
        url: "https://www.youtube.com",
        kind: "video",
        meta: "14 min",
      },
      {
        label: "The Founder's Mindset",
        url: "https://www.youtube.com",
        kind: "video",
        meta: "22 min",
      },
    ],
    articles: [
      {
        label: "From Idea to Opportunity",
        url: "https://seabridge.example.com/articles/idea-to-opportunity",
        kind: "article",
        meta: "SEAbridge · 8 min read",
      },
    ],
  },
  {
    id: "B",
    title: "Problem Discovery & Customers",
    description:
      "Finding a problem worth solving and talking to the people who have it.",
    videos: [
      {
        label: "How to Run Customer Interviews",
        url: "https://www.youtube.com",
        kind: "video",
        meta: "18 min",
      },
    ],
    // No articles for this block — that's fine, blocks aren't fixed.
  },
  {
    id: "C",
    title: "Building & Validating Solutions",
    description: "Turn insights into a testable solution and validate fast.",
    // No videos for this block.
    articles: [
      {
        label: "The Lean Canvas, Explained",
        url: "https://seabridge.example.com/articles/lean-canvas",
        kind: "article",
        meta: "SEAbridge · 9 min read",
      },
      {
        label: "Designing Your First Experiment",
        url: "https://seabridge.example.com/articles/first-experiment",
        kind: "article",
        meta: "SEAbridge · 11 min read",
      },
    ],
  },
  {
    id: "D",
    title: "Pitching & Telling Your Story",
    description: "Craft a narrative and a deck that holds attention.",
    videos: [
      {
        label: "Pitching to Investors",
        url: "https://www.youtube.com",
        kind: "video",
        meta: "55 min",
      },
    ],
    articles: [
      {
        label: "Anatomy of a Great Pitch Deck",
        url: "https://seabridge.example.com/articles/pitch-deck",
        kind: "article",
        meta: "SEAbridge · 7 min read",
      },
    ],
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
