import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { CalendarCheck, Check, ChevronRight, GraduationCap, Pin } from "lucide-react";
import { Card, CardHeader } from "../../../components/ui/Card";
import { allFellows, currentFellow, teamMembers } from "../../../data/mock";
import type { TeamMember } from "../../../types";
import type { FellowOutletContext } from "../../../components/layout/FellowLayout";
import { cn } from "../../../lib/cn";
import {
  dayFullNames,
  loadMyAvailability,
  weekDays,
} from "../../../lib/availability";

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

function memberProfileTo(member: TeamMember, isMe: boolean) {
  if (isMe) return "/fellow/settings";
  const fellowRecord = allFellows.find((f) => f.name === member.name);
  return fellowRecord ? `/fellow/roster/${fellowRecord.id}` : undefined;
}

// Compact row used on phones, where the tall profile cards would force a full
// screen of scrolling per member.
function MemberRow({ member, isMe }: { member: TeamMember; isMe: boolean }) {
  const flag = countryFlag[member.country] ?? "🌏";
  const profileTo = memberProfileTo(member, isMe);

  const inner = (
    <>
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          isMe
            ? "bg-brand-600 text-white ring-2 ring-brand-100"
            : "bg-slate-100 text-slate-600"
        )}
      >
        {member.initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-900">
            {member.name}
          </p>
          {isMe && (
            <span className="flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">
              <Pin className="h-2.5 w-2.5" />
              You
            </span>
          )}
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
              teamflowChip[member.teamflow]
            )}
          >
            {member.teamflow}
          </span>
        </div>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
          <span>{flag}</span>
          <span>{member.country}</span>
          <span className="text-slate-300">·</span>
          <GraduationCap className="h-3 w-3 shrink-0" />
          <span className="min-w-0 truncate">{member.university}</span>
        </p>
      </div>
      {profileTo && (
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-slate-500" />
      )}
    </>
  );

  const rowClass = cn(
    "group flex items-center gap-3 px-4 py-3.5 transition",
    isMe ? "bg-brand-50/40" : "hover:bg-slate-50"
  );

  if (profileTo)
    return (
      <Link to={profileTo} className={rowClass}>
        {inner}
      </Link>
    );
  return <div className={rowClass}>{inner}</div>;
}

function MemberCard({ member, isMe }: { member: TeamMember; isMe: boolean }) {
  const flag = countryFlag[member.country] ?? "🌏";
  const profileTo = memberProfileTo(member, isMe);

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
    "group relative flex min-w-0 flex-col items-center gap-3 rounded-xl border p-5 text-center transition",
    isMe
      ? "border-brand-200 bg-brand-50/40 ring-2 ring-brand-100"
      : "cursor-pointer border-slate-200 bg-white hover:border-brand-200 hover:bg-brand-50/20 hover:shadow-sm"
  );

  if (profileTo) return <Link to={profileTo} className={cardClass}>{inner}</Link>;
  return <div className={cardClass}>{inner}</div>;
}

// Join day names into a readable phrase: "Tuesday and Thursday".
function listDays(days: string[]) {
  const names = days.map((d) => dayFullNames[d] ?? d);
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

// Maps each member's available days (picked on their profile) onto a weekly
// grid so the team can see at a glance which day to book a meeting.
function TeamAvailability({ members }: { members: TeamMember[] }) {
  // The current fellow's selection lives in localStorage (set on My Profile);
  // teammates' days come with their member record.
  const [myDays] = useState(loadMyAvailability);

  const memberDays = members.map((member) => ({
    member,
    days:
      member.name === currentFellow.name
        ? new Set(weekDays.filter((d) => myDays[d]))
        : new Set(member.availability),
  }));

  const counts = weekDays.map(
    (day) => memberDays.filter(({ days }) => days.has(day)).length
  );
  const max = Math.max(...counts);
  const bestDays = max > 0 ? weekDays.filter((_, i) => counts[i] === max) : [];
  const everyoneFree = max === members.length;

  return (
    <Card>
      <CardHeader
        title="Team availability"
        subtitle="Days each member can meet, from their profile settings"
      />
      <div className="space-y-4 p-4 sm:p-5">
        <div
          className={cn(
            "flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-sm ring-1",
            bestDays.length === 0
              ? "bg-slate-50 text-slate-600 ring-slate-200"
              : everyoneFree
                ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                : "bg-amber-50 text-amber-800 ring-amber-200"
          )}
        >
          <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0" />
          {bestDays.length === 0 ? (
            <p>
              No availability shared yet. Ask everyone to pick their days on
              the profile page.
            </p>
          ) : everyoneFree ? (
            <p>
              Best {bestDays.length === 1 ? "day" : "days"} to meet:{" "}
              <strong className="font-semibold">{listDays(bestDays)}</strong> —
              all {members.length} members are free.
            </p>
          ) : (
            <p>
              No day works for everyone yet. Most of the team can make{" "}
              <strong className="font-semibold">{listDays(bestDays)}</strong> (
              {max} of {members.length} free).
            </p>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          {/* Day header */}
          <div className="grid grid-cols-[2.75rem_repeat(7,minmax(0,1fr))] border-b border-slate-200 bg-slate-50 sm:grid-cols-[minmax(0,11rem)_repeat(7,minmax(0,1fr))]">
            <div />
            {weekDays.map((day) => (
              <div
                key={day}
                className={cn(
                  "py-2 text-center text-[11px] font-semibold uppercase tracking-wider",
                  bestDays.includes(day) ? "text-brand-700" : "text-slate-500"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* One row per member */}
          {memberDays.map(({ member, days }) => {
            const isMe = member.name === currentFellow.name;
            return (
              <div
                key={member.name}
                className="grid grid-cols-[2.75rem_repeat(7,minmax(0,1fr))] border-b border-slate-100 sm:grid-cols-[minmax(0,11rem)_repeat(7,minmax(0,1fr))]"
              >
                <div className="flex items-center gap-2 py-2 pl-2 sm:pl-3">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      isMe
                        ? "bg-brand-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {member.initials}
                  </span>
                  <span className="hidden min-w-0 truncate text-xs font-medium text-slate-700 sm:block">
                    {member.name}
                    {isMe && <span className="text-slate-400"> (you)</span>}
                  </span>
                </div>
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className={cn(
                      "flex items-center justify-center py-2",
                      bestDays.includes(day) && "bg-emerald-50/60"
                    )}
                  >
                    {days.has(day) ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <span className="h-px w-2.5 bg-slate-200" />
                    )}
                  </div>
                ))}
              </div>
            );
          })}

          {/* Per-day tally */}
          <div className="grid grid-cols-[2.75rem_repeat(7,minmax(0,1fr))] bg-slate-50 sm:grid-cols-[minmax(0,11rem)_repeat(7,minmax(0,1fr))]">
            <div className="flex items-center py-2 pl-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 sm:pl-3">
              Free
            </div>
            {weekDays.map((day, i) => (
              <div
                key={day}
                className={cn(
                  "py-2 text-center text-xs font-semibold",
                  counts[i] === members.length
                    ? "text-emerald-700"
                    : counts[i] > 0
                      ? "text-slate-600"
                      : "text-slate-300"
                )}
              >
                {counts[i]}/{members.length}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Update your own days on{" "}
          <Link
            to="/fellow/settings"
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            Account Settings
          </Link>
          .
        </p>
      </div>
    </Card>
  );
}

export default function TeamPage() {
  const { selectedSprint } = useOutletContext<FellowOutletContext>();
  const nationalities = new Set(teamMembers.map((m) => m.country)).size;
  const orderedMembers = [
    ...teamMembers.filter((m) => m.name === currentFellow.name),
    ...teamMembers.filter((m) => m.name !== currentFellow.name),
  ];

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
        <div className="divide-y divide-slate-100 sm:hidden">
          {orderedMembers.map((member) => (
            <MemberRow key={member.name} member={member} isMe={member.name === currentFellow.name} />
          ))}
        </div>
        <div className="hidden gap-4 p-5 sm:grid sm:grid-cols-2 xl:grid-cols-4">
          {orderedMembers.map((member) => (
            <MemberCard key={member.name} member={member} isMe={member.name === currentFellow.name} />
          ))}
        </div>
      </Card>

      <TeamAvailability members={orderedMembers} />
    </div>
  );
}
