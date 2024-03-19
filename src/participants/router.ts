import { Router } from 'itty-router'
import { renderSvg } from './render'
import { projects } from './projects'
import { services, serviceMap, collect } from './services'
import { UserInfo, User } from './user-class'

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

  // Fetch results from catch to avoid exceeding the sub-requests limit
  if (svg) {
    const fetchURL = new URL(`${url.origin}/participants/${project}/${service}`)
    if (typeof wog !== 'undefined') fetchURL.searchParams.set('wog', wog)
    if (typeof exclude !== 'undefined') fetchURL.searchParams.set('exclude', exclude)
    console.log(`Sub-fetching ${fetchURL}`)
    const users = (await fetch(fetchURL)
      .then((response) => response.json())
      .catch(() => [])) as User[]
    if (users.length > 0) {
      console.log('Responding from sub-request')
      const params = [max, columns, size].map((it) => (typeof it !== 'undefined' ? Number(it) : undefined))
      const svgData: string = await renderSvg(users, ...params)
      return new Response(svgData, { status: 200, headers: { 'Content-Type': 'image/svg+xml' } })
    }
  }

  if (project in projects) {
    if (service in projects[project] || service === 'total') {
      const userSet: UserInfo = new UserInfo()
      if (service === 'total') {
        for (const serv of services) userSet.join(await collect(serviceMap[serv], projects[project][serv], options))
      } else {
        userSet.join(await collect(serviceMap[service], projects[project][service], options))
      }

      // Drop excluded entries
      if (typeof exclude !== 'undefined') {
        const excl: string[] = decodeURI(exclude)
          .replace(/\[|\]|"|'/g, '')
          .split(',')
        userSet.remove(excl)
      }

      // Sort
      const users = userSet.toArray()

      if (svg) {
        const params = [max, columns, size].map((it) => (typeof it !== 'undefined' ? Number(it) : undefined))
        const svgData: string = await renderSvg(users, ...params)
        return new Response(svgData, { status: 200, headers: { 'Content-Type': 'image/svg+xml' } })
      } else {
        return new Response(JSON.stringify(users), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } })
      }
    }
  }

  return invalidRoute()
})

router.get('/', async (request) => {
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
