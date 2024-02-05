import downloadsRouter from './downloads/router'

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/downloads/')) {
      const cacheUrl = new URL(request.url)

      // Construct the cache key from the cache URL
      const cacheKey = new Request(cacheUrl.toString(), request)
      const cache = caches.default

      // Check whether the value is already available in the cache
      // if not, you will need to fetch it from origin, and store it in the cache
      let response = await cache.match(cacheKey)

      if (!response) {
        console.log(
          `Response for request url: ${request.url} not present in cache. Fetching and caching request.`
        )
        // If not in cache, get it from origin
        response = await downloadsRouter.handle(request, env, ctx)

        // Must use Response constructor to inherit all of response's fields
        response = new Response(response.body, response)

        // Cache API respects Cache-Control headers. Setting s-max-age to 21600
        // will limit the response to be in cache for 21600 seconds max

        // Any changes made to the response here will be reflected in the cached value
        response.headers.append('Cache-Control', 's-maxage=21600')

        ctx.waitUntil(cache.put(cacheKey, response.clone()))
      } else {
        console.log(`Cache hit for: ${request.url}.`)
      }

      return response
    }

		if (url.pathname === '/') {
	    return new Response(
	      JSON.stringify({ downloads_url: `${url.origin}/downloads/{project_id}/{service_id}{/badge}{?label,color,style,logo,logoColor}` }),
	      { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }
	    })
		}

    return new Response(
      JSON.stringify({ message: 'Not Found' }),
      { status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8' }
    })
  },
}
