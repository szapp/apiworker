import { UserInfo } from '../user-class'

const avatarRE: RegExp =
  /<a\s+class="postuseravatar"\s+href="members\/(?<id>\d+-(?<name>[^?"]*))[?=\d\w]*"\s+title="[^"]+">\s*<img src="(?<avatar>[^"]+)"/g
const postRE: RegExp = /<a\s+class="username\s+(offline|online)\s+popupctrl"\s+href="members\/(?<id>\d+-(?<name>[^?"]*))[?=\d\w]*"\s+/g

async function getUsersFetch(thread: number, env: Env): Promise<UserInfo> {
  let hasPage: boolean = true

  // Retrieve previous results from KV
  const url: string = `https://forum.worldofplayers.de/forum/threads/${thread}`
  const { users, fromPage, fromPost } = await env.KV_PARTICIPANTS.getWithMetadata(url, { type: 'arrayBuffer' })
    .then(({ value, metadata }) => {
      if (value === null || typeof value === 'undefined') throw new Error()
      const users = UserInfo.fromBuffer(value)
      const { page, post } = metadata as { page: number; post: number }
      return { users, fromPage: page, fromPost: post }
    })
    .catch(() => {
      console.log('No KV entry found or invalid data')
      return { users: new UserInfo(), fromPage: 1, fromPost: 0 }
    })
  let page: number = fromPage
  let post: number = fromPost

  do {
    hasPage = await fetch(new URL(`https://forum.worldofplayers.de/forum/threads/${thread}/page${page}`), {
      method: 'GET',
      headers: {
        Accept: 'text/html',
      },
    })
      .then(async (response) => {
        if (!response.ok) Promise.reject()
        if (page !== 1 && !response.url.endsWith(String(page))) return false // No more pages
        const htmlText = await response.text()

        // Get posts
        post = 0
        const matchPosts = [...htmlText.matchAll(postRE)]
        if (matchPosts.length <= 0) return false

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
        console.log(`Fetched ${post} posts from page ${page}: ${matchPosts.length} - ${matchImg.length}`)
        return true
      })
      .catch(() => {
        console.warn('Could not reach worldofplayers.de')
        return false
      })
    if (hasPage) page++
  } while (hasPage)

  page--
  console.log(
    `Fetched ${url} up to page ${page} and ${post} posts totalling ${users.size} users with ${users.contributions()} contributions`
  )

  // Store results so far to KV
  const putValue: ArrayBuffer = users.serialize()
  await env.KV_PARTICIPANTS.put(url, putValue, { metadata: { page, post } })

  return users
}

export async function getWog(thread: string, options: { wog?: string; env: Env }): Promise<UserInfo> {
  const users: UserInfo = new UserInfo()

  users.join(await getUsersFetch(Number(thread), options.env))

  // Pick selected users only
  if (typeof options?.wog !== 'undefined') {
    const wog: string[] = decodeURI(options.wog)
      .replace(/\[|\]|"|'/g, '')
      .split(',')
    users.filter(wog)
  }

  return users
}
