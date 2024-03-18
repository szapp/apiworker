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
    const mergedMaps = new UserInfo([...this.entries()].sort((a, b) => b[1].contributions - a[1].contributions))
    this.clear()
    mergedMaps.forEach((value, key) => this.set(key, value))
  }
  join(other: UserInfo): void {
    for (const user of other.values()) this.add(user)
    this.sort()
  }
  toArray(): User[] {
    return Array.from(this.values())
  }
}
