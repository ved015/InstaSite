import React, { useEffect, useState } from "react";
import { WebContainer } from "@webcontainer/api";
import { FileAction } from "../types";
import { Loader2, CheckCircle2, Terminal } from "lucide-react";

interface PreviewFrameProps {
  files: FileAction[];
  webContainer: WebContainer | null;
}

export function PreviewFrame({ files, webContainer }: PreviewFrameProps) {
  const [url, setUrl] = useState<string>("");
  const [status, setStatus] = useState<
    "initializing" | "installing" | "starting" | "ready" | "error"
  >("initializing");
  const [logs, setLogs] = useState<string[]>([]);

  function addLog(msg: string) {
    // Strip ALL ANSI escape sequences (colors, cursor movements, etc.)
    // eslint-disable-next-line no-control-regex
    const cleanMsg = msg
      .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "") // All ANSI sequences
      .replace(/[\x00-\x1f\x7f]/g, "") // Remove other control characters
      .trim();
    if (cleanMsg) {
      setLogs((prev) => [...prev.slice(-49), cleanMsg]); // Keep last 50 logs
    }
  }

  function createMountStructure(actions: FileAction[]): Record<string, any> {
    const root: Record<string, any> = {};

    for (const action of actions) {
      const parts = action.filePath.split("/");
      let curr = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLastPart = i === parts.length - 1;

        if (isLastPart) {
          let content = action.content ?? "";
          if (typeof content !== "string") {
            try {
              content = JSON.stringify(content, null, 2);
            } catch {
              content = String(content);
            }
          }
          curr[part] = { file: { contents: content } };
        } else {
          if (!curr[part]) {
            curr[part] = { directory: {} };
          }
          curr = curr[part].directory;
        }
      }
    }
    return root;
  }

  useEffect(() => {
    if (!webContainer) return;

    // Handle empty actions gracefully
    if (files.length === 0) {
      setStatus("error");
      addLog("No files to mount.");
      return;
    }

    async function mountAndRun() {
      try {
        setStatus("initializing");
        const structure = createMountStructure(files);

        await webContainer.mount(structure);

        // Check for package.json
        const hasPackageJson = files.some(
          (f) =>
            f.filePath === "package.json" ||
            f.filePath.endsWith("/package.json"),
        );

        if (hasPackageJson) {
          setStatus("installing");
          addLog("Installing dependencies...");

          const installProcess = await webContainer.spawn("npm", ["install"]);

          installProcess.output.pipeTo(
            new WritableStream({
              write(data) {
                addLog(data);
              },
            }),
          );

          const installExitCode = await installProcess.exit;

          if (installExitCode !== 0) {
            throw new Error("npm install failed");
          }

          setStatus("starting");
          addLog("Starting dev server...");

          webContainer.on("server-ready", (port: number, url: string) => {
            setUrl(url);
            setStatus("ready");
            addLog(`Server ready at ${url}`);
          });

          const devProcess = await webContainer.spawn("npm", ["run", "dev"]);

          devProcess.output.pipeTo(
            new WritableStream({
              write(data) {
                addLog(data);
              },
            }),
          );
        } else {
          addLog("No package.json found. Skipping install.");
          // We can't run dev server without package.json usually
        }
      } catch (err: any) {
        console.error("PreviewFrame error:", err);
        setStatus("error");
        addLog(`Error: ${err.message}`);
      }
    }

    mountAndRun();
  }, [webContainer, files]);

  return (
    <div className="h-full w-full bg-gray-900 border border-gray-800 rounded-lg overflow-hidden flex flex-col relative">
      {!url && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
          <div className="flex flex-col space-y-4 w-full max-w-md">
            <div className="flex items-center space-x-3 text-gray-400">
              {status === "initializing" || status === "installing" ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
              <span>Initializing environment...</span>
            </div>

            <div className="flex items-center space-x-3 text-gray-400">
              {status === "installing" ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              ) : status === "starting" || status === "ready" ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <div className="w-5 h-5" />
              )}
              <span
                className={status === "initializing" ? "text-gray-600" : ""}
              >
                Installing dependencies...
              </span>
            </div>

            <div className="flex items-center space-x-3 text-gray-400">
              {status === "starting" ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              ) : status === "ready" ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <div className="w-5 h-5" />
              )}
              <span
                className={
                  status === "initializing" || status === "installing"
                    ? "text-gray-600"
                    : ""
                }
              >
                Starting development server...
              </span>
            </div>
          </div>

          <div className="w-full max-w-md bg-black/50 rounded-lg p-4 font-mono text-xs text-gray-500 h-32 overflow-hidden relative">
            <div className="absolute top-2 right-2">
              <Terminal className="w-4 h-4 opacity-50" />
            </div>
            {logs.map((log, i) => (
              <div key={i} className="whitespace-pre-wrap">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {url && (
        <iframe
          src={url}
          title="Preview"
          className="w-full h-full border-0 bg-white"
        />
      )}
    </div>
  );
}
