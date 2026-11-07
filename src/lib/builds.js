// Class builds: which gear a class can wear and its base stats. Numbers live in data/builds.json.
import data from '../data/builds.json'
import { gearItem } from './gear.js'

export const BUILDS = data.builds
export const WEIGHTS = data.weights

// Base stats and wear rules for a class, or null if no class (or an unknown one) is chosen.
export function classBuild(className) {
  const cls = data.classes[className]
  if (!cls) return null
  const build = BUILDS[cls.build]
  const stats = { ...build.stats }
  for (const [k, v] of Object.entries(cls.tweaks || {})) stats[k] = (stats[k] || 0) + v
  return { id: cls.build, name: build.name, about: build.about, wears: build.wears, note: cls.note, stats }
}

// Can this build wear the item? Accessories (no weight) fit everyone; with no class, everything fits.
export function canWear(number, build) {
  const w = gearItem(number)?.weight
  if (!w || !build) return true
  return build.wears.includes(w)
}

export function buildsThatWear(weight) {
  return Object.values(BUILDS).filter(b => b.wears.includes(weight)).map(b => b.name)
}
