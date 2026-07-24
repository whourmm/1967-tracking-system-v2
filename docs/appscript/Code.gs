/**
 * ASEAN 1967 Fellowship — Assignment Submission Sync
 *
 * Exposes a Web App endpoint the admin site calls to check who submitted a
 * Google Form, by matching each response's SBIE ID (format: SBIE-YYYY-ID,
 * e.g. SBIE-2026-024) against the fellow roster.
 *
 * This script is written to be pasted in ONCE and never edited again, even
 * as you add new forms — see "Adding a new form" below.
 *
 * ── One-time setup ──────────────────────────────────────────────────────────
 * 1. Create ONE Google Sheet to be the shared response destination for every
 *    assignment form (e.g. "ASEAN1967 — Form Responses"). Open it.
 * 2. Extensions → Apps Script.
 * 3. Delete the placeholder code and paste this entire file in.
 * 4. Deploy → New deployment → gear icon → Web app.
 *      Execute as:      Me
 *      Who has access:  Anyone
 * 5. Copy the "Web app URL" (ends in /exec) into the site's environment:
 *      VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
 * That's it. Nothing here needs to change again.
 *
 * ── Adding a new form (every time, no code) ─────────────────────────────────
 * 1. Create the new Google Form as usual. Make sure it has a question whose
 *    title contains the words "SBIE ID" (e.g. "What is your SBIE ID?").
 * 2. On the form's Responses tab, click the green Sheets icon → "Select
 *    existing spreadsheet" → choose the ONE shared sheet from setup step 1.
 *    This adds a new tab to that sheet (e.g. "Form Responses 2") instead of
 *    creating a whole new spreadsheet.
 * 3. In the admin site, when creating/editing that assignment, paste the new
 *    tab's exact name into "Response sheet tab". Leave it blank only if this
 *    form's tab happens to be the very first tab in the sheet.
 * Done — this same deployed script already covers it, because it looks up
 * the SBIE ID column by its header text instead of a fixed column number.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ═══════════════════════════════════════════════════════════════════════════════
// WEB APP ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * All requests hit doGet. Query parameters select the action:
 *
 *  ?action=list[&sheet=Tab+Name]
 *      Returns every unique SBIE ID that appears in that tab.
 *      Used by the admin "Refresh" button.
 *
 *  ?action=check&sbieId=SBIE-2026-024[&sheet=Tab+Name]
 *      Returns whether a single SBIE ID has submitted.
 *      Used by the fellow assignments page to show their own status.
 */
function doGet(e) {
  const p        = e.parameter;
  const action   = p.action || 'list';
  const sheetTab = p.sheet  || null; // null → first tab

  try {
    let result;
    switch (action) {
      case 'list':  result = listSubmissions(sheetTab);           break;
      case 'check': result = checkSubmission(p.sbieId, sheetTab); break;
      default:      result = { error: 'Unknown action: list | check' };
    }
    return jsonOutput(result);
  } catch (err) {
    return jsonOutput({ error: err.message });
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Returns all unique SBIE IDs found in the tab plus a full submissions list
 * (with timestamp and email) so the admin can see when each person submitted.
 *
 * Response shape:
 *   { count: 3, sbieIds: ["SBIE-2026-001", "SBIE-2026-004"],
 *     submissions: [{ timestamp, email, sbieId }, …] }
 */
function listSubmissions(sheetTab) {
  const { header, rows } = getSheetData(sheetTab);
  const col = findColumns(header);

  const submissions = rows
    .map(row => ({
      timestamp: col.timestamp >= 0 ? String(row[col.timestamp] || '') : '',
      email    : col.email >= 0 ? String(row[col.email] || '').trim().toLowerCase() : '',
      sbieId   : normaliseSbie(row[col.sbie]),
    }))
    .filter(s => s.sbieId); // drop rows with no SBIE ID

  const sbieIds = [...new Set(submissions.map(s => s.sbieId))];

  return { count: sbieIds.length, sbieIds, submissions };
}

/**
 * Checks whether one specific student already submitted.
 *
 * Response shape:
 *   { sbieId: "SBIE-2026-024", submitted: true, submittedAt: "2026-07-15 14:23:00" }
 */
function checkSubmission(sbieId, sheetTab) {
  if (!sbieId) return { error: 'sbieId parameter is required' };

  const normalised = normaliseSbie(sbieId);
  const { header, rows } = getSheetData(sheetTab);
  const col = findColumns(header);

  const match = rows.find(row => normaliseSbie(row[col.sbie]) === normalised);

  return {
    sbieId,
    submitted  : Boolean(match),
    submittedAt: match && col.timestamp >= 0 ? String(match[col.timestamp]) : null,
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Reads the target tab from the spreadsheet this script is bound to (the one
 * shared sheet every form writes into). Returns the header row separately
 * from the data rows so columns can be found by name, not position.
 */
function getSheetData(sheetTab) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = sheetTab ? ss.getSheetByName(sheetTab) : ss.getSheets()[0];
  if (!sheet) throw new Error(`Sheet tab "${sheetTab}" not found`);

  const data = sheet.getDataRange().getValues();
  return { header: data[0] || [], rows: data.slice(1) };
}

/**
 * Finds the Timestamp / Email / SBIE ID columns by scanning the header row
 * for hint text, so the script works no matter what order a given form's
 * questions land in — no per-form column config needed.
 */
function findColumns(header) {
  const find = (hints) => header.findIndex(h => {
    const text = String(h || '').toLowerCase();
    return hints.some(hint => text.includes(hint));
  });

  const sbie = find(['sbie', 'sea bridge', 'entrepreneurship id', 'fellow id']);
  if (sbie === -1) {
    throw new Error('No SBIE ID column found — make sure the form question title contains "SBIE ID".');
  }

  return {
    timestamp: find(['timestamp']),
    email    : find(['email']),
    sbie,
  };
}

/** Trims and uppercases an SBIE ID so comparisons are case/space-insensitive. */
function normaliseSbie(value) {
  return String(value || '').trim().toUpperCase();
}

/** Wraps any object as a JSON ContentService response. */
function jsonOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
