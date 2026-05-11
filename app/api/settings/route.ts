import { fail, ok } from "@/lib/api-response";
import { getSettings, saveSettings, type Settings } from "@/lib/settings/store";

export const runtime = "nodejs";

export async function GET() {
  try {
    return ok(toClientSettings(await getSettings()));
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      colorTheme?: unknown;
      fontFamily?: unknown;
      fontSize?: unknown;
      activeVaultId?: unknown;
      lastOpenFile?: unknown;
    };
    const patch: Partial<Settings> = {};
    const colorTheme = parseOption(body.colorTheme, ["paper", "light", "dark"]);
    const fontFamily = parseOption(body.fontFamily, ["system", "serif", "mono"]);
    const fontSize = parseOption(body.fontSize, ["small", "medium", "large"]);

    if (colorTheme) patch.colorTheme = colorTheme;
    if (fontFamily) patch.fontFamily = fontFamily;
    if (fontSize) patch.fontSize = fontSize;
    if (typeof body.activeVaultId === "string" && typeof body.lastOpenFile === "string") {
      const current = await getSettings();
      if (current.vaults.some((vault) => vault.id === body.activeVaultId)) {
        patch.lastOpenFileByVault = {
          ...current.lastOpenFileByVault,
          [body.activeVaultId]: body.lastOpenFile,
        };
      }
    }

    const next = await saveSettings(patch);
    return ok(toClientSettings(next));
  } catch (error) {
    return fail(error);
  }
}

function toClientSettings(settings: Awaited<ReturnType<typeof getSettings>>) {
  return {
    colorTheme: settings.colorTheme,
    fontFamily: settings.fontFamily,
    fontSize: settings.fontSize,
    lastOpenFileByVault: settings.lastOpenFileByVault,
  };
}

function parseOption<T extends string>(value: unknown, allowed: readonly T[]) {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : undefined;
}
