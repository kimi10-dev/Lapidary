import { promises as fs } from "node:fs";
import { constants as fsConstants } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { AppError } from "@/lib/api-response";
import { getSettings, saveSettings, type VaultSettings } from "@/lib/settings/store";
import {
  editableExtensions,
  resolveVaultPath,
  previewableExtensions,
  withMarkdownExtension,
} from "@/lib/vault/path-safety";

export type TreeItem = {
  name: string;
  path: string;
  type: "file" | "directory";
  extension: string;
  size: number;
  mtime: string;
};

export type FileData = {
  path: string;
  content: string;
  mtimeMs: number;
  hash: string;
  size: number;
};

export type SearchResult = {
  path: string;
  title: string;
  snippet: string;
  score: number;
};

export type VaultSummary = {
  id: string;
  name: string;
  path: string;
  isConfigured: boolean;
};

const hiddenNames = new Set([".git", ".lapidary", ".lapidary-trash", ".DS_Store"]);
const maxEditableFileBytes = 2 * 1024 * 1024;
const maxSearchFileBytes = 512 * 1024;

export async function getVaultRoot(vaultId?: string) {
  const settings = await getSettings();
  const vault = selectVault(settings.vaults, settings.activeVaultId, vaultId);
  if (!vault) {
    throw new AppError("VAULT_NOT_CONFIGURED", "Vault path is not configured.", 409);
  }
  return vault.path;
}

export async function getSetupStatus() {
  const settings = await getSettings();
  const vaults = await Promise.all(
    settings.vaults.map(async (vault) => {
      const stat = await fs.stat(vault.path).catch(() => null);
      return {
        id: vault.id,
        name: vault.name,
        path: vault.path,
        isConfigured: Boolean(stat?.isDirectory()),
      } satisfies VaultSummary;
    }),
  );
  const activeVaultId = selectVault(settings.vaults, settings.activeVaultId)?.id;
  const activeVault = vaults.find((vault) => vault.id === activeVaultId);

  return {
    isConfigured: Boolean(activeVault?.isConfigured),
    vaultPathSet: vaults.length > 0,
    activeVaultId,
    vaults,
  };
}

export async function addVault(vaultPath: string, name?: string) {
  const settings = await getSettings();
  const existing = settings.vaults.find((vault) => vault.path === vaultPath);
  if (existing) {
    const next = await saveSettings({ activeVaultId: existing.id });
    return { isConfigured: true, activeVaultId: existing.id, vaults: next.vaults };
  }

  const vault: VaultSettings = {
    id: makeVaultId(vaultPath, settings.vaults),
    name: name?.trim() || basenameForDisplay(vaultPath) || "Vault",
    path: vaultPath,
  };
  const next = await saveSettings({
    vaults: [...settings.vaults, vault],
    activeVaultId: vault.id,
  });
  return { isConfigured: true, activeVaultId: vault.id, vaults: next.vaults };
}

export async function setActiveVault(vaultId: string) {
  const settings = await getSettings();
  const vault = settings.vaults.find((item) => item.id === vaultId);
  if (!vault) {
    throw new AppError("VAULT_NOT_CONFIGURED", "Vault was not found.", 404);
  }
  const next = await saveSettings({ activeVaultId: vault.id });
  return { activeVaultId: next.activeVaultId, vaults: next.vaults };
}

export async function listTree(inputPath = "", vaultId?: string) {
  const vaultRoot = await getVaultRoot(vaultId);
  const settings = await getSettings();
  const safe = await resolveVaultPath(vaultRoot, inputPath, { allowRoot: true });
  const stat = await fs.stat(safe.absolutePath).catch(() => null);
  if (!stat?.isDirectory()) {
    throw new AppError("FILE_NOT_FOUND", "Folder was not found.", 404);
  }

  const entries = await fs.readdir(safe.absolutePath, { withFileTypes: true });
  const items: TreeItem[] = [];

  for (const entry of entries) {
    if (shouldHide(entry.name, settings.showHiddenFiles, settings.showObsidianFolder)) {
      continue;
    }

    const absolute = path.join(safe.absolutePath, entry.name);
    const entryStat = await fs.lstat(absolute);
    if (entryStat.isSymbolicLink()) {
      continue;
    }

    if (!entry.isDirectory() && !previewableExtensions.has(path.extname(entry.name).toLowerCase())) {
      continue;
    }

    const itemPath = [safe.relativePath, entry.name].filter(Boolean).join("/");
    items.push({
      name: entry.name,
      path: itemPath,
      type: entry.isDirectory() ? "directory" : "file",
      extension: entry.isDirectory() ? "" : path.extname(entry.name),
      size: entryStat.size,
      mtime: new Date(entryStat.mtimeMs).toISOString(),
    });
  }

  items.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return { path: safe.relativePath, items };
}

export async function readFile(inputPath: string, vaultId?: string): Promise<FileData> {
  const vaultRoot = await getVaultRoot(vaultId);
  const safe = await resolveVaultPath(vaultRoot, inputPath, { mustBeEditableFile: true });
  const stat = await fs.stat(safe.absolutePath).catch(() => null);

  if (!stat?.isFile()) {
    throw new AppError("FILE_NOT_FOUND", "File was not found.", 404);
  }

  if (stat.size > maxEditableFileBytes) {
    throw new AppError("FILE_TOO_LARGE", "This file is too large to edit in the browser.", 413);
  }

  const content = await fs.readFile(safe.absolutePath, "utf8");
  return {
    path: safe.relativePath,
    content,
    mtimeMs: stat.mtimeMs,
    hash: hashContent(content),
    size: stat.size,
  };
}

export async function writeFile(inputPath: string, content: string, baseMtimeMs?: number, vaultId?: string) {
  const vaultRoot = await getVaultRoot(vaultId);
  const safe = await resolveVaultPath(vaultRoot, inputPath, { mustBeEditableFile: true, forWrite: true });
  const stat = await fs.stat(safe.absolutePath).catch(() => null);

  if (!stat?.isFile()) {
    throw new AppError("FILE_NOT_FOUND", "File was not found.", 404);
  }

  if (typeof baseMtimeMs === "number" && Math.abs(stat.mtimeMs - baseMtimeMs) > 1) {
    throw new AppError("FILE_CONFLICT", "The file has changed since it was opened.", 409);
  }

  await atomicWrite(safe.absolutePath, content);
  const nextStat = await fs.stat(safe.absolutePath);
  return { path: safe.relativePath, mtimeMs: nextStat.mtimeMs };
}

export async function createFile(inputPath: string, content = "", vaultId?: string) {
  const vaultRoot = await getVaultRoot(vaultId);
  const safe = await resolveVaultPath(vaultRoot, withMarkdownExtension(inputPath), {
    mustBeEditableFile: true,
    forWrite: true,
  });

  await assertParentDirectory(safe.absolutePath);
  await assertDoesNotExist(safe.absolutePath);
  await atomicWrite(safe.absolutePath, content);
  const stat = await fs.stat(safe.absolutePath);
  return { path: safe.relativePath, mtimeMs: stat.mtimeMs };
}

export async function createFolder(inputPath: string, vaultId?: string) {
  const vaultRoot = await getVaultRoot(vaultId);
  const safe = await resolveVaultPath(vaultRoot, inputPath, { forWrite: true });
  await assertDoesNotExist(safe.absolutePath);
  await fs.mkdir(safe.absolutePath, { recursive: false });
  return { path: safe.relativePath };
}

export async function movePath(from: string, to: string, vaultId?: string) {
  const vaultRoot = await getVaultRoot(vaultId);
  const source = await resolveVaultPath(vaultRoot, from);
  const target = await resolveVaultPath(vaultRoot, to, { forWrite: true });

  await fs.access(source.absolutePath, fsConstants.F_OK).catch(() => {
    throw new AppError("FILE_NOT_FOUND", "Source path was not found.", 404);
  });
  await assertParentDirectory(target.absolutePath);
  await assertDoesNotExist(target.absolutePath);
  await fs.rename(source.absolutePath, target.absolutePath);
  return { from: source.relativePath, to: target.relativePath };
}

export async function trashPath(inputPath: string, vaultId?: string) {
  const vaultRoot = await getVaultRoot(vaultId);
  const settings = await getSettings();
  const source = await resolveVaultPath(vaultRoot, inputPath);
  const stat = await fs.stat(source.absolutePath).catch(() => null);

  if (!stat) {
    throw new AppError("FILE_NOT_FOUND", "Path was not found.", 404);
  }

  const today = new Date().toISOString().slice(0, 10);
  const trashRelativeFolder = path.posix.join(settings.trashPath, today);
  const trashFolder = await resolveVaultPath(vaultRoot, trashRelativeFolder, { forWrite: true });
  await fs.mkdir(trashFolder.absolutePath, { recursive: true });

  const parsed = path.parse(source.relativePath);
  const targetName = `${parsed.name}-${Date.now()}${parsed.ext}`;
  const target = path.join(trashFolder.absolutePath, targetName);
  await fs.rename(source.absolutePath, target);

  return {
    path: source.relativePath,
    trashedTo: path.posix.join(trashRelativeFolder, targetName),
  };
}

export async function searchVault(query: string, limit = 50, vaultId?: string) {
  const trimmed = query.trim();
  if (!trimmed) {
    return { query: trimmed, results: [] as SearchResult[] };
  }

  const vaultRoot = await getVaultRoot(vaultId);
  const root = await resolveVaultPath(vaultRoot, "", { allowRoot: true });
  const lowerQuery = trimmed.toLowerCase();
  const results: SearchResult[] = [];

  await walkMarkdownFiles(root.absolutePath, "", async (absolute, relative) => {
    if (results.length >= limit) {
      return;
    }

    const stat = await fs.stat(absolute);
    if (stat.size > maxSearchFileBytes) {
      return;
    }

    const title = path.basename(relative);
    const pathMatch = relative.toLowerCase().includes(lowerQuery);
    const content = await fs.readFile(absolute, "utf8");
    const contentIndex = content.toLowerCase().indexOf(lowerQuery);
    if (!pathMatch && contentIndex === -1) {
      return;
    }

    results.push({
      path: relative,
      title,
      snippet: makeSnippet(content, contentIndex, trimmed),
      score: (pathMatch ? 20 : 0) + (contentIndex === -1 ? 0 : 10),
    });
  });

  results.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
  return { query: trimmed, results };
}

async function atomicWrite(filePath: string, content: string) {
  const tempPath = `${filePath}.tmp-lapidary-${randomUUID()}`;
  const handle = await fs.open(tempPath, "w", 0o600);
  try {
    await handle.writeFile(content, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fs.rename(tempPath, filePath);
}

async function assertParentDirectory(filePath: string) {
  const parent = path.dirname(filePath);
  const stat = await fs.stat(parent).catch(() => null);
  if (!stat?.isDirectory()) {
    throw new AppError("FILE_NOT_FOUND", "Parent folder was not found.", 404);
  }
}

async function assertDoesNotExist(filePath: string) {
  const exists = await fs
    .access(filePath, fsConstants.F_OK)
    .then(() => true)
    .catch(() => false);
  if (exists) {
    throw new AppError("FILE_ALREADY_EXISTS", "A file or folder already exists at that path.", 409);
  }
}

function hashContent(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

function shouldHide(name: string, showHiddenFiles: boolean, showObsidianFolder: boolean) {
  if (name === ".obsidian") {
    return !showObsidianFolder;
  }
  if (hiddenNames.has(name)) {
    return !showHiddenFiles;
  }
  if (name.startsWith(".")) {
    return !showHiddenFiles;
  }
  return false;
}

function selectVault(vaults: VaultSettings[], activeVaultId?: string, requestedVaultId?: string) {
  if (requestedVaultId) {
    return vaults.find((vault) => vault.id === requestedVaultId);
  }
  return vaults.find((vault) => vault.id === activeVaultId) ?? vaults[0];
}

function makeVaultId(vaultPath: string, vaults: VaultSettings[]) {
  const base = (basenameForDisplay(vaultPath) || "vault")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  let id = base || "vault";
  let suffix = 2;
  while (vaults.some((vault) => vault.id === id)) {
    id = `${base || "vault"}-${suffix}`;
    suffix += 1;
  }
  return id;
}

function basenameForDisplay(inputPath: string) {
  return inputPath.replace(/[\\/]+$/, "").split(/[\\/]/).pop() ?? "";
}

async function walkMarkdownFiles(
  absoluteDir: string,
  relativeDir: string,
  visitor: (absolute: string, relative: string) => Promise<void>,
) {
  const settings = await getSettings();
  const entries = await fs.readdir(absoluteDir, { withFileTypes: true });

  for (const entry of entries) {
    if (shouldHide(entry.name, settings.showHiddenFiles, settings.showObsidianFolder)) {
      continue;
    }

    const absolute = path.join(absoluteDir, entry.name);
    const stat = await fs.lstat(absolute);
    if (stat.isSymbolicLink()) {
      continue;
    }

    const relative = path.posix.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      await walkMarkdownFiles(absolute, relative, visitor);
      continue;
    }

    if (editableExtensions.has(path.extname(entry.name).toLowerCase())) {
      await visitor(absolute, relative);
    }
  }
}

function makeSnippet(content: string, index: number, query: string) {
  if (index === -1) {
    return content.split(/\r?\n/).find((line) => line.trim())?.slice(0, 160) ?? query;
  }

  const start = Math.max(0, index - 70);
  const end = Math.min(content.length, index + query.length + 90);
  return content.slice(start, end).replace(/\s+/g, " ").trim();
}
