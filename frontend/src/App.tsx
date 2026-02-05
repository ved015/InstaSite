import React, { useState, useEffect } from "react";
import axios from "axios";
import { Send, Sparkles, Code2, Globe, Cpu, Loader2 } from "lucide-react";
import { useWebContainer } from "./hooks/useWebContainer";
import { parseXMLResponse } from "./utils/xmlParser";
import FileExplorer from "./components/FileExplorer";
import CodeEditor from "./components/CodeEditor";
import { PreviewFrame } from "./components/PreviewFrame";
import { BoltArtifact, FileAction } from "./types";

function App() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [artifact, setArtifact] = useState<BoltArtifact | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const webContainer = useWebContainer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setArtifact(null); // Reset artifact
    setSelectedFile(null);

    try {
      const response = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: prompt }),
      });

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let streamedText = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          streamedText += chunk;

          try {
            // In streaming mode, we need to wrap the text in a structure that parseXMLResponse expects,
            // or modify parseXMLResponse. For now, let's wrap it in { data: ... } as axios did,
            // but since we are just appending text, we can pass the raw string.
            // We need to handle partial XML carefully.
            // parseXMLResponse is robust enough to extract *complete* actions.
            // We can just try parsing the current accumulated text.

            const parsedArtifact = parseXMLResponse({ data: streamedText });
            if (parsedArtifact && parsedArtifact.actions.length > 0) {
              setArtifact((prev) => {
                // If we already have an artifact, we want to update it.
                // But parseXMLResponse re-parses everything.
                // This is fine for now as it ensures consistency.
                return parsedArtifact;
              });

              // Auto-select the first file if none is selected
              if (!selectedFile && parsedArtifact.actions.length > 0) {
                setSelectedFile(parsedArtifact.actions[0]);
              }
            }
          } catch (err) {
            // Ignore parsing errors for incomplete XML chunks
          }
        }
      }
    } catch (err: any) {
      console.error("Error details:", err);
      setError(err.message || "Failed to process the request.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFile) {
      console.log(
        "Selected file:",
        selectedFile.filePath,
        selectedFile.content,
      );
    }
  }, [selectedFile]);

  // Helper: guess language mode by file extension
  const getFileLanguage = (filePath: string) => {
    const ext = filePath.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "ts":
      case "tsx":
        return "typescript";
      case "js":
      case "jsx":
        return "javascript";
      case "css":
        return "css";
      case "html":
        return "html";
      case "json":
        return "json";
      case "md":
        return "markdown";
      case "xml":
        return "xml";
      case "yml":
      case "yaml":
        return "yaml";
      case "sh":
        return "shell";
      case "py":
        return "python";
      default:
        return "plaintext";
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white font-sans selection:bg-blue-500/30">
      <header className="bg-slate-900/50 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-200">
            Instasite
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-white/5">
          <div
            className={`w-2 h-2 rounded-full ${webContainer ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" : "bg-yellow-500 animate-pulse"}`}
          />
          <span>{webContainer ? "System Ready" : "Booting System..."}</span>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950/0 to-slate-950/0 pointer-events-none" />

        <div className="container mx-auto max-w-7xl p-6 flex-1 flex flex-col gap-6 z-0">
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-1.5 shadow-2xl backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="flex gap-2 relative group">
              <input
                type="text"
                placeholder="Describe your dream website..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 px-6 py-4 bg-transparent text-lg text-white placeholder-slate-500 focus:outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-8 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {loading ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </form>
            {error && (
              <div className="px-6 pb-4 pt-2 text-red-400 text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </div>
            )}
          </div>

          <div className="flex-1 flex gap-6 min-h-0">
            <div className="w-64 bg-slate-900/50 border border-white/10 rounded-xl flex flex-col backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-white/20">
              <div className="p-4 border-b border-white/5 bg-white/5">
                <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-blue-400" />
                  Files
                </h2>
              </div>
              <div className="flex-1 overflow-auto p-2">
                {artifact ? (
                  <FileExplorer
                    files={artifact.actions}
                    onFileSelect={(file) => {
                      console.log("Selected file:", file.filePath);
                      setSelectedFile(file);
                    }}
                    selectedFile={selectedFile || undefined}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                      <Code2 className="w-6 h-6 opacity-50" />
                    </div>
                    <p className="text-xs">Generated files will appear here</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex gap-6 min-w-0">
              <div className="flex-1 bg-slate-900/80 border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-2xl">
                {selectedFile ? (
                  <>
                    <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-300 font-mono">
                        {selectedFile.filePath}
                      </span>
                      <span className="text-xs text-slate-500 bg-black/20 px-2 py-1 rounded">
                        {getFileLanguage(selectedFile.filePath)}
                      </span>
                    </div>
                    <div className="flex-1 relative">
                      <CodeEditor
                        key={selectedFile.filePath}
                        content={selectedFile.content || ""}
                        language={getFileLanguage(selectedFile.filePath)}
                      />
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/5 flex items-center justify-center">
                      <Code2 className="w-8 h-8 opacity-50 text-blue-400" />
                    </div>
                    <p>Select a file to view code</p>
                  </div>
                )}
              </div>

              <div className="flex-1 bg-slate-900/80 border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-2xl">
                <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-green-400" />
                    Live Preview
                  </h2>
                </div>
                <div className="flex-1 bg-white relative">
                  {/* Only show PreviewFrame when NOT loading, to avoid constant mounting during streaming */}
                  {artifact && !loading ? (
                    <PreviewFrame
                      webContainer={webContainer}
                      files={artifact.actions}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-slate-500 gap-4">
                      {loading ? (
                        <div className="flex flex-col items-center gap-4">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                          <p>Generating code...</p>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-white/5 flex items-center justify-center">
                            <Globe className="w-8 h-8 opacity-50 text-green-400" />
                          </div>
                          <p>Preview will start after generation</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
