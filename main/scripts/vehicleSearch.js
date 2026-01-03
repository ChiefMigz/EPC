;(async function () {
  const config = await getConfig()
  if (config.updateDomWithLanguageOnLoad)
    await updateDomWithLanguage('vehicleSearch')
})()
// Attach input/button listeners when DOM is ready and elements exist
function attachVehicleSearchListeners() {
  try {
    const inputEl = document.querySelector('.searchInputWrapper #vehicleSearchInput')
    const buttonEl = document.querySelector('.searchInputWrapper button')

    if (inputEl) {
      inputEl.addEventListener('keydown', async function (e) {
        if (e.key == 'Enter') {
          e.preventDefault()
          if (buttonEl) buttonEl.click()
        }
      })
    }

    if (buttonEl) {
      buttonEl.addEventListener('click', async function () {
        if (this.classList.contains('loading')) return
        showLoadingOnButton(this)

        this.blur()
        const query = (inputEl && inputEl.value ? inputEl.value.trim() : '')
        await performSearch(query)

        hideLoadingOnButton(this)
      })
    }
  } catch (err) {
    // If attaching listeners fails, ensure it doesn't break the rest of the script
    console.warn('Could not attach vehicle search listeners', err)
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', attachVehicleSearchListeners)
} else {
  // Document already loaded (script placed at end of body) — attach immediately
  attachVehicleSearchListeners()
}

async function performSearch(query) {
  const language = await getLanguage()
  if (!query) {
    topWindow.showNotification(
      language.vehicleSearch.notifications.emptySearchInput,
      'warning'
    )
    return
  }
  const response = await (
    await fetch('/data/specificVehicle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: query,
    })
  ).json()

  if (!response) {
    topWindow.showNotification(
      language.vehicleSearch.notifications.vehicleNotFound,
      'warning'
    )
    return
  }

  // Push plate to localStorage database array
  if (response && response.LicensePlate) {
    let plateDb = JSON.parse(localStorage.getItem('plateDb') || '[]');
    plateDb.push({ plate: response.LicensePlate, timestamp: Date.now() });
    localStorage.setItem('plateDb', JSON.stringify(plateDb));
    // Store plate in localStorage for transfer
    localStorage.setItem('pendingReportPlate', response.LicensePlate);
  }

  document.title = `${language.vehicleSearch.static.title}: ${response.LicensePlate}`

  // --- Notify pedSearch.js of the most recent plate using postMessage ---
  try {
    const topDoc = window.top.document;
    const pedIframe = Array.from(topDoc.querySelectorAll('iframe')).find(f => f.src.includes('pedSearch'));
    if (pedIframe && pedIframe.contentWindow) {
      pedIframe.contentWindow.postMessage({ type: 'vehiclePlateSelected', plate: response.LicensePlate }, '*');
    }
  } catch (e) { /* ignore */ }

  document.querySelector('.searchResponseWrapper').classList.remove('hidden')

  // Generate and display a Record ID derived from the plate (A=01, B=02, ...)
  try {
    const recordIdEl = document.getElementById('recordId')
    if (recordIdEl && response.LicensePlate) {
      recordIdEl.textContent = generateRecordId(response.LicensePlate)
    }
  } catch (err) {
    // ignore
  }

  for (const key of Object.keys(response)) {
    const el = document.querySelector(
      `.searchResponseWrapper [data-property="${key}"]`
    )
    if (!el) continue
    switch (key) {
      case 'RegistrationExpiration':
      case 'InsuranceExpiration':
        el.value = await getLanguageValue(response[key])
        el.value =
          response[key] == null
            ? await getLanguageValue(response[key])
            : new Date(response[key]).toLocaleDateString()

        if (
          response[key] != null &&
          new Date(response[key]).getTime() < Date.now()
        ) {
          el.style.color = 'var(--color-warning)'
        }
        break
      case 'Color':
        if (!response[key]) {
          el.parentElement.classList.add('hidden')
          break
        }
        el.parentElement.classList.remove('hidden')
        // Color comes as "R-G-B" (e.g. "255-0-0")
        const parts = response[key].split('-')
        const r = parseInt(parts[0])
        const g = parseInt(parts[1])
        const b = parseInt(parts[2])
        const rgb = `rgb(${r}, ${g}, ${b})`
        el.style.backgroundColor = rgb
        el.style.height = '19px'
        // show a readable color name where possible; fallback to hex
        const colorName = rgbToName(r, g, b) || rgbToHex(r, g, b)
        const textEl = el.querySelector('.color-text')
        if (textEl) textEl.textContent = colorName
        break
      case 'ModelDisplayName':
        // ensure no leftover inline images remain under the field
        el.parentElement.querySelector('.inline-vehicle-thumb')?.remove()

        const vehiclePhotoEl = document.getElementById('vehiclePhoto')
        el.value = response[key]
        // populate vehicle photo: prefer ModelName, but fall back to a slug derived
        // from ModelDisplayName so images still show when only a display name is returned.
        if (vehiclePhotoEl) {
          // hide until a successful load occurs
          vehiclePhotoEl.style.display = 'none'
          const modelCandidate = response.ModelName || modelToSlug(response.ModelDisplayName)
          if (modelCandidate) {
            const imageSrc = `https://docs.fivem.net/vehicles/${modelCandidate.toLowerCase()}.webp`
            // show image when it loads successfully
            vehiclePhotoEl.onload = () => {
              vehiclePhotoEl.style.display = 'block'
            }
            vehiclePhotoEl.onerror = () => {
              // If the requested asset fails to load, show a generic vehicle silhouette
              // as a graceful fallback so the UI remains usable and consistent.
              try {
                const silhouetteSvg = `
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 80'>
                    <rect width='120' height='80' rx='6' fill='none' />
                    <path fill='%23222' d='M12 48c0-6 4-10 10-10h76c6 0 10 4 10 10v6c0 2-2 4-4 4h-6c-1 4-5 7-10 7s-9-3-10-7H40c-1 4-5 7-10 7s-9-3-10-7h-6c-2 0-4-2-4-4v-6zM30 40c-6 0-10-8-10-8s3-6 10-6h60s7 0 10 6-4 8-10 8H30z'/>
                  </svg>
                `
                const dataUri = 'data:image/svg+xml;utf8,' + encodeURIComponent(silhouetteSvg)
                // Only apply the fallback once (avoid infinite onerror loops)
                if (!vehiclePhotoEl.src || !vehiclePhotoEl.src.startsWith('data:image/svg+xml')) {
                  vehiclePhotoEl.src = dataUri
                  vehiclePhotoEl.style.display = 'block'
                  vehiclePhotoEl.setAttribute('data-fallback', 'true')
                } else {
                  // Already tried fallback; hide to avoid repeated errors
                  vehiclePhotoEl.style.display = 'none'
                  vehiclePhotoEl.removeAttribute('src')
                }
              } catch (err) {
                vehiclePhotoEl.style.display = 'none'
                vehiclePhotoEl.removeAttribute('src')
              }
            }
            // set src and optimistically show — onerror will replace with fallback if needed
            vehiclePhotoEl.src = imageSrc
            vehiclePhotoEl.style.display = 'block'
          } else {
            vehiclePhotoEl.style.display = 'none'
            vehiclePhotoEl.removeAttribute('src')
          }
        }
        break
      case 'Owner':
        el.value = await getLanguageValue(response[key])
        if (response[key] && response[key] != 'Government') {
          el.parentElement.classList.add('clickable')
          el.parentElement.onclick = () => openInPedSearch(response[key])
        } else {
          el.parentElement.classList.remove('clickable')
          el.parentElement.onclick = null
        }
        break
      case 'IsStolen':
        // Normalize and show a clear STOLEN / CLEAR status
        const stolenEl = document.querySelector('.searchResponseWrapper [data-property="IsStolen"]')
        if (stolenEl) {
          const val = response[key]
          const inputEl = stolenEl.querySelector('input') || stolenEl
          if (val === true || String(val).toLowerCase() === 'stolen' || String(val) === '1') {
            if (inputEl.tagName === 'INPUT') inputEl.value = 'STOLEN'
            else inputEl.textContent = 'STOLEN'
            inputEl.classList.add('stolen')
            inputEl.classList.remove('clear')
          } else {
            if (inputEl.tagName === 'INPUT') inputEl.value = 'CLEAR'
            else inputEl.textContent = 'CLEAR'
            inputEl.classList.add('clear')
            inputEl.classList.remove('stolen')
          }
        }
        break
      default:
        el.value = await getLanguageValue(response[key])
        el.style.color = getColorForValue(response[key])
    }
  }
}

function getColorForValue(value) {
  switch (value) {
    case true:
    case 'Revoked':
    case 'None':
      return 'var(--color-error)'
    case false:
    case 'Valid':
      return 'var(--color-success)'
    case 'Expired':
      return 'var(--color-warning)'
    default:
      return 'var(--color-text-primary)'
  }
}

function componentToHex(c) {
  const hex = c.toString(16)
  return hex.length == 1 ? '0' + hex : hex
}

function rgbToHex(r, g, b) {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b)
}

// Nearest-color lookup using a palette of common vehicle colors
function rgbToName(r, g, b) {
  const palette = [
    { name: 'Black', rgb: [0, 0, 0] },
    { name: 'White', rgb: [255, 255, 255] },
    { name: 'Red', rgb: [196, 30, 58] },
    { name: 'Maroon', rgb: [128, 0, 0] },
    { name: 'Green', rgb: [34, 139, 34] },
    { name: 'Lime', rgb: [0, 255, 0] },
    { name: 'Blue', rgb: [0, 102, 204] },
    { name: 'Navy', rgb: [0, 0, 128] },
    { name: 'Gray', rgb: [128, 128, 128] },
    { name: 'Silver', rgb: [192, 192, 192] },
    { name: 'Dark Gray', rgb: [64, 64, 64] },
    { name: 'Brown', rgb: [139, 69, 19] },
    { name: 'Beige', rgb: [245, 245, 220] },
    { name: 'Yellow', rgb: [255, 215, 0] },
    { name: 'Gold', rgb: [212, 175, 55] },
    { name: 'Orange', rgb: [255, 140, 0] },
    { name: 'Purple', rgb: [128, 0, 128] },
    { name: 'Pink', rgb: [255, 105, 180] },
    { name: 'Teal', rgb: [0, 128, 128] },
    { name: 'Olive', rgb: [128, 128, 0] },
    { name: 'Silver Metallic', rgb: [176, 176, 176] },
    { name: 'Matte Black', rgb: [20, 20, 20] },
    { name: 'Police Blue', rgb: [0, 38, 77] },
    { name: 'Brownish', rgb: [150, 75, 0] },
  ]

  // find nearest color by Euclidean distance in RGB space
  let best = null
  let bestDist = Infinity
  for (const c of palette) {
    const dr = r - c.rgb[0]
    const dg = g - c.rgb[1]
    const db = b - c.rgb[2]
    const dist = dr * dr + dg * dg + db * db
    if (dist < bestDist) {
      bestDist = dist
      best = c
    }
  }

  // If the nearest color is reasonably close, return its name; otherwise null
  // threshold chosen so very different colors fall back to hex
  const threshold = 2000 // squared distance threshold (~44 units)
  if (best && bestDist <= threshold) return best.name
  return null
}

// Generate record ID: letters -> 2-digit index (A=01 .. Z=26), digits preserved
function generateRecordId(plate) {
  if (!plate) return ''
  const normalized = plate.toString().toUpperCase().trim()
  let out = ''
  for (const ch of normalized) {
    if (/[A-Z]/.test(ch)) {
      const idx = ch.charCodeAt(0) - 64 // A -> 1
      out += idx.toString().padStart(2, '0')
    } else if (/[0-9]/.test(ch)) {
      out += ch
    } // ignore other chars
  }
  return out
}

// Convert a human-friendly model display name into a slug likely matching the
// asset path. Examples: "Ford Mustang" -> "ford_mustang", "F-150" -> "f_150"
function modelToSlug(displayName) {
  if (!displayName) return null
  return displayName
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}
