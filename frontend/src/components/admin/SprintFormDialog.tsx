import { Plus, Trash2, X } from "lucide-react";
import type { KeyDate, Sprint, SprintStatus } from "./sprintTypes";

type SprintFormDialogProps = {
  onAddKeyDate: () => void;
  onChange: (sprint: Sprint) => void;
  onClose: () => void;
  onRemoveKeyDate: (index: number) => void;
  onSave: () => void;
  onUpdateKeyDate: (index: number, key: keyof KeyDate, value: string) => void;
  sprint: Sprint;
  sprintBeingEdited: Sprint | null;
};

export default function SprintFormDialog({
  onAddKeyDate,
  onChange,
  onClose,
  onRemoveKeyDate,
  onSave,
  onUpdateKeyDate,
  sprint,
  sprintBeingEdited,
}: SprintFormDialogProps) {
  const isEdit = Boolean(sprintBeingEdited);

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog-card sprint-dialog-card" role="dialog" aria-modal="true" aria-labelledby="sprint-form-title">
        <div className="dialog-header">
          <div>
            <h2 id="sprint-form-title">{isEdit ? "Edit sprint" : "Add sprint"}</h2>
            <p>{isEdit ? "Update dates and milestones." : "Create a learning sprint."}</p>
          </div>
          <button className="icon-link" type="button" aria-label="Close sprint form" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="form-grid sprint-form-grid">
          <div className="field full">
            <label htmlFor="sprint-name">Name</label>
            <input className="input" id="sprint-name" value={sprint.name} onChange={(event) => onChange({ ...sprint, name: event.target.value })} placeholder="Sprint 5: Launch Readiness" />
          </div>
          <div className="field">
            <label htmlFor="sprint-start">Start date</label>
            <input className="input" id="sprint-start" type="date" value={sprint.startDate} onChange={(event) => onChange({ ...sprint, startDate: event.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="sprint-end">End date</label>
            <input className="input" id="sprint-end" type="date" value={sprint.endDate} onChange={(event) => onChange({ ...sprint, endDate: event.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="sprint-status">Status</label>
            <select className="select" id="sprint-status" value={sprint.status} onChange={(event) => onChange({ ...sprint, status: event.target.value as SprintStatus })}>
              <option>Draft</option>
              <option>Upcoming</option>
              <option>Current</option>
              <option>Complete</option>
            </select>
          </div>
          <div className="field full">
            <label htmlFor="sprint-description">Description</label>
            <textarea className="textarea sprint-textarea" id="sprint-description" value={sprint.description} onChange={(event) => onChange({ ...sprint, description: event.target.value })} placeholder="What teams focus on during this sprint." />
          </div>
        </div>

        <div className="key-date-editor compact">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Key dates</h3>
              <p className="panel-subtitle">Important sprint milestones.</p>
            </div>
            <button className="button" type="button" onClick={onAddKeyDate}>
              <Plus size={14} />
              Add date
            </button>
          </div>
          {sprint.keyDates.length > 0 ? (
            <div className="key-date-fields">
              {sprint.keyDates.map((keyDate, index) => (
                <div className="key-date-field-row" key={index}>
                  <input className="input" value={keyDate.label} onChange={(event) => onUpdateKeyDate(index, "label", event.target.value)} placeholder="Demo Day" />
                  <input className="input" type="date" value={keyDate.date} onChange={(event) => onUpdateKeyDate(index, "date", event.target.value)} />
                  <button className="icon-link danger" type="button" aria-label="Remove key date" onClick={() => onRemoveKeyDate(index)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-inline">No key dates yet.</p>
          )}
        </div>

        <div className="form-actions">
          <button className="round-button" type="button" onClick={onSave}>
            {isEdit ? "Save sprint" : "Create sprint"}
          </button>
          <button className="button" type="button" onClick={onClose}>Cancel</button>
        </div>
      </section>
    </div>
  );
}
