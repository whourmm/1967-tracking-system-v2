// Mock placeholder for the Admin portal pages. These are owned by another
// teammate — this just gives every admin route something to render so the
// navigation and layout can be reviewed. Replace each with the real page.
export default function AdminPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-lg font-semibold text-slate-700">{title}</h1>
      <p className="mt-1 text-sm text-slate-400">Admin page coming soon.</p>
    </div>
  );
}
