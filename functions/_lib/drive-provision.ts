/**
 * functions/_lib/drive-provision.ts
 * -----------------------------------------------------------------------
 * InsuranceAgentKit — creates the agent's Drive "brain" folder tree and
 * seeds it with real starter content. Plain fetch() against the Drive
 * REST API v3. No SDK, no nodejs_compat.
 *
 * ============================= READ THIS =============================
 * Everything in this file runs on authorization ①: SecureProspective's
 * own server-side OAuth grant, scoped to `drive.file`.
 *
 * `drive.file` is PER-FILE. It grants access ONLY to files this app
 * itself created. That has one consequence that WILL bite you:
 *
 *   >>> We cannot see files that anything else — including Claude —
 *   >>> creates inside our own folder. files.list scoped to the folder
 *   >>> returns only OUR files. This is not a bug and not fixable
 *   >>> without escalating to a RESTRICTED scope, which we will not do.
 *
 * See LEVEL 3 of research/tom-findings-wizard-design.md.
 * =====================================================================
 *
 * STATUS: MOCKUP. Never executed. No Google Cloud project, no OAuth
 * client, no Drive account, and no network access existed in the
 * environment where this was written. Nothing below has been run once.
 *
 * CONFIDENT / STANDARD (taken from Google's published reference):
 *   * POST https://www.googleapis.com/drive/v3/files            (metadata only)
 *   * POST https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart
 *   * Folder mimeType: 'application/vnd.google-apps.folder'
 *   * `parents: [id]`, and `fields=` to select the response shape
 *   https://developers.google.com/workspace/drive/api/reference/rest/v3/files/create
 *
 * NEEDS VERIFICATION AGAINST A REAL TEST CALL:
 *   * The exact multipart/related body framing below. The structure is
 *     straight from Google's docs, but hand-built multipart bodies are
 *     the classic place to be off by one CRLF. VERIFY THIS FIRST — it
 *     is the most likely thing in this file to fail on run #1.
 *   * Whether Drive accepts 'text/markdown' as a media Content-Type. If
 *     it rejects it, 'text/plain' is the fallback and changes nothing
 *     about the design.
 *   * >>> THE LOAD-BEARING UNKNOWN — TEST THIS BEFORE BUILDING <<<
 *     Whether Claude's Google Drive connector can READ a plain
 *     text/markdown file at all. If it cannot, a .md brain is invisible
 *     to Claude and the whole architecture fails.
 *
 *     The evidence leans AGAINST .md, which is not what you would guess:
 *       - Anthropic's connector page describes the surface as "Search
 *         and read your Docs, Sheets, and Slides" and enumerates only
 *         Google-native formats. Plain text and Markdown: not named.
 *         https://claude.com/connectors/google-drive
 *       - Their help article names "Sheets, Slides, PDFs, images, and MS
 *         Office files." Also does not name plain text or Markdown.
 *       - anthropics/claude-code#38467 (Mar 2026) reports the connector
 *         returns ONLY Google-native files from search — XLSX, PPTX,
 *         DOCX, PDF and HTML confirmed present in Drive returned zero
 *         hits, SILENTLY. (Single unverified report, closed as
 *         out-of-scope rather than on the merits, and it did not test
 *         .md. A signal, not a finding.)
 *       - Various blog posts claim any text file works. None cite a
 *         primary source.
 *
 *     RESOLVE IT WITH A 10-MINUTE MANUAL TEST, not by reading more:
 *     put a .md file in a Drive folder, connect the Drive connector on
 *     a test account, ask Claude to find and read it. That one test
 *     decides the file format of the entire product and needs no code.
 *
 *     If .md fails, flip SEED_AS_GOOGLE_DOCS below. Note the costs of
 *     that path: appending to a Google Doc needs the Docs API
 *     batchUpdate rather than a simple write, and a local Drive-for-
 *     Desktop mount sees .gdoc pointer stubs instead of content.
 *
 *     Either way, the wizard's setup-code round trip (screen 8) is the
 *     production backstop — it fails loudly, on the first agent, inside
 *     setup, rather than silently six weeks later.
 *   * Whether files.get on a folder ID returns `trashed` reliably for
 *     the "did he delete it?" branch.
 */

import {
  type AgencyProfile,
  readmeStartHere,
  brainIndex,
  pauseFile,
  whatICanDo,
  agencyProfile,
  voiceAndTone,
  complianceRules,
  setupCheck,
  clientTemplate,
  workflowTemplate,
  journalReadme,
  journalSeed,
  outboxReadme,
  skillCandidatesReadme,
  archiveReadme,
} from './seed-content';

/* ---------------------------------------------------------------- */
/* Configuration                                                     */
/* ---------------------------------------------------------------- */

const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const FOLDER_MIME = 'application/vnd.google-apps.folder';

/**
 * THE ESCAPE HATCH for the load-bearing unknown above.
 *
 * >>> SET THIS DELIBERATELY, AFTER RUNNING THE 10-MINUTE TEST. The
 * >>> value below is a placeholder, not a recommendation.
 *
 * false: seed as real .md files. Better for everything EXCEPT the one
 *   thing that matters most — Claude Code's native file tools, clean
 *   appends to journal/, readable in Drive's preview, matches the
 *   memory pattern from pass 1. Only choose this if the manual test
 *   confirms the connector can actually find and read .md files.
 *
 * true: seed as native Google Docs. Drive auto-converts the uploaded
 *   Markdown on import when the METADATA mimeType is a Google type and
 *   the MEDIA Content-Type is text. Anthropic unambiguously documents
 *   that the connector reads Google Docs, so this is the safe choice —
 *   at the cost of Docs-API-only appends and pointer stubs on a local
 *   Drive mount.
 */
const SEED_AS_GOOGLE_DOCS = false;

const DOC_MIME = 'application/vnd.google-apps.document';
const MD_MIME = 'text/markdown';

/* ---------------------------------------------------------------- */
/* Types                                                             */
/* ---------------------------------------------------------------- */

export interface ProvisionEnv {
  KIT_DB: D1Database;
}

interface DriveFile {
  id: string;
  name?: string;
  webViewLink?: string;
  modifiedTime?: string;
  trashed?: boolean;
}

/** logical_path -> drive_file_id, loaded from kit_install_files. */
type FileIndex = Map<string, string>;

export interface ProvisionResult {
  folderId: string;
  folderUrl: string;
  /** The name the folder actually has in Drive — what screen 3 tells the
   *  agent to expect in Anthropic's folder-confirmation dialog. */
  folderName: string;
  /** In creation order, so the UI can render an honest progress list. */
  created: Array<{ path: string; kind: 'folder' | 'file'; id: string }>;
  /** Already existed from a previous run — reported, not re-created. */
  skipped: string[];
}

/* ---------------------------------------------------------------- */
/* Low-level Drive calls                                             */
/* ---------------------------------------------------------------- */

async function driveFetch(
  accessToken: string,
  url: string,
  init: RequestInit,
): Promise<DriveFile> {
  const res = await fetch(url, {
    ...init,
    headers: { authorization: `Bearer ${accessToken}`, ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    // 401 -> access token expired; caller should mint a fresh one.
    // 403 with 'storageQuotaExceeded' -> the agent's Drive is full. This
    //     is a real, user-fixable state and deserves its own message in
    //     the UI rather than a generic failure.
    // 404 on a known ID -> the agent deleted it in Drive.
    throw new Error(`Drive API ${res.status} on ${url}: ${await res.text()}`);
  }
  return res.json<DriveFile>();
}

/** Create a folder. Metadata only — no media, so the non-upload host. */
async function createFolder(
  accessToken: string,
  name: string,
  parentId?: string,
): Promise<DriveFile> {
  return driveFetch(
    accessToken,
    `${DRIVE_FILES}?fields=id,name,webViewLink`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name,
        mimeType: FOLDER_MIME,
        ...(parentId ? { parents: [parentId] } : {}),
      }),
    },
  );
}

/**
 * Create a text file with content, via a hand-built multipart/related
 * body.
 *
 * The Workers runtime has no multipart builder and FormData produces
 * multipart/form-data, which is NOT what Drive's uploadType=multipart
 * wants. So we assemble the body as a string. It's ~15 lines and
 * dependency-free, and it is also the single most likely thing in this
 * file to be subtly wrong on the first real run — verify it before
 * building anything on top.
 *
 * NOTE: metadata mimeType and media Content-Type are DIFFERENT things.
 *   - metadata mimeType = what the file should BE in Drive
 *   - media Content-Type = what we are sending
 * Setting metadata to a Google type while sending text is exactly what
 * triggers Drive's auto-conversion (the SEED_AS_GOOGLE_DOCS path).
 */
async function createTextFile(
  accessToken: string,
  name: string,
  parentId: string,
  content: string,
): Promise<DriveFile> {
  const boundary = `iak${crypto.randomUUID().replace(/-/g, '')}`;

  const metadata = {
    name,
    parents: [parentId],
    mimeType: SEED_AS_GOOGLE_DOCS ? DOC_MIME : MD_MIME,
  };

  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${MD_MIME}; charset=UTF-8\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--`;

  return driveFetch(
    accessToken,
    `${DRIVE_UPLOAD}?uploadType=multipart&fields=id,name,webViewLink`,
    {
      method: 'POST',
      headers: { 'content-type': `multipart/related; boundary=${boundary}` },
      body,
    },
  );
}

/** Confirm a recorded file still exists and hasn't been trashed. */
export async function fileStillExists(
  accessToken: string,
  fileId: string,
): Promise<DriveFile | null> {
  try {
    return await driveFetch(
      accessToken,
      `${DRIVE_FILES}/${fileId}?fields=id,name,trashed,modifiedTime,webViewLink`,
      { method: 'GET' },
    );
  } catch {
    return null; // 404 = the agent deleted it. A normal state, not an error.
  }
}

/* ---------------------------------------------------------------- */
/* The manifest                                                      */
/* ---------------------------------------------------------------- */

/**
 * The tree, in creation order. Order matters: every child needs its
 * parent's Drive ID, so this is inherently sequential — about 14 round
 * trips at ~200ms each. That's ~3s of I/O wait, comfortably inside
 * Workers' limits (the CPU-time limit does not count time blocked on
 * fetch), and it gives the progress UI something real to name.
 *
 * `path` is the logical key stored in kit_install_files. It is what
 * makes re-runs idempotent, so DO NOT rename these strings casually —
 * a renamed path looks like a missing file and gets re-created,
 * producing a duplicate.
 */
interface ManifestEntry {
  /** The idempotency key stored in kit_install_files. Must be stable. */
  path: string;
  /** Overrides the Drive filename when it must differ from the basename. */
  name?: string;
  kind: 'folder' | 'file';
  /** Logical path of the parent; '' is the brain root. */
  parent: string;
  /** Files only. */
  content?: string;
}

function manifest(p: AgencyProfile, setupCode: string, stamp: string): ManifestEntry[] {
  return [
    { path: 'identity', kind: 'folder', parent: '' },
    { path: 'clients', kind: 'folder', parent: '' },
    { path: 'workflows', kind: 'folder', parent: '' },
    { path: 'journal', kind: 'folder', parent: '' },
    { path: 'outbox', kind: 'folder', parent: '' },
    { path: 'outbox/pending-approval', kind: 'folder', parent: 'outbox' },
    { path: 'outbox/skill-candidates', kind: 'folder', parent: 'outbox' },
    { path: '_archive', kind: 'folder', parent: '' },

    { path: 'README-START-HERE.md', kind: 'file', parent: '', content: readmeStartHere(p) },
    { path: 'BRAIN.md', kind: 'file', parent: '', content: brainIndex(p) },
    // PAUSE.md is read FIRST by the brain-read skill on every single
    // session. Before this entry existed the wizard never created it, so
    // step one of the kit's most-used skill was a lookup that could only
    // ever miss. Seeded in the CLEARED state — see seed-content.ts.
    { path: 'PAUSE.md', kind: 'file', parent: '', content: pauseFile(p) },
    // Read by /kit-whats-in-my-brain, and the agent's own answer to
    // "what did I just install?". Also previously never created.
    { path: 'WHAT-I-CAN-DO.md', kind: 'file', parent: '', content: whatICanDo(p) },

    { path: 'identity/agency-profile.md', kind: 'file', parent: 'identity', content: agencyProfile(p) },
    { path: 'identity/voice-and-tone.md', kind: 'file', parent: 'identity', content: voiceAndTone(p) },
    { path: 'identity/compliance-rules.md', kind: 'file', parent: 'identity', content: complianceRules(p) },
    { path: 'identity/setup-check.md', kind: 'file', parent: 'identity', content: setupCheck(p, setupCode) },

    { path: 'clients/_TEMPLATE.md', kind: 'file', parent: 'clients', content: clientTemplate() },
    { path: 'workflows/_TEMPLATE.md', kind: 'file', parent: 'workflows', content: workflowTemplate() },
    // The convention, stated in the folder Claude will be writing into.
    { path: 'journal/README.md', kind: 'file', parent: 'journal', content: journalReadme() },
    // The first entry, named in Drive to the SAME dated convention
    // brain-write uses. The old seed was `journal/<YYYY-MM>.md` — a
    // monthly file the skills are explicitly forbidden to append to, so
    // it sat there as a permanent counter-example to the rule directly
    // above it.
    //
    // `path` (the idempotency key) is DATELESS on purpose; only `name`
    // carries the timestamp. Putting the stamp in `path` would make the
    // key differ on every run, and a re-provision would quietly add a
    // second setup entry — exactly the duplication this function exists
    // to prevent.
    {
      path: 'journal/_setup-entry',
      name: `${stamp}-setup.md`,
      kind: 'file',
      parent: 'journal',
      content: journalSeed(p, stamp),
    },
    { path: 'outbox/pending-approval/README.md', kind: 'file', parent: 'outbox/pending-approval', content: outboxReadme() },
    { path: 'outbox/skill-candidates/README.md', kind: 'file', parent: 'outbox/skill-candidates', content: skillCandidatesReadme() },
    { path: '_archive/README.md', kind: 'file', parent: '_archive', content: archiveReadme() },
  ];
}

/**
 * The name of the brain folder in Drive.
 *
 * Exported because the wizard UI has to tell the agent which folder name to
 * expect in Anthropic's folder-confirmation dialog, and a name that differs
 * from the one actually created would turn the screen's one real safety
 * instruction ("it should say <this>; if it says anything else, say no")
 * into noise. One definition, used by provisioning and by /api/wizard/status.
 */
export function brainFolderName(agencyName: string): string {
  return `InsuranceAgentKit — ${agencyName}`;
}

/**
 * 'YYYY-MM-DD-HHMM' in UTC — the dated-filename convention shared by the
 * `brain-write` skill, brain-template/journal/README.md, and BRAIN.md's
 * standing instruction 3.
 */
export function fileStamp(d = new Date()): string {
  const iso = d.toISOString();               // 2026-08-09T14:20:31.000Z
  return `${iso.slice(0, 10)}-${iso.slice(11, 13)}${iso.slice(14, 16)}`;
}

/**
 * The name the file gets IN DRIVE.
 *
 * Normally the basename of the logical path. An entry may override it
 * with `name` when the Drive filename has to vary run-to-run (a dated
 * journal entry) while the idempotency key must not.
 */
function driveName(entry: { path: string; name?: string }): string {
  if (entry.name) return entry.name;
  const i = entry.path.lastIndexOf('/');
  return i === -1 ? entry.path : entry.path.slice(i + 1);
}

/* ---------------------------------------------------------------- */
/* The provisioning run                                              */
/* ---------------------------------------------------------------- */

/**
 * Create (or repair) the brain folder. IDEMPOTENT BY DESIGN.
 *
 * Running this five times must produce exactly one folder tree. That
 * property is what makes "continue where you left off" safe and makes
 * support repair a button rather than a conversation.
 *
 * The failure this guards against is the worst one available in this
 * product: TWO brain folders. No error appears, and the agent's client
 * notes quietly split across two places. Never create a second root
 * folder for a user who already has one.
 *
 * Seed content is NEVER rewritten on a re-run. By run two,
 * identity/agency-profile.md may contain the agent's own edits, and
 * clobbering those is precisely the silent data loss this whole
 * architecture is built to avoid.
 */
export async function provisionBrain(
  env: ProvisionEnv,
  accessToken: string,
  userId: string,
  profile: AgencyProfile,
  setupCode: string,
): Promise<ProvisionResult> {
  const now = () => Math.floor(Date.now() / 1000);
  const stamp = fileStamp();

  // --- Load what we already made for this user -----------------------
  const existing: FileIndex = new Map();
  const rows = await env.KIT_DB.prepare(
    `SELECT logical_path, drive_file_id FROM kit_install_files WHERE user_id = ?`,
  )
    .bind(userId)
    .all<{ logical_path: string; drive_file_id: string }>();
  for (const r of rows.results ?? []) existing.set(r.logical_path, r.drive_file_id);

  const created: ProvisionResult['created'] = [];
  const skipped: string[] = [];

  const record = async (path: string, kind: 'folder' | 'file', id: string) => {
    await env.KIT_DB.prepare(
      `INSERT OR REPLACE INTO kit_install_files
         (user_id, logical_path, kind, drive_file_id, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
      .bind(userId, path, kind, id, now())
      .run();
    existing.set(path, id);
    created.push({ path, kind, id });
  };

  // --- The root folder ------------------------------------------------
  // Logical path '' is the root. Checked against Drive, not just against
  // our own table: the agent may have deleted it since.
  let rootId = existing.get('') ?? null;
  let rootUrl = '';
  // The name the folder actually has in Drive — reported back so the
  // caller can store it. On a re-run we take Drive's own answer, which is
  // authoritative even if the agent renamed the folder himself.
  let rootName = brainFolderName(profile.agencyName);

  if (rootId) {
    const live = await fileStillExists(accessToken, rootId);
    if (!live || live.trashed) {
      rootId = null; // gone from Drive — rebuild
      await env.KIT_DB.prepare(`DELETE FROM kit_install_files WHERE user_id = ?`)
        .bind(userId)
        .run();
      existing.clear();
    } else {
      rootUrl = live.webViewLink ?? '';
      if (live.name) rootName = live.name;
      skipped.push('');
    }
  }

  if (!rootId) {
    const root = await createFolder(accessToken, rootName);
    rootId = root.id;
    rootUrl = root.webViewLink ?? '';
    if (root.name) rootName = root.name;
    await record('', 'folder', rootId);
  }

  // --- Everything else ------------------------------------------------
  const parentIdFor = (parent: string) => (parent === '' ? rootId! : existing.get(parent)!);

  for (const entry of manifest(profile, setupCode, stamp)) {
    const recordedId = existing.get(entry.path);

    if (recordedId) {
      // Trust our table for children; verifying every one would double
      // the round trips. If a child was deleted individually, the
      // support-desk repair path re-checks the whole tree.
      skipped.push(entry.path);
      continue;
    }

    const parentId = parentIdFor(entry.parent);
    if (!parentId) {
      throw new Error(
        `provision: parent '${entry.parent}' missing for '${entry.path}' — manifest order is wrong`,
      );
    }

    const file =
      entry.kind === 'folder'
        ? await createFolder(accessToken, driveName(entry), parentId)
        : await createTextFile(accessToken, driveName(entry), parentId, entry.content!);

    await record(entry.path, entry.kind, file.id);
  }

  // --- Persist the result --------------------------------------------
  const folderUrl = rootUrl || `https://drive.google.com/drive/folders/${rootId}`;
  await env.KIT_DB.prepare(
    `UPDATE kit_installs
        SET drive_folder_id = ?, drive_folder_url = ?, drive_folder_name = ?,
            provisioned_at = ?,
            step = CASE WHEN step IN ('registered','profile_saved','google_connected')
                        THEN 'provisioned' ELSE step END,
            updated_at = ?
      WHERE user_id = ?`,
  )
    .bind(rootId, folderUrl, rootName, now(), now(), userId)
    .run();

  await env.KIT_DB.prepare(
    `INSERT INTO kit_audit_log (user_id, at, event, detail_json)
     VALUES (?, ?, 'drive.provisioned', ?)`,
  )
    .bind(
      userId,
      now(),
      JSON.stringify({ folderId: rootId, created: created.length, skipped: skipped.length }),
    )
    .run();

  return { folderId: rootId!, folderUrl, folderName: rootName, created, skipped };
}

/* ---------------------------------------------------------------- */
/* The write-back check (wizard screen 8, Check B)                   */
/* ---------------------------------------------------------------- */

/**
 * The file the write check watches.
 *
 * IT IS NOT A JOURNAL FILE, AND THAT IS THE POINT. This check used to
 * watch `journal/<YYYY-MM>.md` and ask Claude to append to it — which
 * could not work, for two independent reasons that both point the same
 * way:
 *
 *   1. The `brain-write` skill forbids appending to an existing journal
 *      file. Told to "add a line to the journal", a correctly-behaving
 *      assistant creates a NEW dated file — and under `drive.file` we
 *      are structurally blind to files we did not create ourselves. The
 *      check therefore returned a false negative when the system was
 *      working exactly as designed.
 *   2. That seeded monthly file no longer exists; the manifest now seeds
 *      a dated first entry instead.
 *
 * `identity/setup-check.md` is a file WE created (so its modifiedTime is
 * visible to us), it is already the read-proof target, and its seeded
 * content now ends with an explicit "Claude adds a line below this one"
 * marker. Appending to it breaks nothing and contradicts no skill rule.
 */
const WRITE_CHECK_PATH = 'identity/setup-check.md';

/**
 * Did Claude actually write into the brain?
 *
 * ADVISORY ONLY — must NEVER block wizard completion. Whether the
 * claude.ai Drive connector can modify an existing file in place is
 * UNDOCUMENTED. Anthropic documents upload and save-to-Drive; in-place
 * editing of an existing text file is not clearly supported, and at
 * least one secondary source describes the connector as effectively
 * read-only for existing documents.
 *
 * A negative result means "we could not see it", never "it failed". The
 * UI's fallback is to ask the agent to open the file and look.
 *
 * Phase 0 note: this is also the cheapest live probe of that undocumented
 * write capability, so record what it does on the first real account.
 */
export async function brainWriteWasObserved(
  env: ProvisionEnv,
  accessToken: string,
  userId: string,
  sinceEpochSeconds: number,
): Promise<{ modified: boolean; reason: string }> {
  const row = await env.KIT_DB.prepare(
    `SELECT drive_file_id FROM kit_install_files
      WHERE user_id = ? AND logical_path = ?`,
  )
    .bind(userId, WRITE_CHECK_PATH)
    .first<{ drive_file_id: string }>();

  if (!row) return { modified: false, reason: 'no setup-check file on record' };

  const live = await fileStillExists(accessToken, row.drive_file_id);
  if (!live?.modifiedTime) return { modified: false, reason: 'setup-check file not readable' };

  const modifiedAt = Math.floor(Date.parse(live.modifiedTime) / 1000);
  return modifiedAt > sinceEpochSeconds
    ? { modified: true, reason: 'setup-check modifiedTime advanced' }
    : { modified: false, reason: 'setup-check unchanged since provisioning' };
}

/* ---------------------------------------------------------------- */
/* Start-fresh: rename, never delete                                 */
/* ---------------------------------------------------------------- */

/**
 * The "start over with a new folder" branch of the resumability design.
 *
 * RENAMES the old folder out of the way. Does NOT delete it, and must
 * not: the agent may have put real client notes in there, and this
 * product's standing rule is that nothing is ever deleted, only moved.
 * A wizard that can destroy a folder is a wizard that eventually will.
 */
export async function retireExistingFolder(
  env: ProvisionEnv,
  accessToken: string,
  userId: string,
): Promise<boolean> {
  const row = await env.KIT_DB.prepare(
    `SELECT drive_file_id FROM kit_install_files
      WHERE user_id = ? AND logical_path = ''`,
  )
    .bind(userId)
    .first<{ drive_file_id: string }>();
  if (!row) return false;

  const live = await fileStillExists(accessToken, row.drive_file_id);
  if (!live) return false;

  const stamp = new Date().toISOString().slice(0, 10);
  await driveFetch(accessToken, `${DRIVE_FILES}/${row.drive_file_id}?fields=id,name`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: `${live.name} (replaced ${stamp})` }),
  });

  await env.KIT_DB.prepare(`DELETE FROM kit_install_files WHERE user_id = ?`)
    .bind(userId)
    .run();

  return true;
}
