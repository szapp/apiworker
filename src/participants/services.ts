import { getGithub } from './services/github'
import { getWog } from './services/wog'
import { UserInfo } from './user-class'

interface Options {
  wog?: string
  env: Env
}

export const serviceMap: { [key: string]: (value: string, options: Options) => Promise<UserInfo> } = {
  wog: getWog,
  github: getGithub,
}
export const services = Object.keys(serviceMap)

export async function collect(
  service: (value: string, options: Options) => Promise<UserInfo>,
  values: string | number | (string | number)[],
  options: Options
): Promise<UserInfo[]> {
  const valueList = Array.isArray(values) ? values : [values]
  return Promise.all(valueList.map((value) => service(String(value), options)))
}
