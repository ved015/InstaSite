import React, { useState } from "react";
import { FileCode, Folder, ChevronRight, ChevronDown } from "lucide-react";
import { FileAction } from "../types";

interface FileExplorerProps {
  files: FileAction[];
  onFileSelect: (file: FileAction) => void;
  selectedFile?: FileAction;
}

const buildFileTree = (files: FileAction[]) => {
  const tree: Record<string, any> = {};

  files.forEach((file) => {
    const parts = file.filePath.split("/");
    let current = tree;

    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = index === parts.length - 1 ? file : {};
      }
      current = current[part];
    });
  });

  return tree;
};

const FileTree: React.FC<{
  tree: Record<string, any>;
  depth: number;
  onFileSelect: (file: FileAction) => void;
  selectedFile?: FileAction;
}> = ({ tree, depth, onFileSelect, selectedFile }) => {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (folder: string) => {
    setOpenFolders((prev) => ({ ...prev, [folder]: !prev[folder] }));
  };

  return (
    <div>
      {Object.entries(tree).map(([name, value]) => {
        const isFile = value.filePath !== undefined;
        return (
          <div
            key={name}
            style={{ paddingLeft: depth * 16 }}
            className="flex flex-col"
          >
            {!isFile ? (
              <div
                className="flex items-center cursor-pointer hover:bg-gray-700 rounded px-2 py-1"
                onClick={() => toggleFolder(name)}
              >
                {openFolders[name] ? (
                  <ChevronDown className="w-4 h-4 mr-2 text-gray-300" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-2 text-gray-300" />
                )}
                <Folder className="w-4 h-4 mr-2 text-yellow-400" />
                <span className="font-semibold text-sm">{name}</span>
              </div>
            ) : (
              <div
                className={`flex items-center cursor-pointer px-2 py-1 rounded ${selectedFile?.filePath === value.filePath ? "bg-gray-700" : "hover:bg-gray-700"}`}
                onClick={() => onFileSelect(value as FileAction)}
              >
                <FileCode className="w-4 h-4 mr-2 text-blue-400" />
                <span className="truncate text-sm">{name}</span>
              </div>
            )}
            {!isFile && openFolders[name] && (
              <FileTree
                tree={value}
                depth={depth + 1}
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  onFileSelect,
  selectedFile,
}) => {
  const fileTree = buildFileTree(files);

  return (
    <div className="w-64 bg-gray-900 text-white p-4 rounded-lg shadow-lg overflow-y-auto">
      <h2 className="text-lg font-bold mb-4">Files</h2>
      <FileTree
        tree={fileTree}
        depth={0}
        onFileSelect={onFileSelect}
        selectedFile={selectedFile}
      />
    </div>
  );
};

export default FileExplorer;
