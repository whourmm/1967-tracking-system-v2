import { Edit3, FileText, Plus, Trash2, Video } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export const resourceItems = [
  {
    id: "pitch-deck",
    title: "Demo Day pitch deck template",
    type: "Template",
    icon: FileText,
    summary: "10-slide structure used by last cohort's top three teams.",
    url: "catalyst.io/r/deck",
  },
  {
    id: "team-agreement",
    title: "Team working agreement (Notion)",
    type: "Guide",
    icon: FileText,
    summary: "Fill-in template for roles, comms cadence and decision rules.",
    url: "catalyst.io/r/agreement",
  },
  {
    id: "scoping-recording",
    title: "Recording: scoping a 1-week build",
    type: "Video",
    icon: Video,
    summary: "32-min walkthrough from a returning mentor.",
    url: "catalyst.io/r/scoping",
  },
  {
    id: "standup-playbook",
    title: "Cross-timezone standup playbook",
    type: "Guide",
    icon: FileText,
    summary: "How SEA-spanning teams keep async standups tight.",
    url: "catalyst.io/r/standup",
  },
];

export default function ResourcesPage() {
  return (
    <div className="page">
      <header className="page-header">
        <div className="page-heading-row">
          <div>
            <h1 className="page-title">Resources</h1>
            <p className="page-subtitle">Templates, guides and recordings the whole cohort can pull from.</p>
          </div>
          <Link className="round-button" to="/admin/resources/new">
            <Plus size={15} />
            Add resource
          </Link>
        </div>
      </header>

      <div className="content-stack">
        <section className="card list-card">
          <h2 className="list-title">Shared resources</h2>
          <p className="list-subtitle">4 items</p>
          <div className="resource-list">
            {resourceItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.article
                  animate={{ opacity: 1, y: 0 }}
                  className="resource-item"
                  initial={{ opacity: 0, y: 12 }}
                  key={item.title}
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
                    <Link className="icon-link" to={`/admin/resources/${item.id}/edit`} aria-label={`Edit ${item.title}`}>
                      <Edit3 size={15} />
                    </Link>
                    <button className="icon-link" type="button" aria-label={`Delete ${item.title}`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
