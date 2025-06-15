// app/api/github/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GITHUB_API_BASE = 'https://api.github.com';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const owner = searchParams.get('owner');
        const repo = searchParams.get('repo');
        const path = searchParams.get('path');

        // You'll need to set this environment variable
        const githubToken = process.env.GITHUB_TOKEN;

        if (!githubToken) {
            return NextResponse.json(
                { error: 'GitHub token not configured' },
                { status: 500 }
            );
        }

        const headers = {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitHub-Chat-App'
        };

        let url = '';

        switch (action) {
            case 'repos':
                // Fetch user's repositories
                url = `${GITHUB_API_BASE}/user/repos?sort=updated&per_page=100`;
                break;

            case 'contents':
                // Fetch repository contents
                if (!owner || !repo) {
                    return NextResponse.json(
                        { error: 'Owner and repo are required for contents' },
                        { status: 400 }
                    );
                }
                const contentsPath = path ? `/${path}` : '';
                url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents${contentsPath}`;
                break;

            case 'file':
                // Fetch specific file content
                if (!owner || !repo || !path) {
                    return NextResponse.json(
                        { error: 'Owner, repo, and path are required for file content' },
                        { status: 400 }
                    );
                }
                url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;
                break;

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`GitHub API error: ${response.status} - ${errorText}`);
            return NextResponse.json(
                { error: `GitHub API error: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();

        switch (action) {
            case 'repos':
                return NextResponse.json({ repos: data });

            case 'contents':
                return NextResponse.json({ contents: data });

            case 'file':
                // Decode base64 content for files
                if (data.content && data.encoding === 'base64') {
                    const decodedContent = Buffer.from(data.content, 'base64').toString('utf-8');
                    return NextResponse.json({
                        content: decodedContent,
                        path: data.path,
                        name: data.name
                    });
                }
                return NextResponse.json({
                    content: data.content || '',
                    path: data.path,
                    name: data.name
                });

            default:
                return NextResponse.json(data);
        }

    } catch (error) {
        console.error('GitHub API route error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}