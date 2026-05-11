import { fail, ok, AppError } from "@/lib/api-response";
import { movePath } from "@/lib/vault/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { from?: unknown; to?: unknown; vaultId?: unknown };
    if (typeof body.from !== "string" || typeof body.to !== "string") {
      throw new AppError("INVALID_PATH", "Source and target paths are required.", 400);
    }
    return ok(await movePath(body.from, body.to, typeof body.vaultId === "string" ? body.vaultId : undefined));
  } catch (error) {
    return fail(error);
  }
}
