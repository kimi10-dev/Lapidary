import { fail, ok } from "@/lib/api-response";
import { listTree } from "@/lib/vault/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    return ok(await listTree(url.searchParams.get("path") ?? "", url.searchParams.get("vaultId") ?? undefined));
  } catch (error) {
    return fail(error);
  }
}
