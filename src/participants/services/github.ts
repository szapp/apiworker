import { UserInfo } from '../user-class'

async function getUsersFetch(url: string, env: Env): Promise<UserInfo> {
  const nextPattern: RegExp = new RegExp(/(?<=<)([\S]*)(?=>; rel="Next")/i)
  let pagesRemaining: boolean = true
  const users: UserInfo = new UserInfo()

  do {
    pagesRemaining = await fetch(new URL(url), {
      headers: {
        'User-Agent': 'read-engagers',
        Authorization: `token ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
    })
      .then(async (response) => {
        if (!response.ok) Promise.reject()
        const issuesData: { user: { login: string; html_url: string; avatar_url: string } }[] = await (
          response as unknown as Response
        ).json()
        for (const issue of issuesData) {
          users.add({
            name: issue.user.login,
            link: issue.user.html_url,
            image: issue.user.avatar_url,
            contributions: 1,
          })
        }
        const link: string | null = response.headers.get('link')
        if (link) {
          const next: string | undefined = nextPattern.exec(link)?.[0]
          if (next) {
            url = next
            return true
          }
        }
        return false
      })
      .catch(() => {
        console.warn('Could not reach api.github.com')
        return false
      })
  } while (pagesRemaining)

  return users
}

async function getUsersFromIssues(repo: string, env: Env): Promise<UserInfo> {
  const url: string = `https://api.github.com/repos/${repo}/issues?&state=all&per_page=100`
  return await getUsersFetch(url, env)
}

async function getUsersFromComments(repo: string, env: Env): Promise<UserInfo> {
  const url: string = `https://api.github.com/repos/${repo}/issues/comments?per_page=100`
  return await getUsersFetch(url, env)
}

async function getContributors(repo: string, env: Env): Promise<string[]> {
  const contributors: string[] = await fetch(new URL(`https://api.github.com/repos/${repo}/contributors`), {
    headers: {
      'User-Agent': 'read-engagers',
      Authorization: `token ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
  })
    .then(async (response) => {
      if (!response.ok) Promise.reject()
      const contributorList: { login: string }[] = await (response as unknown as Response).json()
      return contributorList.map((contributor) => contributor.login)
    })
    .catch(() => {
      console.warn('Could not reach api.github.com')
      return []
    })
  return contributors
}

export async function getGithub(repo: string, options: { env: Env }): Promise<UserInfo> {
  const users: UserInfo = new UserInfo()

  users.join(await getUsersFromIssues(repo, options.env))
  users.join(await getUsersFromComments(repo, options.env))

  const contributors: string[] = await getContributors(repo, options.env)
  users.remove(contributors)

  return users
}
