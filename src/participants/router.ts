import { Router } from 'itty-router'
import { renderSvg } from './render'
import { projects } from './projects'
import { services, serviceMap, collect } from './services'

const router = Router({ base: '/participants' })

function invalidRoute() {
  return new Response(JSON.stringify({ message: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

router.get('/:project/:service/:svg?', async (request, env) => {
  const { project, service, svg } = request.params
  const url = new URL(request.url)
  const { wog, exclude, max, columns, size } = Object.fromEntries(url.searchParams)
  const options = { wog, env }
  if (typeof svg !== 'undefined' && svg !== 'svg') return invalidRoute()

  if (project in projects) {
    if (service in projects[project] || service === 'total') {
      const selServices: string[] = service === 'total' ? services : [service]
      const [userSet, ...jobs] = (await Promise.all(selServices.map((s) => collect(serviceMap[s], projects[project][s], options)))).flat()
      userSet.join(...jobs)

      // Drop excluded entries
      if (typeof exclude !== 'undefined') {
        const excl: string[] = decodeURI(exclude)
          .replace(/\[|\]|"|'/g, '')
          .split(',')
        userSet.remove(excl)
      }

      const users = userSet.toArray()

      if (svg) {
        const params = [max, columns, size].map((it) => (typeof it !== 'undefined' ? Number(it) : undefined))
        const svgData: string = await renderSvg(users, env, ...params)
        return new Response(svgData, { status: 200, headers: { 'Content-Type': 'image/svg+xml' } })
      } else {
        return new Response(JSON.stringify(users), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } })
      }
    }
  }

  return invalidRoute()
})

router.get('/', (request) => {
  const url = new URL(request.url)
  return new Response(
    JSON.stringify({
      participants_url: `${url.origin}/participants/{project_id}/{service_id}{?wog,exclude}`,
      svg_url: `${url.origin}/participants/{project_id}/{service_id}/svg{?wog,exclude,max,columns,size}`,
      service_ids: services.concat('total'),
      project_ids: Object.keys(projects),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
  )
})

// 404 for everything else
router.all('*', invalidRoute)

export default router
