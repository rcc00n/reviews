# Feedback flow prototype

Historical Express and static-frontend exercise: select a rating, follow the feedback flow, and persist a bounded feedback message to a local JSON file. It is a small single-process prototype, not a deployed review-management platform.

## Run locally

Use Node 22 or newer. Run `npm ci`, `npm test`, then `npm start`; open http://127.0.0.1:3000. Tests use temporary synthetic records and localhost only. No mail is sent. Do not enter real customer information into the demo.

`FEEDBACK_FILE` optionally selects a private writable JSON file. The default `feedbacks.json` is ignored by Git. Writes are serialized within one process and atomically replaced. Invalid or unavailable storage returns an error; the server does not claim acceptance before persistence. Multi-process deployment requires a database or shared transactional store and abuse controls.

## Scope and limits

The original rating-dependent navigation remains as historical UI work. It is not a recommendation to selectively solicit public reviews; that policy and any external review destinations need owner review before reuse. No current business relationship or live hosting is claimed.

`public/` is the browser UI; `server.js` owns validation and storage. `npm test` covers concurrent writes, corrupt-storage preservation/recovery, bounded fields, and malformed requests. The historical Jekyll Pages workflow is manual-only: Pages cannot run this Express backend. Push/PR CI runs tests without deploying anything.
