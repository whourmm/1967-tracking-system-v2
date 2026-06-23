import { useState } from "react";
import { Check, Eye, EyeOff, KeyRound, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader } from "../../../components/ui/Card";
import { logout } from "../../../lib/auth";
import ProfilePage from "../profile/ProfilePage";

function AccountSection() {
  return <ProfilePage showHeader={false} />;
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
    </div>
  );
}

export default function SettingPage() {
  const navigate = useNavigate();

  function handleSignOut() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account and security preferences.</p>
      </div>

      <section className="space-y-4">
        <SectionHeading
          icon={User}
          title="Account"
          description="Your profile details, contact visibility, and weekly availability."
        />
        <AccountSection />
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-6">
        <SectionHeading
          icon={KeyRound}
          title="Security"
          description="Update the credentials used to protect your account."
        />
        <SecuritySection />
      </section>

      <Card className="border-red-200">
        <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900">Sign out</h2>
            <p className="mt-0.5 text-xs text-slate-500">End your current session and return to login.</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-100"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </Card>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof User;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <h2 className="text-base font-bold text-slate-900 sm:text-lg">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}
