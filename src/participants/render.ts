import { Buffer } from 'node:buffer'
import { User } from './user-class'

export async function renderSvg(users: User[], max: number = 100, columns: number = 12, size: number = 64): Promise<string> {
  max = Math.max(1, Math.min(max, 100))
  const gap: number = 4
  const stroke: number = Math.max(1, size / 64)
  const radius: number = size / 2
  const numUsers: number = Math.min(users.length, max)
  const totalWidth: number = (size + gap) * Math.min(numUsers, columns) - gap
  const totalHeight: number = (size + gap) * Math.ceil(numUsers / columns) - gap

  let svg: string = `<svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`

  for (const [idx, user] of users.entries()) {
    const col: number = idx % columns
    const row: number = Math.floor(idx / columns)
    const imageData: string = await fetch(new URL(user.image))
      .then(async (response) => {
        if (!response.ok) return Promise.reject()
        const arrBuffer: ArrayBuffer = await response.arrayBuffer()
        const imageString: string = Buffer.from(arrBuffer).toString('base64')
        return `data:${response.headers.get('content-type')};base64,${imageString}`
      })
      .catch(() => {
        const placeholder: string =
          '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50" y="75" font-size="70" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" fill="red">?</text></svg>'
        return `data:image/svg+xml;base64,${Buffer.from(placeholder).toString('base64')}`
      })
    svg += `
  <svg x="${col * (size + gap)}" y="${row * (size + gap)}" width="${size}" height="${size}">
    <title>${user.name}</title>
    <a xlink:href="${user.link}">
      <circle cx="${radius}" cy="${radius}" r="${radius}" stroke="#c0c0c0" stroke-width="${stroke}" fill="url(#fill${idx})" />
      <defs>
        <pattern id="fill${idx}" x="0" y="0" width="${size}" height="${size}" patternUnits="userSpaceOnUse">
          <image x="0" y="0" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice" xlink:href="${imageData}"/>
        </pattern>
      </defs>
    </a>
  </svg>`
  }
  svg += '</svg>'

  return svg
}
