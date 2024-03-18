import { getSteam } from './services/steam'
import { getGithub } from './services/github'
import { getWog } from './services/wog'
import { getSpine } from './services/spine'

export const serviceMap: { [key: string]: () => Promise<number> } = {
  steam: getSteam,
  wog: getWog,
  spine: getSpine,
  github: getGithub,
}
export const services = Object.keys(serviceMap)

export async function collect(service: () => Promise<number>, values: string[] | string | number[] | number) {
  const valueList: string[] | number[] = Array.isArray(values) ? values : [ values ]

  let summed: number = 0
  for (let j = 0; j < valueList.length; j++)
    summed += await service(valueList[j])

  return summed
}
