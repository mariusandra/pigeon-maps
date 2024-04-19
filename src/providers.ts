export function osm(x: number, y: number, z: number): string {
  const s = String.fromCharCode(97 + ((x + y + z) % 3))
  return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
}

export function stamenToner(x: number, y: number, z: number, dpr = 1): string {
  return `https://stamen-tiles.a.ssl.fastly.net/toner/${z}/${x}/${y}${dpr >= 2 ? '@2x' : ''}.png`
}

export function stamenTerrain(x: number, y: number, z: number, dpr = 1): string {
  return `https://stamen-tiles.a.ssl.fastly.net/terrain/${z}/${x}/${y}${dpr >= 2 ? '@2x' : ''}.jpg`
}

export const maptiler =
  (apiKey: string, map = 'streets') =>
  (x: number, y: number, z: number, dpr = 1): string => {
    return `https://api.maptiler.com/maps/${map}/256/${z}/${x}/${y}${dpr >= 2 ? '@2x' : ''}.png?key=${apiKey}`
  }

export const stadiamaps =
  (style = 'alidade_smooth') =>
  (x: number, y: number, z: number, dpr = 1): string => {
    return `https://tiles.stadiamaps.com/styles/${style}/${z}/${x}/${y}${dpr >= 2 ? '@2x' : ''}.png`
  }
