import { UserInfo } from '../user-class'

async function getUsersFetch(thread: number): Promise<UserInfo> {
  const postRE: RegExp = new RegExp(
    /<a class="postuseravatar" href="members\/(?<id>\d+-(?<name>[^?"]*))[?=\d\w]*" title="[^"]+ ist offline">\s*<img src="(?<avatar>[^"]+)" alt="/g
  )
  let page: number = 1
  let hasPage: boolean = true
  const users: UserInfo = new UserInfo()

  do {
    let response: Response
    try {
      response = (await fetch(new URL(`https://forum.worldofplayers.de/forum/threads/${thread}/page${page}`), {
        method: 'GET',
        headers: {
          Accept: 'text/html',
        },
      })) as unknown as Response
    } catch {
      console.warn('Could not reach worldofplayers.de')
      break
    }
    hasPage = response?.ok && (page === 1 || response.url.endsWith(String(page)))
    page += 1

    if (hasPage) {
      const htmlText = await response.text()
      const match = [...htmlText.matchAll(postRE)]
      if (typeof match !== 'undefined' && match.length > 0) {
        for (const m of match) {
          if (typeof m.groups === 'undefined') continue
          users.add({
            name: m.groups.name,
            link: `https://forum.worldofplayers.de/forum/members/${m.groups.id}`,
            image: `https://forum.worldofplayers.de/forum/${m.groups.avatar}`,
            contributions: 1,
          })
        }
      } else {
        hasPage = false
      }
    }
  } while (hasPage)

  return users
}

export async function getWog(thread: string, options?: { wog?: string }): Promise<UserInfo> {
  const users: UserInfo = new UserInfo()

  users.join(await getUsersFetch(Number(thread)))

  // Pick selected users only
  if (typeof options?.wog !== 'undefined') {
    const wog: string[] = decodeURI(options.wog)
      .replace(/\[|\]|"|'/g, '')
      .split(',')
    users.filter(wog)
  }

  return users
}
