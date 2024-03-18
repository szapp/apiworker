import { getSteam } from './services/steam'
import { getGithub } from './services/github'
import { getWog } from './services/wog'
import { getSpine } from './services/spine'

export const serviceMap: { [key: string]: (value: number | string) => Promise<number> } = {
  steam: getSteam,
  wog: getWog,
  spine: getSpine,
  github: getGithub,
}
export const services = Object.keys(serviceMap)

export async function collect(service: (value: number | string) => Promise<number>, values: string | number | (number | string)[]) {
  const valueList: (string | number)[] = Array.isArray(values) ? values : [values]

  let summed: number = 0
  for (let j = 0; j < valueList.length; j++) summed += await service(valueList[j])

  return summed
}
