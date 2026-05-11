import { promises as fs } from "node:fs";
import path from "node:path";

export type Settings = {
  vaults: VaultSettings[];
  activeVaultId?: string;
  vaultPath?: string;
  trashPath: string;
  showHiddenFiles: boolean;
  showObsidianFolder: boolean;
  autoSaveEnabled: boolean;
  colorTheme: ColorTheme;
  fontFamily: FontFamily;
  fontSize: FontSize;
  lastOpenFileByVault: Record<string, string>;
};

export type VaultSettings = {
  id: string;
  name: string;
  path: string;
};

export type ColorTheme = "paper" | "light" | "dark";
export type FontFamily = "system" | "serif" | "mono";
export type FontSize = "small" | "medium" | "large";

const defaultSettings: Settings = {
  vaults: [],
  trashPath: ".lapidary-trash",
  showHiddenFiles: false,
  showObsidianFolder: false,
  autoSaveEnabled: false,
  colorTheme: "paper",
  fontFamily: "system",
  fontSize: "medium",
  lastOpenFileByVault: {},
};

const settingsFile = path.join(process.cwd(), "data", "settings.json");

export async function getSettings(): Promise<Settings> {
  const envVaultPath = process.env.LAPIDARY_VAULT_PATH?.trim();

  try {
    const raw = await fs.readFile(settingsFile, "utf8");
    const saved = JSON.parse(raw) as Partial<Settings>;
    return normalizeSettings({
      ...defaultSettings,
      ...saved,
      ...(envVaultPath ? { vaultPath: envVaultPath } : {}),
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    return normalizeSettings({
      ...defaultSettings,
      vaultPath: envVaultPath || undefined,
    });
  }
}

export async function saveSettings(settings: Partial<Settings>) {
  const current = await getSettings();
  const next = normalizeSettings({ ...current, ...settings });
  await fs.mkdir(path.dirname(settingsFile), { recursive: true });
  await fs.writeFile(settingsFile, JSON.stringify(next, null, 2), "utf8");
  return next;
}

function normalizeSettings(settings: Partial<Settings>): Settings {
  const legacyVaultPath = normalizeVaultPathForRuntime(settings.vaultPath?.trim());
  const normalizedVaults = (settings.vaults ?? [])
    .filter((vault): vault is VaultSettings => Boolean(vault?.id && vault.name && vault.path))
    .map((vault) => ({
      id: vault.id,
      name: vault.name,
      path: normalizeVaultPathForRuntime(vault.path) ?? vault.path,
    }));

  const vaults =
    legacyVaultPath && !normalizedVaults.some((vault) => vault.path === legacyVaultPath)
      ? [
          {
            id: "default",
            name: basenameForDisplay(legacyVaultPath) || "Vault",
            path: legacyVaultPath,
          },
          ...normalizedVaults,
        ]
      : normalizedVaults;

  const activeVaultId =
    settings.activeVaultId && vaults.some((vault) => vault.id === settings.activeVaultId)
      ? settings.activeVaultId
      : vaults[0]?.id;

  return {
    ...defaultSettings,
    ...settings,
    vaults,
    activeVaultId,
    vaultPath: legacyVaultPath || vaults.find((vault) => vault.id === activeVaultId)?.path,
    colorTheme: parseColorTheme(settings.colorTheme),
    fontFamily: parseFontFamily(settings.fontFamily),
    fontSize: parseFontSize(settings.fontSize),
    lastOpenFileByVault: parseLastOpenFileByVault(settings.lastOpenFileByVault, vaults),
  };
}

function basenameForDisplay(inputPath: string) {
  return inputPath.replace(/[\\/]+$/, "").split(/[\\/]/).pop() ?? "";
}

function normalizeVaultPathForRuntime(inputPath?: string) {
  if (!inputPath) {
    return undefined;
  }

  if (isWslRuntime()) {
    const windowsPath = /^([A-Za-z]):[\\/](.*)$/.exec(inputPath);
    if (windowsPath) {
      return `/mnt/${windowsPath[1].toLowerCase()}/${windowsPath[2].replace(/\\/g, "/")}`;
    }
  }

  if (process.platform === "win32") {
    const wslPath = /^\/mnt\/([A-Za-z])\/(.*)$/.exec(inputPath);
    if (wslPath) {
      return `${wslPath[1].toUpperCase()}:\\${wslPath[2].replace(/\//g, "\\")}`;
    }
  }

  return inputPath;
}

function isWslRuntime() {
  return Boolean(process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP);
}

function parseColorTheme(value: unknown): ColorTheme {
  return value === "light" || value === "dark" || value === "paper" ? value : defaultSettings.colorTheme;
}

function parseFontFamily(value: unknown): FontFamily {
  return value === "serif" || value === "mono" || value === "system" ? value : defaultSettings.fontFamily;
}

function parseFontSize(value: unknown): FontSize {
  return value === "small" || value === "large" || value === "medium" ? value : defaultSettings.fontSize;
}

function parseLastOpenFileByVault(value: unknown, vaults: VaultSettings[]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const vaultIds = new Set(vaults.map((vault) => vault.id));
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => vaultIds.has(entry[0]) && typeof entry[1] === "string" && entry[1].trim().length > 0,
    ),
  );
}
