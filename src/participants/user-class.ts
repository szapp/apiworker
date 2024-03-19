export interface User {
  name: string
  link: string
  image: string
  contributions: number
}

export class UserInfo extends Map<string, User> {
  getNames(): string[] {
    return Array.from(this.keys())
  }
  add(user: User): void {
    if (this.has(user.name)) {
      const existingUser = this.get(user.name)
      if (existingUser) {
        existingUser.link = user.link
        existingUser.image = user.image
        existingUser.contributions += user.contributions
      }
    } else {
      this.set(user.name, user)
    }
  }
  contributions(): number {
    return this.toArray().reduce((sum, user) => sum + user.contributions, 0)
  }
  remove(names: string | string[]): void {
    const delNames = Array.isArray(names) ? names : [names]
    delNames.forEach((name) => this.delete(name))
  }
  filter(names: string | string[]): void {
    const keepNames = Array.isArray(names) ? names : [names]
    const allNames = this.getNames()
    allNames.forEach((name) => {
      if (!keepNames.includes(name)) this.delete(name)
    })
  }
  sort(): void {
    const newMap = new UserInfo([...this.entries()].sort((a, b) => b[1].contributions - a[1].contributions))
    this.clear()
    newMap.forEach((value, key) => this.set(key, value))
  }
  join(...other: UserInfo[]): void {
    const flat = [...other.map((userMap) => userMap.toArray()), this.toArray()].flat()
    flat.sort((a, b) => b.contributions - a.contributions)
    this.clear()
    flat.forEach((user) => this.add(user))
  }
  toArray(): User[] {
    return Array.from(this.values())
  }
  serialize(): ArrayBuffer {
    const out = JSON.stringify(this.toArray())
    return new TextEncoder().encode(out)
  }
  deserialize(data: ArrayBuffer): void {
    const input = new TextDecoder().decode(data)
    const array = JSON.parse(input)
    this.clear()
    for (const user of array) this.add(user)
  }
  public static fromBuffer(data: ArrayBuffer): UserInfo {
    const users = new UserInfo()
    users.deserialize(data)
    return users
  }
}
