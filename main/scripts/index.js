// Global Officer Database (loaded from officerInformation.json)
window.OFFICER_DATABASE = [];

// Custom Dialog Function
function showCustomDialog(message, title = 'LAPD MDT') {
  return new Promise((resolve) => {
    const overlay = document.getElementById('customDialogOverlay');
    const dialogTitle = document.getElementById('customDialogTitle');
    const dialogMessage = document.getElementById('customDialogMessage');
    const okBtn = document.getElementById('customDialogOk');
    const cancelBtn = document.getElementById('customDialogCancel');
    
    if (!overlay) {
      // Fallback to native confirm if dialog not found
      resolve(confirm(message));
      return;
    }
    
    // Set the content
    dialogTitle.textContent = title;
    dialogMessage.textContent = message;
    
    // Show the dialog
    overlay.style.display = 'flex';
    
    // Handle OK button
    const handleOk = () => {
      overlay.style.display = 'none';
      cleanup();
      resolve(true);
    };
    
    // Handle Cancel button
    const handleCancel = () => {
      overlay.style.display = 'none';
      cleanup();
      resolve(false);
    };
    
    // Cleanup function to remove event listeners
    const cleanup = () => {
      okBtn.removeEventListener('click', handleOk);
      cancelBtn.removeEventListener('click', handleCancel);
      document.removeEventListener('keydown', handleKeyPress);
    };
    
    // Handle keyboard shortcuts
    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handleOk();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    };
    
    // Add event listeners
    okBtn.addEventListener('click', handleOk);
    cancelBtn.addEventListener('click', handleCancel);
    document.addEventListener('keydown', handleKeyPress);
  });
}

// Default Officers after reset
const DEFAULT_OFFICERS = [
  {
    firstName: "Wade",
    lastName: "Grey",
    rank: "Chief of Police",
    callSign: "1-CHARLIE-1",
    agency: "LAPD",
    badgeNumber: 1,
    division: "Office of the Chief of Police",
    unit: "Executive Command",
    password: "chief2025"
  },
  {
    firstName: "Lucy",
    lastName: "Chen",
    rank: "Police Sergeant I",
    callSign: "1-ADAM-100",
    agency: "LAPD",
    badgeNumber: 7841,
    division: "Midwilshire Division",
    unit: "Patrol Unit",
    password: "lucy2026"
  },
    {
    firstName: "John",
    lastName: "Nolan",
    rank: "Police Sergeant I",
    callSign: "1-LINCOLN-18",
    agency: "LAPD",
    badgeNumber: 4824,
    division: "Midwilshire Division",
    unit: "Patrol Unit",
    password: "john2026"
  }
];

// Global Officer Database (loaded from localStorage or defaults)
window.OFFICER_DATABASE = [];

// Load officers from localStorage
function loadOfficersFromStorage() {
  try {
    const stored = localStorage.getItem('LAPD_OFFICER_DATABASE');
    if (stored) {
      return JSON.parse(stored);
    } else {
      return [...DEFAULT_OFFICERS];
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return [...DEFAULT_OFFICERS];
  }
}

// Save officers to localStorage
function saveOfficersToStorage(officers) {
  try {
    localStorage.setItem('LAPD_OFFICER_DATABASE', JSON.stringify(officers));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
}

// Initialize database from localStorage
(function initOfficerDatabase() {
  window.OFFICER_DATABASE = loadOfficersFromStorage();
  
  // Build PASSWORD_MAP from loaded officers
  window.PASSWORD_MAP = {};
  window.OFFICER_DATABASE.forEach(officer => {
    window.PASSWORD_MAP[officer.badgeNumber.toString()] = officer.password;
  });
})();

// Notification System
function showNotificationMDT(message, type = 'success') {
  // Remove any existing notification
  const existing = document.querySelector('.mdt-notification');
  if (existing) existing.remove();
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `mdt-notification mdt-notification-${type}`;
  notification.innerHTML = `
    <div class="mdt-notification-content">
      <span class="mdt-notification-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
      <span class="mdt-notification-message">${message}</span>
    </div>
  `;
  
  // Add to body
  document.body.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => notification.classList.add('show'), 10);
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// Global variable for shift duration interval
let durationInterval;

// Login Authentication System
;(function initLoginSystem() {
  // Always start logged out - clear any previous session
  sessionStorage.removeItem('lapdMdtLoggedIn')
  sessionStorage.removeItem('loggedInOfficer')
  
  const loginForm = document.getElementById('loginForm')
  const loginScreen = document.getElementById('loginScreen')
  const mdtContent = document.getElementById('mdtContent')
  const loginError = document.getElementById('loginError')
  const mdtWindow = document.getElementById('mdtWindow')

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const badgeNumber = document.getElementById('badgeNumber').value.trim()
    const password = document.getElementById('password').value.trim()
    
    // Show loading state
    const submitButton = loginForm.querySelector('.login-button')
    submitButton.classList.add('loading')
    submitButton.textContent = 'AUTHENTICATING...'
    loginError.style.display = 'none'

    try {
      // Check if badge exists in our PASSWORD_MAP first
      if (!window.PASSWORD_MAP[badgeNumber]) {
        showLoginError('Invalid badge number or password');
        return;
      }
      
      // Find officer in global database
      const officerData = window.OFFICER_DATABASE.find(o => o.badgeNumber.toString() === badgeNumber);
      
      // Verify officer was found and password matches
      if (officerData) {
        // Get password from PASSWORD_MAP
        const expectedPassword = window.PASSWORD_MAP[badgeNumber];
        
        // Verify password matches
        if (password === expectedPassword) {
          // Store officer information in session
          sessionStorage.setItem('lapdMdtLoggedIn', 'true')
          sessionStorage.setItem('loggedInOfficer', JSON.stringify({
            firstName: officerData.firstName,
            lastName: officerData.lastName,
            badgeNumber: officerData.badgeNumber,
            rank: officerData.rank,
            agency: officerData.agency,
            division: officerData.division,
            unit: officerData.unit,
            callSign: officerData.callSign
          }))
          
          // Success animation
          submitButton.textContent = '✓ AUTHENTICATED'
          submitButton.style.background = 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)'
          
          // Show MDT content
          setTimeout(() => {
            showMdtContent()
          }, 800)
        } else {
          showLoginError('Invalid badge number or password')
        }
      } else {
        showLoginError('Invalid badge number or password')
      }
    } catch (error) {
      console.error('Login error:', error)
      showLoginError('Authentication failed. Please try again.')
    } finally {
      setTimeout(() => {
        submitButton.classList.remove('loading')
        submitButton.textContent = 'LOG IN'
        submitButton.style.background = ''
      }, 2000)
    }
  })

  function showLoginError(message) {
    loginError.textContent = message
    loginError.style.display = 'block'
  }

  function showMdtContent() {
    loginScreen.style.animation = 'fadeOut 0.5s ease forwards'
    setTimeout(() => {
      loginScreen.style.display = 'none'
      loginScreen.style.animation = ''
      
      mdtContent.style.display = 'block'
      mdtContent.style.animation = 'fadeIn 0.5s ease forwards'
      
      // Enable scrolling after login on window-content
      const windowContent = document.querySelector('#mdtWindow .window-content');
      if (windowContent) {
        windowContent.style.overflowY = 'auto';
        windowContent.style.removeProperty('visibility');
        windowContent.style.removeProperty('opacity');
      }
      
      // Enable resizing after login
      const mdtWindow = document.getElementById('mdtWindow');
      if (mdtWindow) {
        mdtWindow.classList.remove('login-mode');
      }
      
      // Attach click handlers to MDT navigation buttons
      attachMdtButtonHandlers();
      
      // Update officer information display
      updateOfficerInfoDisplay();
      
      // Check if user has access to Officer Management
      checkOfficerManagementAccess();
      
      // Initialize the main application
      initMainApplication()
      
      // Setup logout button
      setupLogoutButton()
      
      // Initialize duty status
      if (typeof initializeDutyStatus === 'function') {
        initializeDutyStatus();
      }
      
      // Generate dynamic system alerts
      generateSystemAlerts();
      
      // Update alerts every minute
      setInterval(generateSystemAlerts, 60000);
    }, 500)
  }
  
  function updateOfficerInfoDisplay() {
    let loggedInOfficer = JSON.parse(sessionStorage.getItem('loggedInOfficer'));
    
    if (loggedInOfficer) {
      // IMPORTANT: Get fresh data from OFFICER_DATABASE in case it was updated
      const freshOfficerData = window.OFFICER_DATABASE.find(o => o.badgeNumber === loggedInOfficer.badgeNumber);
      
      if (freshOfficerData) {
        // Update sessionStorage with fresh data
        loggedInOfficer = {
          firstName: freshOfficerData.firstName,
          lastName: freshOfficerData.lastName,
          badgeNumber: freshOfficerData.badgeNumber,
          rank: freshOfficerData.rank,
          agency: freshOfficerData.agency,
          division: freshOfficerData.division,
          unit: freshOfficerData.unit,
          callSign: freshOfficerData.callSign
        };
        sessionStorage.setItem('loggedInOfficer', JSON.stringify(loggedInOfficer));
      }
      
      const badgeEl = document.querySelector('#officerBadgeDisplay');
      const deptEl = document.querySelector('#department');
      const divisionEl = document.querySelector('#division');
      const unitEl = document.querySelector('#unit');
      
      // Use the data from officerInformation.json (stored during login)
      if (badgeEl) {
        badgeEl.textContent = loggedInOfficer.badgeNumber || '-';
      }
      if (deptEl) deptEl.textContent = loggedInOfficer.agency || 'LAPD';
      if (divisionEl) divisionEl.textContent = loggedInOfficer.division || '-';
      if (unitEl) unitEl.textContent = loggedInOfficer.unit || '-';
      
      // Update header with officer info
      updateHeaderInfo(loggedInOfficer);
      
      // Update officer dropdown button
      const userProfileName = document.getElementById('userProfileName');
      if (userProfileName) {
        userProfileName.textContent = `${loggedInOfficer.lastName}, ${loggedInOfficer.badgeNumber}`;
      }
    }
  }
  
  function updateHeaderInfo(officer) {
    // Update call sign in header
    const headerCallSign = document.getElementById('headerCallSign');
    if (headerCallSign && officer.callSign) {
      headerCallSign.textContent = `Callsign: ${officer.callSign}`;
    }
    
    // Update date/time (will be updated by WebSocket)
    updateHeaderDateTime();
  }
  
  function updateHeaderDateTime() {
    const now = new Date();
    const headerDate = document.getElementById('headerDate');
    const headerTime = document.getElementById('headerTime');
    
    if (headerDate) {
      headerDate.textContent = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    }
    if (headerTime) {
      headerTime.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    }
  }
  
  // Initial update of header time (WebSocket will update it continuously after connection)
  updateHeaderDateTime();
  
  // Generate dynamic system alerts based on current date and time
  function generateSystemAlerts() {
    const container = document.getElementById('systemAlertsContainer');
    if (!container) return;
    
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayOfMonth = now.getDate();
    
    const alerts = [];
    
    // Time-based alerts
    if (hour >= 0 && hour < 6) {
      alerts.push({
        priority: 'medium',
        text: 'Late night patrol: Increased monitoring in entertainment districts',
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      });
    } else if (hour >= 6 && hour < 9) {
      alerts.push({
        priority: 'medium',
        text: 'Morning rush hour: Traffic enforcement active on major highways',
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      });
    } else if (hour >= 16 && hour < 19) {
      alerts.push({
        priority: 'medium',
        text: 'Evening rush hour: High traffic volume expected citywide',
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      });
    } else if (hour >= 21 && hour < 24) {
      alerts.push({
        priority: 'medium',
        text: 'Night shift: DUI checkpoints active in multiple locations',
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      });
    }
    
    // Day-specific alerts
    if (dayOfWeek === 0) { // Sunday
      alerts.push({
        priority: 'low',
        text: 'Weekend patrol: Increased presence in recreational areas',
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      });
    } else if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday or Saturday
      alerts.push({
        priority: 'high',
        text: 'Weekend alert: Heightened activity expected in nightlife districts',
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      });
    }
    
    // Date-specific alerts (first of month)
    if (dayOfMonth === 1) {
      alerts.push({
        priority: 'low',
        text: 'Monthly reminder: Equipment inspection and vehicle maintenance due',
        time: '08:00'
      });
    }
    
    // Random dynamic alerts (based on time seed for consistency during same minute)
    const minuteSeed = hour * 60 + now.getMinutes();
    const random = (minuteSeed * 9301 + 49297) % 233280 / 233280; // Pseudo-random based on time
    const random2 = (minuteSeed * 7919 + 31337) % 233280 / 233280;
    const random3 = (minuteSeed * 5179 + 12345) % 233280 / 233280;
    
    // BOLO Alerts
    if (random < 0.4) {
      const vehicles = ['4XYZ789', '2ABC123', '8DEF456', '5GHI789', '1JKL012', '7MNO345', '3PQR678', '9STU901'];
      const vehicleIndex = Math.floor((minuteSeed % vehicles.length));
      alerts.push({
        priority: 'high',
        text: `BOLO: Stolen vehicle reported - License: ${vehicles[vehicleIndex]}`,
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      });
    }
    
    // Traffic Enforcement
    if (random < 0.6) {
      const locations = ['Vinewood', 'Downtown', 'Vespucci Beach', 'Del Perro', 'Little Seoul', 'Rockford Hills', 'Pillbox Hill', 'Mission Row'];
      const locationIndex = Math.floor((minuteSeed % locations.length));
      alerts.push({
        priority: 'medium',
        text: `Traffic enforcement priority: ${locations[locationIndex]} area`,
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      });
    }
    
    // Warrant Alerts
    if (random2 < 0.35) {
      const suspects = ['Robert Chen', 'Maria Santos', 'James Wilson', 'Lisa Anderson', 'David Martinez', 'Sarah Johnson'];
      const suspectIndex = Math.floor((minuteSeed % suspects.length));
      alerts.push({
        priority: 'high',
        text: `Active warrant: ${suspects[suspectIndex]} - Armed and dangerous`,
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      });
    }
    
    // Gang Activity
    if (random2 < 0.5) {
      const areas = ['Grove Street', 'Davis', 'Rancho', 'Cypress Flats', 'El Burro Heights'];
      const areaIndex = Math.floor((minuteSeed % areas.length));
      alerts.push({
        priority: 'medium',
        text: `Increased gang activity reported in ${areas[areaIndex]}`,
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      });
    }
    
    // Missing Person
    if (random3 < 0.25) {
      const ages = ['8', '12', '15', '22', '45', '67'];
      const ageIndex = Math.floor((minuteSeed % ages.length));
      alerts.push({
        priority: 'high',
        text: `AMBER Alert: Missing person - ${ages[ageIndex]} years old - Last seen Downtown`,
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      });
    }
    
    // Suspicious Activity
    if (random3 < 0.4) {
      const activities = ['suspicious vehicle circling', 'possible burglary in progress', 'suspicious persons loitering', 'possible drug activity'];
      const activityIndex = Math.floor((minuteSeed % activities.length));
      alerts.push({
        priority: 'medium',
        text: `Report of ${activities[activityIndex]} - Units requested`,
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      });
    }
    
    // Road Closures
    if (random3 < 0.55) {
      const roads = ['Olympic Freeway', 'Del Perro Freeway', 'Great Ocean Highway', 'La Puerta Freeway'];
      const roadIndex = Math.floor((minuteSeed % roads.length));
      alerts.push({
        priority: 'low',
        text: `Road closure: ${roads[roadIndex]} - Accident investigation in progress`,
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      });
    }
    
    // Weather Alerts
    if (random2 < 0.7 && (hour >= 5 && hour <= 8)) {
      alerts.push({
        priority: 'low',
        text: 'Weather advisory: Heavy fog reported - Reduced visibility',
        time: '05:30'
      });
    }
    
    // Community Events
    if (dayOfWeek === 6 && hour >= 10 && hour <= 18) {
      alerts.push({
        priority: 'low',
        text: 'Community event: Increased pedestrian traffic in Vinewood area',
        time: '10:00'
      });
    }
    
    // System maintenance alert (late night/early morning)
    if (hour >= 2 && hour < 4) {
      alerts.push({
        priority: 'low',
        text: 'System maintenance in progress: Some features may be unavailable',
        time: '02:00'
      });
    } else if (hour >= 23 || hour < 2) {
      alerts.push({
        priority: 'low',
        text: 'Scheduled system maintenance: 02:00 - 04:00',
        time: '23:00'
      });
    }
    
    // Always show at least one general alert if no others
    if (alerts.length === 0) {
      alerts.push({
        priority: 'low',
        text: 'All systems operational - No critical alerts at this time',
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      });
    }
    
    // Limit to 10 most recent alerts
    const displayAlerts = alerts.slice(0, 10);
    
    // Generate HTML for alerts
    container.innerHTML = displayAlerts.map(alert => `
      <div class="alert-item">
        <span class="alert-priority ${alert.priority}">${alert.priority === 'high' ? 'HIGH' : alert.priority === 'medium' ? 'MED' : 'LOW'}</span>
        <span class="alert-text">${alert.text}</span>
        <span class="alert-time">${alert.time}</span>
      </div>
    `).join('');
  }
  
  function attachMdtButtonHandlers() {
    const mdtButtons = document.querySelectorAll('.mdt-button[data-name]');
    
    mdtButtons.forEach(button => {
      // Remove any existing click handlers by cloning and replacing
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      const windowName = newButton.dataset.name;
      newButton.addEventListener('click', function() {
        openWindow(windowName);
      });
    });
  }
  
  function setupLogoutButton() {
    const logoutButton = document.getElementById('logoutButton')
    if (logoutButton) {
      logoutButton.addEventListener('click', async () => {
        const confirmed = await showCustomDialog(
          'Are you sure you want to close LAPD MDT?\n\nThis will log you out of the system.',
          'Close LAPD MDT'
        );
        
        if (confirmed) {
          performLogout()
        }
      })
    }
  }
  
  function performLogout() {
    // Clear session
    sessionStorage.removeItem('lapdMdtLoggedIn')
    sessionStorage.removeItem('loggedInOfficer')
    sessionStorage.removeItem('officerDutyStatus')
    
    // Disable scrolling on window content
    const windowContent = document.querySelector('#mdtWindow .window-content');
    if (windowContent) {
      windowContent.style.overflowY = 'hidden';
    }
    
    // Disable resizing (back to login mode)
    const mdtWindow = document.getElementById('mdtWindow');
    if (mdtWindow) {
      mdtWindow.classList.add('login-mode');
    }
    
    // Hide MDT content and show login
    mdtContent.style.animation = 'fadeOut 0.3s ease forwards'
    setTimeout(() => {
      mdtContent.style.display = 'none'
      loginScreen.style.display = 'flex'
      loginScreen.style.animation = 'fadeIn 0.3s ease forwards'
      
      // Reset form
      loginForm.reset()
      loginError.style.display = 'none'
      
      // Don't close the window, just switch to login screen
      // User can manually close if needed
    }, 300)
  }
  
  // Expose performLogout to global scope for HTML onclick handlers
  window.performLogout = performLogout;
  
  // Attach logout to window close button
  window.addEventListener('load', () => {
    const closeBtn = document.querySelector('#mdtCloseButton')
    if (closeBtn) {
      closeBtn.onclick = async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Show confirmation dialog
        const confirmed = await showCustomDialog(
          'Are you sure you want to close LAPD MDT?\n\nThis will log you out of the system.',
          'Close LAPD MDT'
        );
        
        if (confirmed) {
          // Perform logout
          sessionStorage.removeItem('lapdMdtLoggedIn')
          sessionStorage.removeItem('loggedInOfficer')
          sessionStorage.removeItem('officerDutyStatus')
          
          const mdtWindow = document.getElementById('mdtWindow')
          const loginScreen = document.getElementById('loginScreen')
          const mdtContent = document.getElementById('mdtContent')
          const loginForm = document.getElementById('loginForm')
          const loginError = document.getElementById('loginError')
          
          // Reset to login screen
          if (mdtContent) mdtContent.style.display = 'none'
          if (loginScreen) {
            loginScreen.style.display = 'flex'
            if (loginForm) loginForm.reset()
            if (loginError) loginError.style.display = 'none'
          }
          
          // Hide window
          if (mdtWindow) mdtWindow.style.display = 'none'
          
          // Remove taskbar button
          const taskbarButton = document.querySelector('.taskbar-app[data-window="mdtWindow"]')
          if (taskbarButton) taskbarButton.remove()
        }
      }
    }
  })
})()

// Main Application Initialization (runs after login)
async function initMainApplication() {
;(async function () {
  const config = await getConfig()
  const language = await getLanguage()
  if (config.updateDomWithLanguageOnLoad) await updateDomWithLanguage('index')
  const version = await (await fetch('/version')).text()
  const versionEl = document.querySelector('.overlay .settings .version')
  if (versionEl) {
    versionEl.innerHTML = `${language.index.settings.version}: ${version}`
  }

  // Load officer information from server
  const officerInformationData = await (
    await fetch('/data/officerInformationData')
  ).json()
  
  // Check if there's stored session data and merge it with server data
  let sessionData = {}
  try {
    const storedSession = localStorage.getItem('officerInformationSession')
    if (storedSession) {
      sessionData = JSON.parse(storedSession)
    }
  } catch (e) {
    // Failed to load session data, will use server data
  }
  
  // Merge server data with session data (session data takes precedence for form fields)
  const mergedData = Object.assign({}, officerInformationData || {}, sessionData)
  
  applyOfficerInformationToDOM(mergedData)
  try {
    // persist a session copy so other pages (reports/citation/arrest) can prefill
    localStorage.setItem(
      'officerInformationSession',
      JSON.stringify(mergedData || {})
    )
  } catch (e) {
    // Failed to save session data
  }
  
  // Add auto-save functionality for form changes
  setupAutoSaveForOfficerInformation()
})()
}

// Function to setup auto-save for officer information form changes
function setupAutoSaveForOfficerInformation() {
  const inputWrapper = document.querySelector(
    '.overlay .settings .officerInformation .inputWrapper'
  )
  
  if (!inputWrapper) return
  
  // Get all input and select elements
  const formElements = inputWrapper.querySelectorAll('input, select')
  
  formElements.forEach(element => {
    element.addEventListener('change', saveToLocalStorage)
    element.addEventListener('input', saveToLocalStorage)
  })
  
  function saveToLocalStorage() {
    try {
      // Helper function to get value from input or select
      const getFieldValue = (selector) => {
        const input = inputWrapper.querySelector(`${selector} input`)
        const select = inputWrapper.querySelector(`${selector} select`)
        const element = input || select
        return element && element.value.trim() !== '' ? element.value.trim() : null
      }
      
      // Collect current form data (excluding duty status which is managed separately)
      const currentFormData = {
        firstName: getFieldValue('.firstName'),
        lastName: getFieldValue('.lastName'),
        badgeNumber: getFieldValue('.badgeNumber'),
        rank: getFieldValue('.rank'),
        callSign: getFieldValue('.callSign'),
        agency: getFieldValue('.agency'),
        division: getFieldValue('.division'),
        unit: getFieldValue('.unit'),
      }
      
      // Save to localStorage
      localStorage.setItem('officerInformationSession', JSON.stringify(currentFormData))
      
      // Update the header display immediately
      applyOfficerInformationToDOM(currentFormData)
      
    } catch (e) {
      // Auto-save failed, changes will be saved on manual save
    }
  }
}

// Setup duty status dropdown to update display immediately
function setupDutyStatusUpdater() {
  const dutyStatusSelect = document.getElementById('officerInformationDutyStatusInput')
  const dutyStatusText = document.getElementById('dutyStatusText')
  
  if (dutyStatusSelect && dutyStatusText) {
    dutyStatusSelect.addEventListener('change', function() {
      const selectedStatus = this.value
      dutyStatusText.textContent = selectedStatus
      // Remove all existing duty status classes
      dutyStatusText.className = 'detail-value duty-status'
      // Apply appropriate class based on duty status
      switch (selectedStatus) {
        case 'ON DUTY':
          dutyStatusText.classList.add('on-duty')
          break
        case 'OFF DUTY':
          dutyStatusText.classList.add('off-duty')
          break
        case 'BUSY':
          dutyStatusText.classList.add('busy')
          break
        case 'UNAVAILABLE':
          dutyStatusText.classList.add('unavailable')
          break
        case 'CODE 7':
          dutyStatusText.classList.add('code7')
          break
        case 'EMERGENCY':
          dutyStatusText.classList.add('emergency')
          break
        default:
          dutyStatusText.classList.add('unavailable')
          break
      }
      // Store duty status in localStorage
      try {
        const officerInfo = JSON.parse(localStorage.getItem('officerInformationSession')) || {};
        officerInfo.dutyStatus = selectedStatus;
        localStorage.setItem('officerInformationSession', JSON.stringify(officerInfo));
      } catch (e) {
        // Failed to persist duty status
      }
    })
  }
}

// Initialize duty status updater when page loads
setupDutyStatusUpdater()

let currentShift = null

const timeWS = new WebSocket(`ws://${location.host}/ws`)
timeWS.onopen = () => timeWS.send('interval/time')

timeWS.onmessage = async (event) => {
  const config = await getConfig()
  const data = JSON.parse(event.data)
  const inGameDateArr = data.response.split(':')
  const inGameDate = new Date()
  inGameDate.setHours(inGameDateArr[0])
  inGameDate.setMinutes(inGameDateArr[1])
  inGameDate.setSeconds(inGameDateArr[2])
  const realDate = new Date()
  
  // Update taskbar time
  document.querySelector('.taskbar .time').innerHTML = `${
    config.useInGameTime
      ? inGameDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      : realDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  }<br>${realDate.toLocaleDateString()}`

  // Update Windows taskbar time with in-game or real time
  const taskbarTimeEl = document.getElementById('taskbarTime')
  const taskbarDateEls = document.querySelectorAll('.taskbar-date')
  if (taskbarTimeEl) {
    taskbarTimeEl.textContent = config.useInGameTime
      ? inGameDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      : realDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  }
  if (taskbarDateEls.length > 0) {
    const dateStr = realDate.toLocaleDateString('en-US')
    taskbarDateEls.forEach(el => el.textContent = dateStr)
  }
  
  // Update header time and date to match taskbar
  const headerDate = document.getElementById('headerDate')
  const headerTime = document.getElementById('headerTime')
  if (headerDate) {
    headerDate.textContent = realDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
  }
  if (headerTime) {
    headerTime.textContent = config.useInGameTime
      ? inGameDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      : realDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  }

  currentShift =
    currentShift ?? (await (await fetch('/data/currentShift')).json())
  // Always use realDate for duration calculation to avoid negative values
  applyCurrentShiftToDOM(
    currentShift,
    realDate
  )
}

const startShiftBtn = document.querySelector('.overlay .settings .currentShift .buttonWrapper .startShift');
if (startShiftBtn) {
  startShiftBtn.addEventListener('click', async function () {
    if (this.classList.contains('loading')) return
    showLoadingOnButton(this)

    const response = await (
      await fetch('/post/modifyCurrentShift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'start',
      })
    ).text()

    const language = await getLanguage()
    if (response == 'OK') {
      // Force fetch latest shift data and reset timer
      currentShift = await (await fetch('/data/currentShift')).json()
      // Overwrite startTime with current real time for timer accuracy
      currentShift.startTime = new Date().toISOString()
      applyCurrentShiftToDOM(currentShift, new Date())
      const officerInformationData = await (
        await fetch('/data/officerInformationData')
      ).json()
      // Automatically set both duty status dropdowns to UNAVAILABLE when starting shift
      const dutyStatusSelect = document.getElementById('dutyStatus')
      if (dutyStatusSelect) {
        dutyStatusSelect.value = 'UNAVAILABLE'
        dutyStatusSelect.dispatchEvent(new Event('change'))
      }
      const officerDutyStatusSelect = document.getElementById('officerInformationDutyStatusInput')
      if (officerDutyStatusSelect) {
        officerDutyStatusSelect.value = 'UNAVAILABLE'
        officerDutyStatusSelect.dispatchEvent(new Event('change'))
      }
      if (officerInformationData.rank && officerInformationData.lastName) {
        showNotification(
          `${language.index.notifications.currentShiftStartedOfficerInformationExists} ${officerInformationData.rank} ${officerInformationData.lastName}`
        )
      } else {
        showNotification(language.index.notifications.currentShiftStarted)
      }
    } else {
      showNotification(
        language.index.notifications.currentShiftStartedError,
        'error'
      )
    }

    hideLoadingOnButton(this)
  })
}

const endShiftBtn = document.querySelector('.overlay .settings .currentShift .buttonWrapper .endShift');
if (endShiftBtn) {
  endShiftBtn.addEventListener('click', async function () {
    if (this.classList.contains('loading')) return
    showLoadingOnButton(this)

    const response = await (
      await fetch('/post/modifyCurrentShift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'end',
      })
    ).text()

    const language = await getLanguage()
    if (response == 'OK') {
      currentShift = await (await fetch('/data/currentShift')).json()
      // Set duty status to OFF DUTY
      // Set both duty status dropdowns to OFF DUTY and trigger change
      const dutyStatusSelect = document.getElementById('dutyStatus')
      if (dutyStatusSelect) {
        dutyStatusSelect.value = 'OFF DUTY'
        dutyStatusSelect.dispatchEvent(new Event('change'))
      }
      const officerDutyStatusSelect = document.getElementById('officerInformationDutyStatusInput')
      if (officerDutyStatusSelect) {
        officerDutyStatusSelect.value = 'OFF DUTY'
        officerDutyStatusSelect.dispatchEvent(new Event('change'))
      }
      showNotification(language.index.notifications.currentShiftEnded)
    } else {
      showNotification(
        language.index.notifications.currentShiftEndedError,
        'error'
      )
    }

    hideLoadingOnButton(this)
  })
}

async function applyCurrentShiftToDOM(currentShift, currentDate) {
  const language = await getLanguage()
  const dutyStatusDisplay = document.getElementById('dutyStatusDisplay')
  
  if (currentShift.startTime) {
    // Officer is on duty
    const startShiftBtn = document.querySelector(
      '.overlay .settings .currentShift .buttonWrapper .startShift'
    )
    const endShiftBtn = document.querySelector(
      '.overlay .settings .currentShift .buttonWrapper .endShift'
    )
    const startTimeEl = document.querySelector(
      '.overlay .settings .currentShift .startTime'
    )
    const durationEl = document.querySelector(
      '.overlay .settings .currentShift .duration'
    )
    
    if (startShiftBtn) startShiftBtn.disabled = true
    if (endShiftBtn) endShiftBtn.disabled = false

    if (startTimeEl) {
      startTimeEl.innerHTML = `${
        language.index.settings.currentShift.startTime
      }: ${new Date(currentShift.startTime).toLocaleTimeString()}`
    }

    // Clear any previous interval
    if (durationInterval) clearInterval(durationInterval)
    // Start live duration update
    let liveDate = currentDate;
    function updateDuration() {
      // Advance liveDate by 1 second each tick to match the time source
      liveDate = new Date(liveDate.getTime() + 1000);
      const duration = liveDate.getTime() - new Date(currentShift.startTime).getTime();
      convertMsToTimeString(duration).then((durationStr) => {
        const durationEl = document.querySelector(
          '.overlay .settings .currentShift .duration'
        )
        if (durationEl) {
          durationEl.innerHTML = `${language.index.settings.currentShift.duration}: ${durationStr}`;
        }
      });
    }
    updateDuration();
    durationInterval = setInterval(() => {
      updateDuration();
    }, 1000);

    const duration = await convertMsToTimeString(
      currentDate.getTime() - new Date(currentShift.startTime).getTime()
    )
    if (durationEl) {
      durationEl.innerHTML = `${language.index.settings.currentShift.duration}: ${duration}`
    }
    
    // Update header status based on current duty status selection
    if (dutyStatusDisplay) {
      const dutyStatusSelect = document.getElementById('dutyStatus')
      const currentDutyStatus = dutyStatusSelect ? dutyStatusSelect.value : 'ON DUTY'
      
      dutyStatusDisplay.textContent = currentDutyStatus
      
      // Apply appropriate color class based on duty status
      switch (currentDutyStatus) {
        case 'ON DUTY':
          dutyStatusDisplay.className = 'status-badge online'
          break
        case 'OFF DUTY':
          dutyStatusDisplay.className = 'status-badge off-duty'
          break
        case 'UNAVAILABLE':
          dutyStatusDisplay.className = 'status-badge unavailable'
          break
        case 'CODE 7':
          dutyStatusDisplay.className = 'status-badge code7'
          break
        case 'EMERGENCY':
          dutyStatusDisplay.className = 'status-badge emergency'
          break
        default:
          dutyStatusDisplay.className = 'status-badge online'
      }
    }
  } else {
    // Officer is off duty
    if (durationInterval) clearInterval(durationInterval)
    
    const startShiftBtn = document.querySelector(
      '.overlay .settings .currentShift .buttonWrapper .startShift'
    )
    const endShiftBtn = document.querySelector(
      '.overlay .settings .currentShift .buttonWrapper .endShift'
    )
    const startTimeEl = document.querySelector(
      '.overlay .settings .currentShift .startTime'
    )
    const durationEl = document.querySelector(
      '.overlay .settings .currentShift .duration'
    )
    
    if (startShiftBtn) startShiftBtn.disabled = false
    if (endShiftBtn) endShiftBtn.disabled = true
    if (startTimeEl) startTimeEl.innerHTML = language.index.settings.currentShift.offDuty
    if (durationEl) durationEl.innerHTML = ''
    
    // Update header status to OFF DUTY
    if (dutyStatusDisplay) {
      dutyStatusDisplay.textContent = 'OFF DUTY'
      dutyStatusDisplay.className = 'status-badge off-duty'
    }
  }
}

timeWS.onclose = async () => {
  const language = await getLanguage()
  showNotification(language.index.notifications.webSocketOnClose, 'warning', -1)
}

const locationWS = new WebSocket(`ws://${location.host}/ws`)
locationWS.onopen = () => locationWS.send('interval/playerLocation')

locationWS.onmessage = async (event) => {
  const location = JSON.parse(event.data).response
  const icon = document.querySelector('.iconAccess .location').innerHTML
  document.querySelector(
    '.taskbar .location'
  ).innerHTML = `${icon} ${location.Postal} ${location.Street},<br>${location.Area}`
}

locationWS.onclose = async () => {
  const language = await getLanguage()
  showNotification(language.index.notifications.webSocketOnClose, 'warning', -1)
}

// Desktop icon click handlers (only for .desktopItem, not .mdt-button as those are handled by attachMdtButtonHandlers)
const desktopItems = document.querySelectorAll('.desktop .desktopItem:not(.mdt-button)')

for (const desktopItem of desktopItems) {
  desktopItem.addEventListener('click', function () {
    openWindow(this.dataset.name)
  })
}

async function openWindow(name) {
  const config = await getConfig()
  const url = `/page/${name}.html`
  // Use smaller default window sizes for better desktop usage
  const size = [
    Math.max(config.initialWindowWidth || 600, 600), 
    Math.max(config.initialWindowHeight || 550, 550)
  ]
  
  // Get the MDT window position if it exists
  const mdtWindow = document.getElementById('mdtWindow');
  let baseOffsetX = 100; // Default offset from left edge
  let baseOffsetY = 100; // Default offset from top
  
  if (mdtWindow && mdtWindow.style.display !== 'none') {
    // Check if MDT window has been positioned (has inline left/top styles from dragging)
    if (mdtWindow.style.left && mdtWindow.style.top) {
      // Use the inline styles if window has been dragged
      baseOffsetX = parseInt(mdtWindow.style.left);
      baseOffsetY = parseInt(mdtWindow.style.top);
    } else {
      // Otherwise calculate from its actual rendered position
      const mdtRect = mdtWindow.getBoundingClientRect();
      baseOffsetX = mdtRect.left;
      baseOffsetY = mdtRect.top;
    }
  }

  const existingWindows = document.querySelectorAll('.overlay .windows .window')
  const cascade = existingWindows.length * 25;

  const windowElement = document.createElement('div')
  windowElement.style.width = `${size[0]}px`
  windowElement.style.height = `${size[1]}px`
  windowElement.style.left = `${baseOffsetX + cascade}px`
  windowElement.style.top = `${baseOffsetY + cascade}px`
  windowElement.style.scale = '0'
  windowElement.classList.add('window')
  windowElement.classList.add('window-container') // Add window-container class for styling

  // Add resize handles to this window
  const resizeDirections = ['top', 'right', 'bottom', 'left', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
  resizeDirections.forEach(direction => {
    const handle = document.createElement('div');
    handle.className = `resize-handle resize-${direction}`;
    windowElement.appendChild(handle);
  });
  
  // Attach resize event handlers to this window
  if (window.attachResizeHandlers) {
    window.attachResizeHandlers(windowElement);
  }

  const taskbarIcon = document.createElement('button')

  function focusWindow() {
    document.querySelectorAll('.overlay .windows .window').forEach((win) => {
      win.style.zIndex = '50000' // Keep unfocused windows above header
    })
    // Raise focused window above the header so its header receives pointer events
    // (necessary so users can drag windows even when the header has a very high z-index)
    windowElement.style.zIndex = '100000'

    document
      .querySelectorAll('.taskbar .icons button.focused')
      .forEach((icon) => {
        icon.classList.remove('focused')
      })
    taskbarIcon.classList.add('focused')
  }
  windowElement.addEventListener('mousedown', focusWindow)

  const iframe = document.createElement('iframe')
  iframe.src = url
  const header = document.createElement('div')
  header.classList.add('window-titlebar')
  let x, y
  let lastSize
  let lastOffset
  header.addEventListener('mousedown', function (e) {
    e.preventDefault()
    x = e.clientX - windowElement.offsetLeft
    y = e.clientY - windowElement.offsetTop
    document.onmouseup = function () {
      document.onmouseup = null
      document.onmousemove = null
      windowElement.style.transition = '250ms ease'
    }
    // determine bounds container: try .desktop, then .mdt-desktop, then documentElement
    const boundsContainer = document.querySelector('.desktop') || document.querySelector('.mdt-desktop') || document.documentElement
    document.onmousemove = function (e) {
      if (
        e.clientX < 0 ||
        e.clientY < 0 ||
        e.clientX > boundsContainer.clientWidth ||
        e.clientY > boundsContainer.clientHeight
      ) {
        document.onmouseup()
        return
      }
      if (e.target == windowControls || windowControls.contains(e.target)) {
        document.onmouseup()
        return
      }
      windowElement.style.transition = 'none'
      windowElement.style.left = e.clientX - x + 'px'
      windowElement.style.top = e.clientY - y + 'px'
      if (windowElement.classList.contains('maximized')) {
        windowElement.classList.remove('maximized')
        windowElement.style.width = lastSize[0]
        windowElement.style.height = lastSize[1]
        windowElement.querySelector(
          '.windowHeader .windowControls .maximizeButton'
        ).innerHTML = document.querySelector(
          '.iconAccess .maximizeWindow'
        ).innerHTML
      }
    }
  })

  new ResizeObserver(() => {
    windowElement.onmouseup = function () {
      windowElement.style.transition = '250ms ease'
    }
    windowElement.onmousedown = function () {
      windowElement.style.transition = 'none'
    }
  }).observe(windowElement)

  const windowControls = document.createElement('div')
  windowControls.classList.add('window-controls')

  const windowTitle = document.createElement('div')
  windowTitle.classList.add('window-title')

  const icon = document.createElement('img')
  icon.classList.add('window-icon')
  icon.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Seal_of_the_Los_Angeles_Police_Department.png/1033px-Seal_of_the_Los_Angeles_Police_Department.png'
  icon.alt = ''

  const title = document.createElement('span')
  iframe.addEventListener('load', () => {
    title.textContent = iframe.contentDocument.title
    taskbarIcon.title = iframe.contentDocument.title
    windowElement.style.minWidth = `${
      windowTitle.offsetWidth + windowControls.offsetWidth
    }px`
    windowElement.style.scale = '1'

    new MutationObserver(() => {
      title.textContent = iframe.contentDocument.title
      taskbarIcon.title = iframe.contentDocument.title
      windowElement.style.minWidth = `${
        windowTitle.offsetWidth + windowControls.offsetWidth
      }px`
    }).observe(iframe.contentDocument.querySelector('title'), {
      childList: true,
    })

    iframe.contentWindow.addEventListener('mousedown', focusWindow)
    iframe.contentWindow.addEventListener('mousedown', function () {
      document.querySelector('.overlay .settings').classList.add('hide')
    })
  })

  const minimize = document.createElement('button')
  minimize.classList.add('window-btn', 'minimize')
  minimize.textContent = '−'
  minimize.title = 'Minimize'
  minimize.addEventListener('click', function () {
    windowElement.classList.toggle('minimized')
    if (!windowElement.classList.contains('minimized')) {
      focusWindow()
    } else {
      taskbarIcon.classList.remove('focused')
    }
  })

  const maximize = document.createElement('button')
  maximize.classList.add('window-btn', 'maximize')
  maximize.textContent = '□'
  maximize.title = 'Maximize'
  maximize.addEventListener('click', function () {
    if (windowElement.classList.contains('maximized')) {
      // restore previous z-index if we changed it when maximizing
      if (windowElement.__lastZIndex !== undefined && windowElement.__lastZIndex !== '') {
        windowElement.style.zIndex = windowElement.__lastZIndex
      } else {
        windowElement.style.zIndex = '50000' // Keep above header
      }

      windowElement.classList.remove('maximized')
      windowElement.style.width = lastSize[0]
      windowElement.style.height = lastSize[1]
      windowElement.style.left = lastOffset[0]
      windowElement.style.top = lastOffset[1]
      maximize.textContent = '□'
    } else {
      lastSize = [windowElement.style.width, windowElement.style.height]
      lastOffset = [windowElement.style.left, windowElement.style.top]
      // remember z-index and raise above header so controls are clickable
      windowElement.__lastZIndex = windowElement.style.zIndex || ''
      windowElement.style.zIndex = '100000'
      // maximize window to full screen, now above header
      windowElement.style.width = 'calc(100% - 2px)'
      windowElement.style.height = `calc(100% - var(--tb-height))`
      windowElement.style.left = '0'
      windowElement.style.top = '0'
      windowElement.style.minWidth = `${
        windowTitle.offsetWidth + windowControls.offsetWidth
      }px`
      windowElement.classList.add('maximized')
      maximize.textContent = '❐'
    }
  })
  header.addEventListener('dblclick', function () {
    maximize.click()
  })

  const close = document.createElement('button')
  close.classList.add('window-btn', 'close')
  close.textContent = '×'
  close.title = 'Close'
  close.addEventListener('click', async function () {
    windowElement.style.pointerEvents = 'none'
    taskbarIcon.style.pointerEvents = 'none'
    const CSSRootTransitionTimeLong = parseInt(
      getComputedStyle(document.querySelector(':root'))
        .getPropertyValue('--transition-time-long')
        .trim()
        .slice(0, -'ms'.length)
    )
    windowElement.style.scale = '0'
    taskbarIcon.style.opacity = '0'
    await sleep(CSSRootTransitionTimeLong)
    windowElement.remove()
    taskbarIcon.remove()
  })
  windowTitle.appendChild(icon)
  windowTitle.appendChild(title)
  header.appendChild(windowTitle)
  windowControls.appendChild(minimize)
  windowControls.appendChild(maximize)
  windowControls.appendChild(close)
  header.appendChild(windowControls)
  windowElement.appendChild(header)
  windowElement.appendChild(iframe)

  document.querySelector('.overlay .windows').appendChild(windowElement)

  focusWindow()

  taskbarIcon.classList.add('open')
  // Use LAPD badge icon for taskbar
  const taskbarIconImg = document.createElement('img')
  taskbarIconImg.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Seal_of_the_Los_Angeles_Police_Department.png/1033px-Seal_of_the_Los_Angeles_Police_Department.png'
  taskbarIconImg.style.width = '20px'
  taskbarIconImg.style.height = '20px'
  taskbarIcon.appendChild(taskbarIconImg)
  taskbarIcon.addEventListener('click', function () {
    this.blur()
    if (
      !taskbarIcon.classList.contains('focused') &&
      !windowElement.classList.contains('minimized')
    ) {
      focusWindow()
    } else {
      minimize.click()
    }
  })

  taskbarIcon.style.opacity = '0'

  document.querySelector('.taskbar .icons').appendChild(taskbarIcon)

  requestAnimationFrame(() => {
    taskbarIcon.style.opacity = '1'
  })

  // Also add to Windows desktop taskbar
  const windowsTaskbarApps = document.querySelector('.taskbar-apps')
  if (windowsTaskbarApps) {
    const taskbarAppButton = document.createElement('button')
    taskbarAppButton.classList.add('taskbar-app')
    
    // Map of window names to display titles
    const windowTitles = {
      'pedSearch': 'Ped Search',
      'vehicleSearch': 'Vehicle Search',
      'reports': 'Reports',
      'shiftHistory': 'Shift History',
      'court': 'Court'
    }
    
    // Create icon element
    const taskbarIcon = document.createElement('img')
    taskbarIcon.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Seal_of_the_Los_Angeles_Police_Department.png/1033px-Seal_of_the_Los_Angeles_Police_Department.png'
    taskbarIcon.alt = ''
    taskbarIcon.classList.add('taskbar-icon')
    
    // Create label
    const taskbarLabel = document.createElement('span')
    taskbarLabel.textContent = windowTitles[name] || name
    
    taskbarAppButton.appendChild(taskbarIcon)
    taskbarAppButton.appendChild(taskbarLabel)
    
    // Add click handler to focus/minimize window
    taskbarAppButton.addEventListener('click', function () {
      if (windowElement.classList.contains('minimized')) {
        windowElement.classList.remove('minimized')
        focusWindow()
        taskbarAppButton.classList.add('active')
      } else if (document.activeElement === windowElement || windowElement.style.zIndex === '100000') {
        windowElement.classList.add('minimized')
        taskbarAppButton.classList.remove('active')
      } else {
        focusWindow()
        taskbarAppButton.classList.add('active')
      }
    })
    
    // Mark as active initially
    taskbarAppButton.classList.add('active')
    
    windowsTaskbarApps.appendChild(taskbarAppButton)
    
    // Remove taskbar button when window closes
    const originalCloseHandler = close.onclick
    close.onclick = async function() {
      taskbarAppButton.remove()
      if (originalCloseHandler) {
        await originalCloseHandler.call(this)
      }
    }
    
    // Update active state based on focus
    const originalFocusWindow = focusWindow
    focusWindow = function() {
      originalFocusWindow()
      // Remove active from all taskbar apps
      document.querySelectorAll('.taskbar-app').forEach(btn => btn.classList.remove('active'))
      taskbarAppButton.classList.add('active')
    }
  }
}

document.addEventListener('mousedown', function (e) {
  const taskbarIcon = document.querySelector('.taskbar .icons .settings')
  const settingsEl = document.querySelector('.overlay .settings')
  
  // Only proceed if both elements exist
  if (!taskbarIcon || !settingsEl) {
    return;
  }
  
  if (
    e.target == taskbarIcon ||
    taskbarIcon.contains(e.target) ||
    settingsEl.classList.contains('hide') ||
    e.target == settingsEl ||
    settingsEl.contains(e.target)
  ) {
    return
  }
  settingsEl.classList.add('hide')
})

new MutationObserver(() => {
  setMinWidthOnTaskbar()
}).observe(document.querySelector('.taskbar'), {
  childList: true,
  subtree: true,
})

setMinWidthOnTaskbar()
function setMinWidthOnTaskbar() {
  const taskbar = document.querySelector('.taskbar')
  const locationWidth = taskbar.querySelector('.location').clientWidth
  const timeWidth = taskbar.querySelector('.time').clientWidth
  const additionalWidth =
    locationWidth > timeWidth ? locationWidth * 2 : timeWidth * 2
  taskbar.style.minWidth = `${
    taskbar.querySelector('.icons').clientWidth + additionalWidth
  }px`
}

// Auto-fill officer information (only if element exists)
const autoFillButton = document.querySelector('.overlay .settings .officerInformation .autoFill');
if (autoFillButton) {
  autoFillButton.addEventListener('click', async function () {
    if (this.classList.contains('loading')) return
    showLoadingOnButton(this)

    const officerInformation = await (
      await fetch('/data/officerInformation')
    ).json()
    applyOfficerInformationToDOM(officerInformation)

    hideLoadingOnButton(this)
  });
}

function applyOfficerInformationToDOM(officerInformation) {
  const inputWrapper = document.querySelector(
    '.overlay .settings .officerInformation .inputWrapper'
  )
  for (const key in officerInformation) {
    try {
      if (officerInformation[key]) {
        const input = inputWrapper.querySelector(`.${key} input`)
        const select = inputWrapper.querySelector(`.${key} select`)
        const element = input || select
        if (element) {
          element.value = officerInformation[key]
        }
      }
    } catch (e) {
      // ignore missing inputs/selects
    }
  }
  
  // Update header officer name and rank
  const officerDisplayName = document.getElementById('officerDisplayName')
  const officerRankDisplay = document.getElementById('officerRankDisplay')
  
  if (officerDisplayName && officerInformation.firstName && officerInformation.lastName) {
    officerDisplayName.textContent = `${officerInformation.firstName} ${officerInformation.lastName}`
  }
  
  // Update rank display based on officer rank
  if (officerRankDisplay && officerInformation.rank) {
    const rank = officerInformation.rank
    const supervisoryRanks = [
      'Police Sergeant I', 'Police Sergeant II', 'Detective Sergeant I', 'Detective Sergeant II',
      'Police Lieutenant I', 'Police Lieutenant II', 'Detective Lieutenant I', 'Detective Lieutenant II',
      'Police Captain I', 'Police Captain II', 'Police Captain III',
      'Police Commander', 'Deputy Chief', 'Assistant Chief', 'Chief of Police'
    ]
    
    if (supervisoryRanks.includes(rank)) {
      // For supervisory ranks, show the actual rank without Roman numerals
      const displayRank = rank
        .replace('Police ', '')
        .replace('Detective ', '')
        .replace(/ I+$/g, '') // Remove Roman numerals (I, II, III) at the end
      officerRankDisplay.textContent = displayRank
    } else {
      // For non-supervisory ranks, just show "Officer"
      officerRankDisplay.textContent = 'Officer'
    }
  } else {
    // Default to "Officer" if no rank is set
    if (officerRankDisplay) officerRankDisplay.textContent = 'Officer'
  }
  
  // Update officer info section
  if (officerInformation.badgeNumber) {
    const badgeElement = document.getElementById('badgeNumber')
    if (badgeElement) badgeElement.textContent = officerInformation.badgeNumber
  }
  
  // Update unit display with call sign
  const unitDisplay = document.getElementById('unitDisplay')
  if (unitDisplay) {
    if (officerInformation.callSign && officerInformation.callSign.trim()) {
      unitDisplay.textContent = officerInformation.callSign.trim()
    } else {
      unitDisplay.textContent = 'UNASSIGNED'
    }
  }
  
  // Update duty status display with color coding
  const dutyStatusDisplay = document.getElementById('dutyStatusDisplay')
  if (dutyStatusDisplay) {
    const dutyStatus = officerInformation.dutyStatus || 'UNKNOWN'
    dutyStatusDisplay.textContent = dutyStatus
    
    // Remove all existing status classes
    dutyStatusDisplay.className = 'status-badge'
    
    // Apply appropriate class based on duty status
    switch (dutyStatus) {
      case 'ON DUTY':
        dutyStatusDisplay.classList.add('online')
        break
      case 'OFF DUTY':
        dutyStatusDisplay.classList.add('off-duty')
        break
      case 'BUSY':
        dutyStatusDisplay.classList.add('busy')
        break
      case 'UNAVAILABLE':
        dutyStatusDisplay.classList.add('unavailable')
        break
      case 'CODE 7':
        dutyStatusDisplay.classList.add('code-7')
        break
      case 'EMERGENCY':
        dutyStatusDisplay.classList.add('emergency')
        break
      default:
        dutyStatusDisplay.classList.add('unavailable')
        break
    }
  }
  
  // Update duty status in Officer Status panel only if explicitly provided
  const dutyStatusText = document.getElementById('dutyStatusText')
  if (dutyStatusText && officerInformation.dutyStatus) {
    const dutyStatus = officerInformation.dutyStatus
    dutyStatusText.textContent = dutyStatus
    
    // Remove all existing duty status classes
    dutyStatusText.className = 'detail-value duty-status'
    
    // Apply appropriate class based on duty status
    switch (dutyStatus) {
      case 'ON DUTY':
        dutyStatusText.classList.add('on-duty')
        break
      case 'OFF DUTY':
        dutyStatusText.classList.add('off-duty')
        break
      case 'BUSY':
        dutyStatusText.classList.add('busy')
        break
      case 'UNAVAILABLE':
        dutyStatusText.classList.add('unavailable')
        break
      case 'CODE 7':
        dutyStatusText.classList.add('code7')
        break
      case 'EMERGENCY':
        dutyStatusText.classList.add('emergency')
        break
      default:
        dutyStatusText.classList.add('unavailable')
        break
    }
  }
  
  // Department: prefer server value, fallback to form input if available
  const departmentElement = document.getElementById('department')
  const departmentFromServer = officerInformation.agency
  const departmentFromForm = inputWrapper?.querySelector('.agency select')?.value
  if (departmentElement) {
    if (departmentFromServer) {
      departmentElement.textContent = departmentFromServer
    } else if (departmentFromForm) {
      departmentElement.textContent = departmentFromForm
    }
  }
  
  // Division: prefer server value, fallback to form input if available
  const divisionElement = document.getElementById('division')
  const divisionFromServer = officerInformation.division
  const divisionFromForm = inputWrapper?.querySelector('.division select')?.value
  if (divisionElement) {
    if (divisionFromServer) {
      divisionElement.textContent = divisionFromServer
    } else if (divisionFromForm) {
      divisionElement.textContent = divisionFromForm
    }
  }

  // Unit: prefer server value, fallback to form input if available
  const unitElement = document.getElementById('unit')
  const unitFromServer = officerInformation.unit
  const unitFromForm = inputWrapper?.querySelector('.unit input')?.value
  if (unitElement) {
    if (unitFromServer) {
      unitElement.textContent = unitFromServer
    } else if (unitFromForm) {
      unitElement.textContent = unitFromForm
    }
  }
}

// Settings overlay save button (only if element exists)
const settingsSaveButton = document.querySelector('.overlay .settings .officerInformation .save');
if (settingsSaveButton) {
  settingsSaveButton.addEventListener('click', async function () {
    if (this.classList.contains('loading')) return
    showLoadingOnButton(this)

    const inputWrapper = document.querySelector(
      '.overlay .settings .officerInformation .inputWrapper'
    )

    // Helper function to get value from input or select
    const getFieldValue = (selector) => {
      const input = inputWrapper.querySelector(`${selector} input`)
      const select = inputWrapper.querySelector(`${selector} select`)
      const element = input || select
      return element && element.value.trim() !== '' ? element.value.trim() : null
    }

    // Collect data from form fields
    const dataToSend = {
      firstName: getFieldValue('.firstName'),
      lastName: getFieldValue('.lastName'),
      badgeNumber: getFieldValue('.badgeNumber'),
      rank: getFieldValue('.rank'),
      callSign: getFieldValue('.callSign'),
      agency: getFieldValue('.agency'),
      division: getFieldValue('.division'),
      unit: getFieldValue('.unit'),
    }

    // Validate required fields
    const requiredFields = [
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'badgeNumber', label: 'Badge Number' },
      { key: 'rank', label: 'Rank' },
      { key: 'callSign', label: 'Call Sign' },
      { key: 'agency', label: 'Department' }
    ]

    const missingFields = requiredFields.filter(field => !dataToSend[field.key])
    
    if (missingFields.length > 0) {
      const language = await getLanguage()
      const missingFieldNames = missingFields.map(field => field.label).join(', ')
      showNotification(
        `Please fill in the following required fields: ${missingFieldNames}`,
        'error'
      )
      hideLoadingOnButton(this)
      return
    }

    const response = await (
      await fetch('/post/updateOfficerInformationData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      })
    ).text()

    const language = await getLanguage()

    if (response == 'OK') {
      showNotification(
        language.index.notifications.officerInformationSaved,
        'checkMark'
      )
      
      // Update the display with the new information
      // Try to get server data, but if server doesn't return division/unit immediately,
      // use the values we just sent so the UI updates instantly.
      let officerInformation = null
      try {
        officerInformation = await (
          await fetch('/data/officerInformationData')
        ).json()
      } catch (e) {
        // Failed to fetch updated data, will use sent data
      }

      // If server didn't return division/unit, merge in the just-sent values
      const merged = Object.assign({}, officerInformation || {}, dataToSend)
      applyOfficerInformationToDOM(merged)
      try {
        localStorage.setItem('officerInformationSession', JSON.stringify(merged))
      } catch (e) {
        // Failed to persist session data
      }
      
    } else {
      showNotification(
        language.index.notifications.officerInformationError,
        'error'
      )
    }

    hideLoadingOnButton(this)
  });
}

// Officer Management System Functions
function checkOfficerManagementAccess() {
  const loggedInOfficer = JSON.parse(sessionStorage.getItem('loggedInOfficer'));
  const managementBtn = document.getElementById('officerManagementBtn');
  
  if (loggedInOfficer && managementBtn) {
    // Define rank hierarchy (lower number = higher rank)
    const rankHierarchy = {
      'Chief of Police': 1,
      'Deputy Chief': 2,
      'Commander': 3,
      'Captain': 4,
      'Police Lieutenant II': 5,
      'Police Lieutenant I': 6,
      'Police Sergeant II': 7,
      'Police Sergeant I': 8,
      'Police Officer III+1 (FTO)': 9,
      'Police Officer III+1': 10,
      'Police Officer III': 11,
      'Police Officer II': 12,
      'Police Officer I': 13
    };
    
    // Get officer's rank number (default to 999 if not found)
    const officerRankNumber = rankHierarchy[loggedInOfficer.rank] || 999;
    
    // Only Sergeant II and above can access (rank number 7 or lower)
    if (officerRankNumber <= 7) {
      managementBtn.style.display = 'block';
    } else {
      managementBtn.style.display = 'none';
    }
  }
}

function openOfficerManagement() {
  const window = document.getElementById('officerMgmtWindow');
  if (window) {
    window.style.display = 'block';
    createOfficerMgmtTaskbarButton();
    loadOfficersList();
  }
}

function createOfficerMgmtTaskbarButton() {
  // Check if taskbar button already exists
  if (document.querySelector('.taskbar-app[data-window="officerMgmt"]')) {
    return;
  }
  
  const taskbar = document.querySelector('.taskbar-apps');
  if (!taskbar) return;
  
  const button = document.createElement('div');
  button.className = 'taskbar-app active';
  button.dataset.window = 'officerMgmt';
  button.innerHTML = `
    <svg viewBox="0 0 24 24" width="20" height="20" class="taskbar-icon">
      <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      <path fill="currentColor" d="M19 13h-2v2h-2v2h2v2h2v-2h2v-2h-2z"/>
    </svg>
    <span class="taskbar-label">LAPD Officer Management System</span>
  `;
  
  button.addEventListener('click', () => {
    const window = document.getElementById('officerMgmtWindow');
    if (window) {
      if (window.style.display === 'none') {
        window.style.display = 'block';
        button.classList.add('active');
      } else {
        window.style.display = 'none';
        button.classList.remove('active');
      }
    }
  });
  
  taskbar.appendChild(button);
}

function removeOfficerMgmtTaskbarButton() {
  const button = document.querySelector('.taskbar-app[data-window="officerMgmt"]');
  if (button) {
    button.remove();
  }
}

function closeOfficerMgmtWindow() {
  const window = document.getElementById('officerMgmtWindow');
  if (window) {
    window.style.display = 'none';
    removeOfficerMgmtTaskbarButton();
  }
}

function minimizeOfficerMgmtWindow() {
  const window = document.getElementById('officerMgmtWindow');
  const taskbarBtn = document.querySelector('.taskbar-app[data-window="officerMgmt"]');
  
  if (window) {
    window.style.display = 'none';
    if (taskbarBtn) {
      taskbarBtn.classList.remove('active');
    }
  }
}

function maximizeOfficerMgmtWindow() {
  const window = document.getElementById('officerMgmtWindow');
  if (window) {
    if (window.classList.contains('maximized')) {
      window.classList.remove('maximized');
      window.style.width = '900px';
      window.style.height = '600px';
      window.style.top = '5%';
      window.style.left = '50%';
      window.style.transform = 'translateX(-50%)';
    } else {
      window.classList.add('maximized');
      window.style.width = '100%';
      window.style.height = `calc(100% - 48px)`;
      window.style.top = '0';
      window.style.left = '0';
      window.style.transform = 'none';
    }
  }
}

// Player Settings Window Functions
function openPlayerSettings() {
  const window = document.getElementById('playerSettingsWindow');
  if (window) {
    window.style.display = 'block';
    createPlayerSettingsTaskbarButton();
    loadTimeDisplayModeSetting();
    loadInterfaceCustomization();
    
    // Update sidebar with officer information from session
    const loggedInOfficer = JSON.parse(sessionStorage.getItem('loggedInOfficer'));
    
    const sidebarName = document.getElementById('settingsSidebarName');
    const sidebarUnit = document.getElementById('settingsSidebarUnit');
    
    if (loggedInOfficer) {
      // Logged in - show full info
      const fullName = `${loggedInOfficer.firstName} ${loggedInOfficer.lastName}`;
      const unitID = loggedInOfficer.callSign || 'UNASSIGNED';
      
      if (sidebarName) {
        sidebarName.textContent = fullName;
        sidebarName.style.color = '#fff';
        sidebarName.style.fontSize = '16px';
        sidebarName.style.fontWeight = '600';
        sidebarName.style.marginBottom = '4px';
      }
      if (sidebarUnit) {
        sidebarUnit.textContent = unitID;
        sidebarUnit.style.display = 'block';
      }
    } else {
      // Not logged in - show just "05-220"
      if (sidebarName) {
        sidebarName.textContent = '05-220';
        sidebarName.style.color = '#8da9c4';
        sidebarName.style.fontSize = '13px';
        sidebarName.style.fontWeight = '400';
        sidebarName.style.marginBottom = '0';
      }
      if (sidebarUnit) {
        sidebarUnit.style.display = 'none';
      }
    }
  }
}

// Officer Profile Window Functions
function openOfficerProfile() {
  const window = document.getElementById('officerProfileWindow');
  const loggedInOfficer = JSON.parse(sessionStorage.getItem('loggedInOfficer'));
  
  if (window && loggedInOfficer) {
    // Populate form with officer data
    document.getElementById('profileFirstName').value = loggedInOfficer.firstName || '';
    document.getElementById('profileLastName').value = loggedInOfficer.lastName || '';
    document.getElementById('profileBadgeNumber').value = loggedInOfficer.badgeNumber || '';
    document.getElementById('profileRank').value = loggedInOfficer.rank || '';
    document.getElementById('profileCallSign').value = loggedInOfficer.callSign || '';
    document.getElementById('profileDivision').value = loggedInOfficer.division || '';
    document.getElementById('profileUnit').value = loggedInOfficer.unit || '';
    document.getElementById('profileOldPassword').value = ''; // Clear password fields
    document.getElementById('profileNewPassword').value = '';
    document.getElementById('profileConfirmPassword').value = '';
    
    // Show window
    window.style.display = 'block';
    createOfficerProfileTaskbarButton();
  }
}

function createOfficerProfileTaskbarButton() {
  const taskbarApps = document.querySelector('.taskbar-apps');
  if (!document.querySelector('.taskbar-app[data-window="officerProfileWindow"]')) {
    const taskbarButton = document.createElement('button');
    taskbarButton.className = 'taskbar-app active';
    taskbarButton.setAttribute('data-window', 'officerProfileWindow');
    taskbarButton.onclick = () => toggleWindow('officerProfileWindow');
    taskbarButton.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
      <span>Officer Profile</span>
    `;
    taskbarApps.appendChild(taskbarButton);
  }
}

function closeOfficerProfile() {
  const window = document.getElementById('officerProfileWindow');
  if (window) {
    window.style.display = 'none';
    const form = document.getElementById('officerProfileForm');
    if (form) form.reset();
    
    // Remove taskbar button
    const taskbarButton = document.querySelector('.taskbar-app[data-window="officerProfileWindow"]');
    if (taskbarButton) {
      taskbarButton.remove();
    }
  }
}

function minimizeOfficerProfileWindow() {
  const window = document.getElementById('officerProfileWindow');
  const taskbarBtn = document.querySelector('.taskbar-app[data-window="officerProfileWindow"]');
  
  if (window) {
    window.style.display = 'none';
    if (taskbarBtn) {
      taskbarBtn.classList.remove('active');
    }
  }
}

function toggleMaximizeOfficerProfileWindow() {
  const window = document.getElementById('officerProfileWindow');
  if (window) {
    window.classList.toggle('maximized');
  }
}

function updateOfficerPassword(event) {
  event.preventDefault();
  
  const oldPassword = document.getElementById('profileOldPassword').value;
  const newPassword = document.getElementById('profileNewPassword').value;
  const confirmPassword = document.getElementById('profileConfirmPassword').value;
  const loggedInOfficer = JSON.parse(sessionStorage.getItem('loggedInOfficer'));
  
  if (!loggedInOfficer) {
    showNotificationMDT('Officer information not found', 'error');
    return;
  }
  
  // Validation
  if (!oldPassword || oldPassword.trim() === '') {
    showNotificationMDT('Please enter your current password', 'error');
    return;
  }
  
  if (!newPassword || newPassword.trim() === '') {
    showNotificationMDT('Please enter a new password', 'error');
    return;
  }
  
  if (!confirmPassword || confirmPassword.trim() === '') {
    showNotificationMDT('Please confirm your new password', 'error');
    return;
  }
  
  // Verify old password matches current password
  const currentPassword = window.PASSWORD_MAP[loggedInOfficer.badgeNumber.toString()];
  if (oldPassword !== currentPassword) {
    showNotificationMDT('Current password is incorrect', 'error');
    return;
  }
  
  // Check if new passwords match
  if (newPassword !== confirmPassword) {
    showNotificationMDT('New passwords do not match', 'error');
    return;
  }
  
  // Check if new password is different from old password
  if (newPassword === oldPassword) {
    showNotificationMDT('New password must be different from current password', 'error');
    return;
  }
  
  // Update password locally (no server request needed)
  try {
    // Update the password in PASSWORD_MAP
    window.PASSWORD_MAP[loggedInOfficer.badgeNumber.toString()] = newPassword;
    
    // Update the password in OFFICER_DATABASE
    const officerInDb = window.OFFICER_DATABASE.find(o => o.badgeNumber === loggedInOfficer.badgeNumber);
    if (officerInDb) {
      officerInDb.password = newPassword;
    }
    
    // Save to localStorage
    const saved = saveOfficersToStorage(window.OFFICER_DATABASE);
    
    if (saved) {
      showNotificationMDT('Password updated successfully', 'success');
      
      // Clear all password fields
      document.getElementById('profileOldPassword').value = '';
      document.getElementById('profileNewPassword').value = '';
      document.getElementById('profileConfirmPassword').value = '';
    } else {
      showNotificationMDT('Failed to save password to storage', 'error');
    }
  } catch (error) {
    console.error('Error updating password:', error);
    showNotificationMDT('Error updating password: ' + error.message, 'error');
  }
}

// Load the saved time display mode setting and set radio buttons
async function loadTimeDisplayModeSetting() {
  const config = await getConfig();
  const radios = document.querySelectorAll('input[name="timeDisplayMode"]');
  radios.forEach(radio => {
    if ((radio.value === 'ingame' && config.useInGameTime) || 
        (radio.value === 'realtime' && !config.useInGameTime)) {
      radio.checked = true;
    }
  });
}

// Set time display mode (real-time or in-game)
async function setTimeDisplayMode(useInGameTime) {
  try {
    // Get current config from localStorage or server
    let currentConfig = localStorage.getItem('config');
    if (currentConfig) {
      currentConfig = JSON.parse(currentConfig);
    } else {
      currentConfig = await (await fetch('/config')).json();
    }
    
    // Update the useInGameTime property
    currentConfig.useInGameTime = useInGameTime;
    
    // Save updated config to localStorage
    localStorage.setItem('config', JSON.stringify(currentConfig));
    
    // Update radio buttons
    const radios = document.querySelectorAll('input[name="timeDisplayMode"]');
    radios.forEach(radio => {
      if ((radio.value === 'ingame' && useInGameTime) || 
          (radio.value === 'realtime' && !useInGameTime)) {
        radio.checked = true;
      }
    });
    
    showNotificationMDT(`✓ Time display mode set to ${useInGameTime ? 'In-Game Time' : 'Real-Time'}. Changes will apply immediately.`, 'success');
  } catch (error) {
    console.error('Error setting time display mode:', error);
    showNotificationMDT('Failed to update time display mode. Please try again.', 'error');
  }
}

function createPlayerSettingsTaskbarButton() {
  // Check if taskbar button already exists
  if (document.querySelector('.taskbar-app[data-window="playerSettings"]')) {
    return;
  }
  
  const taskbar = document.querySelector('.taskbar-apps');
  if (!taskbar) return;
  
  const button = document.createElement('div');
  button.className = 'taskbar-app active';
  button.dataset.window = 'playerSettings';
  button.innerHTML = `
    <svg viewBox="0 0 24 24" width="20" height="20" class="taskbar-icon">
      <path fill="currentColor" d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
    </svg>
    <span class="taskbar-label">Player Settings</span>
  `;
  
  button.addEventListener('click', () => {
    const window = document.getElementById('playerSettingsWindow');
    if (window) {
      if (window.style.display === 'none') {
        window.style.display = 'block';
        button.classList.add('active');
      } else {
        window.style.display = 'none';
        button.classList.remove('active');
      }
    }
  });
  
  taskbar.appendChild(button);
}

function removePlayerSettingsTaskbarButton() {
  const button = document.querySelector('.taskbar-app[data-window="playerSettings"]');
  if (button) {
    button.remove();
  }
}

function closePlayerSettingsWindow() {
  const window = document.getElementById('playerSettingsWindow');
  if (window) {
    window.style.display = 'none';
    removePlayerSettingsTaskbarButton();
  }
}

function minimizePlayerSettingsWindow() {
  const window = document.getElementById('playerSettingsWindow');
  const taskbarBtn = document.querySelector('.taskbar-app[data-window="playerSettings"]');
  
  if (window) {
    window.style.display = 'none';
    if (taskbarBtn) {
      taskbarBtn.classList.remove('active');
    }
  }
}

function toggleMaximizePlayerSettingsWindow() {
  const window = document.getElementById('playerSettingsWindow');
  if (window) {
    window.classList.toggle('maximized');
  }
}

function switchSettingsSection(sectionName) {
  // Hide all sections
  document.querySelectorAll('.settings-section').forEach(section => {
    section.style.display = 'none';
  });
  
  // Remove active class from all nav items
  document.querySelectorAll('.settings-nav-item').forEach(item => {
    item.classList.remove('active');
    item.style.background = '';
    item.style.borderLeftColor = 'transparent';
    item.style.color = '#8da9c4';
  });
  
  // Show selected section
  const section = document.getElementById(sectionName + 'Section');
  if (section) {
    section.style.display = 'block';
  }
  
  // Add active class to clicked nav item
  event.currentTarget.classList.add('active');
  event.currentTarget.style.background = 'rgba(0, 120, 212, 0.1)';
  event.currentTarget.style.borderLeftColor = '#0078d4';
  event.currentTarget.style.color = '#fff';
}

// Reset from Player Settings
async function resetOfficersToDefaultFromSettings() {
  const firstConfirm = await showCustomDialog(
    'This will delete ALL custom officers and restore the original 7 default officers. This action cannot be undone. Continue?',
    'Reset to Defaults'
  );
  
  if (firstConfirm) {
    const secondConfirm = await showCustomDialog(
      'Are you ABSOLUTELY sure? All custom officers will be permanently deleted!',
      'Confirm Reset'
    );
    
    if (secondConfirm) {
      // Reset to default officers
      window.OFFICER_DATABASE = [...DEFAULT_OFFICERS];
      
      // Save to localStorage
      syncOfficersToStorage();
      
      // Refresh the list if officer management is open
      const officerWindow = document.getElementById('officerMgmtWindow');
      if (officerWindow && officerWindow.style.display !== 'none') {
        loadOfficersList();
      }
      
      showNotificationMDT('✓ Officers database has been reset to defaults. All 7 default officers have been restored.', 'success');
      
      // Close the player settings window
      closePlayerSettingsWindow();
    }
  }
}

function showMgmtTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.mgmt-tab-content').forEach(tab => {
    tab.style.display = 'none';
  });
  
  // Remove active class from all buttons
  document.querySelectorAll('.mgmt-tab').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected tab
  const selectedTab = document.getElementById(`${tabName}-tab`);
  if (selectedTab) {
    selectedTab.style.display = 'block';
  }
  
  // Add active class to clicked button
  const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
  if (selectedBtn) {
    selectedBtn.classList.add('active');
  }
  
  // Reset form to "Add New Officer" mode if switching to add-officer tab
  if (tabName === 'add-officer') {
    const form = document.getElementById('addOfficerForm');
    const tabBtn = document.getElementById('addOfficerTabBtn');
    
    if (form) {
      // Only reset if not already in edit mode
      if (!form.dataset.editMode) {
        form.reset();
        
        // Reset tab button text
        if (tabBtn) {
          tabBtn.textContent = 'Add New Officer';
        }
        
        // Reset submit button
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" style="margin-right: 6px;">
              <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            Add Officer
          `;
          submitBtn.style.background = '';
        }
      }
    }
  }
}

// Reset officers database to default values
async function resetOfficersToDefault() {
  const firstConfirm = await showCustomDialog(
    '⚠️ WARNING: This will delete ALL current officers and restore the default 7 officers.\n\nThis action CANNOT be undone!\n\nAre you sure you want to continue?',
    'Reset to Defaults'
  );
  
  if (firstConfirm) {
    const secondConfirm = await showCustomDialog(
      'Are you ABSOLUTELY sure? All custom officers will be permanently deleted!',
      'Confirm Reset'
    );
    
    if (secondConfirm) {
      // Reset to default officers
      window.OFFICER_DATABASE = [...DEFAULT_OFFICERS];
      
      // Save to localStorage
      syncOfficersToStorage();
      
      // Refresh the list
      loadOfficersList();
      
      showNotificationMDT('✓ Officers database has been reset to defaults. All 7 default officers have been restored.', 'success');
    }
  }
}

async function loadOfficersList() {
  const container = document.getElementById('officersListContainer');
  const searchInput = document.getElementById('officerSearchInput');
  
  if (!container) return;
  
  container.innerHTML = '<p style="color: #8da9c4; text-align: center; padding: 40px 0;">Loading officers...</p>';
  
  try {
    // Check current user's permissions
    const loggedInOfficer = JSON.parse(sessionStorage.getItem('loggedInOfficer'));
    const rankHierarchy = {
      'Chief of Police': 1,
      'Assistant Chief': 2,
      'Deputy Chief': 3,
      'Commander': 4,
      'Captain III': 5,
      'Captain II': 6,
      'Captain I': 7,
      'Police Lieutenant II': 8,
      'Police Lieutenant I': 9,
      'Police Sergeant II': 10,
      'Police Sergeant I': 11,
      'Police Officer III+1 (FTO)': 12,
      'Police Officer III': 13,
      'Police Officer II': 14,
      'Police Officer I': 15
    };
    
    const currentOfficerRank = loggedInOfficer ? (rankHierarchy[loggedInOfficer.rank] || 999) : 999;
    const canEdit = currentOfficerRank <= 10; // Sergeant II and above
    
    // Use global officer database
    let officers = window.OFFICER_DATABASE || [];
    
    // Filter by search if there's a value
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    if (searchTerm) {
      officers = officers.filter(officer => 
        officer.badgeNumber.toString().includes(searchTerm) ||
        `${officer.firstName} ${officer.lastName}`.toLowerCase().includes(searchTerm) ||
        officer.rank.toLowerCase().includes(searchTerm)
      );
    }
    
    if (officers.length === 0) {
      container.innerHTML = '<p style="color: #8da9c4; text-align: center; padding: 40px 0;">No officers found</p>';
      return;
    }
    
    container.innerHTML = officers.map(officer => `
      <div class="officer-card">
        <div class="officer-badge">${officer.badgeNumber}</div>
        <div class="officer-info">
          <h3>${officer.firstName} ${officer.lastName}</h3>
          <div class="officer-info-row">
            <span><strong>Rank:</strong> ${officer.rank}</span>
            <span><strong>Call Sign:</strong> ${officer.callSign}</span>
          </div>
          <div class="officer-info-row">
            <span><strong>Division:</strong> ${officer.division}</span>
            <span><strong>Callsign:</strong> ${officer.callSign}</span>
          </div>
        </div>
        ${canEdit ? `
        <div class="officer-actions">
          <button class="officer-action-btn" onclick="editOfficer(${officer.badgeNumber})">Edit</button>
          <button class="officer-action-btn delete" onclick="deleteOfficer(${officer.badgeNumber}, '${officer.firstName} ${officer.lastName}')">Delete</button>
        </div>
        ` : '<div class="officer-actions" style="color: #8da9c4; font-style: italic; text-align: center; padding: 10px;">View Only</div>'}
      </div>
    `).join('');
    
    // Add search functionality
    if (searchInput) {
      searchInput.addEventListener('input', loadOfficersList);
    }
    
  } catch (error) {
    console.error('Error loading officers:', error);
    container.innerHTML = '<p style="color: #e74c3c; text-align: center; padding: 40px 0;">Error loading officers list</p>';
  }
}

function editOfficer(badgeNumber) {
  // Check if current user has permission to edit
  const loggedInOfficer = JSON.parse(sessionStorage.getItem('loggedInOfficer'));
  if (!loggedInOfficer) {
    showNotificationMDT('You must be logged in to edit officer information.', 'error');
    return;
  }

  // Rank hierarchy for access control
  const rankHierarchy = {
    'Chief of Police': 1,
    'Assistant Chief': 2,
    'Deputy Chief': 3,
    'Commander': 4,
    'Captain III': 5,
    'Captain II': 6,
    'Captain I': 7,
    'Police Lieutenant II': 8,
    'Police Lieutenant I': 9,
    'Police Sergeant II': 10,
    'Police Sergeant I': 11,
    'Police Officer III+1 (FTO)': 12,
    'Police Officer III': 13,
    'Police Officer II': 14,
    'Police Officer I': 15
  };

  const currentOfficerRank = rankHierarchy[loggedInOfficer.rank] || 999;
  
  // Only Sergeant II and above (rank 10 or lower) can edit
  if (currentOfficerRank > 10) {
    showNotificationMDT('Access Denied: Only Police Sergeant II and above can edit officer information.', 'error');
    return;
  }

  // Find the officer in the database
  const officer = window.OFFICER_DATABASE.find(o => o.badgeNumber === badgeNumber);
  if (!officer) {
    showNotificationMDT('Officer not found!', 'error');
    return;
  }
  
  // Update tab button text to indicate editing mode
  const tabBtn = document.getElementById('addOfficerTabBtn');
  if (tabBtn) {
    tabBtn.textContent = 'Edit Officer';
  }
  
  // Switch to Add New Officer tab and populate with data
  showMgmtTab('add-officer');
  
  // Populate the form
  const form = document.getElementById('addOfficerForm');
  if (form) {
    form.elements['firstName'].value = officer.firstName;
    form.elements['lastName'].value = officer.lastName;
    form.elements['badgeNumber'].value = officer.badgeNumber;
    form.elements['password'].value = officer.password;
    form.elements['rank'].value = officer.rank;
    form.elements['callSign'].value = officer.callSign;
    form.elements['division'].value = officer.division;
    form.elements['unit'].value = officer.unit;
    
    // Change form to edit mode
    form.dataset.editMode = 'true';
    form.dataset.originalBadge = badgeNumber;
    
    // Update button text and icon
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" style="margin-right: 6px;">
          <path fill="currentColor" d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
        </svg>
        Update Officer
      `;
      submitBtn.style.background = 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
    }
  }
}

async function deleteOfficer(badgeNumber, name) {
  // Check if current user has permission to delete
  const loggedInOfficer = JSON.parse(sessionStorage.getItem('loggedInOfficer'));
  if (!loggedInOfficer) {
    showNotificationMDT('You must be logged in to delete officer information.', 'error');
    return;
  }

  // Rank hierarchy for access control
  const rankHierarchy = {
    'Chief of Police': 1,
    'Assistant Chief': 2,
    'Deputy Chief': 3,
    'Commander': 4,
    'Captain III': 5,
    'Captain II': 6,
    'Captain I': 7,
    'Police Lieutenant II': 8,
    'Police Lieutenant I': 9,
    'Police Sergeant II': 10,
    'Police Sergeant I': 11,
    'Police Officer III+1 (FTO)': 12,
    'Police Officer III': 13,
    'Police Officer II': 14,
    'Police Officer I': 15
  };

  const currentOfficerRank = rankHierarchy[loggedInOfficer.rank] || 999;
  
  // Only Sergeant II and above (rank 10 or lower) can delete
  if (currentOfficerRank > 10) {
    showNotificationMDT('Access Denied: Only Police Sergeant II and above can delete officer information.', 'error');
    return;
  }

  const confirmed = await showCustomDialog(
    `Are you sure you want to delete Officer ${name} (Badge #${badgeNumber})?\n\nThis action cannot be undone.`,
    'Delete Officer'
  );
  
  if (confirmed) {
    // Remove from database
    const index = window.OFFICER_DATABASE.findIndex(o => o.badgeNumber === badgeNumber);
    if (index !== -1) {
      window.OFFICER_DATABASE.splice(index, 1);
      
      // Save to localStorage
      syncOfficersToStorage();
      
      // Refresh the list
      loadOfficersList();
      
      showNotificationMDT(`Officer ${name} has been deleted successfully.`, 'success');
    } else {
      showNotificationMDT('Officer not found!', 'error');
    }
  }
}

// Sync officers to localStorage (persists data)
function syncOfficersToStorage() {
  try {
    // Update PASSWORD_MAP with all current officers
    window.PASSWORD_MAP = {};
    window.OFFICER_DATABASE.forEach(officer => {
      window.PASSWORD_MAP[officer.badgeNumber.toString()] = officer.password;
    });
    
    // Save to localStorage for persistence across page reloads
    const saved = saveOfficersToStorage(window.OFFICER_DATABASE);
    
    return saved;
  } catch (error) {
    console.error('Error syncing officers:', error);
    return false;
  }
}

// Add Officer Form Handler
function initAddOfficerForm() {
  const addOfficerForm = document.getElementById('addOfficerForm');
  
  if (addOfficerForm) {
    addOfficerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Check if current user has permission
      const loggedInOfficer = JSON.parse(sessionStorage.getItem('loggedInOfficer'));
      if (!loggedInOfficer) {
        showNotificationMDT('You must be logged in to manage officer information.', 'error');
        return;
      }

      // Rank hierarchy for access control
      const rankHierarchy = {
        'Chief of Police': 1,
        'Assistant Chief': 2,
        'Deputy Chief': 3,
        'Commander': 4,
        'Captain III': 5,
        'Captain II': 6,
        'Captain I': 7,
        'Police Lieutenant II': 8,
        'Police Lieutenant I': 9,
        'Police Sergeant II': 10,
        'Police Sergeant I': 11,
        'Police Officer III+1 (FTO)': 12,
        'Police Officer III': 13,
        'Police Officer II': 14,
        'Police Officer I': 15
      };

      const currentOfficerRank = rankHierarchy[loggedInOfficer.rank] || 999;
      
      // Only Sergeant II and above (rank 10 or lower) can add/edit
      if (currentOfficerRank > 10) {
        showNotificationMDT('Access Denied: Only Police Sergeant II and above can manage officer information.', 'error');
        return;
      }
      
      try {
        const formData = new FormData(addOfficerForm);
        const officerData = {
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          badgeNumber: parseInt(formData.get('badgeNumber')),
          password: formData.get('password'),
          rank: formData.get('rank'),
          callSign: formData.get('callSign'),
          division: formData.get('division'),
          unit: formData.get('unit'),
          agency: 'LAPD'
        };
        
        const isEditMode = addOfficerForm.dataset.editMode === 'true';
        const originalBadge = parseInt(addOfficerForm.dataset.originalBadge);
      
      if (isEditMode) {
        // UPDATE existing officer
        // Check if the new badge number conflicts with another officer
        if (officerData.badgeNumber !== originalBadge) {
          const existingOfficer = window.OFFICER_DATABASE.find(o => o.badgeNumber === officerData.badgeNumber);
          if (existingOfficer) {
            showNotificationMDT(`Badge number ${officerData.badgeNumber} is already assigned to ${existingOfficer.firstName} ${existingOfficer.lastName}. Please choose a different badge number.`, 'error');
            
            // Focus the badge number input
            const badgeInput = addOfficerForm.querySelector('input[name="badgeNumber"]');
            if (badgeInput) {
              badgeInput.focus();
              badgeInput.select();
            }
            return;
          }
        }
        
        const index = window.OFFICER_DATABASE.findIndex(o => o.badgeNumber === originalBadge);
        
        if (index !== -1) {
          // Update in memory
          window.OFFICER_DATABASE[index] = officerData;
          
          // Save to localStorage
          const syncResult = syncOfficersToStorage();
          
          // Verify it was saved
          if (syncResult) {
            const verification = localStorage.getItem('LAPD_OFFICER_DATABASE');
            if (verification) {
              const parsed = JSON.parse(verification);
              const savedOfficer = parsed.find(o => o.badgeNumber === officerData.badgeNumber);
            }
          }
          
          // If this is the currently logged-in officer, update session storage
          if (loggedInOfficer && loggedInOfficer.badgeNumber === originalBadge) {
            sessionStorage.setItem('loggedInOfficer', JSON.stringify(officerData));
            
            // Update the display immediately
            updateOfficerInfoDisplay();
            updateHeaderInfo();
          }
          
          showNotificationMDT(`Officer ${officerData.firstName} ${officerData.lastName} (Badge #${officerData.badgeNumber}) has been updated successfully!`, 'success');
          
          // Reset form and switch back to list view
          addOfficerForm.reset();
          delete addOfficerForm.dataset.editMode;
          delete addOfficerForm.dataset.originalBadge;
          
          // Reset tab button text
          const tabBtn = document.getElementById('addOfficerTabBtn');
          if (tabBtn) {
            tabBtn.textContent = 'Add New Officer';
          }
          
          const submitBtn = addOfficerForm.querySelector('button[type="submit"]');
          if (submitBtn) {
            submitBtn.innerHTML = `
              <svg viewBox="0 0 24 24" width="18" height="18" style="margin-right: 6px;">
                <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              Add Officer
            `;
            submitBtn.style.background = '';
          }
          
          showMgmtTab('officers-list');
          loadOfficersList();
        } else {
          showNotificationMDT('Officer not found for update!', 'error');
        }
      } else {
        // ADD new officer
        // Check if badge number already exists
        const existingOfficer = window.OFFICER_DATABASE.find(o => o.badgeNumber === officerData.badgeNumber);
        if (existingOfficer) {
          showNotificationMDT(`Badge number ${officerData.badgeNumber} is already assigned to ${existingOfficer.firstName} ${existingOfficer.lastName}. Please choose a different badge number.`, 'error');
          
          // Focus the badge number input and highlight it for easy correction
          const badgeInput = addOfficerForm.querySelector('input[name="badgeNumber"]');
          if (badgeInput) {
            badgeInput.focus();
            badgeInput.select();
          }
          return;
        }
        
        // Add to database
        window.OFFICER_DATABASE.push(officerData);
        
        // Save to localStorage
        const syncResult = syncOfficersToStorage();
        
        showNotificationMDT(`Officer ${officerData.firstName} ${officerData.lastName} (Badge #${officerData.badgeNumber}) has been added successfully!`, 'success');
        
        // Reset form and switch to list view
        addOfficerForm.reset();
        showMgmtTab('officers-list');
        loadOfficersList();
      }
      
    } catch (error) {
      console.error('Error submitting form:', error);
      showNotificationMDT('Error saving officer: ' + error.message, 'error');
    }
    });
    
    // Reset button handler
    addOfficerForm.addEventListener('reset', () => {
      // Clear edit mode if active
      delete addOfficerForm.dataset.editMode;
      delete addOfficerForm.dataset.originalBadge;
      
      // Reset tab button text
      const tabBtn = document.getElementById('addOfficerTabBtn');
      if (tabBtn) {
        tabBtn.textContent = 'Add New Officer';
      }
      
      // Reset submit button
      const submitBtn = addOfficerForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="18" height="18" style="margin-right: 6px;">
            <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          Add Officer
        `;
        submitBtn.style.background = '';
      }
    });
    
    // Direct button click listener for debugging
    const submitBtn = addOfficerForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        // Button click tracking removed - form is working
      });
    }
  }
  
  // Check if logged in user has management access
  checkOfficerManagementAccess();
}

// Initialize the form when DOM is ready or immediately if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAddOfficerForm);
} else {
  initAddOfficerForm();
}

// Make Officer Management window draggable
document.addEventListener('DOMContentLoaded', () => {
  const officerMgmtWindow = document.getElementById('officerMgmtWindow');
  const officerMgmtTitlebar = document.getElementById('officerMgmtTitlebar');
  
  if (officerMgmtWindow && officerMgmtTitlebar) {
    let isDragging = false;
    let offsetX, offsetY;
    
    officerMgmtTitlebar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.window-btn')) return;
      if (officerMgmtWindow.classList.contains('maximized')) return;
      
      isDragging = true;
      const rect = officerMgmtWindow.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      
      officerMgmtWindow.style.transition = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const newLeft = e.clientX - offsetX;
        const newTop = e.clientY - offsetY;
        
        officerMgmtWindow.style.left = `${Math.max(0, Math.min(newLeft, window.innerWidth - 100))}px`;
        officerMgmtWindow.style.top = `${Math.max(0, Math.min(newTop, window.innerHeight - 100))}px`;
        officerMgmtWindow.style.transform = 'none';
      }
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        officerMgmtWindow.style.transition = '';
      }
    });
  }
  
  // Make Player Settings window draggable
  const playerSettingsWindow = document.getElementById('playerSettingsWindow');
  const playerSettingsTitlebar = document.getElementById('playerSettingsTitlebar');
  
  if (playerSettingsWindow && playerSettingsTitlebar) {
    let isDragging = false;
    let offsetX, offsetY;
    
    playerSettingsTitlebar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.window-btn')) return;
      
      isDragging = true;
      const rect = playerSettingsWindow.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      
      playerSettingsWindow.style.transition = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const newLeft = e.clientX - offsetX;
        const newTop = e.clientY - offsetY;
        
        playerSettingsWindow.style.left = `${Math.max(0, Math.min(newLeft, window.innerWidth - 100))}px`;
        playerSettingsWindow.style.top = `${Math.max(0, Math.min(newTop, window.innerHeight - 100))}px`;
        playerSettingsWindow.style.transform = 'none';
      }
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        playerSettingsWindow.style.transition = '';
      }
    });
  }
});

// Interface Customization Functions
function loadInterfaceCustomization() {
  const customization = JSON.parse(localStorage.getItem('interfaceCustomization') || '{}');
  
  if (customization.deptName) document.getElementById('customDeptName').value = customization.deptName;
  if (customization.deptLogo) document.getElementById('customDeptLogo').value = customization.deptLogo;
  if (customization.wallpaper) document.getElementById('customWallpaper').value = customization.wallpaper;
  if (customization.primaryColor) {
    document.getElementById('customPrimaryColor').value = customization.primaryColor;
    document.getElementById('customPrimaryColorHex').value = customization.primaryColor;
  }
  if (customization.secondaryColor) {
    document.getElementById('customSecondaryColor').value = customization.secondaryColor;
    document.getElementById('customSecondaryColorHex').value = customization.secondaryColor;
  }
  
  // Sync color inputs
  const syncColorInputs = () => {
    const primaryPicker = document.getElementById('customPrimaryColor');
    const primaryHex = document.getElementById('customPrimaryColorHex');
    const secondaryPicker = document.getElementById('customSecondaryColor');
    const secondaryHex = document.getElementById('customSecondaryColorHex');
    
    if (primaryPicker && primaryHex) {
      primaryPicker.addEventListener('input', (e) => primaryHex.value = e.target.value);
      primaryHex.addEventListener('input', (e) => primaryPicker.value = e.target.value);
    }
    if (secondaryPicker && secondaryHex) {
      secondaryPicker.addEventListener('input', (e) => secondaryHex.value = e.target.value);
      secondaryHex.addEventListener('input', (e) => secondaryPicker.value = e.target.value);
    }
  };
  syncColorInputs();
}

function applyInterfaceCustomization() {
  const customization = {
    deptName: document.getElementById('customDeptName').value.trim(),
    deptLogo: document.getElementById('customDeptLogo').value.trim(),
    wallpaper: document.getElementById('customWallpaper').value.trim(),
    primaryColor: document.getElementById('customPrimaryColor').value,
    secondaryColor: document.getElementById('customSecondaryColor').value
  };
  
  localStorage.setItem('interfaceCustomization', JSON.stringify(customization));
  
  if (customization.deptName) {
    document.querySelectorAll('.mdt-title-main').forEach(el => el.textContent = customization.deptName);
  }
  
  if (customization.deptLogo) {
    document.querySelectorAll('.mdt-header-logo').forEach(el => el.src = customization.deptLogo);
  }
  
  if (customization.wallpaper) {
    const bg = document.querySelector('.desktop-background');
    bg.style.backgroundImage = `url('${customization.wallpaper}')`;
    bg.style.backgroundSize = 'cover';
    bg.style.backgroundPosition = 'center';
  }
  
  document.documentElement.style.setProperty('--color-lapd-gold', customization.primaryColor);
  document.documentElement.style.setProperty('--color-border', customization.secondaryColor);
  document.documentElement.style.setProperty('--color-border-light', customization.secondaryColor);
  
  showNotificationMDT('✓ Interface customization applied successfully!', 'success');
}

// Handle logo file selection
function handleLogoFileSelect(event) {
  const file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const dataUrl = e.target.result;
      document.getElementById('customDeptLogo').value = dataUrl;
      applyInterfaceCustomization();
    };
    reader.readAsDataURL(file);
  }
}

// Handle wallpaper file selection
function handleWallpaperFileSelect(event) {
  const file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const dataUrl = e.target.result;
      document.getElementById('customWallpaper').value = dataUrl;
      applyInterfaceCustomization();
    };
    reader.readAsDataURL(file);
  }
}

function resetInterfaceCustomization() {
  if (!confirm('Are you sure you want to reset all interface customizations to default?')) {
    return;
  }
  
  localStorage.removeItem('interfaceCustomization');
  
  document.getElementById('customDeptName').value = '';
  document.getElementById('customDeptLogo').value = '';
  document.getElementById('customWallpaper').value = '';
  document.getElementById('customPrimaryColor').value = '#FDB913';
  document.getElementById('customPrimaryColorHex').value = '#FDB913';
  document.getElementById('customSecondaryColor').value = '#2E8BC0';
  document.getElementById('customSecondaryColorHex').value = '#2E8BC0';
  
  document.querySelectorAll('.mdt-title-main').forEach(el => el.textContent = 'LOS ANGELES POLICE DEPARTMENT');
  document.querySelectorAll('.mdt-header-logo').forEach(el => el.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Seal_of_the_Los_Angeles_Police_Department.png/1033px-Seal_of_the_Los_Angeles_Police_Department.png');
  
  const bg = document.querySelector('.desktop-background');
  bg.style.backgroundImage = '';
  
  document.documentElement.style.setProperty('--color-lapd-gold', '#FDB913');
  document.documentElement.style.setProperty('--color-border', '#2c5f8a');
  document.documentElement.style.setProperty('--color-border-light', '#4a7ba7');
  
  showNotificationMDT('✓ Interface reset to default settings', 'success');
}

// Apply saved customizations on page load
window.addEventListener('DOMContentLoaded', function() {
  const customization = JSON.parse(localStorage.getItem('interfaceCustomization') || '{}');
  
  if (Object.keys(customization).length > 0) {
    if (customization.deptName) {
      document.querySelectorAll('.mdt-title-main').forEach(el => el.textContent = customization.deptName);
    }
    
    if (customization.deptLogo) {
      document.querySelectorAll('.mdt-header-logo').forEach(el => el.src = customization.deptLogo);
    }
    
    if (customization.wallpaper) {
      const bg = document.querySelector('.desktop-background');
      bg.style.backgroundImage = `url('${customization.wallpaper}')`;
      bg.style.backgroundSize = 'cover';
      bg.style.backgroundPosition = 'center';
    }
    
    if (customization.primaryColor) {
      document.documentElement.style.setProperty('--color-lapd-gold', customization.primaryColor);
    }
    
    if (customization.secondaryColor) {
      document.documentElement.style.setProperty('--color-border', customization.secondaryColor);
      document.documentElement.style.setProperty('--color-border-light', customization.secondaryColor);
    }
  }
});

// Window drag and resize functionality
document.addEventListener('DOMContentLoaded', () => {
  const settingsWindow = document.getElementById('playerSettingsWindow');
  const titlebar = document.getElementById('playerSettingsTitlebar');
  
  if (settingsWindow && titlebar) {
    // Dragging functionality
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    
    titlebar.addEventListener('mousedown', (e) => {
      // Don't drag if clicking on buttons
      if (e.target.classList.contains('window-btn') || e.target.closest('.window-btn')) {
        return;
      }
      
      isDragging = true;
      initialX = e.clientX - settingsWindow.offsetLeft;
      initialY = e.clientY - settingsWindow.offsetTop;
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging && !settingsWindow.classList.contains('maximized')) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        settingsWindow.style.left = currentX + 'px';
        settingsWindow.style.top = currentY + 'px';
        settingsWindow.style.transform = 'none';
      }
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
    
    // Resizing functionality
    const resizeHandles = settingsWindow.querySelectorAll('.resize-handle');
    resizeHandles.forEach(handle => {
      let isResizing = false;
      let startX, startY, startWidth, startHeight, startLeft, startTop;
      
      handle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(getComputedStyle(settingsWindow).width);
        startHeight = parseInt(getComputedStyle(settingsWindow).height);
        startLeft = settingsWindow.offsetLeft;
        startTop = settingsWindow.offsetTop;
        e.stopPropagation();
      });
      
      document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        if (handle.classList.contains('resize-right')) {
          settingsWindow.style.width = Math.max(700, startWidth + dx) + 'px';
        }
        if (handle.classList.contains('resize-bottom')) {
          settingsWindow.style.height = Math.max(500, startHeight + dy) + 'px';
        }
        if (handle.classList.contains('resize-left')) {
          const newWidth = Math.max(700, startWidth - dx);
          if (newWidth >= 700) {
            settingsWindow.style.width = newWidth + 'px';
            settingsWindow.style.left = startLeft + dx + 'px';
          }
        }
        if (handle.classList.contains('resize-top')) {
          const newHeight = Math.max(500, startHeight - dy);
          if (newHeight >= 500) {
            settingsWindow.style.height = newHeight + 'px';
            settingsWindow.style.top = startTop + dy + 'px';
          }
        }
        
        // Corner resizing
        if (handle.classList.contains('resize-bottom-right')) {
          settingsWindow.style.width = Math.max(700, startWidth + dx) + 'px';
          settingsWindow.style.height = Math.max(500, startHeight + dy) + 'px';
        }
        if (handle.classList.contains('resize-bottom-left')) {
          const newWidth = Math.max(700, startWidth - dx);
          if (newWidth >= 700) {
            settingsWindow.style.width = newWidth + 'px';
            settingsWindow.style.left = startLeft + dx + 'px';
          }
          settingsWindow.style.height = Math.max(500, startHeight + dy) + 'px';
        }
        if (handle.classList.contains('resize-top-right')) {
          settingsWindow.style.width = Math.max(700, startWidth + dx) + 'px';
          const newHeight = Math.max(500, startHeight - dy);
          if (newHeight >= 500) {
            settingsWindow.style.height = newHeight + 'px';
            settingsWindow.style.top = startTop + dy + 'px';
          }
        }
        if (handle.classList.contains('resize-top-left')) {
          const newWidth = Math.max(700, startWidth - dx);
          const newHeight = Math.max(500, startHeight - dy);
          if (newWidth >= 700) {
            settingsWindow.style.width = newWidth + 'px';
            settingsWindow.style.left = startLeft + dx + 'px';
          }
          if (newHeight >= 500) {
            settingsWindow.style.height = newHeight + 'px';
            settingsWindow.style.top = startTop + dy + 'px';
          }
        }
      });
      
      document.addEventListener('mouseup', () => {
        isResizing = false;
      });
    });
  }
});
