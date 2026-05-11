import { fail, ok, AppError } from "@/lib/api-response";
import { addVault, setActiveVault } from "@/lib/vault/service";
import { assertValidVaultRoot } from "@/lib/vault/path-safety";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { vaultPath?: unknown; name?: unknown; activeVaultId?: unknown };
    if (typeof body.activeVaultId === "string") {
      return ok(await setActiveVault(body.activeVaultId));
    }

    if (typeof body.vaultPath !== "string") {
      throw new AppError("INVALID_PATH", "Vault path must be a string.", 400);
    }

    const vaultPath = await assertValidVaultRoot(body.vaultPath);
    return ok(await addVault(vaultPath, typeof body.name === "string" ? body.name : undefined));
  } catch (error) {
    return fail(error);
  }
}
