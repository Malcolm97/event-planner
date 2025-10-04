// Utility for fetching GitHub repository information

const GITHUB_API_BASE = 'https://api.github.com';
const REPO_OWNER = 'Malcolm97';
const REPO_NAME = 'event-planner';
const CACHE_KEY = 'github-last-commit';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      date: string;
    };
  };
}

export async function getLastCommitDate(): Promise<string | null> {
  try {
    // Check cache first
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { date, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return date;
      }
    }

    // Fetch from GitHub API
    const response = await fetch(`${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/commits/main`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const commit: GitHubCommit = await response.json();
    const date = new Date(commit.commit.author.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    // Cache the result
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      date,
      timestamp: Date.now(),
    }));

    return date;
  } catch (error) {
    console.warn('Failed to fetch last commit date:', error);
    // Return cached value if available, even if expired
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { date } = JSON.parse(cached);
      return date;
    }
    return null;
  }
}
