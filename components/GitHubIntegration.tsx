// components/GitHubIntegration.tsx
'use client';

import { useState, useEffect } from 'react';
import {
    ChevronDownIcon,
    ChevronRightIcon,
    FolderIcon,
    FileTextIcon,
    RefreshCwIcon,
    CheckCircleIcon,
    AlertCircleIcon,
    Loader2Icon
} from 'lucide-react';

interface GitHubFile {
    name: string;
    path: string;
    type: 'file' | 'dir';
    size?: number;
    children?: GitHubFile[];
    loaded?: boolean;
}

interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    owner: {
        login: string;
    };
    private: boolean;
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
    const [reposLoading, setReposLoading] = useState(true);
    const [fileContents, setFileContents] = useState<Map<string, string>>(new Map());
    const [error, setError] = useState<string>('');
    const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());

    // Supported file extensions for text files
    const SUPPORTED_EXTENSIONS = [
        'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'hpp',
        'css', 'scss', 'html', 'htm', 'md', 'txt', 'json', 'xml', 'yml', 'yaml',
        'php', 'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'sh', 'bat', 'ps1',
        'sql', 'r', 'matlab', 'vue', 'svelte', 'astro', 'config', 'env'
    ];

    // Fetch user repositories
    useEffect(() => {
        fetchRepos();
    }, []);

    const fetchRepos = async () => {
        try {
            setReposLoading(true);
            setError('');
            const response = await fetch('/api/github?action=repos');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch repositories');
            }

            if (data.repos && Array.isArray(data.repos)) {
                setRepos(data.repos);
            } else {
                setRepos([]);
            }
        } catch (error) {
            console.error('Error fetching repos:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch repositories');
        } finally {
            setReposLoading(false);
        }
    };

    // Check if file is supported
    const isFileSupported = (filename: string): boolean => {
        const extension = filename.split('.').pop()?.toLowerCase();
        return extension ? SUPPORTED_EXTENSIONS.includes(extension) : false;
    };

    // Fetch repository contents
    const fetchContents = async (owner: string, repo: string, path: string = ''): Promise<GitHubFile[]> => {
        try {
            const response = await fetch(
                `/api/github?action=contents&owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}`
            );
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch contents');
            }

            if (data.contents) {
                const contents = Array.isArray(data.contents) ? data.contents : [data.contents];
                return contents.map((item: any) => ({
                    name: item.name,
                    path: item.path,
                    type: item.type === 'dir' ? 'dir' : 'file',
                    size: item.size,
                    loaded: false,
                    children: item.type === 'dir' ? [] : undefined,
                }));
            }
            return [];
        } catch (error) {
            console.error('Error fetching contents:', error);
            throw error;
        }
    };

    // Handle repository selection
    const handleRepoSelect = async (repo: GitHubRepo) => {
        setSelectedRepo(repo);
        setFileTree([]);
        setExpandedFolders(new Set());
        setSelectedFiles(new Set());
        setFileContents(new Map());
        setError('');
        setLoading(true);

        try {
            const contents = await fetchContents(repo.owner.login, repo.name);
            setFileTree(contents);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to load repository contents');
        } finally {
            setLoading(false);
        }
    };

    // Toggle folder expansion with better tree management
    const toggleFolder = async (folderPath: string) => {
        const newExpanded = new Set(expandedFolders);

        if (expandedFolders.has(folderPath)) {
            newExpanded.delete(folderPath);
            setExpandedFolders(newExpanded);
        } else {
            newExpanded.add(folderPath);
            setExpandedFolders(newExpanded);

            // Load folder contents if not already loaded
            const folder = findFileInTree(fileTree, folderPath);
            if (selectedRepo && folder && folder.type === 'dir' && !folder.loaded) {
                try {
                    setLoadingFiles(prev => new Set(prev).add(folderPath));
                    const contents = await fetchContents(
                        selectedRepo.owner.login,
                        selectedRepo.name,
                        folderPath
                    );

                    // Update the tree with loaded contents
                    setFileTree(prev => updateTreeWithContents(prev, folderPath, contents));
                } catch (error) {
                    console.error('Error loading folder contents:', error);
                    setError(`Failed to load folder: ${folderPath}`);
                } finally {
                    setLoadingFiles(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(folderPath);
                        return newSet;
                    });
                }
            }
        }
    };

    // Helper function to find a file in the tree
    const findFileInTree = (tree: GitHubFile[], path: string): GitHubFile | null => {
        for (const item of tree) {
            if (item.path === path) {
                return item;
            }
            if (item.children) {
                const found = findFileInTree(item.children, path);
                if (found) return found;
            }
        }
        return null;
    };

    // Helper function to update tree with contents
    const updateTreeWithContents = (tree: GitHubFile[], folderPath: string, contents: GitHubFile[]): GitHubFile[] => {
        return tree.map(item => {
            if (item.path === folderPath) {
                return {
                    ...item,
                    children: contents,
                    loaded: true
                };
            }
            if (item.children) {
                return {
                    ...item,
                    children: updateTreeWithContents(item.children, folderPath, contents)
                };
            }
            return item;
        });
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
    const fetchFileContent = async (filePath: string): Promise<string> => {
        if (!selectedRepo) throw new Error('No repository selected');

        if (fileContents.has(filePath)) {
            return fileContents.get(filePath)!;
        }

        try {
            const response = await fetch(
                `/api/github?action=file&owner=${encodeURIComponent(selectedRepo.owner.login)}&repo=${encodeURIComponent(selectedRepo.name)}&path=${encodeURIComponent(filePath)}`
            );
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch file content');
            }

            if (data.content) {
                const newContents = new Map(fileContents);
                newContents.set(filePath, data.content);
                setFileContents(newContents);
                return data.content;
            }

            throw new Error('No content received');
        } catch (error) {
            console.error('Error fetching file content:', error);
            throw error;
        }
    };

    // Handle adding selected files to chat
    const handleAddToChat = async () => {
        if (selectedFiles.size === 0) return;

        setLoading(true);
        const filesToAdd = [];
        const errors = [];

        for (const filePath of selectedFiles) {
            try {
                const content = await fetchFileContent(filePath);
                filesToAdd.push({
                    path: filePath,
                    content,
                    name: filePath.split('/').pop() || filePath,
                });
            } catch (error) {
                errors.push(`Failed to load ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        if (errors.length > 0) {
            setError(errors.join('\n'));
        }

        if (filesToAdd.length > 0) {
            onFilesSelected(filesToAdd);
        }

        setLoading(false);
    };

    // Render file tree recursively
    const renderFileTree = (items: GitHubFile[], depth: number = 0): React.ReactNode => {
        return items.map((item, index) => {
            const isExpanded = expandedFolders.has(item.path);
            const isSelected = selectedFiles.has(item.path);
            const indent = depth * 20;
            const isSupported = item.type === 'file' && isFileSupported(item.name);
            const isLoadingThis = loadingFiles.has(item.path);

            if (item.type === 'dir') {
                return (
                    <div key={`${item.path}-${index}`}>
                        <div
                            className="flex items-center p-2 hover:bg-gray-100 cursor-pointer rounded"
                            style={{ paddingLeft: `${16 + indent}px` }}
                            onClick={() => toggleFolder(item.path)}
                        >
                            {isLoadingThis ? (
                                <Loader2Icon className="w-4 h-4 mr-1 animate-spin" />
                            ) : isExpanded ? (
                                <ChevronDownIcon className="w-4 h-4 mr-1" />
                            ) : (
                                <ChevronRightIcon className="w-4 h-4 mr-1" />
                            )}
                            <FolderIcon className="w-4 h-4 mr-2 text-blue-500" />
                            <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        {isExpanded && item.children && (
                            <div className="ml-4">
                                {renderFileTree(item.children, depth + 1)}
                            </div>
                        )}
                    </div>
                );
            } else {
                return (
                    <div
                        key={`${item.path}-${index}`}
                        className={`flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded transition-colors ${isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                            } ${!isSupported ? 'opacity-50' : ''}`}
                        style={{ paddingLeft: `${36 + indent}px` }}
                        onClick={() => isSupported && toggleFileSelection(item.path)}
                        title={isSupported ? 'Click to select' : 'File type not supported'}
                    >
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => { }}
                            className="mr-2"
                            disabled={!isSupported}
                        />
                        <FileTextIcon className={`w-4 h-4 mr-2 ${isSupported ? 'text-green-500' : 'text-gray-400'
                            }`} />
                        <span className={`text-sm flex-1 ${isSupported ? '' : 'text-gray-500'}`}>
                            {item.name}
                        </span>
                        {isSelected && <CheckCircleIcon className="w-4 h-4 text-blue-500" />}
                        {item.size && (
                            <span className="ml-2 text-xs text-gray-400">
                                {(item.size / 1024).toFixed(1)}KB
                            </span>
                        )}
                    </div>
                );
            }
        });
    };

    return (
        <div className="border rounded-lg p-4 mb-4 bg-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">GitHub Integration</h3>
                <button
                    onClick={fetchRepos}
                    disabled={reposLoading}
                    className="flex items-center px-3 py-1 text-sm bg-gray-600 hover:bg-gray-600 rounded disabled:opacity-50"
                >
                    <RefreshCwIcon className={`w-4 h-4 mr-1 ${reposLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-start">
                    <AlertCircleIcon className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-700 whitespace-pre-wrap">{error}</div>
                </div>
            )}

            {/* Repository Selection */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select Repository:</label>
                {reposLoading ? (
                    <div className="flex items-center p-2 text-gray-500">
                        <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                        Loading repositories...
                    </div>
                ) : (
                    <select
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={selectedRepo?.id || ''}
                        onChange={(e) => {
                            const repo = repos.find(r => r.id.toString() === e.target.value);
                            if (repo) handleRepoSelect(repo);
                        }}
                    >
                        <option value="">Choose a repository...</option>
                        {repos.map(repo => (
                            <option key={repo.id} value={repo.id}>
                                {repo.full_name} {repo.private ? '(Private)' : ''}
                            </option>
                        ))}
                    </select>
                )}
                {repos.length === 0 && !reposLoading && !error && (
                    <p className="text-sm text-gray-500 mt-1">No repositories found. Make sure your GitHub token has the correct permissions.</p>
                )}
            </div>

            {/* File Tree */}
            {selectedRepo && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium">
                            Select Files ({selectedFiles.size} selected):
                        </label>
                        {selectedFiles.size > 0 && (
                            <button
                                onClick={() => setSelectedFiles(new Set())}
                                className="text-xs text-gray-500 hover:text-gray-700"
                            >
                                Clear selection
                            </button>
                        )}
                    </div>
                    <div className="border rounded max-h-96 overflow-y-auto bg-gray-500">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500 flex items-center justify-center">
                                <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                                Loading repository contents...
                            </div>
                        ) : fileTree.length > 0 ? (
                            <div className="p-2">
                                {renderFileTree(fileTree)}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-gray-500">
                                Repository is empty or failed to load
                            </div>
                        )}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                        Supported files: {SUPPORTED_EXTENSIONS.join(', ')}
                    </div>
                </div>
            )}

            {/* Add to Chat Button */}
            {selectedFiles.size > 0 && (
                <button
                    onClick={handleAddToChat}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 flex items-center justify-center"
                >
                    {loading ? (
                        <>
                            <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                            Loading files...
                        </>
                    ) : (
                        <>
                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                            Add {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} to Chat Context
                        </>
                    )}
                </button>
            )}
        </div>
    );
}