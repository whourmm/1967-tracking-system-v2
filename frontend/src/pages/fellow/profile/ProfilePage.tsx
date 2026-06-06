import { useState } from "react";
import {
  Camera,
  Check,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  MessageCircle,
  Pencil,
  Save,
  User,
} from "lucide-react";
import { Card, CardHeader } from "../../../components/ui/Card";
import { currentFellow } from "../../../data/mock";
import { cn } from "../../../lib/cn";

type Visibility = "public" | "private";

interface ContactField {
  key: string;
  label: string;
  icon: typeof Mail;
  placeholder: string;
  value: string;
  visibility: Visibility;
}

const defaultContacts: ContactField[] = [
  { key: "email", label: "Email", icon: Mail, placeholder: "your@email.com", value: "sirada.w@example.com", visibility: "public" },
  { key: "discord", label: "Discord", icon: MessageCircle, placeholder: "username#0000", value: "sirada_w", visibility: "public" },
  { key: "line", label: "LINE ID", icon: MessageCircle, placeholder: "your LINE ID", value: "siradawong", visibility: "private" },
  { key: "instagram", label: "Instagram", icon: Globe, placeholder: "@handle", value: "@sirada.w", visibility: "private" },
];

const availabilityDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const defaultAvailability: Record<string, boolean> = { Mon: true, Tue: true, Wed: false, Thu: true, Fri: true, Sat: false, Sun: false };

function VisibilityToggle({ visibility, onChange }: { visibility: Visibility; onChange: (v: Visibility) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(visibility === "public" ? "private" : "public")}
      className={cn(
        "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
        visibility === "public"
          ? "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
          : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
      )}
    >
      {visibility === "public" ? <><Eye className="h-3.5 w-3.5" />Public</> : <><EyeOff className="h-3.5 w-3.5" />Private</>}
    </button>
  );
}

export default function ProfilePage() {
  const [editingInfo, setEditingInfo] = useState(false);
  const [saved, setSaved] = useState(false);
  const [displayName, setDisplayName] = useState(currentFellow.name);
  const [nickname, setNickname] = useState("Sirada");
  const [university, setUniversity] = useState(currentFellow.university);
  const [major, setMajor] = useState("Commerce & Accountancy");
  const [contacts, setContacts] = useState<ContactField[]>(defaultContacts);
  const [availability, setAvailability] = useState(defaultAvailability);

  function handleVisibilityChange(key: string, v: Visibility) {
    setContacts((prev) => prev.map((c) => (c.key === key ? { ...c, visibility: v } : c)));
  }
  function handleContactValue(key: string, value: string) {
    setContacts((prev) => prev.map((c) => (c.key === key ? { ...c, value } : c)));
  }
  function handleSave() {
    setSaved(true);
    setEditingInfo(false);
    setTimeout(() => setSaved(false), 2500);
  }

  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your personal information, contacts, and availability.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-600 text-2xl font-bold text-white ring-4 ring-brand-100">
                  {initials}
                </div>
                <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-800 text-white shadow-md transition hover:bg-slate-700" aria-label="Change photo">
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-slate-900">{displayName}</p>
                <p className="text-sm text-slate-500">{currentFellow.team}</p>
                <span className="mt-2 inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{currentFellow.cohort}</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Availability" subtitle={`Internship start: 2026-04-14`} />
            <div className="p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">Available days</p>
              <div className="grid grid-cols-7 gap-1">
                {availabilityDays.map((day) => (
                  <button key={day} type="button"
                    onClick={() => setAvailability((prev) => ({ ...prev, [day]: !prev[day] }))}
                    className={cn("flex flex-col items-center rounded-md py-2 text-[11px] font-semibold transition-colors",
                      availability[day] ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                    )}
                  >{day}</button>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">{Object.values(availability).filter(Boolean).length} days / week available</p>
            </div>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-900">Personal Information</h3>
                <p className="mt-0.5 text-xs text-slate-500">Displayed to admins and your team</p>
              </div>
              {editingInfo ? (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setEditingInfo(false)} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">Cancel</button>
                  <button type="button" onClick={handleSave} className="flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-500">
                    <Save className="h-3.5 w-3.5" />Save
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setEditingInfo(true)} className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
                  <Pencil className="h-3.5 w-3.5" />Edit
                </button>
              )}
            </div>
            {saved && (
              <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-5 py-2.5 text-xs font-medium text-emerald-700">
                <Check className="h-4 w-4" />Changes saved successfully
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              {[
                { label: "Full name", value: displayName, setter: setDisplayName },
                { label: "Nickname", value: nickname, setter: setNickname },
                { label: "University", value: university, setter: setUniversity },
                { label: "Major", value: major, setter: setMajor },
              ].map(({ label, value, setter }) => (
                <div key={label}>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</label>
                  {editingInfo ? (
                    <input type="text" value={value} onChange={(e) => setter(e.target.value)}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{value}</p>
                  )}
                </div>
              ))}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Team</label>
                <p className="text-sm font-medium text-slate-900">{currentFellow.team}</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Role</label>
                <p className="text-sm font-medium text-slate-900">{currentFellow.role}</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Contact Details" subtitle="Control which contacts are visible on the Fellows Roster" />
            <div className="divide-y divide-slate-100">
              {contacts.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.key} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500"><Icon className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-xs font-semibold text-slate-500">{c.label}</p>
                      <input type="text" value={c.value} onChange={(e) => handleContactValue(c.key, e.target.value)} placeholder={c.placeholder}
                        className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100" />
                    </div>
                    <div className="self-start sm:self-auto">
                      <VisibilityToggle visibility={c.visibility} onChange={(v) => handleVisibilityChange(c.key, v)} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              <p className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">Private</span> contacts are only visible to admins.{" "}
                <span className="font-medium text-slate-700">Public</span> contacts appear in the Fellows Roster.
              </p>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600"><User className="h-4 w-4" /></span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">SBIE Fellow ID</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-slate-900">SBIE-2026-042</p>
              </div>
              <span className="self-start rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 sm:ml-auto sm:self-auto">Confirmed</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
