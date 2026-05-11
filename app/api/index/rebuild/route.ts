import { ok } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST() {
  return ok({
    status: "noop",
    message: "Filesystem search is active. SQLite FTS rebuild is reserved for the next phase.",
  });
}
