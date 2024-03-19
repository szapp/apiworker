import { Buffer } from 'node:buffer'
import { User } from './user-class'

// SVG image to use as a placeholder
const image = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
<mask id="shape">
  <rect x="0" y="0" width="100" height="100" fill="white" />
  <circle cx="50" cy="45" r="22" fill="black" />
  <circle cx="50" cy="103" r="38" fill="black" />
</mask>
<rect x="0" y="0" width="100" height="100" fill="#dddddd" mask="url(#shape)" />
</svg>`
const placeholder: string = 'data:image/svg+xml;base64,' + Buffer.from(image).toString('base64')

export async function renderSvg(users: User[], env: Env, max: number = 100, columns: number = 12, size: number = 64): Promise<string> {
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
    let imageData = placeholder
    if (user.image.length > 0) {
      // Use KV to cache images
      const cacheKey = user.image
      imageData = await env.KV_USERIMAGES.get(cacheKey, { type: 'text' })
        .then((value) => {
          if (value === null || typeof value === 'undefined' || value === '') throw new Error()
          return value
        })
        .catch(async () => {
          // Fetch and create base64 image
          const generated = await fetch(new URL(cacheKey))
            .then(async (response) => {
              if (!response.ok) return Promise.reject()
              const arrBuffer: ArrayBuffer = await response.arrayBuffer()
              const imageString: string = Buffer.from(arrBuffer).toString('base64')
              const output = `data:${response.headers.get('content-type')};base64,${imageString}`
              // Cache image
              await env.KV_USERIMAGES.put(cacheKey, output, {})
                .then(() => console.log(`Cached image ${cacheKey}`))
                .catch(() => console.log(`Failed to cache image ${cacheKey}`))
              return output
            })
            .catch(() => placeholder)
          return generated
        })
    }
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
