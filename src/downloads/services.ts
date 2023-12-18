import { getSteam } from './steam';
import { getGithub } from './github';
import { getWog } from './wog';
import { getSpine } from './spine';

export const serviceMap: { [key: string]: () => Promise<number> } = {
  ['steam']: getSteam,
  ['wog']: getWog,
  ['spine']: getSpine,
  ['github']: getGithub,
}
export const services = Object.keys(serviceMap)
