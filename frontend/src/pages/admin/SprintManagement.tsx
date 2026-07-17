import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import EmptyState from "../../components/admin/EmptyState";
import SprintCard from "../../components/admin/SprintCard";
import SprintFormDialog from "../../components/admin/SprintFormDialog";
import type { KeyDate, Sprint } from "../../components/admin/sprintTypes";
import { api, type AdminSprint } from "../../lib/api";

const emptySprint: Sprint = {
  id: "",
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  status: "Draft",
  keyDates: [],
};

function mapSprint(item: AdminSprint): Sprint {
  const today = new Date().toISOString().slice(0, 10);
  const startDate = item.starts_on?.slice(0, 10) ?? "";
  const endDate = item.submission_deadline?.slice(0, 10) ?? "";
  return {
    id: String(item.id),
    name: item.name ?? "Untitled sprint",
    description: item.description ?? "",
    startDate,
    endDate,
    status: item.is_current ? "Current" : endDate && endDate < today ? "Complete" : startDate && startDate > today ? "Upcoming" : "Draft",
    keyDates: [],
  };
}

export default function SprintManagement() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editSprint, setEditSprint] = useState<Sprint | null>(null);
  const [draftSprint, setDraftSprint] = useState<Sprint>(emptySprint);

  async function loadSprints() {
    try {
      setSprints((await api.admin.listSprints()).map(mapSprint));
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load sprints");
    }
  }

  useEffect(() => {
    void loadSprints();
  }, []);

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

  async function saveSprint() {
    const payload: Partial<AdminSprint> = {
      name: draftSprint.name,
      description: draftSprint.description,
      starts_on: draftSprint.startDate,
      submission_deadline: draftSprint.endDate,
      is_current: draftSprint.status === "Current",
    };
    try {
      if (editSprint) {
        await api.admin.updateSprint(Number(editSprint.id), payload);
      } else {
        await api.admin.createSprint(payload);
      }
      await loadSprints();
      closeForm();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not save sprint");
    }
  }

  async function removeSprint(id: string) {
    try {
      await api.admin.deleteSprint(Number(id));
      await loadSprints();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not delete sprint");
    }
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
      {loadError && <p className="error-box">{loadError}</p>}

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
                  onDelete={(sprintId) => void removeSprint(sprintId)}
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
          onSave={() => void saveSprint()}
          onUpdateKeyDate={updateKeyDate}
          sprint={draftSprint}
          sprintBeingEdited={editSprint}
        />
      ) : null}
    </div>
  );
}
