import { fail, ok } from "@/lib/api-response";
import { getSetupStatus } from "@/lib/vault/service";

export const runtime = "nodejs";

export async function GET() {
  try {
    return ok(await getSetupStatus());
  } catch (error) {
    return fail(error);
  }
}
