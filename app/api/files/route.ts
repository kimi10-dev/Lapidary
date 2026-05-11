import { fail, ok, AppError } from "@/lib/api-response";
import { createFile, readFile, trashPath, writeFile } from "@/lib/vault/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    return ok(await readFile(url.searchParams.get("path") ?? "", url.searchParams.get("vaultId") ?? undefined));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { path?: unknown; content?: unknown; vaultId?: unknown };
    if (typeof body.path !== "string") {
      throw new AppError("INVALID_PATH", "Path must be a string.", 400);
    }
    return ok(await createFile(body.path, typeof body.content === "string" ? body.content : "", getVaultId(body)));
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { path?: unknown; content?: unknown; baseMtimeMs?: unknown; vaultId?: unknown };
    if (typeof body.path !== "string" || typeof body.content !== "string") {
      throw new AppError("INVALID_PATH", "Path and content are required.", 400);
    }

    const baseMtimeMs = typeof body.baseMtimeMs === "number" ? body.baseMtimeMs : undefined;
    return ok(await writeFile(body.path, body.content, baseMtimeMs, getVaultId(body)));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { path?: unknown; vaultId?: unknown };
    if (typeof body.path !== "string") {
      throw new AppError("INVALID_PATH", "Path must be a string.", 400);
    }
    return ok(await trashPath(body.path, getVaultId(body)));
  } catch (error) {
    return fail(error);
  }
}

function getVaultId(body: { vaultId?: unknown }) {
  return typeof body.vaultId === "string" ? body.vaultId : undefined;
}
