/**
 * ASEAN 1967 Fellowship — Assignment Submission Sync
 *
 * This script runs inside the Google Sheet that collects Google Form responses.
 * It exposes a Web App endpoint the website calls to check who submitted.
 *
 * ── Setup ────────────────────────────────────────────────────────────────────
 * 1. Open the Google Sheet → Extensions → Apps Script
 * 2. Paste this file's contents into Code.gs
 * 3. Fill in the CONFIGURATION section below
 * 4. Deploy → New deployment → Web app
 *      Execute as:      Me
 *      Who has access:  Anyone
 * 5. Copy the Web App URL into your frontend .env:
 *      VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
 * 6. (Optional) Add an on-form-submit trigger for auto-sync:
 *      Triggers (clock icon) → Add trigger → onFormSubmit
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION — update before deploying
// ═══════════════════════════════════════════════════════════════════════════════

/** The ID from your Google Sheet URL (the long string between /d/ and /edit). */
const SHEET_ID = '1K2SVtPA53UtgY8RmbL_-6uJkEfZdPa9fA6kUUV6Soks';

/**
 * Column positions in your sheet (1 = column A, 2 = column B, …).
 *
 * Typical Google Form response sheet layout:
 *   A  → Timestamp  (auto)
 *   B  → Email      (auto, if "Collect email addresses" is on)
 *   C  → SBIE ID    (the question you added: "What is your SBIE ID?")
 *
 * Adjust if your form has a different order.
 */
const COL_TIMESTAMP = 1; // Column A
const COL_EMAIL     = 2; // Column B
const COL_SBIE_ID   = 3; // Column C  ← students type e.g. SBIE26-001

/**
 * Backend API root for DB sync.
 * Leave empty ('') to skip syncing to the backend and only return sheet data.
 * For local dev you cannot use localhost here — the script runs on Google's
 * servers. Use your deployed backend URL or an ngrok tunnel for testing.
 */
const BACKEND_URL = ''; // e.g. 'https://api.your-site.com'


// ═══════════════════════════════════════════════════════════════════════════════
// WEB APP ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * All requests hit doGet.  Query parameters select the action:
 *
 *  ?action=list[&sheet=Tab+Name]
 *      Returns every unique SBIE ID that appears in the sheet.
 *      Used by the admin "Refresh" button to get the full submission list.
 *
 *  ?action=check&sbieId=SBIE26-001[&sheet=Tab+Name]
 *      Returns whether a single SBIE ID has submitted.
 *      Used by the student assignments page to show their own status.
 *
 *  ?action=sync&assignmentId=3[&sheet=Tab+Name]
 *      Reads the sheet, maps SBIE IDs → member IDs via the backend API, then
 *      POSTs to /api/admin/assignments/{id}/sync to update the database.
 *      Requires BACKEND_URL to be set.
 */
function doGet(e) {
  const p          = e.parameter;
  const action     = p.action     || 'list';
  const sheetTab   = p.sheet      || null;   // null → first sheet tab
  const assignId   = p.assignmentId || null;

  try {
    let result;
    switch (action) {
      case 'list':   result = listSubmissions(sheetTab);                     break;
      case 'check':  result = checkSubmission(p.sbieId, sheetTab);           break;
      case 'sync':   result = syncToBackend(sheetTab, assignId);             break;
      default:       result = { error: 'Unknown action: list | check | sync' };
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
 * Returns all unique SBIE IDs found in the sheet plus a full submissions list
 * (with timestamp and email) so the admin can see when each person submitted.
 *
 * Response shape:
 *   { count: 3, sbieIds: ["SBIE26-001", "SBIE26-004", "SBIE26-007"],
 *     submissions: [{ timestamp, email, sbieId }, …] }
 */
function listSubmissions(sheetTab) {
  const rows = getDataRows(sheetTab);

  const submissions = rows
    .map(row => ({
      timestamp : String(row[COL_TIMESTAMP - 1] || ''),
      email     : String(row[COL_EMAIL     - 1] || '').trim().toLowerCase(),
      sbieId    : normaliseSbie(row[COL_SBIE_ID - 1]),
    }))
    .filter(s => s.sbieId); // drop rows with no SBIE ID

  const sbieIds = [...new Set(submissions.map(s => s.sbieId))];

  return { count: sbieIds.length, sbieIds, submissions };
}

/**
 * Checks whether one specific student already submitted.
 *
 * Response shape:
 *   { sbieId: "SBIE26-001", submitted: true, submittedAt: "2026-07-15 14:23:00" }
 */
function checkSubmission(sbieId, sheetTab) {
  if (!sbieId) return { error: 'sbieId parameter is required' };

  const normalised = normaliseSbie(sbieId);
  const rows       = getDataRows(sheetTab);

  const match = rows.find(row => normaliseSbie(row[COL_SBIE_ID - 1]) === normalised);

  return {
    sbieId      : normalised,
    submitted   : Boolean(match),
    submittedAt : match ? String(match[COL_TIMESTAMP - 1]) : null,
  };
}

/**
 * Reads the sheet, maps SBIE IDs to backend member IDs, then POSTs to
 * /api/admin/assignments/{assignmentId}/sync to update the database.
 *
 * Response shape:
 *   { synced: 3, notFound: ["SBIE26-999"], backendResponse: { … } }
 */
function syncToBackend(sheetTab, assignmentId) {
  if (!BACKEND_URL)   return { error: 'BACKEND_URL is not configured in the script' };
  if (!assignmentId)  return { error: 'assignmentId query param is required' };

  // 1. Get submitted SBIE IDs from the sheet
  const { sbieIds } = listSubmissions(sheetTab);
  if (sbieIds.length === 0) return { synced: 0, notFound: [], message: 'No submissions in sheet' };

  // 2. Fetch the fellow list from the backend to map SBIE ID → member ID.
  //    The frontend generates SBIE IDs as: `SBIE26-${id.toString().padStart(3,'0')}`
  const fellowsResp = UrlFetchApp.fetch(`${BACKEND_URL}/api/fellows`, {
    muteHttpExceptions: true,
  });
  const fellows = JSON.parse(fellowsResp.getContentText()); // [{id, name, email, …}]

  const sbieToId = {};
  fellows.forEach(f => {
    const sbie = `SBIE26-${String(f.id).padStart(3, '0')}`;
    sbieToId[sbie] = f.id;
  });

  const submittedMemberIds = [...new Set(
    sbieIds.map(s => sbieToId[s]).filter(id => id !== undefined)
  )];

  const notFound = sbieIds.filter(s => sbieToId[s] === undefined);

  if (submittedMemberIds.length === 0) {
    return { synced: 0, notFound, message: 'No SBIE IDs matched any registered fellow' };
  }

  // 3. POST to the backend sync endpoint
  const syncResp = UrlFetchApp.fetch(
    `${BACKEND_URL}/api/admin/assignments/${assignmentId}/sync`,
    {
      method          : 'post',
      contentType     : 'application/json',
      payload         : JSON.stringify({ submitted_member_ids: submittedMemberIds }),
      muteHttpExceptions: true,
    }
  );

  return {
    synced          : submittedMemberIds.length,
    notFound,
    backendResponse : JSON.parse(syncResp.getContentText()),
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
// TRIGGER — auto-sync when a new form response arrives
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Wire this up as a form-submit trigger:
 *   Apps Script → Triggers → Add trigger
 *   Function: onFormSubmit
 *   Event source: From spreadsheet
 *   Event type: On form submit
 *
 * Set FIXED_ASSIGNMENT_ID below if all responses go to the same assignment.
 * For a per-form setup, update the function body to map the response to the
 * correct assignment ID before calling syncToBackend().
 */
const FIXED_ASSIGNMENT_ID = null; // e.g. 1  ← set to your assignment's backend ID

function onFormSubmit(e) {
  if (!BACKEND_URL || !FIXED_ASSIGNMENT_ID) return;
  syncToBackend(null, String(FIXED_ASSIGNMENT_ID));
}


// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/** Returns all data rows (skipping the header) from the target sheet tab. */
function getDataRows(sheetTab) {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = sheetTab ? ss.getSheetByName(sheetTab) : ss.getSheets()[0];
  if (!sheet) throw new Error(`Sheet tab "${sheetTab}" not found`);
  const data = sheet.getDataRange().getValues();
  return data.slice(1); // row 0 is the header
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
