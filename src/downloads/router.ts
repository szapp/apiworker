import { Router } from 'itty-router'
import { getGithub } from './github'
import { getSpine } from './spine'
import { getSteam } from './steam'
import { getWog } from './wog'
import { projects } from './projects'
import { services, serviceMap } from './services'

const router = Router()

function invalidRoute() {
  return new Response(
    JSON.stringify({ message: 'Not Found' }),
    { status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8' }
  })
}

async function collect(service: () => Promise<number>, values: string[] | string | number[] | number) {
  const valueList: string[] | number[] = Array.isArray(values) ? values : [ values ]

  var summed: number = 0
  for (var j = 0; j < valueList.length; j++)
    summed += await service(valueList[j])

  return summed
}

router.get('/downloads/:project/:service', async ({ params }) => {
  if (params.project in projects) {
    if (params.service in projects[params.project] || params.service === 'total') {
      var count: number = 0
      if (params.service == 'total')
        for (var i = 0; i < services.length; i++) {
          count += await collect(
            serviceMap[services[i]],
            projects[params.project][services[i]]
          )
        }
      else
        count = await collect(
          serviceMap[params.service],
          projects[params.project][params.service]
        )

      var message: string = ''
      if (count > 1000 * 1000) {
        message = Math.round(count / 1000000) + 'm'
      } else if (count > 1000) {
        message = Math.round(count / 1000) + 'k'
      } else {
        message = count
      }

      var label: string = 'downloads'
      var color: string = '#4c1'

      const url = `https://img.shields.io/badge/${label}-${message}-${color.replace(/#/g, '')}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'image/svg+xml',
        },
      })
      const content = await response.text()
      return new Response(content, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' } })
    }
  }

  return invalidRoute()
})

// 404 for everything else
router.all('*', invalidRoute)

export default router
