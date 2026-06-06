import { useState } from "react";
import { Bell, Check, ChevronRight, Eye, EyeOff, KeyRound, LogOut, Mail, Shield, Smartphone, User } from "lucide-react";
import { Card, CardHeader } from "../../../components/ui/Card";
import { currentFellow } from "../../../data/mock";
import { cn } from "../../../lib/cn";

type Section = "account" | "notifications" | "privacy" | "security";

const sections: { key: Section; label: string; icon: typeof User }[] = [
  { key: "account", label: "Account", icon: User },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "privacy", label: "Privacy", icon: Shield },
  { key: "security", label: "Security", icon: KeyRound },
];

interface Toggle { key: string; label: string; description: string; enabled: boolean; }

const notificationDefaults: Toggle[] = [
  { key: "sprint_deadline", label: "Sprint deadlines", description: "Reminder 3 days before each sprint submission closes", enabled: true },
  { key: "assignment_due", label: "Assignment due dates", description: "Daily digest of upcoming assignment deadlines", enabled: true },
  { key: "mentor_feedback", label: "Mentor feedback", description: "When a mentor leaves feedback on your work", enabled: true },
  { key: "team_updates", label: "Team updates", description: "When members join or leave your team", enabled: false },
  { key: "new_resources", label: "New resources", description: "When new learning resources are added", enabled: false },
  { key: "announcements", label: "Program announcements", description: "Broadcast announcements from the admin team", enabled: true },
];

const privacyDefaults: Toggle[] = [
  { key: "show_email", label: "Show email on roster", description: "Your email address is visible to other fellows", enabled: true },
  { key: "show_discord", label: "Show Discord on roster", description: "Your Discord handle is visible to other fellows", enabled: true },
  { key: "show_university", label: "Show university", description: "Your university appears on your roster card", enabled: true },
  { key: "show_availability", label: "Show availability", description: "Your available days are visible to team members", enabled: false },
];

function ToggleSwitch({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={enabled} aria-label={label} onClick={() => onChange(!enabled)}
      className={cn("relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200", enabled ? "bg-brand-600" : "bg-slate-200")}>
      <span className={cn("pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200", enabled ? "translate-x-4" : "translate-x-0")} />
    </button>
  );
}

function ToggleList({ items, onChange }: { items: Toggle[]; onChange: (key: string, val: boolean) => void }) {
  return (
    <div className="divide-y divide-slate-100">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-4 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">{item.label}</p>
            <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
          </div>
          <ToggleSwitch enabled={item.enabled} onChange={(v) => onChange(item.key, v)} label={item.label} />
        </div>
      ))}
    </div>
  );
}

function AccountSection() {
  const [email, setEmail] = useState("sirada.w@example.com");
  const [saved, setSaved] = useState(false);
  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2500); }
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Account Details" />
        {saved && <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-5 py-2.5 text-xs font-medium text-emerald-700"><Check className="h-4 w-4" />Changes saved</div>}
        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Display Name</label>
            <input type="text" defaultValue={currentFellow.name} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={handleSave} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500">Save changes</button>
          </div>
        </div>
      </Card>
      <Card className="border-red-200">
        <div className="px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">Danger Zone</h3>
          <p className="mt-0.5 text-xs text-slate-500">Irreversible actions — proceed with caution.</p>
        </div>
        <div className="border-t border-red-100 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Sign out</p>
              <p className="text-xs text-slate-500">End your current session</p>
            </div>
            <button type="button" className="flex items-center gap-2 rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50">
              <LogOut className="h-3.5 w-3.5" />Sign out
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function NotificationsSection() {
  const [items, setItems] = useState(notificationDefaults);
  const [channel, setChannel] = useState<"email" | "inapp" | "both">("both");
  function handleChange(key: string, val: boolean) { setItems((prev) => prev.map((i) => (i.key === key ? { ...i, enabled: val } : i))); }
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Notification Channel" subtitle="How you'd like to receive notifications" />
        <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
          {([{ key: "email", label: "Email only", icon: Mail }, { key: "inapp", label: "In-app only", icon: Smartphone }, { key: "both", label: "Email & in-app", icon: Bell }] as { key: typeof channel; label: string; icon: typeof Mail }[]).map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" onClick={() => setChannel(key)}
              className={cn("flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg border px-3 py-3 text-xs font-medium transition",
                channel === key ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              )}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>
      </Card>
      <Card>
        <CardHeader title="Notify Me About" subtitle="Toggle individual notification types" />
        <ToggleList items={items} onChange={handleChange} />
        <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span className="text-xs text-slate-500">{items.filter((i) => i.enabled).length} of {items.length} enabled</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setItems((p) => p.map((i) => ({ ...i, enabled: false })))} className="text-xs font-medium text-slate-500 transition hover:text-slate-700">Disable all</button>
            <span className="text-slate-300">·</span>
            <button type="button" onClick={() => setItems((p) => p.map((i) => ({ ...i, enabled: true })))} className="text-xs font-medium text-brand-600 transition hover:text-brand-700">Enable all</button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function PrivacySection() {
  const [items, setItems] = useState(privacyDefaults);
  function handleChange(key: string, val: boolean) { setItems((prev) => prev.map((i) => (i.key === key ? { ...i, enabled: val } : i))); }
  return (
    <Card>
      <CardHeader title="Roster Visibility" subtitle="Control what other fellows can see on your roster card" />
      <ToggleList items={items} onChange={handleChange} />
      <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3">
        <Eye className="h-3.5 w-3.5 text-slate-400" />
        <p className="text-xs text-slate-500">Admins can always see all your information regardless of these settings.</p>
      </div>
    </Card>
  );
}

function SecuritySection() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saved, setSaved] = useState(false);
  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2500); }
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Change Password" subtitle="Use a strong password of at least 8 characters" />
        {saved && <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-5 py-2.5 text-xs font-medium text-emerald-700"><Check className="h-4 w-4" />Password updated</div>}
        <div className="space-y-4 p-5">
          {[
            { label: "Current password", show: showCurrent, toggle: () => setShowCurrent((s) => !s) },
            { label: "New password", show: showNew, toggle: () => setShowNew((s) => !s) },
            { label: "Confirm new password", show: showNew, toggle: () => setShowNew((s) => !s) },
          ].map(({ label, show, toggle }) => (
            <div key={label}>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</label>
              <div className="relative">
                <input type={show ? "text" : "password"} placeholder="••••••••" className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
                <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <button type="button" onClick={handleSave} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500">Update password</button>
          </div>
        </div>
      </Card>
      <Card>
        <CardHeader title="Login Activity" subtitle="Recent sign-ins to your account" />
        <div className="divide-y divide-slate-100">
          {[
            { device: "Chrome · macOS", location: "Bangkok, TH", time: "Now · current session", current: true },
            { device: "Safari · iPhone", location: "Bangkok, TH", time: "Yesterday at 14:32", current: false },
          ].map(({ device, location, time, current }) => (
            <div key={device} className="flex items-center gap-4 px-5 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100"><Smartphone className="h-4 w-4 text-slate-500" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">{device}</p>
                  {current && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Current</span>}
                </div>
                <p className="text-xs text-slate-500">{location} · {time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function SettingPage() {
  const [active, setActive] = useState<Section>("account");
  const SectionContent = { account: AccountSection, notifications: NotificationsSection, privacy: PrivacySection, security: SecuritySection }[active];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account, notifications, and privacy preferences.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card className="h-fit lg:col-span-1">
          <div className="p-2">
            {sections.map(({ key, label, icon: Icon }) => (
              <button key={key} type="button" onClick={() => setActive(key)}
                className={cn("flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  active === key ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}>
                <Icon className={cn("h-4 w-4 shrink-0", active === key ? "text-brand-600" : "text-slate-400")} />
                {label}
                <ChevronRight className={cn("ml-auto h-3.5 w-3.5 shrink-0", active === key ? "text-brand-400 opacity-100" : "opacity-0")} />
              </button>
            ))}
          </div>
        </Card>
        <div className="lg:col-span-3"><SectionContent /></div>
      </div>
    </div>
  );
}
