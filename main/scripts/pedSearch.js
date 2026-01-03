// Pull and remove the latest plate from localStorage database
function getLatestPlateFromDb() {
  let plateDb = JSON.parse(localStorage.getItem('plateDb') || '[]');
  if (plateDb.length === 0) return '';
  // Get the most recent plate (do not delete)
  const latest = plateDb[plateDb.length - 1];
  return latest.plate;
}
// Listen for vehicle plate selection from vehicleSearch window
window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'vehiclePlateSelected' && event.data.plate) {
    recentVehiclePlate = event.data.plate;
  }
});
// --- Begin: Logic moved from pedSearch.html ---
let recentVehiclePlate = '';

function getPedInfo() {
  // Grab plate from the vehicleSearch window DOM
  let plate = '';
  try {
    const topDoc = window.top.document;
    const vehicleIframe = Array.from(topDoc.querySelectorAll('iframe')).find(f => f.src.includes('vehicleSearch'));
    if (vehicleIframe) {
      const plateInput = vehicleIframe.contentWindow.document.getElementById('licensePlateInput');
      if (plateInput && plateInput.value) {
        plate = plateInput.value.trim();
      }
    }
  } catch (e) {}
  return {
    firstName: document.getElementById('firstNameInput').value,
    lastName: document.getElementById('lastNameInput').value,
    gender: document.getElementById('genderInput').value,
    birthday: document.getElementById('birthdayInput').value,
    age: document.getElementById('ageInput').value,
    address: document.getElementById('addressInput').value,
    vehiclePlate: plate
  };
}

function openReportWindow(type, pedInfo) {
  // Trigger creation of a new report in the current app, preselecting the correct category and autofilling info
  // Use openPedInReport to create new report and preselect category
  if (window.openPedInReport) {
    // Pass the plate as the third argument, or empty string if not found
    window.openPedInReport(type, pedInfo.firstName + ' ' + pedInfo.lastName, pedInfo.vehiclePlate ? pedInfo.vehiclePlate : '');
    // Remove plate from localStorage after transfer
    localStorage.removeItem('pendingReportPlate');
  } else {
    alert('openPedInReport function not found. Please ensure the report system is loaded.');
  }
}

// Example: update recentVehiclePlate when a vehicle search is performed
// You should call this function from your vehicle search logic
function setRecentVehiclePlate(plate) {
  recentVehiclePlate = plate;
  // Optionally, update .pdb file for search history here
}

document.addEventListener('DOMContentLoaded', function() {
  // Incident button may not exist anymore, but keep logic for completeness
  const incidentBtn = document.getElementById('makeIncidentBtn');
  const citationBtn = document.getElementById('issueCitationBtn');
  const arrestBtn = document.getElementById('createArrestBtn');

  if (incidentBtn) {
    incidentBtn.addEventListener('click', function() {
      const pedInfo = getPedInfo();
      openReportWindow('incident', pedInfo);
    });
  }
  if (citationBtn) {
    citationBtn.addEventListener('click', function() {
      const pedInfo = getPedInfo();
      openReportWindow('citation', pedInfo);
    });
  }
  if (arrestBtn) {
    arrestBtn.addEventListener('click', function() {
      const pedInfo = getPedInfo();
      openReportWindow('arrest', pedInfo);
    });
  }
});
// --- End: Logic moved from pedSearch.html ---
;(async function () {
  const config = await getConfig()
  if (config.updateDomWithLanguageOnLoad)
    await updateDomWithLanguage('pedSearch')
})()

document
  .querySelector('.searchInputWrapper #pedSearchInput')
  .addEventListener('keydown', async function (e) {
    if (e.key == 'Enter') {
      e.preventDefault()
      document.querySelector('.searchInputWrapper button').click()
    }
  })

document
  .querySelector('.searchInputWrapper button')
  .addEventListener('click', async function () {
    if (this.classList.contains('loading')) return
    showLoadingOnButton(this)

    this.blur()
    await performSearch(
      document.querySelector('.searchInputWrapper #pedSearchInput').value.trim()
    )

    hideLoadingOnButton(this)
  })

async function performSearch(query) {
  const language = await getLanguage()
  if (!query) {
    topWindow.showNotification(
      language.pedSearch.notifications.emptySearchInput,
      'warning'
    )
    return
  }
  const response = await (
    await fetch('/data/specificPed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: query,
    })
  ).json()

  if (!response) {
    topWindow.showNotification(
      language.pedSearch.notifications.pedNotFound,
      'warning'
    )
    return
  }

  document.title = `${language.pedSearch.static.title}: ${response.Name}`

  document.querySelector('.searchResponseWrapper').classList.remove('hidden')

  for (const key of Object.keys(response)) {
    const el = document.querySelector(
      `.searchResponseWrapper [data-property="${key}"]`
    )
    if (!el) continue
    switch (key) {
      case 'Birthday':
        el.value = new Date(response[key]).toLocaleDateString()
        document.querySelector(
          '.searchResponseWrapper [data-property="Age"]'
        ).value = Math.abs(
          new Date(
            Date.now() - new Date(response[key]).getTime()
          ).getFullYear() - 1970
        )
        break
      case 'IsWanted':
        el.value = response[key]
          ? `${language.values.wanted} ${response.WarrantText}`
          : language.values.notWanted
        el.style.color = getColorForValue(response[key])
        break
      case 'AdvisoryText':
        el.value = await getLanguageValue(response[key])
        if (response[key] != undefined) el.style.color = 'var(--color-error)'
        break
      case 'LicenseExpiration':
      case 'WeaponPermitExpiration':
      case 'HuntingPermitExpiration':
      case 'FishingPermitExpiration':
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
      case 'WeaponPermitType':
        el.value = await getLanguageValue(
          response.WeaponPermitStatus == 'Valid' ? response[key] : null
        )
        break
      case 'Citations':
      case 'Arrests':
        el.parentElement.classList.add('clickable')
        el.parentElement.onclick = () =>
          openPedInReport(
            key == 'Citations' ? 'citation' : 'arrest',
            response.Name
          )
        el.innerHTML =
          response[key].length > 0
            ? response[key].map((item) => `<li>${item.name}</li>`).join('')
            : await getLanguageValue(null)
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
    case 'Unlicensed':
    case 'Suspended':
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
