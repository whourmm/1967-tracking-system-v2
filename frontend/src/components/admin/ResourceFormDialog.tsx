import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import type { ResourceItem, ResourceKind } from "./contentTypes";

export interface ResourceFormValues {
  title: string;
  type: ResourceKind;
  url: string;
  summary: string;
}

// Popup form for adding / editing a resource.
export default function ResourceFormDialog({
  initial,
  onClose,
  onSave,
}: {
  initial: ResourceItem | null;
  onClose: () => void;
  onSave: (values: ResourceFormValues) => void;
}) {
  const isEdit = Boolean(initial);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<ResourceKind>(initial?.type ?? "Guide");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit() {
    if (!title.trim()) return;
    onSave({ title: title.trim(), type, url: url.trim(), summary: summary.trim() });
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <section
        className="dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resource-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <div>
            <h2 id="resource-form-title">{isEdit ? "Edit resource" : "Add a resource"}</h2>
            <p>Appears in the shared resource list.</p>
          </div>
          <button className="icon-link" type="button" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="resource-title">Title</label>
            <input className="input" id="resource-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Pitch deck template" />
          </div>
          <div className="field">
            <label htmlFor="resource-type">Type</label>
            <select className="select" id="resource-type" value={type} onChange={(e) => setType(e.target.value as ResourceKind)}>
              <option>Guide</option>
              <option>Template</option>
              <option>Video</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="resource-link">Link</label>
            <input className="input" id="resource-link" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="catalyst.io/r/..." />
          </div>
          <div className="field full">
            <label htmlFor="resource-description">Description</label>
            <textarea className="textarea" id="resource-description" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="What it is and when to use it." />
          </div>
        </div>

        <div className="form-actions">
          <button className="round-button" type="button" onClick={submit}>
            <Plus size={15} />
            {isEdit ? "Save resource" : "Add resource"}
          </button>
          <button className="button" type="button" onClick={onClose}>Cancel</button>
        </div>
      </section>
    </div>
  );
}
