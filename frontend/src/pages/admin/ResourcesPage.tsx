import { useState } from "react";
import { Edit3, FileText, Plus, Trash2, Video } from "lucide-react";
import { motion } from "framer-motion";
import ResourceFormDialog, { type ResourceFormValues } from "../../components/admin/ResourceFormDialog";
import type { ResourceItem } from "../../components/admin/contentTypes";

const initialResources: ResourceItem[] = [
  {
    id: "pitch-deck",
    title: "Demo Day pitch deck template",
    type: "Template",
    summary: "10-slide structure used by last cohort's top three teams.",
    url: "catalyst.io/r/deck",
  },
  {
    id: "team-agreement",
    title: "Team working agreement (Notion)",
    type: "Guide",
    summary: "Fill-in template for roles, comms cadence and decision rules.",
    url: "catalyst.io/r/agreement",
  },
  {
    id: "scoping-recording",
    title: "Recording: scoping a 1-week build",
    type: "Video",
    summary: "32-min walkthrough from a returning mentor.",
    url: "catalyst.io/r/scoping",
  },
  {
    id: "standup-playbook",
    title: "Cross-timezone standup playbook",
    type: "Guide",
    summary: "How SEA-spanning teams keep async standups tight.",
    url: "catalyst.io/r/standup",
  },
];

export default function ResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>(initialResources);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ResourceItem | null>(null);

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(item: ResourceItem) {
    setEditing(item);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  function handleSave(values: ResourceFormValues) {
    if (editing) {
      setResources((cur) => cur.map((r) => (r.id === editing.id ? { ...r, ...values } : r)));
    } else {
      setResources((cur) => [{ id: `resource-${Date.now()}`, ...values }, ...cur]);
    }
    closeForm();
  }

  function remove(item: ResourceItem) {
    if (window.confirm(`Delete "${item.title}"?`)) {
      setResources((cur) => cur.filter((r) => r.id !== item.id));
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-heading-row">
          <div>
            <h1 className="page-title">Resources</h1>
            <p className="page-subtitle">Templates, guides and recordings the whole cohort can pull from.</p>
          </div>
          <button className="round-button" type="button" onClick={openCreate}>
            <Plus size={15} />
            Add resource
          </button>
        </div>
      </header>

      <div className="content-stack">
        <section className="card list-card">
          <h2 className="list-title">Shared resources</h2>
          <p className="list-subtitle">{resources.length} item{resources.length === 1 ? "" : "s"}</p>
          <div className="resource-list">
            {resources.map((item, index) => {
              const Icon = item.type === "Video" ? Video : FileText;
              return (
                <motion.article
                  animate={{ opacity: 1, y: 0 }}
                  className="resource-item"
                  initial={{ opacity: 0, y: 12 }}
                  key={item.id}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="doc-icon"><Icon size={18} /></div>
                  <div>
                    <p className="item-title">
                      {item.title} <span className={`pill ${item.type === "Video" ? "red" : ""}`}>{item.type}</span>
                    </p>
                    <p className="item-summary">{item.summary}</p>
                    <p className="resource-meta">{item.url}</p>
                  </div>
                  <div className="item-actions">
                    <button className="icon-link" type="button" aria-label={`Edit ${item.title}`} onClick={() => openEdit(item)}>
                      <Edit3 size={15} />
                    </button>
                    <button className="icon-link" type="button" aria-label={`Delete ${item.title}`} onClick={() => remove(item)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>
      </div>

      {showForm && <ResourceFormDialog initial={editing} onClose={closeForm} onSave={handleSave} />}
    </div>
  );
}
