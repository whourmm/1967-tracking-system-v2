import { CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { adminEvents, caseSubmissionStatus, learningReadIds, resourceReadIds } from "../../data/adminMock";
import { allFellows, caseAssignments } from "../../data/mock";
import { formatShortDate } from "../../lib/format";
import { renumberTeamName, sortTeamNames, teamNameMap } from "../../lib/teams";
import { useAdminAssignments } from "../../lib/assignmentStore";

const chartWidth = 630;
const chartHeight = 210;
const teamSize = 4;
const seededTeamNameMap = teamNameMap(allFellows.map((fellow) => fellow.team));

function getNiceAxisMax(value: number) {
  if (value <= 0) return 10;

  const targetStep = value / 4;
  const magnitude = 10 ** Math.floor(Math.log10(targetStep));
  const normalized = targetStep / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 1.5 ? 1.5 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;

  return niceNormalized * magnitude * 4;
}

function getSubmissionChartData(series: { label: string; submissions: number }[]) {
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

function pct(done: number, total: number) {
  return total ? Math.round((done / total) * 100) : 0;
}

function plural(value: number, singular: string, pluralValue = `${singular}s`) {
  return `${value} ${value === 1 ? singular : pluralValue}`;
}

function shortTitle(title: string) {
  return title.length > 24 ? `${title.slice(0, 22)}...` : title;
}

const teams = sortTeamNames([...new Set(allFellows.map((fellow) => renumberTeamName(fellow.team, seededTeamNameMap)))])
  .map((teamName) => {
    const members = allFellows.filter((fellow) => renumberTeamName(fellow.team, seededTeamNameMap) === teamName);
    const hasFinisher = members.some((member) => member.teamflow === "Finisher");
    const complete = members.length >= teamSize && hasFinisher;
    const missingMembers = Math.max(teamSize - members.length, 0);
    const meta = !hasFinisher
      ? "Needs a Finisher"
      : missingMembers > 0
        ? `Needs ${plural(missingMembers, "member")}`
        : `${members.length} members ready`;

    return {
      complete,
      count: `${members.length}/${teamSize}`,
      meta,
      name: teamName,
      progress: pct(Math.min(members.length, teamSize), teamSize),
      urgent: !hasFinisher || missingMembers > 0,
    };
  });

const caseRows = caseAssignments.map((assignment) => ({
  ...assignment,
  assignedTeam: renumberTeamName(assignment.assignedTeam, seededTeamNameMap),
  status: caseSubmissionStatus[assignment.id] ?? assignment.status,
}));

const caseSubmitted = caseRows.filter((assignment) => assignment.status === "submitted" || assignment.status === "reviewed").length;
const completeTeams = teams.filter((team) => team.complete).length;
const trackedReadIds = [...Object.values(resourceReadIds), ...Object.values(learningReadIds)];
const averageReadRate = pct(
  trackedReadIds.reduce((sum, ids) => sum + ids.length, 0),
  trackedReadIds.length * allFellows.length
);
const fellowsNeedingReadFollowup = trackedReadIds.length
  ? allFellows.filter((fellow) => trackedReadIds.some((readIds) => !readIds.includes(fellow.id))).length
  : 0;

const upcomingEvents = [...adminEvents]
  .sort((a, b) => a.date.localeCompare(b.date))
  .slice(0, 3)
  .map((event) => {
    const date = new Date(`${event.date}T00:00:00`);
    return {
      day: date.toLocaleDateString("en-US", { day: "numeric" }),
      meta: event.allDay ? "All day" : `${event.start}-${event.end} - ${event.location || "TBA"}`,
      month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      title: event.title,
    };
  });

export default function AdminDashboard() {
  const adminAssignments = useAdminAssignments();
  const completeAssignments = adminAssignments.filter((assignment) => assignment.submittedIds.length === allFellows.length).length;
  const averageAssignmentPct = pct(
    adminAssignments.reduce((sum, assignment) => sum + assignment.submittedIds.length, 0),
    adminAssignments.length * allFellows.length
  );
  const chartSeries = adminAssignments.map((assignment) => ({
    label: shortTitle(assignment.title),
    submissions: assignment.submittedIds.length,
  }));
  const assignmentRows = [...adminAssignments]
    .sort((a, b) => pct(a.submittedIds.length, allFellows.length) - pct(b.submittedIds.length, allFellows.length))
    .slice(0, 3);
  const submissionChart = getSubmissionChartData(chartSeries);
  const incompleteTeams = teams.filter((team) => !team.complete);
  const overdueAssignments = adminAssignments.filter((assignment) => assignment.submittedIds.length < allFellows.length);

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle">Cohort 2026 - operational health across members, teams, submissions, and learning.</p>
      </header>

      <section className="stats-grid" aria-label="Program metrics">
        <article className="card stat-card">
          <p className="eyebrow">Participants</p>
          <p className="stat-value">{allFellows.length}</p>
          <p className="stat-note">across {new Set(allFellows.map((fellow) => fellow.country)).size} countries</p>
        </article>
        <article className="card stat-card">
          <p className="eyebrow">Assignments</p>
          <p className="stat-value">{averageAssignmentPct}%</p>
          <p className={overdueAssignments.length ? "stat-note warning" : "stat-note positive"}>
            {completeAssignments}/{adminAssignments.length} complete
          </p>
        </article>
        <article className="card stat-card">
          <p className="eyebrow">Case submissions</p>
          <p className="stat-value">{caseSubmitted}<span style={{ color: "#9aa3b5" }}> /{caseRows.length}</span></p>
          <p className={caseSubmitted === caseRows.length ? "stat-note positive" : "stat-note warning"}>
            {caseRows.length - caseSubmitted} pending
          </p>
        </article>
        <article className="card stat-card">
          <p className="eyebrow">Learning read rate</p>
          <p className="stat-value">{averageReadRate}%</p>
          <p className={fellowsNeedingReadFollowup ? "stat-note warning" : "stat-note positive"}>
            {fellowsNeedingReadFollowup} need follow-up
          </p>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="card panel chart-card">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Assignment submission snapshot</h2>
              <p className="panel-subtitle">Bars show submitted fellows per active form</p>
            </div>
            <Link className="button" to="/admin/assignments">View all</Link>
          </div>
          <div className="chart-body">
            <div className="chart-area">
              <div className="chart-y-axis" aria-hidden="true">
                {submissionChart.yTicks.map((tick) => (
                  <span key={tick}>{tick}</span>
                ))}
              </div>
              <div className="chart" aria-label={`Assignment chart, ${submissionChart.axisMax} maximum axis value`}>
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
              {submissionChart.points.map((item) => (
                <span key={item.label}>{item.label}</span>
              ))}
            </div>
            <div className="legend">
              <span><i className="dot-square" /> Mean submitted ({submissionChart.meanDaily.toFixed(1)})</span>
              <span><i className="dot-square soft" /> Form submissions</span>
            </div>
          </div>
        </article>

        <article className="card panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Needs attention</h2>
              <p className="panel-subtitle">Highest-signal admin follow-ups</p>
            </div>
          </div>
          <div className="team-list">
            <div className="team-row">
              <div>
                <div className="team-name">
                  <span className={`status-dot${incompleteTeams.length ? " red" : ""}`} />
                  Teams incomplete
                </div>
                <p className="team-meta">{incompleteTeams.length ? `${incompleteTeams.length} teams need composition review` : "All teams are complete"}</p>
              </div>
              <div className="mini-progress">
                <span className="progress-fill" style={{ width: `${pct(completeTeams, teams.length)}%` }} />
              </div>
              <div className="team-count">{completeTeams}/{teams.length}</div>
            </div>
            <div className="team-row">
              <div>
                <div className="team-name">
                  <span className={`status-dot${caseSubmitted < caseRows.length ? " red" : ""}`} />
                  Case submissions
                </div>
                <p className="team-meta">{caseRows.length - caseSubmitted} case submissions still pending</p>
              </div>
              <div className="mini-progress">
                <span className="progress-fill" style={{ width: `${pct(caseSubmitted, caseRows.length)}%` }} />
              </div>
              <div className="team-count">{caseSubmitted}/{caseRows.length}</div>
            </div>
            <div className="team-row">
              <div>
                <div className="team-name">
                  <span className={`status-dot${fellowsNeedingReadFollowup ? " red" : ""}`} />
                  Learning engagement
                </div>
                <p className="team-meta">{fellowsNeedingReadFollowup} fellows have unread materials</p>
              </div>
              <div className="mini-progress">
                <span className="progress-fill" style={{ width: `${averageReadRate}%` }} />
              </div>
              <div className="team-count">{averageReadRate}%</div>
            </div>
          </div>
        </article>
      </section>

      <section className="bottom-grid">
        <article className="card panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Upcoming events</h2>
              <p className="panel-subtitle">Published schedule for the cohort</p>
            </div>
            <Link className="button" to="/admin/events">View all</Link>
          </div>
          <div className="event-list">
            {upcomingEvents.map((event) => (
              <div className="event-item" key={event.title}>
                <div className="date-badge">
                  <div>{event.day}<span>{event.month}</span></div>
                </div>
                <div>
                  <p className="event-title">{event.title}</p>
                  <p className="event-meta">{event.meta}</p>
                </div>
                <button className="icon-button" type="button" aria-label={`Add ${event.title} to calendar`}>
                  <CalendarDays size={15} />
                </button>
              </div>
            ))}
          </div>
        </article>

        <article className="card panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Active assignment progress</h2>
              <p className="panel-subtitle">Forms with the lowest completion first</p>
            </div>
            <Link className="button" to="/admin/assignments">View all</Link>
          </div>
          <div className="assignment-list">
            {assignmentRows.map((assignment) => {
              const submitted = assignment.submittedIds.length;
              return (
                <div className="assignment-row" key={assignment.id}>
                  <div className="assignment-line">
                    <span>{assignment.title}</span>
                    <span style={{ color: "#8a93a8" }}>{submitted}/{allFellows.length}</span>
                  </div>
                  <p className="resource-meta">Due {assignment.due ? formatShortDate(assignment.due) : "not set"}</p>
                  <div className="progress-track">
                    <span className="progress-fill" style={{ width: `${pct(submitted, allFellows.length)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="bottom-grid">
        <article className="card panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Teams not yet complete</h2>
              <p className="panel-subtitle">Numbered teams match the team builder</p>
            </div>
            <Link className="button" to="/admin/teams">View all</Link>
          </div>
          <div className="team-list">
            {(incompleteTeams.length ? incompleteTeams : teams).slice(0, 5).map((team) => (
              <div className="team-row" key={team.name}>
                <div>
                  <div className="team-name">
                    <span className={`status-dot${team.urgent ? " red" : ""}`} />
                    {team.name}
                  </div>
                  <p className="team-meta">{team.meta}</p>
                </div>
                <div className="mini-progress">
                  <span className="progress-fill" style={{ width: `${team.progress}%` }} />
                </div>
                <div className="team-count">{team.count}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="card panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Case submissions</h2>
              <p className="panel-subtitle">Submitted and reviewed count as done</p>
            </div>
            <Link className="button" to="/admin/assignments">View all</Link>
          </div>
          <div className="assignment-list">
            {caseRows.map((assignment) => {
              const done = assignment.status === "submitted" || assignment.status === "reviewed";
              return (
                <div className="assignment-row" key={assignment.id}>
                  <div className="assignment-line">
                    <span>{assignment.caseTitle}</span>
                    <span style={{ color: done ? "#16a34a" : "#dc2626" }}>{done ? "Done" : "Pending"}</span>
                  </div>
                  <p className="resource-meta">
                    {assignment.assignedTeam} - due {formatShortDate(assignment.deadline)}
                  </p>
                  <div className="progress-track">
                    <span className="progress-fill" style={{ width: done ? "100%" : "10%" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
}
