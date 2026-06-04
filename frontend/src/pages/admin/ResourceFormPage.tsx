import { ArrowLeft, Plus } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { resourceItems } from "./ResourcesPage";

export default function ResourceFormPage() {
  const { resourceId } = useParams();
  const existingResource = resourceItems.find((item) => item.id === resourceId);
  const isEdit = Boolean(existingResource);

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-heading-row">
          <div>
            <h1 className="page-title">{isEdit ? "Edit resource" : "Add a resource"}</h1>
            <p className="page-subtitle">Appears in the shared resource list.</p>
          </div>
          <Link className="button" to="/admin/resources">
            <ArrowLeft size={15} />
            Back to resources
          </Link>
        </div>
      </header>

      <div className="content-stack">
        <section className="card form-card form-page-card">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="resource-title">Title</label>
              <input className="input" id="resource-title" defaultValue={existingResource?.title} placeholder="e.g. Pitch deck template" />
            </div>
            <div className="field">
              <label htmlFor="resource-type">Type</label>
              <select className="select" id="resource-type" defaultValue={existingResource?.type ?? "Guide"}>
                <option>Guide</option>
                <option>Template</option>
                <option>Video</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="resource-link">Link</label>
              <input className="input" id="resource-link" defaultValue={existingResource?.url} placeholder="catalyst.io/r/..." />
            </div>
            <div className="field full">
              <label htmlFor="resource-description">Description</label>
              <textarea className="textarea" id="resource-description" defaultValue={existingResource?.summary} placeholder="What it is and when to use it." />
            </div>
          </div>
          <div className="form-actions">
            <button className="round-button" type="button">
              <Plus size={15} />
              {isEdit ? "Save resource" : "Add resource"}
            </button>
            <Link className="button" to="/admin/resources">Cancel</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
