import { fail, ok } from "@/lib/api-response";
import { searchVault } from "@/lib/vault/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    return ok(await searchVault(url.searchParams.get("q") ?? "", 50, url.searchParams.get("vaultId") ?? undefined));
  } catch (error) {
    return fail(error);
  }
}
