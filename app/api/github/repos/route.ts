// app/api/github/repos/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
        return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    try {
        const headers: Record<string, string> = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Claude-Chat-App',
        };

        // Only add authorization if token exists
        if (process.env.GITHUB_TOKEN) {
            headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
        }

        const response = await fetch(
            `https://api.github.com/users/${username}/repos?sort=updated&per_page=30&type=public`,
            { headers }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            if (response.status === 404) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
            if (response.status === 403) {
                return NextResponse.json({
                    error: 'API rate limit exceeded. Please add a GitHub token or try again later.'
                }, { status: 403 });
            }

            throw new Error(`GitHub API error: ${response.status} ${errorData.message || ''}`);
        }

        const repos = await response.json();
        return NextResponse.json(repos);
    } catch (error) {
        console.error('Error fetching repos:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to fetch repositories'
        }, { status: 500 });
    }
}

// Separate route for fetching repository contents
export async function POST(request: NextRequest) {
    try {
        const { repoUrl, path = '' } = await request.json();

        if (!repoUrl) {
            return NextResponse.json({ error: 'Repository URL is required' }, { status: 400 });
        }

        // Extract owner and repo from URL - handle various formats
        const urlPatterns = [
            /github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?(?:\/.*)?$/,
            /^([^\/]+)\/([^\/]+)$/  // Direct owner/repo format
        ];

        let owner: string, repo: string;
        let matched = false;

        for (const pattern of urlPatterns) {
            const match = repoUrl.match(pattern);
            if (match) {
                [, owner, repo] = match;
                repo = repo.replace('.git', '');
                matched = true;
                break;
            }
        }

        if (!matched) {
            return NextResponse.json({ error: 'Invalid GitHub repository URL or format' }, { status: 400 });
        }

        const headers: Record<string, string> = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Claude-Chat-App',
        };

        if (process.env.GITHUB_TOKEN) {
            headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
        }

        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        const response = await fetch(apiUrl, { headers });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            if (response.status === 404) {
                return NextResponse.json({
                    error: path ? 'Path not found in repository' : 'Repository not found or is private'
                }, { status: 404 });
            }
            if (response.status === 403) {
                return NextResponse.json({
                    error: 'Access denied. Repository may be private or rate limit exceeded.'
                }, { status: 403 });
            }

            throw new Error(`GitHub API error: ${response.status} ${errorData.message || ''}`);
        }

        const contents = await response.json();
        return NextResponse.json(contents);
    } catch (error) {
        console.error('Error fetching repo contents:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to fetch repository contents'
        }, { status: 500 });
    }
}