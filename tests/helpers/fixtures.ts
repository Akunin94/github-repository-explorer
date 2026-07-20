import type { GitHubRepo } from '@/types/github'

/** A fully-populated repo; override fields per test (including to null). */
export function makeRepo(overrides: Partial<GitHubRepo> = {}): GitHubRepo {
  return {
    id: 1,
    name: 'vue',
    full_name: 'vuejs/vue',
    owner: {
      login: 'vuejs',
      avatar_url: 'https://avatars.example/vuejs.png',
      html_url: 'https://github.com/vuejs',
    },
    html_url: 'https://github.com/vuejs/vue',
    description: 'The progressive JavaScript framework.',
    fork: false,
    language: 'TypeScript',
    stargazers_count: 1234,
    watchers_count: 1234,
    forks_count: 567,
    open_issues_count: 89,
    topics: ['vue', 'framework', 'frontend'],
    license: { key: 'mit', name: 'MIT License', spdx_id: 'MIT' },
    homepage: 'https://vuejs.org',
    default_branch: 'main',
    archived: false,
    updated_at: '2026-07-01T00:00:00Z',
    pushed_at: '2026-07-10T00:00:00Z',
    created_at: '2015-01-01T00:00:00Z',
    ...overrides,
  }
}
