import { getGithub } from './services/github'
import { getWog } from './services/wog'

export interface User {
  name: string,
  link: string,
  image: string,
  contributions: number
}

export type UserInfo = Record<[key: string], User>

export const serviceMap: { [key: string]: () => Promise<number> } = {
  github: getGithub,
  wog: getWog,
}
export const services = Object.keys(serviceMap)

export async function collect(service: () => Promise<void>, values: string[] | string | number[] | number, users: UserInfo, options?: Record<string, string | Env | undefined>) {
  const valueList: string[] | number[] = Array.isArray(values) ? values : [ values ]
  for (const value of valueList) await service(value, users, options)
}
