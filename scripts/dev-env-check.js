const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = process.cwd();
const platform = process.platform;
const isWindows = platform === "win32";
const isWsl = Boolean(process.env.WSL_DISTRO_NAME) || isWslKernel();
const binDir = path.join(root, "node_modules", ".bin");
const nextUnix = path.join(binDir, "next");
const nextCmd = path.join(binDir, "next.cmd");
const vaultPath = process.env.LAPIDARY_VAULT_PATH || "";

const runtimeName = isWindows ? "Windows" : isWsl ? "WSL" : platform;
const vaultExample = isWindows ? "E:\\obsidian\\obsidian_study" : "/mnt/e/obsidian/obsidian_study";
const messages = [];

if (!fs.existsSync(path.join(root, "node_modules"))) {
  messages.push("node_modules is missing. Run `npm install` in this same runtime first.");
} else if (isWindows && !fs.existsSync(nextCmd)) {
  messages.push(
    "Windows cannot find `node_modules\\.bin\\next.cmd`. This usually means dependencies were installed from WSL. Run `rmdir /s /q node_modules` and then `npm install` in Windows.",
  );
} else if (!isWindows && !fs.existsSync(nextUnix)) {
  messages.push(
    "Cannot find `node_modules/.bin/next`. Run `npm install` in this same runtime first.",
  );
}

if (isWindows && vaultPath.startsWith("/mnt/")) {
  messages.push(`LAPIDARY_VAULT_PATH looks like a WSL path. In Windows use something like ${vaultExample}.`);
}

if (!isWindows && /^[A-Za-z]:[\\/]/.test(vaultPath)) {
  messages.push(`LAPIDARY_VAULT_PATH looks like a Windows path. In WSL use something like ${vaultExample}.`);
}

console.log(`[Lapidary] runtime: ${runtimeName}`);
console.log(`[Lapidary] vault path example for this runtime: ${vaultExample}`);

if (messages.length > 0) {
  console.error("\n[Lapidary] Environment check failed:");
  for (const message of messages) {
    console.error(`- ${message}`);
  }
  console.error("");
  process.exit(1);
}

function isWslKernel() {
  try {
    return os.release().toLowerCase().includes("microsoft");
  } catch {
    return false;
  }
}
