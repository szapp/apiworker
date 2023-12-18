export async function getSteam(appId: number) {
  var downloads: number = 0

  try {
    const response = await fetch(
      new URL(`https://img.shields.io/steam/downloads/${appId}`),
      {
        method: 'GET',
        headers: { Accept: 'text/plain' },
      }
    )
    const result = await response.text()
    const dlRegExp = /<title>downloads: ([\d\w\.]+)<\/title>/
    const match = result.match(dlRegExp)
    if (match == null || match.length < 2)
      console.warn('Could not retrieve download count from shields.io svg. Returning 0 downloads')
    else {
      const numStr: string = match.slice(1)[0]
      if (numStr.endsWith('k'))
        downloads = +numStr.substr(0, numStr.length-1) * 1000
      else if (numStr.endsWith('m'))
        downloads = +numStr.substr(0, numStr.length-1) * 1000 * 1000
      else
        downloads = +numStr
    }
  } catch (error) {
    if (error instanceof TypeError && error.message == 'fetch failed')
      console.warn('Could not reach shields.io. Returning 0 downloads')
    else
      console.warn(`Unexpected error. Returning 0 downloads: ${error}`)
  }

  return downloads
}
