import { UserInfo } from '../services'

async function getUsersFetch(url: string, env: Env, users: UserInfo) : Promise<void> {
  const nextPattern: RegExp = new RegExp(/(?<=<)([\S]*)(?=>; rel="Next")/i)
  let pagesRemaining: boolean = true

  do {
    let response: Reponse
    try {
      response = await fetch(
        new URL(url),
        {
          headers: {
            'User-Agent': 'read-engagers',
            Authorization: `token ${env.GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
          },
        }
      )
    } catch {
      console.warn('Could not reach api.github.com')
      return
    }
    const issuesData = await response.json()

    for (const issue of issuesData) {
      users[issue.user.login] = {
        name: issue.user.login,
        link: issue.user.html_url,
        image: issue.user.avatar_url,
        contributions: (users?.[issue.user.login]?.contributions ?? 0) + 1
      }
    }

    const linkHeader = response.headers.get('link')
    // eslint-disable-next-line quotes
    pagesRemaining = linkHeader && linkHeader.includes(`rel="next"`)
    if (pagesRemaining) {
      url = linkHeader.match(nextPattern)[0]
    }
  } while (pagesRemaining)
}

async function getUsersFromIssues(repo: string, env: Env, users: UserInfo) : Promise<void> {
  const url: string = `https://api.github.com/repos/${repo}/issues?&state=all&per_page=100`
  await getUsersFetch(url, env, users)
}

async function getUsersFromComments(repo: string, env: Env, users: UserInfo) : Promise<void> {
  const url: string = `https://api.github.com/repos/${repo}/issues/comments?per_page=100`
  await getUsersFetch(url, env, users)
}

async function removeContributors(repo: string, env: Env, users: UserInfo) : Promise<void> {
  let response: Reponse
  try {
    response = await fetch(
      new URL(`https://api.github.com/repos/${repo}/contributors`),
      {
        headers: {
          'User-Agent': 'read-engagers',
          Authorization: `token ${env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
      }
    )
  } catch {
    console.warn('Could not reach api.github.com')
    return
  }
  const contributorList = await response.json()
  for (const contributor of contributorList) delete users[contributor.login]
}

export async function getGithub(repo: string, users: UserInfo, options: { env: Env }) : Promise<void> {
  await getUsersFromIssues(repo, options.env, users)
  await getUsersFromComments(repo, options.env, users)
  await removeContributors(repo, options.env, users)
}
