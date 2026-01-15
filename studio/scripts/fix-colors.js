/**
 * Migration script to fix color fields that are missing rgb/hsl/alpha properties
 *
 * Run with: npx sanity exec scripts/fix-colors.js --with-user-token
 */

import { getCliClient } from 'sanity/cli'

const client = getCliClient()

// Convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return null
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}

// Convert RGB to HSL
function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s
  const l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

// Build complete Sanity color object from hex
function buildColorObject(hex) {
  if (!hex) return null

  const rgb = hexToRgb(hex)
  if (!rgb) return null

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)

  return {
    _type: 'color',
    hex: hex.startsWith('#') ? hex : `#${hex}`,
    alpha: 1,
    hsl: {
      _type: 'hslaColor',
      h: hsl.h,
      s: hsl.s,
      l: hsl.l,
      a: 1,
    },
    hsv: {
      _type: 'hsvaColor',
      h: hsl.h,
      s: hsl.s,
      v: hsl.l,
      a: 1,
    },
    rgb: {
      _type: 'rgbaColor',
      r: rgb.r,
      g: rgb.g,
      b: rgb.b,
      a: 1,
    },
  }
}

// Check if color needs fixing
function needsFixing(color) {
  if (!color) return false
  if (!color.hex) return false
  // If it's missing rgb or hsl, it needs fixing
  return !color.rgb || !color.hsl
}

async function fixColors() {
  console.log('Fetching documents with color fields...')

  // Fetch all routes and agencies
  const routes = await client.fetch(`*[_type == "route" && (defined(color) || defined(textColor))]`)
  const agencies = await client.fetch(`*[_type == "agency" && (defined(color) || defined(textColor))]`)
  const bikeshares = await client.fetch(`*[_type == "bikeshare" && defined(color)]`)

  console.log(`Found ${routes.length} routes, ${agencies.length} agencies, ${bikeshares.length} bikeshares`)

  const transaction = client.transaction()
  let fixCount = 0

  // Fix routes
  for (const route of routes) {
    const patches = {}

    if (needsFixing(route.color)) {
      const fixed = buildColorObject(route.color.hex)
      if (fixed) {
        patches.color = fixed
        console.log(`Route ${route.shortName}: fixing color ${route.color.hex}`)
      }
    }

    if (needsFixing(route.textColor)) {
      const fixed = buildColorObject(route.textColor.hex)
      if (fixed) {
        patches.textColor = fixed
        console.log(`Route ${route.shortName}: fixing textColor ${route.textColor.hex}`)
      }
    }

    if (Object.keys(patches).length > 0) {
      transaction.patch(route._id, { set: patches })
      fixCount++
    }
  }

  // Fix agencies
  for (const agency of agencies) {
    const patches = {}

    if (needsFixing(agency.color)) {
      const fixed = buildColorObject(agency.color.hex)
      if (fixed) {
        patches.color = fixed
        console.log(`Agency ${agency.name}: fixing color ${agency.color.hex}`)
      }
    }

    if (needsFixing(agency.textColor)) {
      const fixed = buildColorObject(agency.textColor.hex)
      if (fixed) {
        patches.textColor = fixed
        console.log(`Agency ${agency.name}: fixing textColor ${agency.textColor.hex}`)
      }
    }

    if (Object.keys(patches).length > 0) {
      transaction.patch(agency._id, { set: patches })
      fixCount++
    }
  }

  // Fix bikeshares
  for (const bikeshare of bikeshares) {
    if (needsFixing(bikeshare.color)) {
      const fixed = buildColorObject(bikeshare.color.hex)
      if (fixed) {
        console.log(`Bikeshare ${bikeshare.name}: fixing color ${bikeshare.color.hex}`)
        transaction.patch(bikeshare._id, { set: { color: fixed } })
        fixCount++
      }
    }
  }

  if (fixCount === 0) {
    console.log('No colors need fixing!')
    return
  }

  console.log(`\nCommitting ${fixCount} document fixes...`)
  await transaction.commit()
  console.log('Done!')
}

fixColors().catch(console.error)
