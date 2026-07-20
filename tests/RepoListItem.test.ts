import { describe, it, expect } from 'vitest'
import RepoListItem from '@/components/RepoListItem.vue'
import { mountWithApp } from './helpers/mount'
import { makeRepo } from './helpers/fixtures'

describe('RepoListItem', () => {
  it('renders the full name, compact stars and forks', () => {
    const wrapper = mountWithApp(RepoListItem, {
      props: { repo: makeRepo({ stargazers_count: 1234, forks_count: 567 }) },
    })
    const text = wrapper.text()
    expect(text).toContain('vuejs/vue')
    expect(text).toContain('1.2K') // stars
    expect(text).toContain('567') // forks
  })

  it('links to the detail route', () => {
    const wrapper = mountWithApp(RepoListItem, { props: { repo: makeRepo() } })
    const link = wrapper.find('a')
    expect(link.attributes('href')).toContain('/repo/vuejs/vue')
  })

  it('omits the description when null', () => {
    const wrapper = mountWithApp(RepoListItem, {
      props: { repo: makeRepo({ description: null }) },
    })
    expect(wrapper.find('.repo-description').exists()).toBe(false)
  })

  it('omits the language row when language is null', () => {
    const withLang = mountWithApp(RepoListItem, {
      props: { repo: makeRepo({ language: 'Go' }) },
    })
    expect(withLang.text()).toContain('Go')

    const noLang = mountWithApp(RepoListItem, {
      props: { repo: makeRepo({ language: null }) },
    })
    expect(noLang.text()).not.toContain('Go')
  })

  it('renders topic chips only when topics are present', () => {
    // 'frontend' is a fixture topic that does not appear in the description.
    const withTopics = mountWithApp(RepoListItem, {
      props: { repo: makeRepo({ description: null }) },
    })
    expect(withTopics.text()).toContain('frontend')

    const noTopics = mountWithApp(RepoListItem, {
      props: { repo: makeRepo({ description: null, topics: undefined }) },
    })
    expect(noTopics.text()).not.toContain('frontend')
  })

  it('shows an Archived chip only for archived repos', () => {
    const active = mountWithApp(RepoListItem, { props: { repo: makeRepo() } })
    expect(active.text()).not.toContain('Archived')

    const archived = mountWithApp(RepoListItem, {
      props: { repo: makeRepo({ archived: true }) },
    })
    expect(archived.text()).toContain('Archived')
  })
})
