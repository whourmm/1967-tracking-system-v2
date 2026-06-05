import { useState } from "react";
import { Edit3, FileText, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import CaseFormDialog, { type CaseFormValues } from "../../components/admin/CaseFormDialog";
import type { CaseItem } from "../../components/admin/contentTypes";

const initialCases: CaseItem[] = [
  {
    id: "coral-payments",
    title: "How Team Coral shipped a payments demo in 48h",
    status: "Published",
    author: "Linh Pham",
    summary: "A breakdown of how a cross-country team scoped, split work and demoed a working payments flow over one weekend.",
    document: "team-coral-payments-writeup.pdf",
    tags: ["sprint", "fintech", "teamwork"],
    date: "May 21, 2026",
  },
  {
    id: "user-calls",
    title: "Validating an idea with 12 user calls",
    status: "Published",
    author: "Wei-Lin Tan",
    summary: "What we learned booking, running and synthesising a dozen customer interviews in five days.",
    document: "user-research-synthesis.docx",
    tags: ["research", "validation"],
    date: "May 18, 2026",
  },
  {
    id: "scope-demo",
    title: "Saying no: scoping a demo you can actually finish",
    status: "Draft",
    author: "Dewi Putri",
    summary: "A finisher's guide to cutting scope so the team has something to show on demo day.",
    document: "",
    tags: ["scope", "demo-day"],
    date: "May 25, 2026",
  },
];

const todayLabel = () =>
  new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function CaseManagement() {
  const [cases, setCases] = useState<CaseItem[]>(initialCases);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CaseItem | null>(null);

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(item: CaseItem) {
    setEditing(item);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  function handleSave(values: CaseFormValues) {
    if (editing) {
      setCases((cur) => cur.map((c) => (c.id === editing.id ? { ...c, ...values } : c)));
    } else {
      setCases((cur) => [{ id: `case-${Date.now()}`, date: todayLabel(), ...values }, ...cur]);
    }
    closeForm();
  }

  function remove(item: CaseItem) {
    if (window.confirm(`Delete "${item.title}"?`)) {
      setCases((cur) => cur.filter((c) => c.id !== item.id));
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-heading-row">
          <div>
            <h1 className="page-title">Cases</h1>
            <p className="page-subtitle">Write up what teams built and learned so the rest of the cohort can read it.</p>
          </div>
          <button className="round-button" type="button" onClick={openCreate}>
            <Plus size={15} />
            Add case
          </button>
        </div>
      </header>

      <div className="content-stack">
        <section className="card list-card">
          <h2 className="list-title">Library</h2>
          <p className="list-subtitle">{cases.length} case{cases.length === 1 ? "" : "s"}</p>
          <div className="library-list">
            {cases.map((item, index) => (
              <motion.article
                animate={{ opacity: 1, y: 0 }}
                className="library-item"
                initial={{ opacity: 0, y: 12 }}
                key={item.id}
                transition={{ delay: index * 0.05 }}
              >
                <div className="doc-icon"><FileText size={18} /></div>
                <div>
                  <p className="item-title">
                    {item.title}{" "}
                    <span className={`pill ${item.status === "Published" ? "success" : "draft"}`}>{item.status}</span>
                  </p>
                  <p className="item-summary">{item.summary}</p>
                  <p className="case-meta">By {item.author || "—"} · {item.date} · {item.document || "No document"}</p>
                  <div className="inline-tags">
                    {item.tags.map((tag) => (
                      <span className="pill" key={tag}>{tag}</span>
                    ))}
                  </div>
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
            ))}
          </div>
        </section>
      </div>

      {showForm && <CaseFormDialog initial={editing} onClose={closeForm} onSave={handleSave} />}
    </div>
  );
}
