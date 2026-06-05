import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, Flag, Globe, GraduationCap, Pin, Shield, Users } from "lucide-react";
import { Card, CardHeader } from "../../../components/ui/Card";
import { allFellows, currentFellow, teamMembers, currentSprint } from "../../../data/mock";
import type { TeamMember } from "../../../types";
import { cn } from "../../../lib/cn";

const teamflowChip: Record<TeamMember["teamflow"], string> = {
  Initiator: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
  Translator: "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20",
  Sharper: "bg-violet-50 text-violet-700 ring-1 ring-violet-600/20",
  Finisher: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
};

const countryFlag: Record<string, string> = {
  Thailand: "🇹🇭", Vietnam: "🇻🇳", Singapore: "🇸🇬", Indonesia: "🇮🇩",
  Philippines: "🇵🇭", Malaysia: "🇲🇾", Myanmar: "🇲🇲", Cambodia: "🇰🇭",
};

const sprints = [
  { id: 1, name: "Sprint 1 · Discovery" },
  { id: 2, name: "Sprint 2 · Problem Framing" },
  { id: 3, name: "Sprint 3 · Prototyping" },
  { id: 4, name: currentSprint.name },
];

function MemberCard({ member, isMe }: { member: TeamMember; isMe: boolean }) {
  const flag = countryFlag[member.country] ?? "🌏";
  const fellowRecord = allFellows.find((f) => f.name === member.name);
  const profileTo = isMe ? "/fellow/profile" : fellowRecord ? `/fellow/roster/${fellowRecord.id}` : undefined;

  const inner = (
    <>
      {isMe && (
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">
          <Pin className="h-2.5 w-2.5" />You
        </span>
      )}
      {!isMe && (
        <span className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
          <ChevronRight className="h-4 w-4 text-brand-400" />
        </span>
      )}
      <div className={cn("flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold",
        isMe ? "bg-brand-600 text-white ring-4 ring-brand-100" : "bg-slate-100 text-slate-600"
      )}>
        {member.initials}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900">{member.name}</p>
        <span className={cn("mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium", teamflowChip[member.teamflow])}>
          {member.teamflow}
        </span>
      </div>
      <div className="w-full space-y-1 border-t border-slate-100 pt-3">
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600">
          <span>{flag}</span><span className="font-medium">{member.country}</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <GraduationCap className="h-3 w-3 shrink-0" />
          <span className="truncate">{member.university}</span>
        </div>
      </div>
    </>
  );

  const cardClass = cn(
    "group relative flex flex-col items-center gap-3 rounded-xl border p-5 text-center transition",
    isMe
      ? "border-brand-200 bg-brand-50/40 ring-2 ring-brand-100"
      : "cursor-pointer border-slate-200 bg-white hover:border-brand-200 hover:bg-brand-50/20 hover:shadow-sm"
  );

  if (profileTo) return <Link to={profileTo} className={cardClass}>{inner}</Link>;
  return <div className={cardClass}>{inner}</div>;
}

export default function TeamPage() {
  const [selectedSprintId, setSelectedSprintId] = useState(currentSprint.id);
  const [sprintOpen, setSprintOpen] = useState(false);
  const selectedSprint = sprints.find((s) => s.id === selectedSprintId) ?? sprints[sprints.length - 1];
  const nationalities = new Set(teamMembers.map((m) => m.country)).size;
  const hasFinisher = teamMembers.some((m) => m.teamflow === "Finisher");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Team</h1>
          <p className="mt-1 text-sm text-slate-500">{currentFellow.cohort} · {currentFellow.team}</p>
        </div>
        <div className="relative">
          <button type="button" onClick={() => setSprintOpen((o) => !o)}
            className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
            {selectedSprint.name}
            <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", sprintOpen && "rotate-180")} />
          </button>
          {sprintOpen && (
            <div className="absolute right-0 z-10 mt-1 w-56 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
              {sprints.map((s) => (
                <button key={s.id} type="button" onClick={() => { setSelectedSprintId(s.id); setSprintOpen(false); }}
                  className={cn("flex w-full items-center px-4 py-2.5 text-left text-sm transition hover:bg-slate-50",
                    s.id === selectedSprintId ? "font-semibold text-brand-600" : "font-medium text-slate-700"
                  )}>
                  {s.name}
                  {s.id === currentSprint.id && <span className="ml-auto rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600">Current</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Users, label: "Members", value: teamMembers.length, color: "text-brand-600 bg-brand-50" },
          { icon: Globe, label: "Nationalities", value: nationalities, color: "text-sky-600 bg-sky-50" },
          { icon: Shield, label: "Has Finisher", value: hasFinisher ? "Yes" : "No", color: hasFinisher ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50" },
          { icon: Flag, label: "Sprint", value: `#${selectedSprint.id}`, color: "text-violet-600 bg-violet-50" },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-3">
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", color)}><Icon className="h-5 w-5" /></span>
              <div>
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="text-base font-bold text-slate-900">{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title={currentFellow.team} subtitle={`${teamMembers.length} fellows · ${nationalities} nationalities · ${selectedSprint.name}`} />
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ...teamMembers.filter((m) => m.name === currentFellow.name),
            ...teamMembers.filter((m) => m.name !== currentFellow.name),
          ].map((member) => (
            <MemberCard key={member.name} member={member} isMe={member.name === currentFellow.name} />
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Team Composition Rules" subtitle="Validated for this sprint" />
        <div className="divide-y divide-slate-100">
          {[
            { rule: "Minimum 4 members", met: teamMembers.length >= 4, detail: `${teamMembers.length} members` },
            { rule: "At least 3 nationalities", met: nationalities >= 3, detail: `${nationalities} nationalities` },
            { rule: "At least 1 Finisher", met: hasFinisher, detail: hasFinisher ? teamMembers.find((m) => m.teamflow === "Finisher")?.name : "Missing Finisher" },
          ].map(({ rule, met, detail }) => (
            <div key={rule} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold",
                  met ? "bg-emerald-100 text-emerald-600" : "bg-brand-100 text-brand-600"
                )}>{met ? "✓" : "✗"}</span>
                <p className="text-sm font-medium text-slate-800">{rule}</p>
              </div>
              <span className={cn("text-xs font-medium", met ? "text-emerald-600" : "text-brand-600")}>{detail}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
