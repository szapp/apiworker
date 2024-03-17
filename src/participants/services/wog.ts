import { UserInfo } from '../services'

export async function getWog(thread: string, users: UserInfo, options: { wog: string | undefined }) : Promise<void> {
  const postRE: RegExp = new RegExp(/<a class="postuseravatar" href="members\/(?<id>\d+\-(?<name>[^?"]*))[?=\d\w]*" title="[^"]+ ist offline">\s*<img src="(?<avatar>[^"]+)" alt="/g)
  let page: number = 1
  let hasPage: boolean = true
  const wog: string[] | undefined = options.wog && decodeURI(options.wog).replace(/\[|\]/g, '').split(',')

  do {
    let response: Reponse
    try {
      response = await fetch(
        new URL(`https://forum.worldofplayers.de/forum/threads/${thread}/page${page}`),
        {
          method: 'GET',
          headers: {
            Accept: 'text/html',
          },
        }
      )
    } catch {
      console.warn('Could not reach worldofplayers.de')
      return
    }
    hasPage = response?.ok && (page === 1 || response.url.endsWith(page))
    page += 1

    if (hasPage) {
      const htmlText = await response.text()
      const match = [...htmlText.matchAll(postRE)]
      if (match && match.length > 0) {
        for (const m of match) {
          if (typeof wog === 'undefined' || wog.includes(m.groups.name)) {
            users[m.groups.name] = {
              name: m.groups.name,
              link: `https://forum.worldofplayers.de/forum/members/${m.groups.id}`,
              image: `https://forum.worldofplayers.de/forum/${m.groups.avatar}`,
              contributions: (users?.[m.groups.name]?.contributions ?? 0) + 1
            }
          }
        }
      } else {
        hasPage = false
      }
    }
  } while (hasPage)
}
