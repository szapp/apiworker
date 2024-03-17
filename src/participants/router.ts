import { Router } from 'itty-router'
import { renderSvg } from './render'
import { projects } from './projects'
import { services, serviceMap, collect, User, UserInfo } from './services'

const router = Router({ base: '/participants' })

function invalidRoute() {
  return new Response(
    JSON.stringify({ message: 'Not Found' }),
    { status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8' }
  })
}

router.get('/:project/:service/:svg?', async (request, env, ctx) => {
  const { project, service, svg } = request.params
  const url = new URL(request.url)
  const { wog, exclude, max, columns, size } = Object.fromEntries(url.searchParams)
  const options: Record<string, string | Env | undefined> = { wog, env }

  if (project in projects) {
    if (service in projects[project] || service === 'total') {
      let userSet: UserInfo = {}
      if (service == 'total') {
        for (const serv of services) await collect(serviceMap[serv], projects[project][serv], userSet, options)
      } else {
        await collect(serviceMap[service], projects[project][service], userSet, options)
      }

      // Drop excluded entries
      if (typeof exclude !== 'undefined') {
        const excl: string[] = decodeURI(exclude).replace(/\[|\]/g, '').split(',')
        for (const name of excl) delete userSet[name]
      }

      // Sort
      const users: User[] = Object.values(userSet).sort((a, b) => b.contributions - a.contributions)

      if (svg) {
        const svgData: string = await renderSvg(users, max && Number(max), columns && Number(columns), size && Number(size))
        return new Response(
          svgData,
          { status: 200, headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' }}
        )
      } else {
        return new Response(
          JSON.stringify(users),
          { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }}
        )
      }
    }
  }

  return invalidRoute()
})

router.get('/', async (request, env, ctx) => {
  const url = new URL(request.url)
  return new Response(
    JSON.stringify({
      participants_url: `${url.origin}/participants/{project_id}/{service_id}{?wog,exclude}`,
      svg_url: `${url.origin}/participants/{project_id}/{service_id}/svg{?wog,exclude,max,columns,size}`,
      service_ids: services.concat('total'),
      project_ids: Object.keys(projects)
    }),
    { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }
  })
})

// 404 for everything else
router.all('*', invalidRoute)

export default router
