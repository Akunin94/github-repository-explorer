export interface GitHubOwner {
  login: string
  avatar_url: string
  html_url: string
}

export interface GitHubLicense {
  key: string
  name: string
  spdx_id: string | null
}

/** A repository, as returned by /search/repositories items and /repos/{o}/{r}. */
export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  owner: GitHubOwner
  html_url: string
  description: string | null
  fork: boolean
  language: string | null
  stargazers_count: number
  /**
   * Legacy GitHub quirk: `watchers_count` is an alias of `stargazers_count`, not
   * the real watcher count. The actual number of watchers is `subscribers_count`,
   * which the /repos/{owner}/{repo} endpoint returns but the search endpoint omits.
   */
  watchers_count: number
  subscribers_count?: number
  forks_count: number
  open_issues_count: number
  topics?: string[]
  license: GitHubLicense | null
  homepage: string | null
  default_branch: string
  archived: boolean
  updated_at: string
  pushed_at: string
  created_at: string
}

export interface SearchReposResponse {
  total_count: number
  incomplete_results: boolean
  items: GitHubRepo[]
}

export type SortOption = 'best-match' | 'stars' | 'forks' | 'updated'
