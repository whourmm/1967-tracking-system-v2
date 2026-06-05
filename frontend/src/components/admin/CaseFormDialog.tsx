import { useEffect, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import type { CaseItem, CaseStatus } from "./contentTypes";

export interface CaseFormValues {
  title: string;
  author: string;
  status: CaseStatus;
  summary: string;
  document: string;
  tags: string[];
}

// Popup form for adding / editing a case. Manages its own field state and emits
// the final values on save — mirrors SprintFormDialog's modal pattern.
export default function CaseFormDialog({
  initial,
  onClose,
  onSave,
}: {
  initial: CaseItem | null;
  onClose: () => void;
  onSave: (values: CaseFormValues) => void;
}) {
  const isEdit = Boolean(initial);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [status, setStatus] = useState<CaseStatus>(initial?.status ?? "Draft");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const document = initial?.document ?? "";

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit() {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      author: author.trim(),
      status,
      summary: summary.trim(),
      document,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <section
        className="dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <div>
            <h2 id="case-form-title">{isEdit ? "Edit case" : "Add a case"}</h2>
            <p>Shared in the cohort library once published.</p>
          </div>
          <button className="icon-link" type="button" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="form-grid two">
          <div className="field full">
            <label htmlFor="case-title">Title</label>
            <input className="input" id="case-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A short, specific headline" />
          </div>
          <div className="field">
            <label htmlFor="case-author">Author</label>
            <input className="input" id="case-author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Member or team name" />
          </div>
          <div className="field">
            <label htmlFor="case-status">Status</label>
            <select className="select" id="case-status" value={status} onChange={(e) => setStatus(e.target.value as CaseStatus)}>
              <option>Draft</option>
              <option>Published</option>
            </select>
          </div>
          <div className="field full">
            <label htmlFor="case-summary">Summary <small>- shown in the list</small></label>
            <textarea className="textarea" id="case-summary" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="One or two sentences." />
          </div>
          <div className="field full">
            <label>Case document <small>- upload the full write-up instead of typing it</small></label>
            <div className="dropzone">
              <div>
                <span className="dropzone-icon"><UploadCloud size={18} /></span>
                <strong>{document || "Click to upload a document"}</strong>
                <span>PDF, DOC, DOCX, MD or TXT - up to 10MB</span>
              </div>
            </div>
          </div>
          <div className="field full">
            <label htmlFor="case-tags">Tags <small>- comma separated</small></label>
            <input className="input" id="case-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="sprint, research, demo-day" />
          </div>
        </div>

        <div className="form-actions">
          <button className="round-button" type="button" onClick={submit}>
            <FileText size={15} />
            {isEdit ? "Save case" : "Publish case"}
          </button>
          <button className="button" type="button" onClick={onClose}>Cancel</button>
        </div>
      </section>
    </div>
  );
}
