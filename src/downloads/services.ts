import { getSteam } from './services/steam'
import { getGithub } from './services/github'
import { getWog } from './services/wog'
import { getSpine } from './services/spine'

export const serviceMap: { [key: string]: (value: string) => Promise<number> } = {
  steam: getSteam,
  wog: getWog,
  spine: getSpine,
  github: getGithub,
}
export const services = Object.keys(serviceMap)

export async function collect(service: (value: string) => Promise<number>, values: string | number | (number | string)[]): Promise<number> {
  const valueList = Array.isArray(values) ? values : [values]
  let summed: number = 0
  for (const value of valueList) summed += await service(String(value))
  return summed
}
