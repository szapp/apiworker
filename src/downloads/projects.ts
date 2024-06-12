export const projects: Record<string, Record<string, string | number | (string | number)[]>> = {
  ninja: {
    github: 'szapp/Ninja',
    spine: 154300, // ID 314
    steam: [2786936496, 2786910489],
    wog: 652,
  },
  g1cp: {
    github: 'AmProsius/gothic-1-community-patch',
    spine: 15984, // ID 395
    steam: 2789245548,
    wog: 660,
  },
  gfa: {
    github: ['szapp/GothicFreeAim', 'szapp/FreeAiming'],
    spine: [
      3020, // ID 192
      3786, // ID 75
      920, // ID 227 (disabled)
      7336, // ID 223
    ],
    steam: [2786959658, 2786958841],
    wog: [548, 535, 613],
  },
}
