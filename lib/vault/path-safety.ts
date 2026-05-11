import { promises as fs } from "node:fs";
import path from "node:path";
import { AppError } from "@/lib/api-response";

export const editableExtensions = new Set([".md", ".markdown", ".txt"]);
export const previewableExtensions = new Set([
  ".md",
  ".markdown",
  ".txt",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".pdf",
]);

export type SafePath = {
  absolutePath: string;
  relativePath: string;
};

type ResolveOptions = {
  allowRoot?: boolean;
  mustBeEditableFile?: boolean;
  forWrite?: boolean;
};

export async function assertValidVaultRoot(vaultPath: string) {
  const trimmed = vaultPath.trim();
  if (!trimmed) {
    throw new AppError("VAULT_NOT_CONFIGURED", "Vault path is required.", 400);
  }

  const stat = await fs.stat(trimmed).catch(() => null);
  if (!stat?.isDirectory()) {
    throw new AppError("INVALID_PATH", "Vault path must be an existing directory.", 400);
  }

  const real = await fs.realpath(trimmed);
  const rootStat = await fs.lstat(real);
  if (rootStat.isSymbolicLink()) {
    throw new AppError("FORBIDDEN", "Vault path cannot be a symlink.", 403);
  }

  return real;
}

export async function resolveVaultPath(
  vaultRoot: string,
  inputPath: string | null | undefined,
  options: ResolveOptions = {},
): Promise<SafePath> {
  const root = await assertValidVaultRoot(vaultRoot);
  const raw = (inputPath ?? "").trim();

  if (!raw && !options.allowRoot) {
    throw new AppError("INVALID_PATH", "Path is required.", 400);
  }

  if (raw.includes("\0") || /[\x00-\x1f]/.test(raw)) {
    throw new AppError("INVALID_PATH", "Path contains invalid characters.", 400);
  }

  if (raw.includes("\\") || path.isAbsolute(raw) || path.win32.isAbsolute(raw)) {
    throw new AppError("INVALID_PATH", "Only vault-relative paths are allowed.", 400);
  }

  const relativePath = normalizeRelativePath(raw);
  if (!relativePath && !options.allowRoot) {
    throw new AppError("INVALID_PATH", "Path is required.", 400);
  }

  const absolutePath = path.resolve(root, relativePath || ".");
  assertInsideVault(root, absolutePath);

  if (options.mustBeEditableFile && !editableExtensions.has(path.extname(relativePath).toLowerCase())) {
    throw new AppError("UNSUPPORTED_FILE_TYPE", "Only Markdown and text files can be edited.", 415);
  }

  await assertNoSymlink(root, absolutePath, options.forWrite);

  return { absolutePath, relativePath };
}

export function normalizeRelativePath(inputPath: string) {
  const normalized = path.posix.normalize(inputPath.replace(/^\/+/, ""));
  if (normalized === ".") {
    return "";
  }

  if (normalized === ".." || normalized.startsWith("../")) {
    throw new AppError("PATH_OUTSIDE_VAULT", "The requested path is outside the vault.", 403);
  }

  return normalized;
}

export function withMarkdownExtension(inputPath: string) {
  const trimmed = inputPath.trim();
  if (!path.posix.extname(trimmed)) {
    return `${trimmed}.md`;
  }
  return trimmed;
}

export function assertInsideVault(vaultRoot: string, absolutePath: string) {
  const relative = path.relative(vaultRoot, absolutePath);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    return;
  }

  throw new AppError("PATH_OUTSIDE_VAULT", "The requested path is outside the vault.", 403);
}

async function assertNoSymlink(vaultRoot: string, targetPath: string, forWrite = false) {
  const relative = path.relative(vaultRoot, targetPath);
  const segments = relative ? relative.split(path.sep).filter(Boolean) : [];
  let current = vaultRoot;

  const segmentsToCheck = forWrite ? segments.slice(0, -1) : segments;
  for (const segment of segmentsToCheck) {
    current = path.join(current, segment);
    const stat = await fs.lstat(current).catch((error) => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    });

    if (stat?.isSymbolicLink()) {
      throw new AppError("FORBIDDEN", "Symlink paths are not allowed.", 403);
    }
  }

  if (!forWrite) {
    const stat = await fs.lstat(targetPath).catch((error) => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    });

    if (stat?.isSymbolicLink()) {
      throw new AppError("FORBIDDEN", "Symlink paths are not allowed.", 403);
    }
  }
}
