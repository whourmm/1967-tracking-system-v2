import { motion } from "framer-motion";
import { CalendarDays, Pencil, Trash2 } from "lucide-react";
import StatusBadge from "./StatusBadge";
import type { Sprint } from "./sprintTypes";

type SprintCardProps = {
  index: number;
  onDelete: (sprintId: string) => void;
  onEdit: (sprint: Sprint) => void;
  sprint: Sprint;
};

function formatDateRange(startDate: string, endDate: string) {
  if (!startDate || !endDate) return "Dates not set";

  const start = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(startDate));
  const end = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(endDate));

  return `${start} - ${end}`;
}

function formatShortDate(date: string) {
  if (!date) return "";

  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(date));
}

export default function SprintCard({ index, onDelete, onEdit, sprint }: SprintCardProps) {
  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className="sprint-card"
      initial={{ opacity: 0, y: 12 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="sprint-card-main">
        <div className="sprint-card-info">
          <span className="sprint-icon" aria-hidden="true">
            <CalendarDays size={20} />
          </span>
          <div>
            <h2>{sprint.name}</h2>
            <p>{formatDateRange(sprint.startDate, sprint.endDate)}</p>
            <span>{sprint.description}</span>
          </div>
        </div>
        <div className="sprint-card-actions">
          <StatusBadge status={sprint.status} />
          <button className="icon-link" type="button" aria-label={`Edit ${sprint.name}`} onClick={() => onEdit(sprint)}>
            <Pencil size={15} />
          </button>
          <button className="icon-link danger" type="button" aria-label={`Delete ${sprint.name}`} onClick={() => onDelete(sprint.id)}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {sprint.keyDates.length > 0 ? (
        <div className="sprint-key-dates">
          <p>Key Dates</p>
          <div>
            {sprint.keyDates.map((keyDate) => (
              <span className="key-date-chip" key={`${sprint.id}-${keyDate.label}`}>
                <i />
                <strong>{keyDate.label}</strong>
                {formatShortDate(keyDate.date)}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </motion.article>
  );
}
