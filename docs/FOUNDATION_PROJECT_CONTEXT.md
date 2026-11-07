# Private Project Context Candidate

This implementation reuses the companion's SQLite artifacts, immutable revisions
and receipt rows. The regular hosted Workshop uses its existing private browser
storage, with Web Locks, for direction and retained delivery copies when the
companion is unavailable. It does not add cloud storage or job authority.
It is not installed in the owner's existing Workshop or deployed to Pages.

## Use

With this candidate's local companion, open **My Work -> Project direction**.
Save a goal, a correction to the current goal, a decision or a note. The existing
project selector scopes every entry. Reopening loads the stored project context;
it does not submit a job. A stale saved project selection is reconciled against
the actual project list.

The project checkbox pauses or resumes project-scoped admission at the existing
human-signal, generation and local job routes. It does not cancel work already
admitted, alter Harness policy, or control the separate hosted commissioning
endpoint. The hosted client also stops new submissions from a paused project,
but can retrieve its existing result. This is not global server cancellation.
The UI labels private browser versus SQLite storage. Browser data survives
same-browser reopening but may be cleared/evicted, including on Incognito exit.
No cross-device or cloud-archive guarantee is made.

## Contract

- `GET /api/projects/<project>/foundation/context` reads context plus recorded
  local job states; it never starts work.
- `POST` at the same path appends one event with `eventId`, `kind`, `text`,
  `expectedRevision` and, for corrections, the current `goalId`.
- A SQLite `BEGIN IMMEDIATE` transaction compares the current revision and
  publishes the artifact projection, immutable revision and storage receipt
  together. Storage errors roll all three back.
- A repeated event ID with identical content returns its existing save. Changed
  content using that ID and stale new writes fail closed. The UI retains one
  pending event for checking an uncertain save instead of inventing a new ID.
- Context is limited to 1,000 events, 4,096 characters per entry and 256 KiB total
  UTF-8 document bytes. Reaching a limit rejects the append; it does not truncate.
- Generic artifact overwrite and retirement cannot bypass this writer.
- Context hashes are checked against the immutable revision when read.
- Private context and retained job result payloads are excluded from the Git
  registry projection; original records remain in private storage. SQLite
  capsules retain those artifacts. Browser context remains browser-local and
  is not a new protected server archive.
- Both service workers leave all `/api/` responses to the network. Companion
  JSON responses use `Cache-Control: no-store`.

`OWNER_INTENT` and `executionAuthority: NOT_GRANTED` are deliberate. A context
receipt proves the local storage transaction, not authenticated owner delegation,
independent job execution, a signed portable certificate, or a learned rule.
The local Host/Origin boundary is preserved; this is not new cloud identity proof.

## Validation

`python -X utf8 -B -m unittest discover -s tests -p test_project_context.py -v`
tests actual disposable HTTP/SQLite persistence, concurrent/stale writes,
duplicate semantics, limits, tampering, rollback, interpreter restart, backup
restore and paused admission. No actual worker executes.

`node --test tests/hosted-first-job.test.mjs` retains the existing simulated
hosted-result/replay tests and checks both private API cache exclusions. Its
retained rehearsal directory is external test evidence, not real owner proof.

`node tests/project_context_browser.cjs` uses an installed Playwright module and
Chrome with a fresh temporary browser context. Set `PLAYWRIGHT_MODULE` to an
existing installation if it is not locally resolvable. It starts and stops a
disposable loopback companion, verifies save/correction/decision/pause/reopen,
checks a narrow viewport, records screenshots and rejects JavaScript errors.
It does not use the owner's browser profile or authenticate a hosted job.

## Remaining Integration

The original request remains failed and consumed. A separately bound successor
uses `/api/foundation/hosted-commissioning-successor` and `FRIDAY_SUCCESSOR_*`
flags, leaving original retrieval/control settings independent. The new compiled
contract keeps exactly the same fixed recipe and pinned five source revisions.
Talk and Open Door recognize the known instruction across capitalization,
spacing and terminal punctuation, then send the same canonical fixed request.

The client checks the original first, persists uncertainty before any POST and
never retries execution automatically. Bounded status polling and reopening use
GET only. Original output/receipt copies remain in the originating private
project, available in My Work and the conversation without another worker run.
Saved goal/correction revision hashes are client delivery references, not new
worker parameters or independently certified semantic constraints. Private goal
text is not uploaded to GitHub. Portable copies require original provider
provenance for authenticity; matching fields alone are not a live proof.

Production publication remains a separate protected gate. No hosted successor
or authenticated live delivery is claimed by these local tests. Typed additional
jobs, verified live lesson reuse, reasoning and cloud-private retention remain
tracked work; saving a goal does not execute it.
