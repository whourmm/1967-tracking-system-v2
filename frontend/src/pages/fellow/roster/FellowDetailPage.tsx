import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, GraduationCap, Globe, Mail, MessageCircle, Users } from "lucide-react";
import { Card, CardHeader } from "../../../components/ui/Card";
import { allFellows } from "../../../data/mock";
import type { FellowRecord, TeamFlow } from "../../../types";
import { cn } from "../../../lib/cn";

const teamflowChip: Record<TeamFlow, string> = {
  Initiator: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
  Translator: "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20",
  Sharper: "bg-violet-50 text-violet-700 ring-1 ring-violet-600/20",
  Finisher: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
};

const teamflowDesc: Record<TeamFlow, string> = {
  Initiator: "Generates ideas, kicks off momentum, and pushes the team to start.",
  Translator: "Bridges concepts and people — explains clearly across contexts.",
  Sharper: "Challenges assumptions and refines ideas into their clearest form.",
  Finisher: "Drives things to completion and makes sure nothing falls through.",
};

const countryFlag: Record<string, string> = {
  Thailand: "🇹🇭", Vietnam: "🇻🇳", Singapore: "🇸🇬", Indonesia: "🇮🇩",
  Philippines: "🇵🇭", Malaysia: "🇲🇾", Myanmar: "🇲🇲", Cambodia: "🇰🇭",
};

function ContactRow({ icon: Icon, label, value, href }: { icon: typeof Mail; label: string; value: string | null; href?: string }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500"><Icon className="h-4 w-4" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        {value ? (
          href ? (
            <a href={href} target="_blank" rel="noreferrer" className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">
              {value}<ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          ) : (
            <p className="mt-0.5 text-sm font-medium text-slate-900">{value}</p>
          )
        ) : (
          <p className="mt-0.5 text-sm italic text-slate-400">Not shared</p>
        )}
      </div>
    </div>
  );
}

export default function FellowDetailPage() {
  const { fellowId } = useParams<{ fellowId: string }>();
  const fellow = allFellows.find((f) => f.id === Number(fellowId));
  if (!fellow) return <Navigate to="/fellow/roster" replace />;

  const teammates = allFellows.filter((f) => f.team === fellow.team && f.id !== fellow.id);
  const flag = countryFlag[fellow.country] ?? "🌏";

  return (
    <div className="space-y-6">
      <Link to="/fellow/roster" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" />Back to Roster
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-600 text-2xl font-bold text-white ring-4 ring-brand-100">{fellow.initials}</div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">{fellow.name}</h1>
                <p className="mt-0.5 text-sm text-slate-500">{fellow.team}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                  fellow.status === "Confirmed" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-amber-50 text-amber-700 ring-amber-600/20"
                )}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", fellow.status === "Confirmed" ? "bg-emerald-500" : "bg-amber-500")} />
                  {fellow.status}
                </span>
                <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", teamflowChip[fellow.teamflow])}>{fellow.teamflow}</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="About" />
            <div className="divide-y divide-slate-100">
              {[
                { icon: "flag" as const, label: "Country", value: `${flag} ${fellow.country}` },
                { icon: "grad" as const, label: "University", value: fellow.university },
                { icon: "team" as const, label: "Team", value: fellow.team },
                { icon: "globe" as const, label: "Cohort Start", value: fellow.startDate },
              ].map(({ icon, label, value }) => {
                const Icon = icon === "grad" ? GraduationCap : icon === "team" ? Users : Globe;
                return (
                  <div key={label} className="flex items-center gap-3 px-5 py-3">
                    <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-900">{value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Contact" subtitle="Only contacts shared by this fellow are visible" />
            <div className="divide-y divide-slate-100">
              <ContactRow icon={Mail} label="Email" value={fellow.email} href={fellow.email ? `mailto:${fellow.email}` : undefined} />
              <ContactRow icon={MessageCircle} label="Discord" value={fellow.discord} />
              <ContactRow icon={MessageCircle} label="LINE ID" value={fellow.line} />
              <ContactRow icon={Globe} label="Instagram" value={fellow.instagram}
                href={fellow.instagram ? `https://instagram.com/${fellow.instagram.replace("@", "")}` : undefined} />
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className={cn("p-5",
              fellow.teamflow === "Initiator" && "bg-amber-50",
              fellow.teamflow === "Translator" && "bg-sky-50",
              fellow.teamflow === "Sharper" && "bg-violet-50",
              fellow.teamflow === "Finisher" && "bg-emerald-50"
            )}>
              <span className={cn("inline-flex rounded-full px-3 py-1 text-sm font-bold", teamflowChip[fellow.teamflow])}>{fellow.teamflow}</span>
              <p className="mt-3 text-sm text-slate-700">{teamflowDesc[fellow.teamflow]}</p>
            </div>
          </Card>

          {teammates.length > 0 && (
            <Card>
              <CardHeader title={`${fellow.team} Members`} subtitle={`${teammates.length + 1} fellows in this team`}
                action={<Link to="/fellow/teams" className="text-xs font-semibold text-brand-600 hover:text-brand-700">View team</Link>} />
              <ul className="divide-y divide-slate-100">
                {teammates.map((mate: FellowRecord) => (
                  <li key={mate.id}>
                    <Link to={`/fellow/roster/${mate.id}`} className="group flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{mate.initials}</div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{mate.name}</p>
                        <p className="text-xs text-slate-500">{countryFlag[mate.country] ?? "🌏"} {mate.country}</p>
                      </div>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", teamflowChip[mate.teamflow])}>{mate.teamflow}</span>
                      <ArrowLeft className="h-3.5 w-3.5 shrink-0 rotate-180 text-slate-300 transition group-hover:text-slate-500" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
