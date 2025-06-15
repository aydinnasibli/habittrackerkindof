// app/api/github/repos/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
        return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=20`, {
            headers: {
                'Authorization': process.env.GITHUB_TOKEN ? `token ${process.env.GITHUB_TOKEN}` : '',
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch repositories');
        }

        const repos = await response.json();
        return NextResponse.json(repos);
    } catch (error) {
        console.error('Error fetching repos:', error);
        return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 });
    }
}

// app/api/github/files/route.ts
export async function POST(request: NextRequest) {
    try {
        const { repoUrl, path = '' } = await request.json();

        if (!repoUrl) {
            return NextResponse.json({ error: 'Repository URL is required' }, { status: 400 });
        }

        // Extract owner and repo from URL
        const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) {
            return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
        }

        const [, owner, repo] = match;
        const cleanRepo = repo.replace('.git', '');

        const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/contents/${path}`, {
            headers: {
                'Authorization': process.env.GITHUB_TOKEN ? `token ${process.env.GITHUB_TOKEN}` : '',
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch repository contents');
        }

        const contents = await response.json();
        return NextResponse.json(contents);
    } catch (error) {
        console.error('Error fetching repo contents:', error);
        return NextResponse.json({ error: 'Failed to fetch repository contents' }, { status: 500 });
    }
}