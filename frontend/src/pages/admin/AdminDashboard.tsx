import { CalendarDays } from "lucide-react";

const submissionSeries = [
  { label: "Apr 29", submissions: 4 },
  { label: "Apr 30", submissions: 5 },
  { label: "May 1", submissions: 5 },
  { label: "May 2", submissions: 6 },
  { label: "May 3", submissions: 7 },
  { label: "May 4", submissions: 8 },
  { label: "May 5", submissions: 5 },
  { label: "May 6", submissions: 7 },
  { label: "May 7", submissions: 6 },
  { label: "May 8", submissions: 4 },
  { label: "May 9", submissions: 5 },
  { label: "May 10", submissions: 5 },
  { label: "May 11", submissions: 4 },
  { label: "May 12", submissions: 6 },
  { label: "May 13", submissions: 7 },
  { label: "May 14", submissions: 5 },
  { label: "May 15", submissions: 5 },
  { label: "May 16", submissions: 7 },
  { label: "May 17", submissions: 6 },
  { label: "May 18", submissions: 4 },
  { label: "May 19", submissions: 4 },
  { label: "May 20", submissions: 5 },
  { label: "May 21", submissions: 6 },
  { label: "May 22", submissions: 7 },
  { label: "May 23", submissions: 7 },
  { label: "May 24", submissions: 8 },
  { label: "May 25", submissions: 8 },
  { label: "May 26", submissions: 9 },
  { label: "May 27", submissions: 9 },
  { label: "May 29", submissions: 10 },
];

const chartWidth = 630;
const chartHeight = 210;

function getNiceAxisMax(value: number) {
  if (value <= 0) return 10;

  const targetStep = value / 4;
  const magnitude = 10 ** Math.floor(Math.log10(targetStep));
  const normalized = targetStep / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 1.5 ? 1.5 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;

  return niceNormalized * magnitude * 4;
}

function getSubmissionChartData(series: typeof submissionSeries) {
  const maxDaily = Math.max(...series.map((item) => item.submissions), 1);
  const meanDaily = series.reduce((sum, item) => sum + item.submissions, 0) / Math.max(series.length, 1);
  const axisMax = getNiceAxisMax(Math.max(maxDaily, meanDaily));
  const meanY = chartHeight - (meanDaily / axisMax) * chartHeight;
  const linePoints = series
    .map((_, index) => {
      const x = series.length === 1 ? 0 : (index / (series.length - 1)) * chartWidth;
      return `${x.toFixed(1)},${meanY.toFixed(1)}`;
    })
    .join(" ");
  const yTicks = [axisMax, axisMax * 0.75, axisMax * 0.5, axisMax * 0.25, 0].map(Math.round);

  return { axisMax, linePoints, meanDaily, points: series, yTicks };
}

const teams = [
  ["Team Delta", "Waiting on Maria, Paolo", "2/4", 55, true],
  ["Team Aurora", "Waiting on Ploy", "3/4", 72, false],
  ["Team Banyan", "Waiting on Minh", "3/4", 74, false],
  ["Team Coral", "Waiting on Budi", "3/4", 75, false],
  ["Team Ember", "Waiting on Mei", "3/4", 74, false],
  ["Team Frangipani", "Waiting on Hafiz", "3/4", 76, false],
];

const events = [
  ["2", "JUN", "Mentor office hours", "10:00-12:00 - Online - Meet"],
  ["5", "JUN", "Sprint 3 submission deadline", "All day"],
  ["6", "JUN", "Sprint 3 Demo Day", "14:00-16:00 - Online - Zoom"],
];

export default function AdminDashboard() {
  const submissionChart = getSubmissionChartData(submissionSeries);

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle">Spring 2026 - submissions, teams, events and assignments at a glance.</p>
      </header>

      <section className="stats-grid" aria-label="Program metrics">
        <article className="card stat-card">
          <p className="eyebrow">Participants</p>
          <p className="stat-value">24</p>
          <p className="stat-note">across 6 countries</p>
        </article>
        <article className="card stat-card">
          <p className="eyebrow">Submissions all-time</p>
          <p className="stat-value">543</p>
          <p className="stat-note positive">+66 this week</p>
        </article>
        <article className="card stat-card">
          <p className="eyebrow">Teams complete</p>
          <p className="stat-value">0<span style={{ color: "#9aa3b5" }}> /6</span></p>
          <p className="stat-note warning">6 need follow-up</p>
        </article>
        <article className="card stat-card">
          <p className="eyebrow">Assignments done</p>
          <p className="stat-value">0<span style={{ color: "#9aa3b5" }}> /2</span></p>
          <p className="stat-note warning">2 in progress</p>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="card panel chart-card">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Submissions over time</h2>
              <p className="panel-subtitle">Mean line - bars show daily intake</p>
            </div>
            <div className="segmented" aria-label="Chart range">
              <button type="button">7d</button>
              <button className="selected" type="button">30d</button>
              <button type="button">90d</button>
              <button type="button">All</button>
            </div>
          </div>
          <div className="chart-body">
            <div className="chart-area">
              <div className="chart-y-axis" aria-hidden="true">
                {submissionChart.yTicks.map((tick) => (
                  <span key={tick}>{tick}</span>
                ))}
              </div>
              <div className="chart" aria-label={`Submission chart, ${submissionChart.axisMax} maximum axis value`}>
                <div className="bar-row">
                  {submissionChart.points.map((item) => (
                    <span
                      className="bar"
                      key={item.label}
                      style={{ height: `${(item.submissions / submissionChart.axisMax) * 100}%` }}
                      title={`${item.label}: ${item.submissions} submissions`}
                    />
                  ))}
                </div>
                <svg className="line-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" aria-hidden="true">
                  <polyline
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="4"
                    points={submissionChart.linePoints}
                  />
                </svg>
              </div>
            </div>
            <div className="chart-labels">
              <span>Apr 29</span>
              <span>May 5</span>
              <span>May 12</span>
              <span>May 19</span>
              <span>May 26</span>
              <span>May 29</span>
            </div>
            <div className="legend">
              <span><i className="dot-square" /> Mean per day ({submissionChart.meanDaily.toFixed(1)})</span>
              <span><i className="dot-square soft" /> New per day</span>
            </div>
          </div>
        </article>

        <article className="card panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Teams not yet complete</h2>
              <p className="panel-subtitle">Sorted by who is furthest behind</p>
            </div>
          </div>
          <div className="team-list">
            {teams.map(([name, meta, count, progress, urgent]) => (
              <div className="team-row" key={name as string}>
                <div>
                  <div className="team-name">
                    <span className={`status-dot${urgent ? " red" : ""}`} />
                    {name}
                  </div>
                  <p className="team-meta">{meta}</p>
                </div>
                <div className="mini-progress">
                  <span className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="team-count">{count}</div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="bottom-grid">
        <article className="card panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Upcoming events</h2>
              <p className="panel-subtitle">Add any to Google Calendar in one click</p>
            </div>
            <button className="button" type="button">View all</button>
          </div>
          <div className="event-list">
            {events.map(([day, month, title, meta]) => (
              <div className="event-item" key={title}>
                <div className="date-badge">
                  <div>{day}<span>{month}</span></div>
                </div>
                <div>
                  <p className="event-title">{title}</p>
                  <p className="event-meta">{meta}</p>
                </div>
                <button className="icon-button" type="button" aria-label={`Add ${title} to calendar`}>
                  <CalendarDays size={15} />
                </button>
              </div>
            ))}
          </div>
        </article>

        <article className="card panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Assignment progress</h2>
              <p className="panel-subtitle">Auto-updated as attendees submit the form</p>
            </div>
            <button className="button" type="button">View all</button>
          </div>
          <div className="assignment-list">
            <div className="assignment-row">
              <div className="assignment-line">
                <span>Sprint 3 retrospective form</span>
                <span style={{ color: "#8a93a8" }}>16/24</span>
              </div>
              <div className="progress-track">
                <span className="progress-fill" style={{ width: "67%" }} />
              </div>
            </div>
            <div className="assignment-row">
              <div className="assignment-line">
                <span>Weekly check-in</span>
                <span style={{ color: "#8a93a8" }}>12/24</span>
              </div>
              <div className="progress-track">
                <span className="progress-fill" style={{ width: "50%" }} />
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
