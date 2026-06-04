import { Edit3, FileText, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export const caseItems = [
  {
    id: "coral-payments",
    title: "How Team Coral shipped a payments demo in 48h",
    status: "Published",
    author: "Linh Pham",
    summary: "A breakdown of how a cross-country team scoped, split work and demoed a working payments flow over one weekend.",
    meta: "By Linh Pham   May 21, 2026   team-coral-payments-writeup.pdf",
    document: "team-coral-payments-writeup.pdf",
    tags: ["sprint", "fintech", "teamwork"],
  },
  {
    id: "user-calls",
    title: "Validating an idea with 12 user calls",
    status: "Published",
    author: "Wei-Lin Tan",
    summary: "What we learned booking, running and synthesising a dozen customer interviews in five days.",
    meta: "By Wei-Lin Tan   May 18, 2026   user-research-synthesis.docx",
    document: "user-research-synthesis.docx",
    tags: ["research", "validation"],
  },
  {
    id: "scope-demo",
    title: "Saying no: scoping a demo you can actually finish",
    status: "Draft",
    author: "Dewi Putri",
    summary: "A finisher's guide to cutting scope so the team has something to show on demo day.",
    meta: "By Dewi Putri   May 25, 2026   No document",
    document: "",
    tags: ["scope", "demo-day"],
  },
];

export default function CaseManagement() {
  return (
    <div className="page">
      <header className="page-header">
        <div className="page-heading-row">
          <div>
            <h1 className="page-title">Cases</h1>
            <p className="page-subtitle">Write up what teams built and learned so the rest of the cohort can read it.</p>
          </div>
          <Link className="round-button" to="/admin/cases/new">
            <Plus size={15} />
            Add case
          </Link>
        </div>
      </header>

      <div className="content-stack">
        <section className="card list-card">
          <h2 className="list-title">Library</h2>
          <p className="list-subtitle">3 cases</p>
          <div className="library-list">
            {caseItems.map((item, index) => (
              <motion.article
                animate={{ opacity: 1, y: 0 }}
                className="library-item"
                initial={{ opacity: 0, y: 12 }}
                key={item.title}
                transition={{ delay: index * 0.05 }}
              >
                <div className="doc-icon"><FileText size={18} /></div>
                <div>
                  <p className="item-title">
                    {item.title}{" "}
                    <span className={`pill ${item.status === "Published" ? "success" : "draft"}`}>{item.status}</span>
                  </p>
                  <p className="item-summary">{item.summary}</p>
                  <p className="case-meta">{item.meta}</p>
                  <div className="inline-tags">
                    {item.tags.map((tag) => (
                      <span className="pill" key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="item-actions">
                  <Link className="icon-link" to={`/admin/cases/${item.id}/edit`} aria-label={`Edit ${item.title}`}>
                    <Edit3 size={15} />
                  </Link>
                  <button className="icon-link" type="button" aria-label={`Delete ${item.title}`}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
