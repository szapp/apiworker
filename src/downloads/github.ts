export async function getGithub(repo: string) {
  var downloads: number = 0

  try {
    const response = await fetch(
      new URL(`https://api.github.com/repos/${repo}/releases`),
      {
        headers: {
          'User-Agent': 'read-downloads',
          Accept: 'application/json',
        },
      }
    )
    const json = await response.json()

    for (var release of Object.values(json)) {
      for (var assest of release.assets) {
        downloads += assest.download_count
      }
    }
  } catch (error) {
    if (error instanceof TypeError && error.message == 'fetch failed')
      console.warn('Could not reach github.com. Returning 0 downloads')
    else
      console.warn(`Unexpected error. Returning 0 downloads: ${error}`)
    }

  return downloads
}
