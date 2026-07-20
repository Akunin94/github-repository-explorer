import { request, type ApiResult } from './client'
import type { GitHubRepo, SearchReposResponse, SortOption } from '@/types/github'

/** GitHub's Search API caps results at 1000 (page * per_page must stay <= 1000). */
export const MAX_SEARCH_RESULTS = 1000
export const PER_PAGE = 20

interface SearchParams {
  query: string
  sort?: SortOption
  page?: number
  token?: string | null
  signal?: AbortSignal
}

/** 'best-match' is GitHub's default and is expressed by omitting `sort`. */
function sortParam(sort: SortOption | undefined): string | undefined {
  if (!sort || sort === 'best-match') return undefined
  return sort
}

export function searchRepositories({
  query,
  sort,
  page = 1,
  token,
  signal,
}: SearchParams): Promise<ApiResult<SearchReposResponse>> {
  const sortValue = sortParam(sort)
  return request<SearchReposResponse>('/search/repositories', {
    params: {
      q: query,
      sort: sortValue,
      order: sortValue ? 'desc' : undefined,
      per_page: PER_PAGE,
      page,
    },
    token,
    signal,
  })
}

interface RepoParams {
  owner: string
  repo: string
  token?: string | null
  signal?: AbortSignal
}

export function getRepository({
  owner,
  repo,
  token,
  signal,
}: RepoParams): Promise<ApiResult<GitHubRepo>> {
  return request<GitHubRepo>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    { token, signal },
  )
}
