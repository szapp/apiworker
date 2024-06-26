import { UserInfo } from '../user-class'

const avatarRE: RegExp =
  /<a\s+class="postuseravatar"\s+href="members\/(?<id>\d+-(?<name>[^?"]*))[?=\d\w]*"\s+title="[^"]+">\s*<img src="(?<avatar>[^"]+)"/g
const postRE: RegExp = /<a\s+class="username\s+(offline|online)\s+popupctrl"\s+href="members\/(?<id>\d+-(?<name>[^?"]*))[?=\d\w]*"\s+/g
const nextRE: RegExp = /rel="next"/

async function getUsersFetch(thread: number, env: Env): Promise<UserInfo> {
  let hasNextPage: boolean = true

  // Retrieve previous results from KV
  const originalUrl: string = `https://forum.worldofplayers.de/forum/threads/${thread}`
  const { users, fromPage, fromPost } = await env.KV_PARTICIPANTS.getWithMetadata(originalUrl, { type: 'arrayBuffer' })
    .then(({ value, metadata }) => {
      if (value === null || typeof value === 'undefined') throw new Error()
      const users = UserInfo.fromBuffer(value)
      const { page, post } = metadata as { page: number; post: number }
      return { users, fromPage: Math.max(1, page), fromPost: Math.max(0, post) }
    })
    .catch(() => {
      console.log('No KV entry found or invalid data')
      return { users: new UserInfo(), fromPage: 1, fromPost: 0 }
    })
  let page: number = fromPage - 1
  let post: number = fromPost
  let baseUrl = originalUrl
  do {
    page++
    const url = baseUrl + (page > 1 ? `/page${page}` : '')
    hasNextPage = await fetch(new URL(url), {
      method: 'GET',
      headers: {
        Accept: 'text/html',
      },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not reach worldofplayers.de')
        if (page !== 1 && !response.url.endsWith(String(page))) throw new Error(`Exhausted available pages ${page - 1}`)

        // Update url from redirect
        if (url !== response.url) baseUrl = response.url.replace(/\/page\d+$/, '')

        const htmlText = await response.text()

        // Get posts
        post = 0
        const matchPosts = [...htmlText.matchAll(postRE)]
        if (matchPosts.length <= 0) throw new Error(`No posts on page ${page}`)

        // Get images
        const matchImg = [...htmlText.matchAll(avatarRE)]
        const images = new Map<string, string>(
          matchImg.filter((m) => typeof m.groups !== 'undefined').map((m) => [m.groups!.name, m.groups!.avatar])
        )

        // Add users
        post = page === fromPage ? fromPost : 0
        for (const { groups: user } of matchPosts.slice(post)) {
          if (typeof user === 'undefined') continue
          users.add({
            name: user.name,
            link: `https://forum.worldofplayers.de/forum/members/${user.id}`,
            image: images.get(user.name) ? 'https://forum.worldofplayers.de/forum/' + images.get(user.name) : '',
            contributions: 1,
          })
          post++
        }
        return nextRE.test(htmlText)
      })
      .catch((e) => {
        console.warn(e instanceof Error ? e.message : e)
        page-- // Current page was not fetched
        return false
      })
  } while (hasNextPage)

  console.log(`Fetched ${originalUrl} up to page ${page} and ${post} posts`)

  // Store results so far to KV
  const putValue: ArrayBuffer = users.serialize()
  env.KV_PARTICIPANTS.put(originalUrl, putValue, { metadata: { page, post } }).catch(() => {})

  return users
}

export async function getWog(thread: string, options: { wog?: string; env: Env }): Promise<UserInfo> {
  const users = await getUsersFetch(Number(thread), options.env)

  // Pick selected users only
  if (typeof options?.wog !== 'undefined') {
    const wog: string[] = decodeURI(options.wog)
      .replace(/\[|\]|"|'/g, '')
      .split(',')
    users.filter(wog)
  }

  return users
}
