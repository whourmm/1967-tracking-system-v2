import { useMemo, useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import EmptyState from "../../components/admin/EmptyState";
import SprintCard from "../../components/admin/SprintCard";
import SprintFormDialog from "../../components/admin/SprintFormDialog";
import type { KeyDate, Sprint } from "../../components/admin/sprintTypes";

const initialSprints: Sprint[] = [
  {
    id: "sprint-3",
    name: "Sprint 3: Demo Build",
    description: "Teams turn validated ideas into a working demo and final submission package.",
    startDate: "2026-06-01",
    endDate: "2026-06-14",
    status: "Current",
    keyDates: [
      { label: "Mentor office hours", date: "2026-06-02" },
      { label: "Submission deadline", date: "2026-06-05" },
      { label: "Demo Day", date: "2026-06-06" },
    ],
  },
  {
    id: "sprint-4",
    name: "Sprint 4: Investor Narrative",
    description: "Refine the story, metrics and next ask after demo feedback.",
    startDate: "2026-06-15",
    endDate: "2026-06-28",
    status: "Upcoming",
    keyDates: [
      { label: "Deck review", date: "2026-06-18" },
      { label: "Partner panel", date: "2026-06-25" },
    ],
  },
  {
    id: "sprint-2",
    name: "Sprint 2: Customer Discovery",
    description: "Run customer calls, synthesize pain points and validate problem urgency.",
    startDate: "2026-05-18",
    endDate: "2026-05-31",
    status: "Complete",
    keyDates: [
      { label: "Interview synthesis", date: "2026-05-24" },
      { label: "Learning memo", date: "2026-05-30" },
    ],
  },
];

const emptySprint: Sprint = {
  id: "",
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  status: "Draft",
  keyDates: [],
};

export default function SprintManagement() {
  const [sprints, setSprints] = useState<Sprint[]>(initialSprints);
  const [showForm, setShowForm] = useState(false);
  const [editSprint, setEditSprint] = useState<Sprint | null>(null);
  const [draftSprint, setDraftSprint] = useState<Sprint>(emptySprint);

  const sortedSprints = useMemo(
    () => [...sprints].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [sprints],
  );

  function openCreateForm() {
    setEditSprint(null);
    setDraftSprint(emptySprint);
    setShowForm(true);
  }

  function openEditForm(sprint: Sprint) {
    setEditSprint(sprint);
    setDraftSprint(sprint);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditSprint(null);
    setDraftSprint(emptySprint);
  }

  function saveSprint() {
    const sprintToSave = {
      ...draftSprint,
      id: draftSprint.id || `sprint-${Date.now()}`,
      keyDates: draftSprint.keyDates.filter((item) => item.label.trim() || item.date),
    };

    setSprints((current) => {
      if (editSprint) {
        return current.map((sprint) => (sprint.id === editSprint.id ? sprintToSave : sprint));
      }

      return [sprintToSave, ...current];
    });
    closeForm();
  }

  function updateKeyDate(index: number, key: keyof KeyDate, value: string) {
    setDraftSprint((current) => ({
      ...current,
      keyDates: current.keyDates.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [key]: value } : item
      )),
    }));
  }

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-heading-row">
          <div>
            <h1 className="page-title">Sprint & Schedule</h1>
            <p className="page-subtitle">Define sprints, learning weeks, and key dates.</p>
          </div>
          <button className="round-button" type="button" onClick={openCreateForm}>
            <Plus size={15} />
            Add Sprint
          </button>
        </div>
      </header>

      <section className="content-stack">
        {sortedSprints.length === 0 ? (
          <EmptyState
            actionLabel="Add Sprint"
            description="Add your first sprint to build the schedule."
            icon={CalendarDays}
            onAction={openCreateForm}
            title="No sprints defined"
          />
        ) : (
          <section className="card list-card">
            <h2 className="list-title">Sprint timeline</h2>
            <p className="list-subtitle">{sortedSprints.length} sprints</p>
            <div className="sprint-list">
              {sortedSprints.map((sprint, index) => (
                <SprintCard
                  index={index}
                  key={sprint.id}
                  onDelete={(sprintId) => setSprints((current) => current.filter((item) => item.id !== sprintId))}
                  onEdit={openEditForm}
                  sprint={sprint}
                />
              ))}
            </div>
          </section>
        )}
      </section>

      {showForm ? (
        <SprintFormDialog
          onAddKeyDate={() => setDraftSprint((current) => ({ ...current, keyDates: [...current.keyDates, { label: "", date: "" }] }))}
          onChange={setDraftSprint}
          onClose={closeForm}
          onRemoveKeyDate={(index) => setDraftSprint((current) => ({ ...current, keyDates: current.keyDates.filter((_, itemIndex) => itemIndex !== index) }))}
          onSave={saveSprint}
          onUpdateKeyDate={updateKeyDate}
          sprint={draftSprint}
          sprintBeingEdited={editSprint}
        />
      ) : null}
    </div>
  );
}
