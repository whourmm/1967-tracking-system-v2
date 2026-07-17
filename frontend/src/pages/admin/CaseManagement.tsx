import { useEffect, useState } from "react";
import { Edit3, FileText, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import CaseFormDialog, { type CaseFormValues } from "../../components/admin/CaseFormDialog";
import type { CaseItem } from "../../components/admin/contentTypes";
import { api, type AdminCase } from "../../lib/api";

const todayLabel = () =>
  new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function mapCase(item: AdminCase): CaseItem {
  return {
    id: String(item.id),
    title: item.title ?? "Untitled case",
    status: item.status?.toLowerCase() === "published" ? "Published" : "Draft",
    author: item.case_owner ?? "",
    summary: item.summary ?? "",
    document: item.file_name ?? "",
    tags: item.theme?.split(",").map((tag) => tag.trim()).filter(Boolean) ?? [],
    date: item.published_date
      ? new Date(item.published_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : todayLabel(),
  };
}

export default function CaseManagement() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CaseItem | null>(null);

  async function loadCases() {
    try {
      setCases((await api.admin.listCases()).map(mapCase));
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load cases");
    }
  }

  useEffect(() => {
    void loadCases();
  }, []);

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

  async function handleSave(values: CaseFormValues) {
    const payload: Partial<AdminCase> = {
      title: values.title,
      case_owner: values.author,
      status: values.status.toLowerCase(),
      summary: values.summary,
      file_name: values.document,
      theme: values.tags.join(", "),
      published_date: new Date().toISOString().slice(0, 10),
    };
    try {
      if (editing) {
        await api.admin.updateCase(Number(editing.id), payload);
      } else {
        await api.admin.createCase(payload);
      }
      await loadCases();
      closeForm();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not save case");
    }
  }

  async function remove(item: CaseItem) {
    if (window.confirm(`Delete "${item.title}"?`)) {
      try {
        await api.admin.deleteCase(Number(item.id));
        await loadCases();
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Could not delete case");
      }
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
      {loadError && <p className="error-box">{loadError}</p>}

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
                  <button className="icon-link" type="button" aria-label={`Delete ${item.title}`} onClick={() => void remove(item)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      </div>

      {showForm && <CaseFormDialog initial={editing} onClose={closeForm} onSave={(values) => void handleSave(values)} />}
    </div>
  );
}
