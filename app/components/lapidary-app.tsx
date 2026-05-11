"use client";

import dynamic from "next/dynamic";
import {
  FilePlus2,
  FolderPlus,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  RefreshCcw,
  Save,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiResponse } from "@/lib/api-response";
import type { FileData, SearchResult, TreeItem } from "@/lib/vault/service";

type SetupStatus = {
  isConfigured: boolean;
  vaultPathSet: boolean;
  activeVaultId?: string;
  vaults: VaultSummary[];
};

type VaultSummary = {
  id: string;
  name: string;
  path: string;
  isConfigured: boolean;
};

type TreeData = {
  path: string;
  items: TreeItem[];
};

type SaveState = "idle" | "dirty" | "saving" | "saved" | "conflict" | "error";
type ViewMode = "edit" | "preview";
type ColorTheme = "paper" | "light" | "dark";
type FontFamily = "system" | "serif" | "mono";
type FontSize = "small" | "medium" | "large";

type AppSettings = {
  colorTheme: ColorTheme;
  fontFamily: FontFamily;
  fontSize: FontSize;
  lastOpenFileByVault: Record<string, string>;
};

const defaultAppSettings: AppSettings = {
  colorTheme: "paper",
  fontFamily: "system",
  fontSize: "medium",
  lastOpenFileByVault: {},
};
const bootTimeoutMs = 8_000;

const MarkdownEditor = dynamic(() => import("@/app/components/markdown-editor").then((module) => module.MarkdownEditor), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-slate-500">편집기를 불러오는 중...</div>,
});
const MarkdownPreview = dynamic(() => import("@/app/components/markdown-preview").then((module) => module.MarkdownPreview), {
  ssr: false,
  loading: () => <div className="px-5 py-6 text-sm text-slate-500">미리보기를 불러오는 중...</div>,
});

export function LapidaryApp() {
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [bootError, setBootError] = useState("");
  const [setupPath, setSetupPath] = useState("");
  const [tree, setTree] = useState<TreeData | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set([""]));
  const [childrenByPath, setChildrenByPath] = useState<Record<string, TreeItem[]>>({});
  const [currentFile, setCurrentFile] = useState<FileData | null>(null);
  const [content, setContent] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(defaultAppSettings);
  const [message, setMessage] = useState("");

  const configured = setupStatus?.isConfigured === true;
  const activeVaultId = setupStatus?.activeVaultId;

  const loadSetup = useCallback(async () => {
    try {
      setBootError("");
      const response = await api<SetupStatus>("/api/setup/status");
      setSetupStatus(response);
    } catch (error) {
      setSetupStatus({
        isConfigured: false,
        vaultPathSet: false,
        vaults: [],
      });
      setBootError(error instanceof Error ? error.message : "초기 설정을 불러오지 못했습니다.");
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const response = await api<AppSettings>("/api/settings");
      setSettings(response);
      return response;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "설정을 불러오지 못했습니다.");
      return defaultAppSettings;
    }
  }, []);

  const loadTree = useCallback(async (path = "") => {
    const data = await api<TreeData>(withVault(`/api/tree?path=${encodeURIComponent(path)}`, activeVaultId));
    if (path === "") {
      setTree(data);
    }
    setChildrenByPath((current) => ({ ...current, [path]: data.items }));
    return data;
  }, [activeVaultId]);

  const openFile = useCallback(async (path: string) => {
    const data = await api<FileData>(withVault(`/api/files?path=${encodeURIComponent(path)}`, activeVaultId));
    setCurrentFile(data);
    setContent(data.content);
    setSaveState("idle");
    setViewMode("preview");
    setSidebarOpen(false);
    if (activeVaultId) {
      setSettings((current) => ({
        ...current,
        lastOpenFileByVault: {
          ...current.lastOpenFileByVault,
          [activeVaultId]: data.path,
        },
      }));
      void api<AppSettings>("/api/settings", {
        method: "PUT",
        body: JSON.stringify({ activeVaultId, lastOpenFile: data.path }),
      }).catch(() => {
        setMessage("마지막으로 연 문서를 저장하지 못했습니다.");
      });
    }
  }, [activeVaultId]);

  const saveFile = useCallback(async () => {
    if (!currentFile) {
      return;
    }

    setSaveState("saving");
    try {
      const saved = await api<{ path: string; mtimeMs: number }>("/api/files", {
        method: "PUT",
        body: JSON.stringify({
          path: currentFile.path,
          content,
          baseMtimeMs: currentFile.mtimeMs,
          vaultId: activeVaultId,
        }),
      });

      setCurrentFile({ ...currentFile, content, mtimeMs: saved.mtimeMs });
      setSaveState("saved");
      setMessage("저장했습니다.");
    } catch (error) {
      const code = error instanceof ApiClientError ? error.code : "INTERNAL_ERROR";
      setSaveState(code === "FILE_CONFLICT" ? "conflict" : "error");
      setMessage(error instanceof Error ? error.message : "저장하지 못했습니다.");
    }
  }, [activeVaultId, content, currentFile]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSetupStatus((current) => {
        if (current) {
          return current;
        }
        setBootError("초기 설정 응답이 지연되고 있습니다. 서버 로그와 vault 경로를 확인해주세요.");
        return {
          isConfigured: false,
          vaultPathSet: false,
          vaults: [],
        };
      });
    }, bootTimeoutMs);

    void loadSetup();
    void loadSettings();
    return () => window.clearTimeout(timeout);
  }, [loadSetup, loadSettings]);

  useEffect(() => {
    if (configured) {
      setTree(null);
      setExpanded(new Set([""]));
      setChildrenByPath({});
      setCurrentFile(null);
      setContent("");
      setSearchResults([]);
      setQuery("");
      void (async () => {
        await loadTree("");
        const latestSettings = await loadSettings();
        const lastOpenFile = activeVaultId ? latestSettings.lastOpenFileByVault[activeVaultId] : undefined;
        if (lastOpenFile) {
          await openFile(lastOpenFile).catch(() => undefined);
        }
      })();
    }
  }, [activeVaultId, configured, loadSettings, loadTree, openFile]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveFile();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        window.setTimeout(() => document.getElementById("search-input")?.focus(), 0);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [saveFile]);

  useEffect(() => {
    const run = window.setTimeout(async () => {
      if (!query.trim() || !configured) {
        setSearchResults([]);
        return;
      }

      const data = await api<{ query: string; results: SearchResult[] }>(
        withVault(`/api/search?q=${encodeURIComponent(query)}`, activeVaultId),
      );
      setSearchResults(data.results);
    }, 250);

    return () => window.clearTimeout(run);
  }, [activeVaultId, configured, query]);

  const appStyle = useMemo(() => toAppStyle(settings), [settings]);

  async function updateSettings(next: AppSettings) {
    setSettings(next);
    try {
      const saved = await api<AppSettings>("/api/settings", {
        method: "PUT",
        body: JSON.stringify(next),
      });
      setSettings(saved);
      setMessage("설정을 저장했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "설정을 저장하지 못했습니다.");
    }
  }

  async function submitSetup(event: React.FormEvent) {
    event.preventDefault();
    const data = await api<SetupStatus>("/api/setup", {
      method: "POST",
      body: JSON.stringify({ vaultPath: setupPath }),
    });
    setSetupStatus((current) => ({
      isConfigured: data.isConfigured,
      vaultPathSet: data.vaults.length > 0,
      activeVaultId: data.activeVaultId,
      vaults: data.vaults.map((vault) => ({ ...vault, isConfigured: true })),
    }));
    setSetupPath("");
    void loadSetup();
  }

  async function switchVault(vaultId: string) {
    const data = await api<{ activeVaultId?: string; vaults: VaultSummary[] }>("/api/setup", {
      method: "POST",
      body: JSON.stringify({ activeVaultId: vaultId }),
    });
    setSetupStatus((current) => ({
      isConfigured: true,
      vaultPathSet: data.vaults.length > 0,
      activeVaultId: data.activeVaultId,
      vaults: (current?.vaults ?? data.vaults).map((vault) => ({
        ...vault,
        isConfigured: data.vaults.some((item) => item.id === vault.id),
      })),
    }));
    void loadSetup();
  }

  async function addVaultFromPrompt() {
    const vaultPath = window.prompt("추가할 vault 경로");
    if (!vaultPath) {
      return;
    }
    const data = await api<{ activeVaultId?: string; vaults: VaultSummary[] }>("/api/setup", {
      method: "POST",
      body: JSON.stringify({ vaultPath }),
    });
    setSetupStatus({
      isConfigured: true,
      vaultPathSet: data.vaults.length > 0,
      activeVaultId: data.activeVaultId,
      vaults: data.vaults.map((vault) => ({ ...vault, isConfigured: true })),
    });
    void loadSetup();
  }

  async function toggleFolder(path: string) {
    const next = new Set(expanded);
    if (next.has(path)) {
      next.delete(path);
      setExpanded(next);
      return;
    }

    next.add(path);
    setExpanded(next);
    if (!childrenByPath[path]) {
      await loadTree(path);
    }
  }

  async function createNote() {
    const target = window.prompt("새 문서 경로", currentFile ? siblingPath(currentFile.path, "Untitled.md") : "Untitled.md");
    if (!target) {
      return;
    }
    const created = await api<{ path: string }>("/api/files", {
      method: "POST",
      body: JSON.stringify({
        path: target,
        content: `# ${target.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "Untitled"}\n`,
        vaultId: activeVaultId,
      }),
    });
    await refreshVisibleTree(created.path);
    await openFile(created.path);
    setCreateMenuOpen(false);
  }

  async function createDirectory() {
    const target = window.prompt("새 폴더 경로", "New Folder");
    if (!target) {
      return;
    }
    await api<{ path: string }>("/api/folders", {
      method: "POST",
      body: JSON.stringify({ path: target, vaultId: activeVaultId }),
    });
    await refreshVisibleTree(target);
    setCreateMenuOpen(false);
  }

  async function moveCurrentFile() {
    if (!currentFile) {
      return;
    }

    const target = window.prompt("이동하거나 바꿀 경로", currentFile.path);
    if (!target || target === currentFile.path) {
      return;
    }

    const moved = await api<{ to: string }>("/api/move", {
      method: "POST",
      body: JSON.stringify({ from: currentFile.path, to: target, vaultId: activeVaultId }),
    });
    await refreshVisibleTree(currentFile.path);
    await refreshVisibleTree(moved.to);
    await openFile(moved.to);
    setFileMenuOpen(false);
  }

  async function trashCurrentFile() {
    if (!currentFile || !window.confirm("이 문서를 휴지통으로 이동할까요?")) {
      return;
    }

    await api("/api/files", {
      method: "DELETE",
      body: JSON.stringify({ path: currentFile.path, vaultId: activeVaultId }),
    });
    await refreshVisibleTree(currentFile.path);
    setCurrentFile(null);
    setContent("");
    setSaveState("idle");
    setFileMenuOpen(false);
  }

  async function refreshVisibleTree(changedPath: string) {
    const parent = parentPath(changedPath);
    await loadTree("");
    if (parent && expanded.has(parent)) {
      await loadTree(parent);
    }
  }

  if (setupStatus === null && bootError) {
    return (
      <main className="lapidary-shell grid min-h-screen place-items-center px-5" data-theme={settings.colorTheme} style={appStyle}>
        <div className="w-full max-w-xl rounded-md border border-line bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold tracking-normal">Lapidary를 시작하지 못했습니다</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{bootError}</p>
          <button className="mt-4 h-10 rounded-md bg-ink px-4 text-sm font-medium text-white" onClick={() => void loadSetup()}>
            다시 시도
          </button>
        </div>
      </main>
    );
  }

  if (setupStatus === null) {
    return (
      <main className="lapidary-shell grid min-h-screen place-items-center text-sm text-moss" data-theme={settings.colorTheme} style={appStyle}>
        Loading Lapidary...
      </main>
    );
  }

  if (!configured) {
    return (
      <main className="lapidary-shell grid min-h-screen place-items-center px-5" data-theme={settings.colorTheme} style={appStyle}>
        <form onSubmit={submitSetup} className="w-full max-w-xl rounded-md border border-line bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h1 className="text-2xl font-semibold tracking-normal">Lapidary</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Obsidian vault 경로를 설정하면 로컬 Markdown 문서를 웹에서 탐색하고 편집할 수 있습니다.
            </p>
            {bootError && <p className="mt-3 rounded-md border border-line bg-paper px-3 py-2 text-sm leading-6 text-slate-700">{bootError}</p>}
          </div>
          <label className="block text-sm font-medium" htmlFor="vault-path">
            Vault path
          </label>
          <input
            id="vault-path"
            value={setupPath}
            onChange={(event) => setSetupPath(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-line bg-paper px-3 outline-none focus:border-moss"
            placeholder="/Users/name/Documents/ObsidianVault"
          />
          <button className="mt-4 h-10 rounded-md bg-ink px-4 text-sm font-medium text-white" type="submit">
            설정 저장
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="lapidary-shell flex h-[100svh] min-h-0 flex-col overflow-hidden" data-theme={settings.colorTheme} style={appStyle}>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line bg-white px-2 md:h-14 md:px-4">
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line md:hidden"
          onClick={() => setSidebarOpen((open) => !open)}
          title="파일 트리"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0 flex-1 truncate text-sm font-medium md:text-base">
          {currentFile?.path ?? setupStatus.vaults.find((vault) => vault.id === activeVaultId)?.name ?? "Lapidary"}
        </div>
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line"
          onClick={() => {
            setSearchOpen(true);
            window.setTimeout(() => document.getElementById("search-input")?.focus(), 0);
          }}
          title="검색"
        >
          <Search size={16} />
        </button>
        <button className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-sm" onClick={() => setSettingsOpen(true)} title="설정">
          <Settings2 size={16} />
        </button>
      </header>

      {searchOpen && (
        <SearchOverlay
          query={query}
          results={searchResults}
          onChange={setQuery}
          onClose={() => setSearchOpen(false)}
          onOpen={(path) => {
            void openFile(path);
            setSearchOpen(false);
          }}
        />
      )}

      {settingsOpen && (
        <SettingsPanel
          setupStatus={setupStatus}
          activeVaultId={activeVaultId}
          settings={settings}
          onSwitchVault={(vaultId) => void switchVault(vaultId)}
          onAddVault={() => void addVaultFromPrompt()}
          onRefresh={() => void loadTree("")}
          onClose={() => setSettingsOpen(false)}
          onChange={(next) => void updateSettings(next)}
        />
      )}

      <div className="flex min-h-0 flex-1">
        <aside
          className={`${
            sidebarOpen ? "fixed bottom-0 left-0 top-12 z-20 w-[min(20rem,calc(100vw-1rem))] md:top-14" : "hidden"
          } shrink-0 border-r border-line bg-white md:static md:block md:w-80`}
        >
          <div className="relative flex h-11 items-center justify-between border-b border-line px-3">
            <div className="min-w-0 truncate text-sm font-medium">문서</div>
            <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line" onClick={() => setCreateMenuOpen((open) => !open)} title="새로 만들기">
              <Plus size={16} />
            </button>
            {createMenuOpen && (
              <div className="absolute right-3 top-10 z-30 w-40 rounded-md border border-line bg-white p-1 shadow-lg">
                <button className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-paper" onClick={createNote}>
                  <FilePlus2 size={16} />
                  새 문서
                </button>
                <button className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-paper" onClick={createDirectory}>
                  <FolderPlus size={16} />
                  새 폴더
                </button>
              </div>
            )}
          </div>
          <div className="h-[calc(100%-2.75rem)] overflow-auto p-2 text-sm">
            <TreeList
              items={tree?.items ?? []}
              childrenByPath={childrenByPath}
              expanded={expanded}
              currentPath={currentFile?.path}
              onToggle={toggleFolder}
              onOpen={openFile}
            />
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line bg-white px-3">
            <div className="min-w-0 flex-1 truncate text-sm font-medium">
              {currentFile ? currentFile.path.split("/").pop() : "문서를 선택하세요"}
            </div>
            {currentFile && (
              <>
                <span className="hidden text-xs text-slate-500 sm:inline">{statusLabel(saveState)}</span>
                <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line" onClick={() => setViewMode(viewMode === "edit" ? "preview" : "edit")} title="편집/미리보기">
                  <Pencil size={16} />
                </button>
                <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line" onClick={saveFile} title="저장">
                  <Save size={16} />
                </button>
                <div className="relative">
                  <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line" onClick={() => setFileMenuOpen((open) => !open)} title="문서 메뉴">
                    <MoreHorizontal size={16} />
                  </button>
                  {fileMenuOpen && (
                    <div className="absolute right-0 top-9 z-30 w-40 rounded-md border border-line bg-white p-1 shadow-lg">
                      <button className="flex h-9 w-full items-center rounded-md px-2 text-left text-sm hover:bg-paper" onClick={moveCurrentFile}>
                        이동/이름 변경
                      </button>
                      <button className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-clay hover:bg-paper" onClick={trashCurrentFile}>
                        <Trash2 size={16} />
                        휴지통
                      </button>
                    </div>
                  )}
                </div>
                <button className="hidden h-8 w-8 items-center justify-center rounded-md border border-line md:inline-flex" onClick={() => void loadTree("")} title="새로고침">
                  <RefreshCcw size={16} />
                </button>
              </>
            )}
          </div>

          {message && <div className="border-b border-line bg-paper px-4 py-2 text-sm text-slate-700">{message}</div>}

          <div className="min-h-0 flex-1 overflow-auto">
            {!currentFile ? (
              <div className="grid h-full place-items-center px-5 text-center text-sm text-slate-600">
                파일 트리나 검색 결과에서 Markdown 문서를 선택하세요.
              </div>
            ) : viewMode === "edit" ? (
              <MarkdownEditor
                value={content}
                onChange={(value) => {
                  setContent(value);
                  setSaveState(value === currentFile.content ? "idle" : "dirty");
                }}
              />
            ) : (
              <MarkdownPreview
                content={content}
                onWikiLink={(target) => {
                  setQuery(target);
                  setSearchOpen(true);
                  window.setTimeout(() => document.getElementById("search-input")?.focus(), 0);
                }}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function TreeList(props: {
  items: TreeItem[];
  childrenByPath: Record<string, TreeItem[]>;
  expanded: Set<string>;
  currentPath?: string;
  onToggle: (path: string) => void;
  onOpen: (path: string) => void;
}) {
  return (
    <ul className="space-y-0.5">
      {props.items.map((item) => (
        <TreeRow key={item.path} item={item} depth={0} {...props} />
      ))}
    </ul>
  );
}

function TreeRow(props: {
  item: TreeItem;
  depth: number;
  childrenByPath: Record<string, TreeItem[]>;
  expanded: Set<string>;
  currentPath?: string;
  onToggle: (path: string) => void;
  onOpen: (path: string) => void;
}) {
  const { item, depth } = props;
  const isExpanded = props.expanded.has(item.path);
  const isCurrent = props.currentPath === item.path;
  const children = props.childrenByPath[item.path] ?? [];

  return (
    <li>
      <button
        className={`flex h-8 w-full items-center rounded-md px-2 text-left hover:bg-paper ${isCurrent ? "bg-[var(--selected)] text-ink" : ""}`}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => (item.type === "directory" ? props.onToggle(item.path) : props.onOpen(item.path))}
      >
        <span className="mr-2 w-4 shrink-0 text-slate-500">{item.type === "directory" ? (isExpanded ? "▾" : "▸") : "·"}</span>
        <span className="min-w-0 truncate">{item.name}</span>
      </button>
      {item.type === "directory" && isExpanded && children.length > 0 && (
        <ul>
          {children.map((child) => (
            <TreeRow key={child.path} {...props} item={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

function SearchOverlay({
  query,
  results,
  onChange,
  onClose,
  onOpen,
}: {
  query: string;
  results: SearchResult[];
  onChange: (query: string) => void;
  onClose: () => void;
  onOpen: (path: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-40 bg-black/20 px-3 pt-16" role="dialog" aria-modal="true" aria-label="검색">
      <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="검색 닫기" />
      <div className="relative mx-auto flex max-h-[min(34rem,calc(100svh-5rem))] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-line bg-white shadow-xl">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3">
          <Search className="text-slate-500" size={17} />
          <input
            id="search-input"
            value={query}
            onChange={(event) => onChange(event.target.value)}
            className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
            placeholder="문서 검색"
          />
          <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line" onClick={onClose} title="닫기">
            <X size={16} />
          </button>
        </div>
        <div className="min-h-40 overflow-auto p-2 text-sm">
          {query.trim() ? (
            <SearchResults results={results} onOpen={onOpen} />
          ) : (
            <div className="px-2 py-4 text-sm text-slate-500">검색어를 입력하세요.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchResults({ results, onOpen }: { results: SearchResult[]; onOpen: (path: string) => void }) {
  if (results.length === 0) {
    return <div className="px-2 py-4 text-sm text-slate-500">검색 결과가 없습니다.</div>;
  }

  return (
    <ul className="space-y-1">
      {results.map((result) => (
        <li key={result.path}>
          <button className="w-full rounded-md px-2 py-2 text-left hover:bg-paper" onClick={() => onOpen(result.path)}>
            <div className="truncate font-medium">{result.title}</div>
            <div className="truncate text-xs text-slate-500">{result.path}</div>
            <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{result.snippet}</div>
          </button>
        </li>
      ))}
    </ul>
  );
}

function SettingsPanel({
  setupStatus,
  activeVaultId,
  settings,
  onSwitchVault,
  onAddVault,
  onRefresh,
  onClose,
  onChange,
}: {
  setupStatus: SetupStatus;
  activeVaultId?: string;
  settings: AppSettings;
  onSwitchVault: (vaultId: string) => void;
  onAddVault: () => void;
  onRefresh: () => void;
  onClose: () => void;
  onChange: (settings: AppSettings) => void;
}) {
  return (
    <div className="fixed inset-0 z-40 bg-black/20" role="dialog" aria-modal="true" aria-label="설정">
      <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="설정 닫기" />
      <aside className="absolute right-0 top-0 flex h-full w-[min(24rem,100vw)] flex-col border-l border-line bg-white shadow-xl">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
          <h2 className="text-base font-semibold">설정</h2>
          <button className="h-8 rounded-md border border-line px-3 text-sm" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="space-y-5 overflow-auto p-4">
          <label className="block">
            <span className="text-sm font-medium">Vault</span>
            <select
              value={activeVaultId ?? ""}
              onChange={(event) => onSwitchVault(event.target.value)}
              className="mt-2 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none focus:border-moss"
            >
              {setupStatus.vaults.map((vault) => (
                <option key={vault.id} value={vault.id}>
                  {vault.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button className="h-10 rounded-md border border-line px-3 text-sm" onClick={onAddVault}>
              Vault 추가
            </button>
            <button className="h-10 rounded-md border border-line px-3 text-sm" onClick={onRefresh}>
              파일 새로고침
            </button>
          </div>

          <label className="block">
            <span className="text-sm font-medium">Color theme</span>
            <select
              value={settings.colorTheme}
              onChange={(event) => onChange({ ...settings, colorTheme: event.target.value as ColorTheme })}
              className="mt-2 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none focus:border-moss"
            >
              <option value="paper">Paper</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Font</span>
            <select
              value={settings.fontFamily}
              onChange={(event) => onChange({ ...settings, fontFamily: event.target.value as FontFamily })}
              className="mt-2 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none focus:border-moss"
            >
              <option value="system">System</option>
              <option value="serif">Serif</option>
              <option value="mono">Mono</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Font size</span>
            <select
              value={settings.fontSize}
              onChange={(event) => onChange({ ...settings, fontSize: event.target.value as FontSize })}
              className="mt-2 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none focus:border-moss"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </label>
        </div>
      </aside>
    </div>
  );
}

function toAppStyle(settings: AppSettings): CSSProperties {
  const theme = {
    paper: {
      background: "#f7f5ef",
      foreground: "#1f2933",
      surface: "#ffffff",
      paper: "#f7f5ef",
      line: "#d9ded8",
      muted: "#53605a",
      accent: "#5d7162",
      selected: "#e8ece6",
      previewCode: "#222b2f",
      previewCodeText: "#f4f1e8",
    },
    light: {
      background: "#f8fafc",
      foreground: "#172033",
      surface: "#ffffff",
      paper: "#f1f5f9",
      line: "#d7dde7",
      muted: "#526072",
      accent: "#25636f",
      selected: "#e4eef1",
      previewCode: "#18202d",
      previewCodeText: "#f8fafc",
    },
    dark: {
      background: "#161819",
      foreground: "#ece7dd",
      surface: "#202326",
      paper: "#292d30",
      line: "#3b4246",
      muted: "#b7b0a5",
      accent: "#9eb48f",
      selected: "#303c34",
      previewCode: "#111315",
      previewCodeText: "#f1eee7",
    },
  }[settings.colorTheme];

  const fontFamily = {
    system: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    serif: 'Georgia, "Times New Roman", ui-serif, serif',
    mono: '"SFMono-Regular", Consolas, "Liberation Mono", ui-monospace, monospace',
  }[settings.fontFamily];

  const fontSize = {
    small: "14px",
    medium: "16px",
    large: "18px",
  }[settings.fontSize];

  return {
    "--background": theme.background,
    "--foreground": theme.foreground,
    "--surface": theme.surface,
    "--paper": theme.paper,
    "--line": theme.line,
    "--muted": theme.muted,
    "--accent": theme.accent,
    "--selected": theme.selected,
    "--preview-code": theme.previewCode,
    "--preview-code-text": theme.previewCodeText,
    "--app-font-family": fontFamily,
    "--app-font-size": fontSize,
  } as CSSProperties;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(`서버가 JSON 대신 ${response.status} 응답을 반환했습니다.`);
  }

  const payload = (await response.json()) as ApiResponse<T>;
  if (!payload.ok) {
    throw new ApiClientError(payload.error.code, payload.error.message);
  }
  return payload.data;
}

class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function parentPath(filePath: string) {
  return filePath.split("/").slice(0, -1).join("/");
}

function siblingPath(filePath: string, name: string) {
  const parent = parentPath(filePath);
  return parent ? `${parent}/${name}` : name;
}

function withVault(url: string, vaultId?: string) {
  if (!vaultId) {
    return url;
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}vaultId=${encodeURIComponent(vaultId)}`;
}

function statusLabel(state: SaveState) {
  switch (state) {
    case "dirty":
      return "Unsaved changes";
    case "saving":
      return "Saving...";
    case "saved":
      return "Saved";
    case "conflict":
      return "Conflict detected";
    case "error":
      return "Save failed";
    default:
      return "Ready";
  }
}
