export async function getWog(id: number) {
  let downloads: number = 0

  try {
    const response = await fetch(
      new URL(`https://www.worldofgothic.de/dl/download_${id}.htm`),
      {
        method: 'GET',
        headers: {
          Accept: 'text/html',
        },
      }
    )
    const htmlText = await response.text()
    const dlRegExp = /<td>\s*<b>\s*Downloads:\s*<\/b>\s*<\/td>\s*<td>\s*(\d+)\s*<\/td>/
    const match = htmlText.match(dlRegExp)
    if (match === null || match.length < 2)
      console.warn('Could not retrieve download count from WoG download page. Returning 0 downloads')
    else
      downloads = +match.slice(1)[0]

  } catch (error) {
    if (error instanceof TypeError && error.message === 'fetch failed')
      console.warn('Could not reach worldofgothic.de. Returning 0 downloads')
    else
      console.warn(`Unexpected error. Returning 0 downloads: ${error}`)
  }

  return downloads
}
