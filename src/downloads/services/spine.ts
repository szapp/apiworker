export async function getSpine(identity: string): Promise<number> {
  console.log('Could not retrieve Spine downloads. Returning hard-coded value as of Mar 2024')
  return Number(identity)
}
