import { useState } from "react";
import {
  Bell,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Mail,
  Smartphone,
  User,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader } from "../../../components/ui/Card";
import { changePassword, logout } from "../../../lib/auth";
import { cn } from "../../../lib/cn";
import { ProfileAccountSection } from "../profile/ProfilePage";

type Section = "account" | "notifications" | "security";

const sections: { key: Section; label: string; icon: LucideIcon }[] = [
  { key: "account", label: "Account", icon: User },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Security", icon: KeyRound },
];

interface Toggle {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

const notificationDefaults: Toggle[] = [
  {
    key: "sprint_deadline",
    label: "Sprint deadlines",
    description: "Reminder 3 days before each sprint submission closes",
    enabled: true,
  },
  {
    key: "assignment_due",
    label: "Assignment due dates",
    description: "Daily digest of upcoming assignment deadlines",
    enabled: true,
  },
  {
    key: "mentor_feedback",
    label: "Mentor feedback",
    description: "When a mentor leaves feedback on your work",
    enabled: true,
  },
  {
    key: "team_updates",
    label: "Team updates",
    description: "When members join or leave your team",
    enabled: false,
  },
  {
    key: "new_resources",
    label: "New resources",
    description: "When new learning resources are added",
    enabled: false,
  },
  {
    key: "announcements",
    label: "Program announcements",
    description: "Broadcast announcements from the admin team",
    enabled: true,
  },
];

function ToggleSwitch({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
        enabled ? "bg-brand-600" : "bg-slate-200"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 dark:bg-[#fff]",
          enabled ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}

function ToggleList({
  items,
  onChange,
}: {
  items: Toggle[];
  onChange: (key: string, val: boolean) => void;
}) {
  return (
    <div className="divide-y divide-slate-100">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-4 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">{item.label}</p>
            <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
          </div>
          <ToggleSwitch
            enabled={item.enabled}
            onChange={(v) => onChange(item.key, v)}
            label={item.label}
          />
        </div>
      ))}
    </div>
  );
}

function AccountSection() {
  const navigate = useNavigate();

  async function handleSignOut() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="space-y-4">
      <ProfileAccountSection />
      <Card className="border-red-200">
        <div className="px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">Danger Zone</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Irreversible actions — proceed with caution.
          </p>
        </div>
        <div className="border-t border-red-100 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Sign out</p>
              <p className="text-xs text-slate-500">End your current session</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
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

  function handleChange(key: string, val: boolean) {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, enabled: val } : item))
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Notification Channel"
          subtitle="How you'd like to receive notifications"
        />
        <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
          {(
            [
              { key: "email", label: "Email only", icon: Mail },
              { key: "inapp", label: "In-app only", icon: Smartphone },
              { key: "both", label: "Email & in-app", icon: Bell },
            ] as { key: typeof channel; label: string; icon: LucideIcon }[]
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setChannel(key)}
              className={cn(
                "flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg border px-3 py-3 text-xs font-medium transition",
                channel === key
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Notify Me About"
          subtitle="Toggle individual notification types"
        />
        <ToggleList items={items} onChange={handleChange} />
        <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span className="text-xs text-slate-500">
            {items.filter((item) => item.enabled).length} of {items.length} enabled
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setItems((prev) => prev.map((item) => ({ ...item, enabled: false })))
              }
              className="text-xs font-medium text-slate-500 transition hover:text-slate-700"
            >
              Disable all
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={() =>
                setItems((prev) => prev.map((item) => ({ ...item, enabled: true })))
              }
              className="text-xs font-medium text-brand-600 transition hover:text-brand-700"
            >
              Enable all
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SecuritySection() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setSaving(true);
    const result = await changePassword(currentPassword, newPassword);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Change Password"
          subtitle="Use a strong password of at least 8 characters"
        />
        {saved && (
          <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-5 py-2.5 text-xs font-medium text-emerald-700">
            <Check className="h-4 w-4" />
            Password updated
          </div>
        )}
        {error && (
          <div className="border-b border-red-100 bg-red-50 px-5 py-2.5 text-xs font-medium text-red-700">
            {error}
          </div>
        )}
        <div className="space-y-4 p-5">
          {[
            {
              label: "Current password",
              show: showCurrent,
              toggle: () => setShowCurrent((showing) => !showing),
              value: currentPassword,
              setValue: setCurrentPassword,
            },
            {
              label: "New password",
              show: showNew,
              toggle: () => setShowNew((showing) => !showing),
              value: newPassword,
              setValue: setNewPassword,
            },
            {
              label: "Confirm new password",
              show: showNew,
              toggle: () => setShowNew((showing) => !showing),
              value: confirmPassword,
              setValue: setConfirmPassword,
            },
          ].map(({ label, show, toggle, value, setValue }) => (
            <div key={label}>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                {label}
              </label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
                <button
                  type="button"
                  onClick={toggle}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !currentPassword || !newPassword || !confirmPassword}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update password"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function SettingPage() {
  const [activeSection, setActiveSection] = useState<Section>("account");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your account, notifications, and security preferences.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-2">
        {sections.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveSection(key)}
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold transition",
              activeSection === key
                ? "bg-brand-600 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {activeSection === "account" && <AccountSection />}
      {activeSection === "notifications" && <NotificationsSection />}
      {activeSection === "security" && <SecuritySection />}
    </div>
  );
}
