import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  actionLabel: string;
  description: string;
  icon: LucideIcon;
  onAction: () => void;
  title: string;
};

export default function EmptyState({ actionLabel, description, icon: Icon, onAction, title }: EmptyStateProps) {
  return (
    <div className="card empty-state">
      <Icon size={34} />
      <h2>{title}</h2>
      <p>{description}</p>
      <button className="round-button" type="button" onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}
