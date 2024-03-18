import { Router } from 'itty-router'
import { projects } from './projects'
import { services, serviceMap, collect } from './services'

const router = Router({ base: '/downloads' })

function invalidRoute() {
  return new Response(
    JSON.stringify({ message: 'Not Found' }),
    { status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
  )
}

router.get('/:project/:service/:badge?', async (request) => {
  const { project, service, badge } = request.params
  const url = new URL(request.url)
  const { label = 'downloads', color = '#4c1', style = 'flat', logo = '', logoColor = '' } = Object.fromEntries(url.searchParams)
  if (typeof badge !== 'undefined' && badge !== 'badge') return invalidRoute()

  if (project in projects) {
    if (service in projects[project] || service === 'total') {
      let count: number = 0
      if (service === 'total')
        for (let i = 0; i < services.length; i++) {
          count += await collect(
            serviceMap[services[i]],
            projects[project][services[i]]
          )
        }
      else
        count = await collect(
          serviceMap[service],
          projects[project][service]
        )

      let message: string = ''
      if (count > 1000 * 1000) {
        message = Math.round(count / 1000000) + 'm'
      } else if (count > 1000) {
        message = Math.round(count / 1000) + 'k'
      } else {
        message = String(count)
      }

      // Return SVG or JSON
      if (badge) {
        const url = `https://img.shields.io/badge/${label}-${message}-${color.replace(/#/g, '')}?style=${style}&logo=${logo}&logoColor=${logoColor.replace(/#/g, '')}`
        const response = await fetch(url, { headers: { Accept: 'image/svg+xml' } })
        const content = await response.text()
        return new Response(content, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' } })
      } else {
        const format = {
          schemaVersion: 1,
          label: label,
          message: message,
          color: color,
          style: style,
        }
        if (logo) format.logo = logo
        if (logoColor) format.logoColor = logoColor
        return new Response(JSON.stringify(format), { headers: { 'Content-Type': 'application/json; charset=utf-8' }})
      }
    }
  }

  return invalidRoute()
})

router.get('/', async (request) => {
  const url = new URL(request.url)
  return new Response(
    JSON.stringify({
      downloads_url: `${url.origin}/downloads/{project_id}/{service_id}`,
      badge_url: `${url.origin}/downloads/{project_id}/{service_id}/badge{?label,color,style,logo,logoColor}`,
      service_ids: services.concat('total'),
      project_ids: Object.keys(projects)
    }),
    { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }}
  )
})

// 404 for everything else
router.all('*', invalidRoute)

export default router
