// components/RepoBrowser.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { RepoFile, GitHubRepo } from '@/lib/types';

interface RepoBrowserProps {
    onFilesSelected: (files: RepoFile[]) => void;
    selectedFiles: RepoFile[];
}

const SUPPORTED_FILE_EXTENSIONS = [
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp',
    '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.r',
    '.sql', '.html', '.css', '.scss', '.sass', '.less', '.vue', '.svelte',
    '.json', '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf',
    '.md', '.mdx', '.txt', '.sh', '.bash', '.zsh', '.fish', '.ps1',
    '.dockerfile', '.makefile', '.cmake', '.gradle', '.pom'
];

const MAX_FILE_SIZE = 100 * 1024; // 100KB limit for file content

export default function RepoBrowser({ onFilesSelected, selectedFiles }: RepoBrowserProps) {
    const [repoUrl, setRepoUrl] = useState('');
    const [username, setUsername] = useState('');
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [repoStructure, setRepoStructure] = useState<RepoFile[]>([]);
    const [currentPath, setCurrentPath] = useState('');
    const [currentRepo, setCurrentRepo] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'url' | 'browse'>('url');
    const [pathHistory, setPathHistory] = useState<string[]>([]);

    const fetchUserRepos = async () => {
        if (!username.trim()) return;

        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/github/repos?username=${encodeURIComponent(username.trim())}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch repositories');
            }

            setRepos(data);
            if (data.length === 0) {
                setError('No public repositories found for this user');
            }
        } catch (error) {
            console.error('Error fetching repos:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch repositories');
            setRepos([]);
        }
        setIsLoading(false);
    };

    const fetchRepoContents = async (url: string, path: string = '') => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/github/repos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repoUrl: url, path }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch repository contents');
            }

            const files: RepoFile[] = Array.isArray(data)
                ? data.map((item: any) => ({
                    name: item.name,
                    path: item.path,
                    type: item.type === 'dir' ? 'dir' : 'file',
                    size: item.size,
                })).sort((a, b) => {
                    // Sort directories first, then files
                    if (a.type !== b.type) {
                        return a.type === 'dir' ? -1 : 1;
                    }
                    return a.name.localeCompare(b.name);
                })
                : [];

            setRepoStructure(files);
            setCurrentPath(path);
            setCurrentRepo(url);

            // Update path history
            if (path) {
                setPathHistory(prev => {
                    const newHistory = [...prev];
                    if (newHistory[newHistory.length - 1] !== path) {
                        newHistory.push(path);
                    }
                    return newHistory;
                });
            } else {
                setPathHistory([]);
            }
        } catch (error) {
            console.error('Error fetching repo contents:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch repository contents');
            setRepoStructure([]);
        }
        setIsLoading(false);
    };

    const loadFileContent = async (file: RepoFile) => {
        if (file.type === 'dir') {
            fetchRepoContents(currentRepo, file.path);
            return;
        }

        // Check if file is already selected
        if (selectedFiles.some(f => f.path === file.path)) {
            setError('File is already selected');
            return;
        }

        // Check file size
        if (file.size && file.size > MAX_FILE_SIZE) {
            setError(`File is too large (${Math.round(file.size / 1024)}KB). Maximum size is ${Math.round(MAX_FILE_SIZE / 1024)}KB.`);
            return;
        }

        // Check if file extension is supported
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        const isSupported = SUPPORTED_FILE_EXTENSIONS.includes(extension) ||
            file.name.toLowerCase().includes('readme') ||
            file.name.toLowerCase().includes('license') ||
            !file.name.includes('.');

        if (!isSupported) {
            setError(`Unsupported file type: ${extension}`);
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const match = currentRepo.match(/github\.com\/([^\/]+)\/([^\/]+)/);
            if (!match) {
                throw new Error('Invalid repository URL');
            }

            const [, owner, repo] = match;
            const cleanRepo = repo.replace('.git', '');

            const headers: Record<string, string> = {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Claude-Chat-App',
            };

            const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/contents/${file.path}`, {
                headers
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('File not found');
                }
                if (response.status === 403) {
                    throw new Error('Access denied or rate limit exceeded');
                }
                throw new Error(`Failed to load file: ${response.status}`);
            }

            const fileData = await response.json();

            if (fileData.content) {
                try {
                    const content = atob(fileData.content);
                    const fileWithContent: RepoFile = {
                        ...file,
                        content,
                    };
                    onFilesSelected([...selectedFiles, fileWithContent]);
                } catch (decodeError) {
                    throw new Error('Unable to decode file content. File may be binary.');
                }
            } else {
                throw new Error('File content not available');
            }
        } catch (error) {
            console.error('Error loading file content:', error);
            setError(error instanceof Error ? error.message : 'Failed to load file content');
        }
        setIsLoading(false);
    };

    const removeFile = (filePath: string) => {
        onFilesSelected(selectedFiles.filter(f => f.path !== filePath));
    };

    const navigateUp = () => {
        const pathParts = currentPath.split('/').filter(Boolean);
        if (pathParts.length > 0) {
            pathParts.pop();
            const parentPath = pathParts.join('/');
            fetchRepoContents(currentRepo, parentPath);
        }
    };

    const navigateToPath = (targetPath: string) => {
        fetchRepoContents(currentRepo, targetPath);
    };

    const handleRepoSubmit = () => {
        const trimmedUrl = repoUrl.trim();
        if (trimmedUrl) {
            setError('');
            fetchRepoContents(trimmedUrl);
        }
    };

    const selectRepo = (repo: GitHubRepo) => {
        setRepoUrl(repo.html_url);
        setError('');
        fetchRepoContents(repo.html_url);
        setActiveTab('url');
    };

    const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
        if (e.key === 'Enter') {
            action();
        }
    };

    const clearError = () => setError('');

    return (
        <div className="bg-gray-800 border rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-4">Repository Access</h3>

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex justify-between items-start">
                        <p className="text-red-700 text-sm">{error}</p>
                        <button
                            onClick={clearError}
                            className="text-red-500 hover:text-red-700 ml-2"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Tab Selection */}
            <div className="flex mb-4 border-b">
                <button
                    onClick={() => setActiveTab('url')}
                    className={`px-4 py-2 transition-colors ${activeTab === 'url'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-600 hover:text-gray-800'
                        }`}
                >
                    Direct URL
                </button>
                <button
                    onClick={() => setActiveTab('browse')}
                    className={`px-4 py-2 transition-colors ${activeTab === 'browse'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-600 hover:text-gray-800'
                        }`}
                >
                    Browse User Repos
                </button>
            </div>

            {activeTab === 'url' && (
                <div className="mb-4">
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            onKeyPress={(e) => handleKeyPress(e, handleRepoSubmit)}
                            placeholder="Enter GitHub repository URL... (e.g., https://github.com/user/repo)"
                            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleRepoSubmit}
                            disabled={isLoading || !repoUrl.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                        >
                            {isLoading ? 'Loading...' : 'Load Repo'}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Supports public repositories. Private repos require a GitHub token.
                    </p>
                </div>
            )}

            {activeTab === 'browse' && (
                <div className="mb-4">
                    <div className="flex space-x-2 mb-4">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyPress={(e) => handleKeyPress(e, fetchUserRepos)}
                            placeholder="Enter GitHub username..."
                            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={fetchUserRepos}
                            disabled={isLoading || !username.trim()}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                        >
                            {isLoading ? 'Loading...' : 'Fetch Repos'}
                        </button>
                    </div>

                    {repos.length > 0 && (
                        <div className="max-h-40 overflow-y-auto border rounded">
                            {repos.map((repo) => (
                                <div
                                    key={repo.full_name}
                                    onClick={() => selectRepo(repo)}
                                    className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 transition-colors"
                                >
                                    <div className="font-medium">{repo.name}</div>
                                    {repo.description && (
                                        <div className="text-sm text-gray-600 mt-1">{repo.description}</div>
                                    )}
                                    <div className="text-xs text-gray-500 mt-1">
                                        {repo.private ? '🔒 Private' : '🌐 Public'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Path Navigation */}
            {currentPath && (
                <div className="mb-3 p-2 bg-gray-50 rounded">
                    <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium">Path: </span>
                        <button
                            onClick={() => navigateToPath('')}
                            className="text-blue-600 hover:underline mx-1"
                        >
                            root
                        </button>
                        {currentPath.split('/').map((part, index, arr) => {
                            const fullPath = arr.slice(0, index + 1).join('/');
                            return (
                                <React.Fragment key={index}>
                                    <span className="mx-1">/</span>
                                    <button
                                        onClick={() => navigateToPath(fullPath)}
                                        className="text-blue-600 hover:underline"
                                    >
                                        {part}
                                    </button>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Repository Browser */}
            {repoStructure.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Repository Files</h4>
                        {currentPath && (
                            <button
                                onClick={navigateUp}
                                className="text-sm text-blue-600 hover:underline flex items-center"
                            >
                                ← Back
                            </button>
                        )}
                    </div>

                    <div className="max-h-60 overflow-y-auto border rounded">
                        {repoStructure.map((file) => {
                            const isSelected = selectedFiles.some(f => f.path === file.path);
                            const isSupported = file.type === 'dir' ||
                                SUPPORTED_FILE_EXTENSIONS.includes('.' + file.name.split('.').pop()?.toLowerCase()) ||
                                file.name.toLowerCase().includes('readme') ||
                                file.name.toLowerCase().includes('license') ||
                                !file.name.includes('.');

                            return (
                                <div
                                    key={file.path}
                                    onClick={() => loadFileContent(file)}
                                    className={`p-2 border-b last:border-b-0 flex items-center transition-colors ${isSelected
                                        ? 'bg-blue-50 cursor-default'
                                        : isSupported
                                            ? 'hover:bg-gray-100 cursor-pointer'
                                            : 'opacity-50 cursor-not-allowed'
                                        }`}
                                >
                                    <span className="mr-2">
                                        {file.type === 'dir' ? '📁' : '📄'}
                                    </span>
                                    <span className="flex-1">{file.name}</span>
                                    {isSelected && (
                                        <span className="text-xs text-blue-600 mr-2">Selected</span>
                                    )}
                                    {file.size && (
                                        <span className="text-xs text-gray-500">
                                            {file.size > 1024 ? `${Math.round(file.size / 1024)}KB` : `${file.size}B`}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
                <div>
                    <h4 className="font-medium mb-2">Selected Files ({selectedFiles.length})</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {selectedFiles.map((file) => (
                            <div
                                key={file.path}
                                className="flex items-center justify-between bg-blue-50 p-2 rounded"
                            >
                                <span className="text-sm truncate flex-1 mr-2">{file.path}</span>
                                <button
                                    onClick={() => removeFile(file.path)}
                                    className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isLoading && (
                <div className="text-center text-gray-500 py-4">
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading...</span>
                </div>
            )}
        </div>
    );
}