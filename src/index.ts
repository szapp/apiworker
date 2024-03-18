import downloadsRouter from './downloads/router'
import participantsRouter from './participants/router'

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)

    if (
      url.pathname === '/downloads' ||
      url.pathname.startsWith('/downloads/') ||
      url.pathname === '/participants' ||
      url.pathname.startsWith('/participants/')
    ) {
      const cacheUrl = new URL(request.url)
      const cacheKey = new Request(cacheUrl.toString(), request)
      const cache = caches.default
      let response = undefined // await cache.match(cacheKey)
      if (typeof response === 'undefined') {
        console.log(`Response for request url: ${request.url} not present in cache. Fetching and caching request.`)
        if (url.pathname.startsWith('/downloads')) response = await downloadsRouter.handle(request, env, ctx)
        else if (url.pathname.startsWith('/participants')) {
          response = await participantsRouter.handle(request, env, ctx)
        }

        if (typeof response === 'undefined') {
          response = new Response(JSON.stringify({ message: 'Not Found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
          })
        } else {
          response = new Response(response.body, response)
        }

        response.headers.append('Cache-Control', 's-maxage=21600') // In cache for 21600 seconds max
        ctx.waitUntil(cache.put(cacheKey, response.clone()))
      } else {
        console.log(`Cache hit for: ${request.url}.`)
      }
      return response
    }

    if (url.pathname === '/') {
      return new Response(
        JSON.stringify({
          downloads_url: `${url.origin}/downloads/{project_id}/{service_id}{/badge}{?label,color,style,logo,logoColor}`,
          participants_url: `${url.origin}/participants/{project_id}/{service_id}{/svg}{?wog,exclude,max,columns,size}`,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      )
    }

    return new Response(JSON.stringify({ message: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  },
}
