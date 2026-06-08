import { Link, useOutletContext } from "react-router-dom";
import { ChevronRight, GraduationCap, Pin } from "lucide-react";
import { Card, CardHeader } from "../../../components/ui/Card";
import { allFellows, currentFellow, teamMembers } from "../../../data/mock";
import type { TeamMember } from "../../../types";
import type { FellowOutletContext } from "../../../components/layout/FellowLayout";
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
    "group relative flex w-56 shrink-0 flex-col items-center gap-3 rounded-xl border p-5 text-center transition",
    isMe
      ? "border-brand-200 bg-brand-50/40 ring-2 ring-brand-100"
      : "cursor-pointer border-slate-200 bg-white hover:border-brand-200 hover:bg-brand-50/20 hover:shadow-sm"
  );

  if (profileTo) return <Link to={profileTo} className={cardClass}>{inner}</Link>;
  return <div className={cardClass}>{inner}</div>;
}

export default function TeamPage() {
  const { selectedSprint } = useOutletContext<FellowOutletContext>();
  const nationalities = new Set(teamMembers.map((m) => m.country)).size;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">My Team</h1>
          <p className="mt-1 text-sm text-slate-500">{currentFellow.cohort} · {currentFellow.team}</p>
        </div>
      </div>

      <Card>
        <CardHeader title={currentFellow.team} subtitle={`${teamMembers.length} fellows · ${nationalities} nationalities · ${selectedSprint.name}`} />
        <div className="flex gap-4 overflow-x-auto p-5">
          {[
            ...teamMembers.filter((m) => m.name === currentFellow.name),
            ...teamMembers.filter((m) => m.name !== currentFellow.name),
          ].map((member) => (
            <MemberCard key={member.name} member={member} isMe={member.name === currentFellow.name} />
          ))}
        </div>
      </Card>
    </div>
  );
}
