import { ArrowLeft, FileText, UploadCloud } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { caseItems } from "./CaseManagement";

export default function CaseFormPage() {
  const { caseId } = useParams();
  const existingCase = caseItems.find((item) => item.id === caseId);
  const isEdit = Boolean(existingCase);

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-heading-row">
          <div>
            <h1 className="page-title">{isEdit ? "Edit case" : "Add a case"}</h1>
            <p className="page-subtitle">Shared in the cohort library once published.</p>
          </div>
          <Link className="button" to="/admin/cases">
            <ArrowLeft size={15} />
            Back to cases
          </Link>
        </div>
      </header>

      <div className="content-stack">
        <section className="card form-card form-page-card">
          <div className="form-grid two">
            <div className="field full">
              <label htmlFor="case-title">Title</label>
              <input className="input" id="case-title" defaultValue={existingCase?.title} placeholder="A short, specific headline" />
            </div>
            <div className="field">
              <label htmlFor="case-author">Author</label>
              <input className="input" id="case-author" defaultValue={existingCase?.author} placeholder="Member or team name" />
            </div>
            <div className="field">
              <label htmlFor="case-status">Status</label>
              <select className="select" id="case-status" defaultValue={existingCase?.status ?? "Draft"}>
                <option>Draft</option>
                <option>Published</option>
              </select>
            </div>
            <div className="field full">
              <label htmlFor="case-summary">Summary <small>- shown in the list</small></label>
              <textarea className="textarea" id="case-summary" defaultValue={existingCase?.summary} placeholder="One or two sentences." />
            </div>
            <div className="field full">
              <label>Case document <small>- upload the full write-up instead of typing it</small></label>
              <div className="dropzone">
                <div>
                  <span className="dropzone-icon"><UploadCloud size={18} /></span>
                  <strong>{existingCase?.document || "Click to upload a document"}</strong>
                  <span>PDF, DOC, DOCX, MD or TXT - up to 10MB</span>
                </div>
              </div>
            </div>
            <div className="field full">
              <label htmlFor="case-tags">Tags <small>- comma separated</small></label>
              <input className="input" id="case-tags" defaultValue={existingCase?.tags.join(", ")} placeholder="sprint, research, demo-day" />
            </div>
          </div>
          <div className="form-actions">
            <button className="round-button" type="button">
              <FileText size={15} />
              {isEdit ? "Save case" : "Publish case"}
            </button>
            <Link className="button" to="/admin/cases">Cancel</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
