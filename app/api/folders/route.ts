import { fail, ok, AppError } from "@/lib/api-response";
import { createFolder } from "@/lib/vault/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { path?: unknown; vaultId?: unknown };
    if (typeof body.path !== "string") {
      throw new AppError("INVALID_PATH", "Path must be a string.", 400);
    }
    return ok(await createFolder(body.path, typeof body.vaultId === "string" ? body.vaultId : undefined));
  } catch (error) {
    return fail(error);
  }
}
