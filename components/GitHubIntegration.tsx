// components/GitHubIntegration.tsx
'use client';

import { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon, FolderIcon, FileTextIcon } from 'lucide-react';

interface GitHubFile {
    name: string;
    path: string;
    type: 'file' | 'dir';
    size?: number;
}

interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    owner: {
        login: string;
    };
}

interface Props {
    onFilesSelected: (files: { path: string; content: string; name: string }[]) => void;
}

export default function GitHubIntegration({ onFilesSelected }: Props) {
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
    const [fileTree, setFileTree] = useState<GitHubFile[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [fileContents, setFileContents] = useState<Map<string, string>>(new Map());

    // Fetch user repositories
    useEffect(() => {
        async function fetchRepos() {
            try {
                const response = await fetch('/api/github?action=repos');
                const data = await response.json();
                if (data.repos) {
                    setRepos(data.repos);
                }
            } catch (error) {
                console.error('Error fetching repos:', error);
            }
        }
        fetchRepos();
    }, []);

    // Fetch repository contents
    const fetchContents = async (owner: string, repo: string, path: string = '') => {
        try {
            setLoading(true);
            const response = await fetch(
                `/api/github?action=contents&owner=${owner}&repo=${repo}&path=${path}`
            );
            const data = await response.json();

            if (data.contents) {
                const contents = Array.isArray(data.contents) ? data.contents : [data.contents];
                return contents.map((item: any) => ({
                    name: item.name,
                    path: item.path,
                    type: item.type === 'dir' ? 'dir' : 'file',
                    size: item.size,
                }));
            }
            return [];
        } catch (error) {
            console.error('Error fetching contents:', error);
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Handle repository selection
    const handleRepoSelect = async (repo: GitHubRepo) => {
        setSelectedRepo(repo);
        setFileTree([]);
        setExpandedFolders(new Set());
        setSelectedFiles(new Set());
        setFileContents(new Map());

        const contents = await fetchContents(repo.owner.login, repo.name);
        setFileTree(contents);
    };

    // Toggle folder expansion
    const toggleFolder = async (folderPath: string) => {
        const newExpanded = new Set(expandedFolders);

        if (expandedFolders.has(folderPath)) {
            newExpanded.delete(folderPath);
            setExpandedFolders(newExpanded);
        } else {
            newExpanded.add(folderPath);
            setExpandedFolders(newExpanded);

            if (selectedRepo) {
                const contents = await fetchContents(
                    selectedRepo.owner.login,
                    selectedRepo.name,
                    folderPath
                );

                // Insert contents after the folder
                const newFileTree = [...fileTree];
                const folderIndex = newFileTree.findIndex(item => item.path === folderPath);
                newFileTree.splice(folderIndex + 1, 0, ...contents);
                setFileTree(newFileTree);
            }
        }
    };

    // Toggle file selection
    const toggleFileSelection = (filePath: string) => {
        const newSelected = new Set(selectedFiles);

        if (selectedFiles.has(filePath)) {
            newSelected.delete(filePath);
        } else {
            newSelected.add(filePath);
        }

        setSelectedFiles(newSelected);
    };

    // Fetch file content
    const fetchFileContent = async (filePath: string) => {
        if (!selectedRepo || fileContents.has(filePath)) return;

        try {
            const response = await fetch(
                `/api/github?action=file&owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&path=${filePath}`
            );
            const data = await response.json();

            if (data.content) {
                const newContents = new Map(fileContents);
                newContents.set(filePath, data.content);
                setFileContents(newContents);
            }
        } catch (error) {
            console.error('Error fetching file content:', error);
        }
    };

    // Handle adding selected files to chat
    const handleAddToChat = async () => {
        const filesToAdd = [];

        for (const filePath of selectedFiles) {
            await fetchFileContent(filePath);
            const content = fileContents.get(filePath);

            if (content) {
                filesToAdd.push({
                    path: filePath,
                    content,
                    name: filePath.split('/').pop() || filePath,
                });
            }
        }

        onFilesSelected(filesToAdd);
    };

    // Render file tree
    const renderFileTree = (items: GitHubFile[], depth: number = 0) => {
        return items.map((item, index) => {
            const isExpanded = expandedFolders.has(item.path);
            const isSelected = selectedFiles.has(item.path);
            const indent = depth * 20;

            if (item.type === 'dir') {
                return (
                    <div key={`${item.path}-${index}`}>
                        <div
                            className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                            style={{ paddingLeft: `${16 + indent}px` }}
                            onClick={() => toggleFolder(item.path)}
                        >
                            {isExpanded ? (
                                <ChevronDownIcon className="w-4 h-4 mr-1" />
                            ) : (
                                <ChevronRightIcon className="w-4 h-4 mr-1" />
                            )}
                            <FolderIcon className="w-4 h-4 mr-2 text-blue-500" />
                            <span className="text-sm">{item.name}</span>
                        </div>
                    </div>
                );
            } else {
                const isTextFile = /\.(js|ts|jsx|tsx|py|java|cpp|c|h|css|html|md|txt|json|xml|yml|yaml)$/i.test(item.name);

                return (
                    <div
                        key={`${item.path}-${index}`}
                        className={`flex items-center p-2 hover:bg-gray-100 cursor-pointer ${isSelected ? 'bg-blue-100' : ''
                            }`}
                        style={{ paddingLeft: `${36 + indent}px` }}
                        onClick={() => isTextFile && toggleFileSelection(item.path)}
                    >
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => { }}
                            className="mr-2"
                            disabled={!isTextFile}
                        />
                        <FileTextIcon className={`w-4 h-4 mr-2 ${isTextFile ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={`text-sm ${isTextFile ? '' : 'text-gray-500'}`}>
                            {item.name}
                        </span>
                        {item.size && (
                            <span className="ml-auto text-xs text-gray-400">
                                {(item.size / 1024).toFixed(1)}KB
                            </span>
                        )}
                    </div>
                );
            }
        });
    };

    return (
        <div className="border rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-4">GitHub Integration</h3>

            {/* Repository Selection */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select Repository:</label>
                <select
                    className="w-full p-2 border rounded"
                    value={selectedRepo?.id || ''}
                    onChange={(e) => {
                        const repo = repos.find(r => r.id.toString() === e.target.value);
                        if (repo) handleRepoSelect(repo);
                    }}
                >
                    <option value="">Choose a repository...</option>
                    {repos.map(repo => (
                        <option key={repo.id} value={repo.id}>
                            {repo.full_name}
                        </option>
                    ))}
                </select>
            </div>

            {/* File Tree */}
            {selectedRepo && (
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                        Select Files ({selectedFiles.size} selected):
                    </label>
                    <div className="border rounded max-h-64 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500">Loading...</div>
                        ) : (
                            renderFileTree(fileTree)
                        )}
                    </div>
                </div>
            )}

            {/* Add to Chat Button */}
            {selectedFiles.size > 0 && (
                <button
                    onClick={handleAddToChat}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                    Add {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} to Chat Context
                </button>
            )}
        </div>
    );
}