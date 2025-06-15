// components/RepoBrowser.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { RepoFile, GitHubRepo } from '@/lib/types';

interface RepoBrowserProps {
    onFilesSelected: (files: RepoFile[]) => void;
    selectedFiles: RepoFile[];
}

export default function RepoBrowser({ onFilesSelected, selectedFiles }: RepoBrowserProps) {
    const [repoUrl, setRepoUrl] = useState('');
    const [username, setUsername] = useState('');
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [repoStructure, setRepoStructure] = useState<RepoFile[]>([]);
    const [currentPath, setCurrentPath] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'url' | 'browse'>('url');

    const fetchUserRepos = async () => {
        if (!username.trim()) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/github/repos?username=${username}`);
            if (response.ok) {
                const repoData = await response.json();
                setRepos(repoData);
            }
        } catch (error) {
            console.error('Error fetching repos:', error);
        }
        setIsLoading(false);
    };

    const fetchRepoContents = async (url: string, path: string = '') => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/github/files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repoUrl: url, path }),
            });

            if (response.ok) {
                const contents = await response.json();
                const files: RepoFile[] = Array.isArray(contents)
                    ? contents.map((item: any) => ({
                        name: item.name,
                        path: item.path,
                        type: item.type === 'dir' ? 'dir' : 'file',
                        size: item.size,
                    }))
                    : [];

                setRepoStructure(files);
                setCurrentPath(path);
            }
        } catch (error) {
            console.error('Error fetching repo contents:', error);
        }
        setIsLoading(false);
    };

    const loadFileContent = async (file: RepoFile) => {
        if (file.type === 'dir') {
            fetchRepoContents(repoUrl, file.path);
            return;
        }

        // Check if file is already selected
        if (selectedFiles.some(f => f.path === file.path)) {
            return;
        }

        setIsLoading(true);
        try {
            const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
            if (!match) return;

            const [, owner, repo] = match;
            const cleanRepo = repo.replace('.git', '');

            const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/contents/${file.path}`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                },
            });

            if (response.ok) {
                const fileData = await response.json();
                if (fileData.content) {
                    const content = atob(fileData.content);
                    const fileWithContent: RepoFile = {
                        ...file,
                        content,
                    };
                    onFilesSelected([...selectedFiles, fileWithContent]);
                }
            }
        } catch (error) {
            console.error('Error loading file content:', error);
        }
        setIsLoading(false);
    };

    const removeFile = (filePath: string) => {
        onFilesSelected(selectedFiles.filter(f => f.path !== filePath));
    };

    const navigateUp = () => {
        const parentPath = currentPath.split('/').slice(0, -1).join('/');
        fetchRepoContents(repoUrl, parentPath);
    };

    const handleRepoSubmit = () => {
        if (repoUrl.trim()) {
            fetchRepoContents(repoUrl.trim());
        }
    };

    const selectRepo = (repo: GitHubRepo) => {
        setRepoUrl(repo.html_url);
        fetchRepoContents(repo.html_url);
        setActiveTab('url');
    };

    return (
        <div className="bg-white border rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-4">Repository Access</h3>

            {/* Tab Selection */}
            <div className="flex mb-4 border-b">
                <button
                    onClick={() => setActiveTab('url')}
                    className={`px-4 py-2 ${activeTab === 'url' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
                >
                    Direct URL
                </button>
                <button
                    onClick={() => setActiveTab('browse')}
                    className={`px-4 py-2 ${activeTab === 'browse' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
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
                            placeholder="Enter GitHub repository URL..."
                            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleRepoSubmit}
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            Load Repo
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'browse' && (
                <div className="mb-4">
                    <div className="flex space-x-2 mb-4">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter GitHub username..."
                            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={fetchUserRepos}
                            disabled={isLoading}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                        >
                            Fetch Repos
                        </button>
                    </div>

                    {repos.length > 0 && (
                        <div className="max-h-40 overflow-y-auto border rounded">
                            {repos.map((repo) => (
                                <div
                                    key={repo.full_name}
                                    onClick={() => selectRepo(repo)}
                                    className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                                >
                                    <div className="font-medium">{repo.name}</div>
                                    {repo.description && (
                                        <div className="text-sm text-gray-600">{repo.description}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
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
                                className="text-sm text-blue-600 hover:underline"
                            >
                                ← Back
                            </button>
                        )}
                    </div>

                    <div className="max-h-60 overflow-y-auto border rounded">
                        {repoStructure.map((file) => (
                            <div
                                key={file.path}
                                onClick={() => loadFileContent(file)}
                                className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 flex items-center"
                            >
                                <span className="mr-2">
                                    {file.type === 'dir' ? '📁' : '📄'}
                                </span>
                                <span className="flex-1">{file.name}</span>
                                {file.size && (
                                    <span className="text-xs text-gray-500">
                                        {Math.round(file.size / 1024)}KB
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
                <div>
                    <h4 className="font-medium mb-2">Selected Files ({selectedFiles.length})</h4>
                    <div className="space-y-1">
                        {selectedFiles.map((file) => (
                            <div
                                key={file.path}
                                className="flex items-center justify-between bg-blue-50 p-2 rounded"
                            >
                                <span className="text-sm">{file.path}</span>
                                <button
                                    onClick={() => removeFile(file.path)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isLoading && (
                <div className="text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading...</span>
                </div>
            )}
        </div>
    );
}