import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

const highlights = [
  "Track every sprint, assignment, and learning block in one place.",
  "Stay connected with your team and the wider 1967 cohort.",
  "Submit forms, watch lectures, and follow your progress.",
];

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-700 p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.08) 2px, transparent 2px, transparent 12px)",
          }}
        />
        <div className="relative max-w-md">
          {/* Brand lockup */}
          <div className="mb-10">
            <p className="text-2xl font-extrabold tracking-tight">
              1967 <span className="font-semibold text-brand-100">Fellowship</span>
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-brand-200">
              Fellow Portal
            </p>
          </div>

          <h2 className="text-3xl font-bold leading-tight">
            Build, validate, and ship your venture with the 1967 cohort.
          </h2>
          <ul className="mt-8 space-y-4">
            {highlights.map((line) => (
              <li key={line} className="flex items-start gap-3 text-sm text-brand-50">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-white" />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-brand-100">
          © {new Date().getFullYear()} 1967 Fellowship. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Brand logo */}
          <img
            src="/nextgen_logo.svg"
            alt="SeaBridge NextGen"
            className="mb-10 h-14 w-auto"
          />

          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>
        </div>
      </div>
    </div>
  );
}
