/**
 * BullMQ worker entrypoint (Phase 2+). Import job processors here and run with `pnpm worker`.
 * Keeps a separate process from the HTTP server so long-running jobs do not block API latency.
 */
console.log("Worker placeholder — register BullMQ queues in src/jobs/ when async jobs are added.");
