// ControlNVSR - Client Application (Mobile First)
document.addEventListener('DOMContentLoaded', () => {
  // App State
  const state = {
    asistencias: [],
    stats: { total: 0, nuevos: 0, consolidados: 0, hoy: 0 },
    filters: {
      search: '',
      tipo: 'todos',
      dateFilter: 'hoy' // Default to today's service!
    },
    selectedPerson: null,
    editingId: null,
    deleteId: null,
    admin: {
      token: localStorage.getItem('control_nvsr_admin_token') || null,
      user: JSON.parse(localStorage.getItem('control_nvsr_admin_user') || 'null'),
      usersList: []
    },
    currentView: 'home',
    analytics: {
      filter: {
        mode: 'preset',
        days: 30,
        date: '',
        dateFrom: '',
        dateTo: ''
      },
      overview: null,
      selectedCity: null,
      geoMode: 'city',
      geoIncludeMissing: true,
      selectedPersonId: null
    }
  };

  // --- DOM Elements ---

  // Main Action Buttons
  const btnOpenAsistencia = document.getElementById('btnOpenAsistencia');
  const btnOpenNuevo = document.getElementById('btnOpenNuevo');

  // Stats Elements
  const statTotal = document.getElementById('statTotal');
  const statNuevos = document.getElementById('statNuevos');
  const statConsolidados = document.getElementById('statConsolidados');
  const statHoy = document.getElementById('statHoy');

  // Clock
  const clockElement = document.getElementById('headerClock');

  // Table and Toolbar
  const tableBody = document.getElementById('tableBody');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const filterPills = document.querySelectorAll('.filter-pill');
  const totalCountLabel = document.getElementById('totalCountLabel');

  // Dropdown Export
  const exportDropdown = document.getElementById('exportDropdown');
  const exportBtn = document.getElementById('exportBtn');
  const btnExportOriginal = document.getElementById('btnExportOriginal');
  const btnExportFull = document.getElementById('btnExportFull');
  const btnBackupDb = document.getElementById('btnBackupDb');

  // --- MODAL: REGISTRAR ASISTENCIA ---
  const asistenciaModal = document.getElementById('asistenciaModal');
  const closeAsistenciaModalBtn = document.getElementById('closeAsistenciaModalBtn');
  const cancelAsistenciaBtn = document.getElementById('cancelAsistenciaBtn');
  const asistenciaForm = document.getElementById('asistenciaForm');
  const asistSearchInput = document.getElementById('asistSearchInput');
  const asistClearBtn = document.getElementById('asistClearBtn');
  const asistDropdownResults = document.getElementById('asistDropdownResults');
  const selectedPersonCard = document.getElementById('selectedPersonCard');
  const selectedPersonName = document.getElementById('selectedPersonName');
  const selectedPersonBadge = document.getElementById('selectedPersonBadge');
  const selectedPersonPhone = document.getElementById('selectedPersonPhone');
  const alreadyAttendedAlert = document.getElementById('alreadyAttendedAlert');
  const btnChangePerson = document.getElementById('btnChangePerson');
  const checkMarcarAsistencia = document.getElementById('checkMarcarAsistencia');
  const asistFechaHoraDisplay = document.getElementById('asistFechaHoraDisplay');
  const asistTipoGroup = document.getElementById('asistTipoGroup');
  const asistOptionNuevo = document.getElementById('asistOptionNuevo');
  const asistOptionConsolidado = document.getElementById('asistOptionConsolidado');
  const asistRadioNuevo = document.getElementById('asistRadioNuevo');
  const asistRadioConsolidado = document.getElementById('asistRadioConsolidado');
  const asistNotasGroup = document.getElementById('asistNotasGroup');
  const asistNotas = document.getElementById('asistNotas');
  const notFoundPrompt = document.getElementById('notFoundPrompt');
  const btnSwitchToNuevo = document.getElementById('btnSwitchToNuevo');
  const btnSubmitAsistencia = document.getElementById('btnSubmitAsistencia');

  // --- MODAL: REGISTRAR NUEVO (Formulario Completo) ---
  const nuevoModal = document.getElementById('nuevoModal');
  const closeNuevoModalBtn = document.getElementById('closeNuevoModalBtn');
  const cancelNuevoBtn = document.getElementById('cancelNuevoBtn');
  const nuevoPersonaForm = document.getElementById('nuevoPersonaForm');
  const nuevoInputNombre = document.getElementById('nuevoInputNombre');
  const nuevoInputTelefono = document.getElementById('nuevoInputTelefono');
  const nuevoInputDireccion = document.getElementById('nuevoInputDireccion');
  const nuevoInputCumpleanos = document.getElementById('nuevoInputCumpleanos');
  const nuevoInputFechaHora = document.getElementById('nuevoInputFechaHora');
  const nuevoBtnSetNow = document.getElementById('nuevoBtnSetNow');
  const nuevoInputNotas = document.getElementById('nuevoInputNotas');
  const nuevoOptionNuevo = document.getElementById('nuevoOptionNuevo');
  const nuevoOptionConsolidado = document.getElementById('nuevoOptionConsolidado');
  const nuevoRadioNuevo = document.getElementById('nuevoRadioNuevo');
  const nuevoRadioConsolidado = document.getElementById('nuevoRadioConsolidado');

  // --- MODAL: EDITAR REGISTRO ---
  const editModal = document.getElementById('editModal');
  const editForm = document.getElementById('editForm');
  const closeEditModalBtn = document.getElementById('closeEditModalBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  // --- MODAL: ELIMINAR CON AUTORIZACIÓN ADMIN ---
  const deleteModal = document.getElementById('deleteModal');
  const deleteAuthForm = document.getElementById('deleteAuthForm');
  const deletePersonName = document.getElementById('deletePersonName');
  const deleteAdminUser = document.getElementById('deleteAdminUser');
  const deleteAdminPassword = document.getElementById('deleteAdminPassword');
  const deleteAuthError = document.getElementById('deleteAuthError');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');

  // --- MODAL: PANEL DE ADMINISTRADORES ---
  const adminModal = document.getElementById('adminModal');
  const btnOpenAdminPanel = document.getElementById('btnOpenAdminPanel');
  const closeAdminModalBtn = document.getElementById('closeAdminModalBtn');
  const closeAdminPanelBtn = document.getElementById('closeAdminPanelBtn');

  const adminLoginView = document.getElementById('adminLoginView');
  const adminDashboardView = document.getElementById('adminDashboardView');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const loginAdminUser = document.getElementById('loginAdminUser');
  const loginAdminPass = document.getElementById('loginAdminPass');
  const btnLoginAdmin = document.getElementById('btnLoginAdmin');
  const adminLoginError = document.getElementById('adminLoginError');

  const currentAdminName = document.getElementById('currentAdminName');
  const btnLogoutAdmin = document.getElementById('btnLogoutAdmin');
  const adminCountBadge = document.getElementById('adminCountBadge');
  const adminUsersList = document.getElementById('adminUsersList');

  const createAdminForm = document.getElementById('createAdminForm');
  const newAdminUser = document.getElementById('newAdminUser');
  const newAdminPass = document.getElementById('newAdminPass');
  const newAdminPassConfirm = document.getElementById('newAdminPassConfirm');
  const createAdminError = document.getElementById('createAdminError');
  const btnSubmitNewAdmin = document.getElementById('btnSubmitNewAdmin');

  // --- MODAL: IMPORTAR EXCEL ---
  const importModal = document.getElementById('importModal');
  const btnOpenImport = document.getElementById('btnOpenImport');
  const closeImportModalBtn = document.getElementById('closeImportModalBtn');
  const fileInput = document.getElementById('fileInput');
  const dropzone = document.getElementById('dropzone');
  const btnProcessImport = document.getElementById('btnProcessImport');
  const selectedFileName = document.getElementById('selectedFileName');

  // --- ANALYTICS PAGE ELEMENTS (Admin Only) ---
  const homeControlView = document.getElementById('homeControlView');
  const analyticsView = document.getElementById('analyticsView');
  const btnOpenAnalyticsPage = document.getElementById('btnOpenAnalyticsPage');
  const btnAdminGoAnalytics = document.getElementById('btnAdminGoAnalytics');
  const btnBackToHome = document.getElementById('btnBackToHome');
  const btnRefreshAnalytics = document.getElementById('btnRefreshAnalytics');
  const btnAnalyticsLogout = document.getElementById('btnAnalyticsLogout');
  const analyticsAdminBadgeText = document.getElementById('analyticsAdminBadgeText');
  const analyticsTopbarActions = document.getElementById('analyticsTopbarActions');

  const analyticsAuthGate = document.getElementById('analyticsAuthGate');
  const analyticsLoginForm = document.getElementById('analyticsLoginForm');
  const analyticsLoginUser = document.getElementById('analyticsLoginUser');
  const analyticsLoginPass = document.getElementById('analyticsLoginPass');
  const analyticsLoginError = document.getElementById('analyticsLoginError');
  const btnAnalyticsLogin = document.getElementById('btnAnalyticsLogin');
  const analyticsDashboard = document.getElementById('analyticsDashboard');

  const analyticsPeriodLabel = document.getElementById('analyticsPeriodLabel');
  const analyticsPeriodRangeBadge = document.getElementById('analyticsPeriodRangeBadge');
  const analyticsPresetBtns = document.querySelectorAll('[data-preset]');
  const analyticsSingleDate = document.getElementById('analyticsSingleDate');
  const btnApplySingleDate = document.getElementById('btnApplySingleDate');
  const analyticsDateFrom = document.getElementById('analyticsDateFrom');
  const analyticsDateTo = document.getElementById('analyticsDateTo');
  const btnApplyRange = document.getElementById('btnApplyRange');

  const kpiNuevosIngreso = document.getElementById('kpiNuevosIngreso');
  const kpiNuevosVisitantes = document.getElementById('kpiNuevosVisitantes');
  const kpiTotalAsistencias = document.getElementById('kpiTotalAsistencias');
  const kpiAsistenciasDesglose = document.getElementById('kpiAsistenciasDesglose');
  const kpiDirectorioTotal = document.getElementById('kpiDirectorioTotal');
  const analyticsNewPeopleCount = document.getElementById('analyticsNewPeopleCount');
  const analyticsNewPeopleList = document.getElementById('analyticsNewPeopleList');

  const analyticsPersonSection = document.getElementById('analyticsPersonSection');
  const analyticsPersonSearch = document.getElementById('analyticsPersonSearch');
  const analyticsPersonClearBtn = document.getElementById('analyticsPersonClearBtn');
  const analyticsPersonDropdown = document.getElementById('analyticsPersonDropdown');
  const analyticsPersonEmptyHint = document.getElementById('analyticsPersonEmptyHint');
  const analyticsPersonDetail = document.getElementById('analyticsPersonDetail');
  const personDetailName = document.getElementById('personDetailName');
  const personDetailBadges = document.getElementById('personDetailBadges');
  const personDetailContact = document.getElementById('personDetailContact');
  const personDetailLastVisit = document.getElementById('personDetailLastVisit');
  const personDetailLastRelative = document.getElementById('personDetailLastRelative');
  const personDetailCount = document.getElementById('personDetailCount');
  const personDetailCountNote = document.getElementById('personDetailCountNote');
  const personDetailFirstVisit = document.getElementById('personDetailFirstVisit');
  const personDetailGeoTag = document.getElementById('personDetailGeoTag');
  const personDetailMetaExtra = document.getElementById('personDetailMetaExtra');
  const personDetailHistory = document.getElementById('personDetailHistory');

  const geoCitiesCountBadge = document.getElementById('geoCitiesCountBadge');
  const geoSummaryPills = document.getElementById('geoSummaryPills');
  const btnGeoScopeAll = document.getElementById('btnGeoScopeAll');
  const btnGeoScopeKnown = document.getElementById('btnGeoScopeKnown');
  const pie3dActiveInfo = document.getElementById('pie3dActiveInfo');
  const geoPie3dSvg = document.getElementById('geoPie3dSvg');
  const geoCitiesList = document.getElementById('geoCitiesList');
  const geoSelectedCityTitle = document.getElementById('geoSelectedCityTitle');
  const btnGeoModeCity = document.getElementById('btnGeoModeCity');
  const btnGeoModeAllZones = document.getElementById('btnGeoModeAllZones');
  const geoZonesAndPeople = document.getElementById('geoZonesAndPeople');

  // --- HELPER FUNCTIONS ---

  function getLocalDateTimeString(date = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${y}-${m}-${d}T${h}:${min}`;
  }

  function getLocalDateString(date = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function formatDisplayDate(dateStr) {
    if (!dateStr) return '-';
    if (dateStr.startsWith('1970-01-01')) return '—';
    try {
      const clean = dateStr.replace(' ', 'T');
      const d = new Date(clean);
      if (isNaN(d.getTime())) return dateStr;

      const day = d.getDate();
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');

      return `${day} ${month} ${year}, ${hours}:${mins}`;
    } catch (e) {
      return dateStr;
    }
  }

  function formatTodayServiceText() {
    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' };
    const str = now.toLocaleDateString('es-ES', options);
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function startClock() {
    const update = () => {
      const now = new Date();
      const options = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
      if (clockElement) {
        const text = now.toLocaleDateString('es-ES', options);
        clockElement.textContent = text;
      }
      if (asistFechaHoraDisplay) {
        asistFechaHoraDisplay.textContent = `Culto: ${formatTodayServiceText()}`;
      }
    };
    update();
    setInterval(update, 30000);
  }

  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success'
      ? '<i class="fa-sharp-duotone fa-solid fa-circle-check"></i>'
      : '<i class="fa-sharp-duotone fa-solid fa-triangle-exclamation"></i>';
    toast.innerHTML = `<span class="toast-icon">${icon}</span> <span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  function formatWhatsAppLink(phone, name) {
    if (!phone) return null;
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('00')) clean = clean.slice(2);
    if (clean.length === 9 && (clean.startsWith('6') || clean.startsWith('7'))) {
      clean = '34' + clean;
    }
    if (clean.length < 9) return null;
    const firstName = name ? name.trim().split(' ')[0] : '';
    const greeting = firstName ? `¡Hola ${firstName}!` : '¡Hola!';
    const message = encodeURIComponent(`${greeting} Te saludamos de la Iglesia Nueva Vida de Soto del Real. Nos alegra tenerte con nosotros.`);
    return `https://wa.me/${clean}?text=${message}`;
  }

  // --- API CALLS ---

  async function fetchStats() {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Error al cargar métricas');
      const data = await res.json();
      state.stats = data;
      renderStats();
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchAsistencias() {
    try {
      const params = new URLSearchParams();
      if (state.filters.search) params.append('search', state.filters.search);
      if (state.filters.tipo && state.filters.tipo !== 'todos') params.append('tipo', state.filters.tipo);

      if (state.filters.dateFilter === 'hoy') {
        const todayStr = getLocalDateString();
        params.append('dateFrom', `${todayStr} 00:00:00`);
        params.append('dateTo', `${todayStr} 23:59:59`);
      }

      const res = await fetch(`/api/personas?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar registros');
      const data = await res.json();
      state.asistencias = data;
      renderTable();
    } catch (err) {
      console.error(err);
      showToast('No se pudieron cargar los registros', 'error');
    }
  }

  function renderStats() {
    const { totalPersonas, hoy, nuevos, consolidados } = state.stats;
    if (statTotal) statTotal.textContent = totalPersonas || 0;
    if (statHoy) statHoy.textContent = hoy || 0;
    if (statNuevos) statNuevos.textContent = nuevos || 0;
    if (statConsolidados) statConsolidados.textContent = consolidados || 0;
  }

  // Render Table / Cards
  function renderTable() {
    tableBody.innerHTML = '';

    if (totalCountLabel) {
      const labelText = state.filters.dateFilter === 'hoy' ? 'asistencias hoy' : 'registros';
      totalCountLabel.textContent = `${state.asistencias.length} ${labelText}`;
    }

    if (state.asistencias.length === 0) {
      tableBody.parentElement.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    tableBody.parentElement.style.display = 'table';
    emptyState.style.display = 'none';

    state.asistencias.forEach((p, index) => {
      const tr = document.createElement('tr');
      const isNuevo = p.tipo === 'nuevo';
      const badgeClass = isNuevo ? 'badge-nuevo' : 'badge-consolidado';
      const badgeText = isNuevo
        ? '<i class="fa-sharp-duotone fa-solid fa-seedling"></i> Nuevo'
        : '<i class="fa-sharp-duotone fa-solid fa-user-check"></i> Consolidado';

      const waLink = formatWhatsAppLink(p.telefono, p.nombre);

      tr.innerHTML = `
        <td style="font-weight: 600; color: #64748b; width: 40px; text-align: center;">${index + 1}</td>
        <td>
          <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem;">${escapeHtml(p.nombre)}</div>
          ${p.notas ? `<div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;" title="${escapeHtml(p.notas)}"><i class="fa-sharp-duotone fa-solid fa-comment-dots"></i> ${escapeHtml(p.notas)}</div>` : ''}
        </td>
        <td>
          ${p.telefono ? `
            <div style="display: flex; align-items: center;">
              <a href="tel:${escapeHtml(p.telefono)}" class="phone-link">${escapeHtml(p.telefono)}</a>
              ${waLink ? `
                <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="whatsapp-btn" title="Enviar WhatsApp de bienvenida">
                  <i class="fa-brands fa-whatsapp"></i>
                </a>
              ` : ''}
            </div>
          ` : '<span style="color: #94a3b8;">-</span>'}
        </td>
        <td>${p.direccion ? escapeHtml(p.direccion) : '<span style="color: #94a3b8;">-</span>'}</td>
        <td style="white-space: nowrap;">${p.cumpleanos ? `<i class="fa-sharp-duotone fa-solid fa-cake-candles"></i> ${escapeHtml(p.cumpleanos)}` : '<span style="color: #94a3b8;">-</span>'}</td>
        <td>
          <span class="badge-status ${badgeClass}">${badgeText}</span>
        </td>
        <td class="cell-date">${formatDisplayDate(p.fecha_hora_registro)}</td>
        <td style="text-align: right; white-space: nowrap;">
          <div class="row-actions" style="justify-content: flex-end;">
            <button class="action-btn btn-edit" data-id="${p.id}" title="Editar registro"><i class="fa-sharp-duotone fa-solid fa-pen-to-square"></i></button>
            <button class="action-btn btn-delete" data-id="${p.id}" data-name="${escapeHtml(p.nombre)}" title="Eliminar registro"><i class="fa-sharp-duotone fa-solid fa-trash-can"></i></button>
          </div>
        </td>
      `;

      tableBody.appendChild(tr);
    });

    // Attach row events
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => openDeleteModal(btn.dataset.id, btn.dataset.name));
    });
  }

  // ========================================================
  // MODAL 1: REGISTRAR ASISTENCIA (Lógica Clave)
  // ========================================================

  function openAsistenciaModal() {
    asistenciaModal.classList.add('open');
    resetAsistenciaModal();
    setTimeout(() => asistSearchInput.focus(), 150);
    searchPersonasForDropdown('');
  }

  function closeAsistenciaModal() {
    asistenciaModal.classList.remove('open');
    resetAsistenciaModal();
  }

  function resetAsistenciaModal() {
    state.selectedPerson = null;
    asistSearchInput.value = '';
    asistClearBtn.style.display = 'none';
    asistDropdownResults.style.display = 'none';
    asistDropdownResults.innerHTML = '';
    selectedPersonCard.style.display = 'none';
    alreadyAttendedAlert.style.display = 'none';
    asistTipoGroup.style.display = 'none';
    asistNotasGroup.style.display = 'none';
    asistNotas.value = '';
    notFoundPrompt.style.display = 'none';
    checkMarcarAsistencia.checked = true;
    btnSubmitAsistencia.disabled = true;
    if (asistFechaHoraDisplay) {
      asistFechaHoraDisplay.textContent = `Culto: ${formatTodayServiceText()}`;
    }
  }

  btnOpenAsistencia.addEventListener('click', openAsistenciaModal);
  closeAsistenciaModalBtn.addEventListener('click', closeAsistenciaModal);
  cancelAsistenciaBtn.addEventListener('click', closeAsistenciaModal);

  // Search input with autocomplete dropdown
  let asistSearchTimeout;
  asistSearchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    asistClearBtn.style.display = val ? 'flex' : 'none';

    clearTimeout(asistSearchTimeout);
    asistSearchTimeout = setTimeout(() => {
      searchPersonasForDropdown(val);
    }, 200);
  });

  asistSearchInput.addEventListener('focus', () => {
    if (!state.selectedPerson) {
      searchPersonasForDropdown(asistSearchInput.value.trim());
    }
  });

  asistClearBtn.addEventListener('click', () => {
    asistSearchInput.value = '';
    asistClearBtn.style.display = 'none';
    searchPersonasForDropdown('');
    asistSearchInput.focus();
  });

  async function searchPersonasForDropdown(query) {
    try {
      const res = await fetch(`/api/personas/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Error al buscar');
      const list = await res.json();
      renderAsistDropdown(list, query);
    } catch (err) {
      console.error(err);
    }
  }

  function renderAsistDropdown(personas, query) {
    asistDropdownResults.innerHTML = '';

    if (personas.length === 0) {
      asistDropdownResults.innerHTML = `
        <div class="dropdown-empty">
          No se encontraron personas con "<strong>${escapeHtml(query)}</strong>".
        </div>
      `;
      notFoundPrompt.style.display = 'block';
      asistDropdownResults.style.display = 'block';
      return;
    }

    notFoundPrompt.style.display = 'none';

    personas.forEach(p => {
      const item = document.createElement('div');
      item.className = 'dropdown-item-person';

      const isNuevo = p.tipo === 'nuevo';
      const badgeClass = isNuevo ? 'badge-nuevo' : 'badge-consolidado';
      const badgeText = isNuevo
        ? '<i class="fa-sharp-duotone fa-solid fa-seedling"></i> Nuevo'
        : '<i class="fa-sharp-duotone fa-solid fa-user-check"></i> Consolidado';

      item.innerHTML = `
        <div>
          <div class="dropdown-person-name">${escapeHtml(p.nombre)}</div>
          <div class="dropdown-person-sub">
            <span class="badge-status ${badgeClass}" style="font-size: 0.65rem; padding: 0.1rem 0.4rem;">${badgeText}</span>
            <span>${p.telefono ? escapeHtml(p.telefono) : 'Sin tel'}</span>
            ${p.cumpleanos ? `<span>• <i class="fa-sharp-duotone fa-solid fa-cake-candles"></i> ${escapeHtml(p.cumpleanos)}</span>` : ''}
          </div>
        </div>
        <div>
          ${p.asistio_hoy > 0 ? `<span class="dropdown-already-badge"><i class="fa-sharp-duotone fa-solid fa-circle-check"></i> Asistió hoy</span>` : `<span style="color: #3b82f6; font-size: 0.85rem; font-weight: 700;">Elegir <i class="fa-sharp-duotone fa-solid fa-arrow-right"></i></span>`}
        </div>
      `;

      item.addEventListener('click', () => {
        selectPersonForAttendance(p);
      });

      asistDropdownResults.appendChild(item);
    });

    asistDropdownResults.style.display = 'block';
  }

  function selectPersonForAttendance(person) {
    state.selectedPerson = person;
    asistDropdownResults.style.display = 'none';
    asistSearchInput.value = person.nombre;
    asistClearBtn.style.display = 'none';

    // Show person card
    selectedPersonName.textContent = person.nombre;
    selectedPersonPhone.innerHTML = person.telefono ? `<i class="fa-sharp-duotone fa-solid fa-phone"></i> ${escapeHtml(person.telefono)}` : 'Sin teléfono registrado';

    const isNuevo = person.tipo === 'nuevo';
    selectedPersonBadge.className = `badge-status ${isNuevo ? 'badge-nuevo' : 'badge-consolidado'}`;
    selectedPersonBadge.innerHTML = isNuevo
      ? '<i class="fa-sharp-duotone fa-solid fa-seedling"></i> Nuevo'
      : '<i class="fa-sharp-duotone fa-solid fa-user-check"></i> Consolidado';

    // Show alert if already attended today
    if (person.asistio_hoy > 0) {
      alreadyAttendedAlert.style.display = 'block';
    } else {
      alreadyAttendedAlert.style.display = 'none';
    }

    selectedPersonCard.style.display = 'block';
    asistTipoGroup.style.display = 'block';
    asistNotasGroup.style.display = 'block';

    // Preselect condition radio
    if (person.tipo === 'nuevo') {
      asistRadioNuevo.checked = true;
      asistOptionNuevo.classList.add('selected');
      asistOptionConsolidado.classList.remove('selected');
    } else {
      asistRadioConsolidado.checked = true;
      asistOptionConsolidado.classList.add('selected');
      asistOptionNuevo.classList.remove('selected');
    }

    // Attendance checkbox checked by default
    checkMarcarAsistencia.checked = true;
    btnSubmitAsistencia.disabled = false;
  }

  // Change selected person
  btnChangePerson.addEventListener('click', () => {
    state.selectedPerson = null;
    selectedPersonCard.style.display = 'none';
    asistTipoGroup.style.display = 'none';
    asistNotasGroup.style.display = 'none';
    btnSubmitAsistencia.disabled = true;
    asistSearchInput.value = '';
    searchPersonasForDropdown('');
    asistSearchInput.focus();
  });

  // Switch to nuevo modal if person not found
  btnSwitchToNuevo.addEventListener('click', () => {
    const currentSearch = asistSearchInput.value.trim();
    closeAsistenciaModal();
    openNuevoModal();
    if (currentSearch) {
      nuevoInputNombre.value = currentSearch;
    }
  });

  // Radio selector for Asistencia modal
  asistOptionNuevo.addEventListener('click', () => {
    asistRadioNuevo.checked = true;
    asistOptionNuevo.classList.add('selected');
    asistOptionConsolidado.classList.remove('selected');
  });

  asistOptionConsolidado.addEventListener('click', () => {
    asistRadioConsolidado.checked = true;
    asistOptionConsolidado.classList.add('selected');
    asistOptionNuevo.classList.remove('selected');
  });

  // Attendance Checkbox toggle
  checkMarcarAsistencia.addEventListener('change', () => {
    btnSubmitAsistencia.disabled = !checkMarcarAsistencia.checked || !state.selectedPerson;
  });

  // Submit Asistencia
  asistenciaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!state.selectedPerson) {
      showToast('Por favor selecciona una persona de la lista', 'error');
      asistSearchInput.focus();
      return;
    }

    if (!checkMarcarAsistencia.checked) {
      showToast('Debe estar marcada la casilla de asistencia', 'error');
      return;
    }

    const payload = {
      persona_id: state.selectedPerson.id,
      tipo: asistRadioNuevo.checked ? 'nuevo' : 'consolidado',
      fecha_hora: getLocalDateTimeString().replace('T', ' ') + ':00',
      notas: asistNotas.value.trim()
    };

    btnSubmitAsistencia.disabled = true;
    btnSubmitAsistencia.textContent = 'Guardando...';

    try {
      const res = await fetch('/api/asistencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar la asistencia');
      }

      showToast(`¡Asistencia de "${state.selectedPerson.nombre}" registrada!`, 'success');

      // Refresh data
      await fetchAsistencias();
      await fetchStats();

      // Reset modal ready for the next person
      resetAsistenciaModal();
      asistSearchInput.focus();
      searchPersonasForDropdown('');

    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      btnSubmitAsistencia.disabled = false;
      btnSubmitAsistencia.innerHTML = '<i class="fa-sharp-duotone fa-solid fa-check"></i> Confirmar Asistencia';
    }
  });

  // ========================================================
  // MODAL 2: REGISTRAR NUEVO (Formulario Completo)
  // ========================================================

  function openNuevoModal() {
    nuevoModal.classList.add('open');
    nuevoPersonaForm.reset();
    updateNuevoTypeSelection('nuevo');
    nuevoInputFechaHora.value = getLocalDateTimeString();
    setTimeout(() => nuevoInputNombre.focus(), 150);
  }

  function closeNuevoModal() {
    nuevoModal.classList.remove('open');
    nuevoPersonaForm.reset();
  }

  btnOpenNuevo.addEventListener('click', openNuevoModal);
  closeNuevoModalBtn.addEventListener('click', closeNuevoModal);
  cancelNuevoBtn.addEventListener('click', closeNuevoModal);

  function updateNuevoTypeSelection(type) {
    if (type === 'nuevo') {
      nuevoRadioNuevo.checked = true;
      nuevoOptionNuevo.classList.add('selected');
      nuevoOptionConsolidado.classList.remove('selected');
    } else {
      nuevoRadioConsolidado.checked = true;
      nuevoOptionConsolidado.classList.add('selected');
      nuevoOptionNuevo.classList.remove('selected');
    }
  }

  nuevoOptionNuevo.addEventListener('click', () => updateNuevoTypeSelection('nuevo'));
  nuevoOptionConsolidado.addEventListener('click', () => updateNuevoTypeSelection('consolidado'));

  if (nuevoBtnSetNow) {
    nuevoBtnSetNow.addEventListener('click', () => {
      nuevoInputFechaHora.value = getLocalDateTimeString();
      showToast('Fecha y hora actualizadas', 'success');
    });
  }

  nuevoPersonaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = nuevoInputNombre.value.trim();
    if (!nombre) {
      showToast('El nombre es obligatorio', 'error');
      nuevoInputNombre.focus();
      return;
    }

    const payload = {
      nombre,
      telefono: nuevoInputTelefono.value.trim(),
      direccion: nuevoInputDireccion.value.trim(),
      cumpleanos: nuevoInputCumpleanos.value.trim(),
      tipo: nuevoRadioNuevo.checked ? 'nuevo' : 'consolidado',
      fecha_hora_registro: (nuevoInputFechaHora.value.trim().replace('T', ' ') || getLocalDateTimeString().replace('T', ' ')) + ':00',
      notas: nuevoInputNotas.value.trim()
    };

    try {
      const res = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar nuevo registro');
      }

      showToast(`¡Nuevo asistente "${nombre}" registrado con éxito!`, 'success');
      closeNuevoModal();

      await fetchAsistencias();
      await fetchStats();

    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    }
  });

  // ========================================================
  // FILTERS, SEARCH & TABLE ACTIONS
  // ========================================================

  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    if (clearSearchBtn) {
      clearSearchBtn.style.display = e.target.value ? 'flex' : 'none';
    }
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.filters.search = e.target.value;
      fetchAsistencias();
    }, 250);
  });

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      state.filters.search = '';
      fetchAsistencias();
      searchInput.focus();
    });
  }

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const filterType = pill.dataset.filter;
      if (filterType === 'hoy') {
        state.filters.tipo = 'todos';
        state.filters.dateFilter = 'hoy';
      } else if (filterType === 'todos') {
        state.filters.tipo = 'todos';
        state.filters.dateFilter = 'todos';
      } else {
        state.filters.tipo = filterType;
        state.filters.dateFilter = 'todos';
      }

      fetchAsistencias();
    });
  });

  // ========================================================
  // EXPORT & BACKUP
  // ========================================================

  exportBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    exportDropdown.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!exportDropdown.contains(e.target)) {
      exportDropdown.classList.remove('open');
    }
    if (!asistDropdownResults.contains(e.target) && e.target !== asistSearchInput) {
      asistDropdownResults.style.display = 'none';
    }
  });

  function downloadExcel(format) {
    const params = new URLSearchParams();
    params.append('format', format);
    if (state.filters.search) params.append('search', state.filters.search);
    if (state.filters.tipo && state.filters.tipo !== 'todos') params.append('tipo', state.filters.tipo);
    if (state.filters.dateFilter === 'hoy') {
      const todayStr = getLocalDateString();
      params.append('dateFrom', `${todayStr} 00:00:00`);
      params.append('dateTo', `${todayStr} 23:59:59`);
    }

    const url = `/api/export/excel?${params.toString()}`;
    exportDropdown.classList.remove('open');
    showToast('Generando archivo Excel...', 'success');
    window.location.href = url;
  }

  btnExportOriginal.addEventListener('click', () => downloadExcel('original'));
  btnExportFull.addEventListener('click', () => downloadExcel('full'));

  if (btnBackupDb) {
    btnBackupDb.addEventListener('click', () => {
      exportDropdown.classList.remove('open');
      showToast('Descargando copia de seguridad (.db)...', 'success');
    });
  }

  // ========================================================
  // EDIT & DELETE MODALS
  // ========================================================

  async function openEditModal(id) {
    try {
      const res = await fetch(`/api/personas/${id}`);
      if (!res.ok) throw new Error('No se encontró el registro');
      const p = await res.json();

      state.editingId = p.id;
      document.getElementById('editNombre').value = p.nombre || '';
      document.getElementById('editTelefono').value = p.telefono || '';
      document.getElementById('editDireccion').value = p.direccion || '';
      document.getElementById('editCumpleanos').value = p.cumpleanos || '';
      document.getElementById('editNotas').value = p.notas || '';

      if (p.fecha_hora_registro) {
        document.getElementById('editFechaHora').value = p.fecha_hora_registro.slice(0, 16);
      }

      if (p.tipo === 'nuevo') {
        document.getElementById('editRadioNuevo').checked = true;
      } else {
        document.getElementById('editRadioConsolidado').checked = true;
      }

      editModal.classList.add('open');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function closeEditModal() {
    editModal.classList.remove('open');
    state.editingId = null;
  }

  closeEditModalBtn.addEventListener('click', closeEditModal);
  cancelEditBtn.addEventListener('click', closeEditModal);

  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.editingId) return;

    const nombre = document.getElementById('editNombre').value.trim();
    const telefono = document.getElementById('editTelefono').value.trim();
    const direccion = document.getElementById('editDireccion').value.trim();
    const cumpleanos = document.getElementById('editCumpleanos').value.trim();
    const notas = document.getElementById('editNotas').value.trim();
    const tipo = document.getElementById('editRadioNuevo').checked ? 'nuevo' : 'consolidado';

    let fechaHora = document.getElementById('editFechaHora').value.trim();
    if (fechaHora) {
      fechaHora = fechaHora.replace('T', ' ') + ':00';
    }

    try {
      const res = await fetch(`/api/personas/${state.editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          telefono,
          direccion,
          cumpleanos,
          tipo,
          fecha_hora_registro: fechaHora,
          notas
        })
      });

      if (!res.ok) throw new Error('Error al actualizar el registro');

      showToast('Registro actualizado correctamente', 'success');
      closeEditModal();
      await fetchAsistencias();
      await fetchStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  function openDeleteModal(id, name) {
    state.deleteId = id;
    deletePersonName.textContent = `"${name}"`;
    if (deleteAdminPassword) deleteAdminPassword.value = '';
    if (deleteAuthError) {
      deleteAuthError.style.display = 'none';
      deleteAuthError.textContent = '';
    }
    // Pre-fill admin user
    if (deleteAdminUser) {
      deleteAdminUser.value = (state.admin.user && state.admin.user.username) ? state.admin.user.username : 'Pastora';
    }
    deleteModal.classList.add('open');
    if (deleteAdminPassword) {
      setTimeout(() => deleteAdminPassword.focus(), 150);
    }
  }

  function closeDeleteModal() {
    deleteModal.classList.remove('open');
    state.deleteId = null;
    if (deleteAdminPassword) deleteAdminPassword.value = '';
    if (deleteAuthError) deleteAuthError.style.display = 'none';
  }

  if (closeDeleteModalBtn) closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);

  // Form submit for delete with admin authorization
  if (deleteAuthForm) {
    deleteAuthForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!state.deleteId) return;

      const adminUser = deleteAdminUser ? deleteAdminUser.value.trim() : '';
      const adminPassword = deleteAdminPassword ? deleteAdminPassword.value : '';

      if (!adminUser || !adminPassword) {
        if (deleteAuthError) {
          deleteAuthError.style.display = 'flex';
          deleteAuthError.innerHTML = '<i class="fa-sharp-duotone fa-solid fa-triangle-exclamation"></i> Introduce el usuario y contraseña de administrador.';
        }
        return;
      }

      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.innerHTML = '<i class="fa-sharp-duotone fa-solid fa-spinner fa-spin"></i> Verificando...';
      if (deleteAuthError) deleteAuthError.style.display = 'none';

      try {
        const headers = { 'Content-Type': 'application/json' };
        if (state.admin.token) {
          headers['Authorization'] = `Bearer ${state.admin.token}`;
        }

        const res = await fetch(`/api/personas/${state.deleteId}`, {
          method: 'DELETE',
          headers,
          body: JSON.stringify({ adminUser, adminPassword })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Credenciales de administrador incorrectas');
        }

        showToast(data.message || 'Registro eliminado correctamente', 'success');
        closeDeleteModal();
        await fetchAsistencias();
        await fetchStats();

      } catch (err) {
        if (deleteAuthError) {
          deleteAuthError.style.display = 'flex';
          deleteAuthError.innerHTML = `<i class="fa-sharp-duotone fa-solid fa-triangle-exclamation"></i> ${escapeHtml(err.message)}`;
        }
        if (deleteAdminPassword) {
          deleteAdminPassword.focus();
          deleteAdminPassword.select();
        }
      } finally {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.innerHTML = '<i class="fa-sharp-duotone fa-solid fa-trash-can"></i> Aprobar y Eliminar';
      }
    });
  }

  // ========================================================
  // IMPORT EXCEL
  // ========================================================

  btnOpenImport.addEventListener('click', () => {
    importModal.classList.add('open');
    selectedFileName.textContent = '';
    btnProcessImport.disabled = true;
    fileInput.value = '';
  });

  closeImportModalBtn.addEventListener('click', () => {
    importModal.classList.remove('open');
  });

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  function handleFileSelected(file) {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      showToast('Por favor selecciona un archivo Excel (.xlsx o .xls)', 'error');
      return;
    }
    selectedFileName.textContent = `Archivo: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    btnProcessImport.disabled = false;
  }

  btnProcessImport.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    btnProcessImport.disabled = true;
    btnProcessImport.textContent = 'Importando...';

    try {
      const res = await fetch('/api/import/excel', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al importar');

      showToast(data.message, 'success');
      importModal.classList.remove('open');
      await fetchAsistencias();
      await fetchStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btnProcessImport.disabled = false;
      btnProcessImport.textContent = 'Procesar e Importar';
    }
  });

  // ========================================================
  // PANEL DE ADMINISTRADORES (Solo Usuarios Admin)
  // ========================================================

  async function openAdminPanel() {
    if (!adminModal) return;
    adminModal.classList.add('open');
    if (state.admin.token) {
      try {
        const res = await fetch('/api/admin/verify', {
          headers: { 'Authorization': `Bearer ${state.admin.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          state.admin.user = data.user;
          showAdminDashboard();
          return;
        }
      } catch (err) {
        console.warn('Verificación de token falló:', err);
      }
      // Token expirado o inválido
      logoutAdmin(false);
    } else {
      showAdminLogin();
    }
  }

  function closeAdminPanel() {
    if (!adminModal) return;
    adminModal.classList.remove('open');
    if (adminLoginError) adminLoginError.style.display = 'none';
    if (createAdminError) createAdminError.style.display = 'none';
  }

  function showAdminLogin() {
    if (adminLoginView) adminLoginView.style.display = 'block';
    if (adminDashboardView) adminDashboardView.style.display = 'none';
    if (loginAdminPass) loginAdminPass.value = '';
    if (adminLoginError) adminLoginError.style.display = 'none';
    if (loginAdminPass) {
      setTimeout(() => loginAdminPass.focus(), 150);
    }
  }

  function showAdminDashboard() {
    if (adminLoginView) adminLoginView.style.display = 'none';
    if (adminDashboardView) adminDashboardView.style.display = 'block';
    if (currentAdminName && state.admin.user) {
      currentAdminName.textContent = state.admin.user.username;
    }
    loadAdminUsers();
  }

  async function authenticateAdmin(username, password) {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Usuario o contraseña de administrador incorrectos');
    }

    state.admin.token = data.token;
    state.admin.user = data.user;
    localStorage.setItem('control_nvsr_admin_token', data.token);
    localStorage.setItem('control_nvsr_admin_user', JSON.stringify(data.user));
    return data.user;
  }

  async function verifyCurrentAdminToken() {
    if (!state.admin.token) return false;
    try {
      const res = await fetch('/api/admin/verify', {
        headers: { 'Authorization': `Bearer ${state.admin.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        state.admin.user = data.user;
        localStorage.setItem('control_nvsr_admin_user', JSON.stringify(data.user));
        return true;
      }
    } catch (err) {
      console.warn('Verificación de token falló:', err);
    }
    return false;
  }

  async function loginAdmin(username, password) {
    if (!username || !password) return;

    if (btnLoginAdmin) {
      btnLoginAdmin.disabled = true;
      btnLoginAdmin.innerHTML = '<i class="fa-sharp-duotone fa-solid fa-spinner fa-spin"></i> Verificando...';
    }
    if (adminLoginError) adminLoginError.style.display = 'none';

    try {
      const user = await authenticateAdmin(username, password);
      showToast(`¡Bienvenida ${user.username}! Sesión iniciada`, 'success');
      showAdminDashboard();
    } catch (err) {
      if (adminLoginError) {
        adminLoginError.style.display = 'flex';
        adminLoginError.innerHTML = `<i class="fa-sharp-duotone fa-solid fa-triangle-exclamation"></i> ${escapeHtml(err.message)}`;
      }
      if (loginAdminPass) {
        loginAdminPass.focus();
        loginAdminPass.select();
      }
    } finally {
      if (btnLoginAdmin) {
        btnLoginAdmin.disabled = false;
        btnLoginAdmin.innerHTML = '<i class="fa-sharp-duotone fa-solid fa-right-to-bracket"></i> Entrar al Panel Admin';
      }
    }
  }

  async function logoutAdmin(notify = true) {
    if (state.admin.token) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${state.admin.token}` }
        });
      } catch (e) {}
    }
    state.admin.token = null;
    state.admin.user = null;
    state.analytics.overview = null;
    state.analytics.selectedPersonId = null;
    localStorage.removeItem('control_nvsr_admin_token');
    localStorage.removeItem('control_nvsr_admin_user');

    if (notify) {
      showToast('Sesión de administrador cerrada', 'info');
    }
    showAdminLogin();
    if (state.currentView === 'analytics') {
      syncAnalyticsAccessState();
    }
  }

  async function loadAdminUsers() {
    if (!state.admin.token) return;
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${state.admin.token}` }
      });
      if (!res.ok) throw new Error('Error al cargar la lista de administradores');
      const data = await res.json();
      state.admin.usersList = data.users || [];
      renderAdminUsers();
    } catch (err) {
      console.error(err);
    }
  }

  function renderAdminUsers() {
    if (!adminUsersList) return;
    adminUsersList.innerHTML = '';
    const users = state.admin.usersList;

    if (adminCountBadge) {
      adminCountBadge.textContent = `${users.length} ${users.length === 1 ? 'Admin' : 'Admins'}`;
    }

    if (users.length === 0) {
      adminUsersList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem 0;">No hay administradores registrados.</div>';
      return;
    }

    users.forEach(u => {
      const item = document.createElement('div');
      item.className = 'admin-user-item';
      const isCurrent = state.admin.user && state.admin.user.username.toLowerCase() === u.username.toLowerCase();

      item.innerHTML = `
        <div class="admin-user-item-info">
          <div class="admin-user-item-avatar">
            <i class="fa-sharp-duotone fa-solid fa-user-shield"></i>
          </div>
          <div>
            <div class="admin-user-name">
              ${escapeHtml(u.username)}
              ${isCurrent ? '<span style="color: #10b981; font-size: 0.72rem; margin-left: 0.35rem; font-weight: 700;">(Tú)</span>' : ''}
            </div>
            <div class="admin-user-date">
              Alta: ${u.created_at ? u.created_at.slice(0, 10) : 'Inicial'}
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="badge-status badge-consolidado" style="font-size: 0.7rem; padding: 0.15rem 0.5rem;">
            <i class="fa-sharp-duotone fa-solid fa-shield"></i> Admin
          </span>
          ${(!isCurrent && users.length > 1) ? `
            <button type="button" class="action-btn btn-delete btn-delete-admin" data-id="${u.id}" data-name="${escapeHtml(u.username)}" title="Eliminar administrador" style="width: 28px; height: 28px;">
              <i class="fa-sharp-duotone fa-solid fa-trash-can" style="font-size: 0.75rem;"></i>
            </button>
          ` : ''}
        </div>
      `;

      adminUsersList.appendChild(item);
    });

    // Delete admin event
    document.querySelectorAll('.btn-delete-admin').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        if (!confirm(`¿Estás seguro de que deseas eliminar al administrador "${name}"?`)) return;

        try {
          const res = await fetch(`/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${state.admin.token}` }
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Error al eliminar');
          showToast(`Administrador "${name}" eliminado`, 'success');
          loadAdminUsers();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });
  }

  // Create new admin user
  if (createAdminForm) {
    createAdminForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = newAdminUser ? newAdminUser.value.trim() : '';
      const pass = newAdminPass ? newAdminPass.value : '';
      const passConfirm = newAdminPassConfirm ? newAdminPassConfirm.value : '';

      if (!username || username.length < 3) {
        showCreateAdminError('El nombre de usuario debe tener al menos 3 caracteres.');
        if (newAdminUser) newAdminUser.focus();
        return;
      }

      if (!pass || pass.length < 6) {
        showCreateAdminError('La contraseña debe tener al menos 6 caracteres.');
        if (newAdminPass) newAdminPass.focus();
        return;
      }

      if (pass !== passConfirm) {
        showCreateAdminError('Las contraseñas no coinciden.');
        if (newAdminPassConfirm) newAdminPassConfirm.focus();
        return;
      }

      if (createAdminError) createAdminError.style.display = 'none';
      if (btnSubmitNewAdmin) {
        btnSubmitNewAdmin.disabled = true;
        btnSubmitNewAdmin.innerHTML = '<i class="fa-sharp-duotone fa-solid fa-spinner fa-spin"></i> Registrando...';
      }

      try {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.admin.token}`
          },
          body: JSON.stringify({ username, password: pass })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Error al crear el usuario administrador');
        }

        showToast(data.message || `Administrador "${username}" creado`, 'success');
        createAdminForm.reset();
        await loadAdminUsers();

      } catch (err) {
        showCreateAdminError(err.message);
      } finally {
        if (btnSubmitNewAdmin) {
          btnSubmitNewAdmin.disabled = false;
          btnSubmitNewAdmin.innerHTML = '<i class="fa-sharp-duotone fa-solid fa-user-plus"></i> Registrar Usuario Admin';
        }
      }
    });
  }

  function showCreateAdminError(msg) {
    if (!createAdminError) return;
    createAdminError.style.display = 'flex';
    createAdminError.innerHTML = `<i class="fa-sharp-duotone fa-solid fa-triangle-exclamation"></i> ${escapeHtml(msg)}`;
  }

  // Attach Admin Panel DOM events
  if (btnOpenAdminPanel) btnOpenAdminPanel.addEventListener('click', openAdminPanel);
  if (closeAdminModalBtn) closeAdminModalBtn.addEventListener('click', closeAdminPanel);
  if (closeAdminPanelBtn) closeAdminPanelBtn.addEventListener('click', closeAdminPanel);
  if (btnLogoutAdmin) btnLogoutAdmin.addEventListener('click', () => logoutAdmin(true));

  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = loginAdminUser ? loginAdminUser.value.trim() : '';
      const p = loginAdminPass ? loginAdminPass.value : '';
      loginAdmin(u, p);
    });
  }

  // ========================================================
  // PÁGINA DE ANALÍTICAS (EXCLUSIVO ADMIN)
  // ========================================================

  function adminAuthHeaders() {
    return { 'Authorization': `Bearer ${state.admin.token}` };
  }

  function formatShortDate(isoDate) {
    if (!isoDate || isoDate.length < 10) return '-';
    const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${d} ${months[m - 1] || m} ${y}`;
  }

  function formatMonthLabel(ym) {
    if (!ym || ym.length < 7) return ym || '';
    const [y, m] = ym.split('-').map(Number);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[m - 1] || m} ${String(y).slice(-2)}`;
  }

  function formatRelativeDays(dias) {
    if (dias === null || dias === undefined) return 'Sin visitas registradas con fecha';
    if (dias === 0) return 'Vino hoy';
    if (dias === 1) return 'Vino ayer (hace 1 día)';
    if (dias > 1) return `Hace ${dias} días`;
    return 'Fecha registrada posterior a hoy';
  }

  function openAnalyticsPage(pushUrl = true) {
    state.currentView = 'analytics';
    if (homeControlView) homeControlView.style.display = 'none';
    if (analyticsView) analyticsView.style.display = 'flex';
    closeAdminPanel();

    if (pushUrl && window.location.pathname !== '/analiticas') {
      history.pushState({ view: 'analytics' }, '', '/analiticas');
    }

    syncAnalyticsAccessState();
  }

  function openHomePage(pushUrl = true) {
    state.currentView = 'home';
    if (analyticsView) analyticsView.style.display = 'none';
    if (homeControlView) homeControlView.style.display = 'block';

    if (pushUrl && window.location.pathname !== '/') {
      history.pushState({ view: 'home' }, '', '/');
    }

    fetchStats();
    fetchAsistencias();
  }

  async function syncAnalyticsAccessState() {
    const isValid = await verifyCurrentAdminToken();
    if (!isValid) {
      state.admin.token = null;
      state.admin.user = null;
      localStorage.removeItem('control_nvsr_admin_token');
      localStorage.removeItem('control_nvsr_admin_user');
      if (analyticsAuthGate) analyticsAuthGate.style.display = 'block';
      if (analyticsDashboard) analyticsDashboard.style.display = 'none';
      if (analyticsTopbarActions) analyticsTopbarActions.style.display = 'none';
      if (analyticsAdminBadgeText) analyticsAdminBadgeText.textContent = 'Solo Admin';
      if (analyticsLoginPass) {
        analyticsLoginPass.value = '';
        setTimeout(() => analyticsLoginPass.focus(), 120);
      }
      return;
    }

    if (analyticsAuthGate) analyticsAuthGate.style.display = 'none';
    if (analyticsDashboard) analyticsDashboard.style.display = 'flex';
    if (analyticsTopbarActions) analyticsTopbarActions.style.display = 'flex';
    if (analyticsAdminBadgeText && state.admin.user) {
      analyticsAdminBadgeText.textContent = `Admin: ${state.admin.user.username}`;
    }

    await loadAnalyticsOverview();
    await loadAnalyticsPersonas(analyticsPersonSearch ? analyticsPersonSearch.value.trim() : '', false);
  }

  function buildAnalyticsOverviewQuery() {
    const f = state.analytics.filter;
    const params = new URLSearchParams();
    params.append('mode', f.mode);
    if (f.mode === 'preset') params.append('days', String(f.days || 30));
    if (f.mode === 'date' && f.date) params.append('date', f.date);
    if (f.mode === 'range') {
      if (f.dateFrom) params.append('dateFrom', f.dateFrom);
      if (f.dateTo) params.append('dateTo', f.dateTo);
    }
    return params.toString();
  }

  function animateKpiNumber(el, targetVal) {
    if (!el) return;
    const target = Number(targetVal) || 0;
    if (typeof anime !== 'function') {
      el.textContent = target;
      return;
    }
    const counter = { val: 0 };
    anime({
      targets: counter,
      val: target,
      round: 1,
      duration: 850,
      easing: 'easeOutQuad',
      update: () => { el.textContent = counter.val; }
    });
  }

  async function loadAnalyticsOverview(animateFill = true) {
    if (!state.admin.token) return;
    try {
      const res = await fetch(`/api/analytics/overview?${buildAnalyticsOverviewQuery()}`, {
        headers: adminAuthHeaders()
      });
      if (res.status === 401) {
        await logoutAdmin(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error cargando analíticas');

      state.analytics.overview = data;
      renderGeographicAnalytics(data.geography, animateFill);
      renderEntriesAnalytics(data.entries, animateFill);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'No se pudieron cargar las analíticas', 'error');
    }
  }

  function renderEntriesAnalytics(entries, animateNumbers = false) {
    if (!entries) return;
    const { period, totals, newPeopleList } = entries;

    if (analyticsDateFrom) analyticsDateFrom.value = period.dateFrom || '';
    if (analyticsDateTo) analyticsDateTo.value = period.dateTo || '';
    if (analyticsSingleDate && period.mode === 'date') {
      analyticsSingleDate.value = period.dateFrom || '';
    }

    if (analyticsPeriodLabel) {
      analyticsPeriodLabel.textContent = `Rango consultado: ${formatShortDate(period.dateFrom)} al ${formatShortDate(period.dateTo)}`;
    }
    if (analyticsPeriodRangeBadge) {
      analyticsPeriodRangeBadge.textContent = period.label || '-';
    }

    if (animateNumbers) {
      animateKpiNumber(kpiNuevosIngreso, totals.nuevosPrimerIngreso || 0);
      animateKpiNumber(kpiNuevosVisitantes, totals.nuevosVisitantes || 0);
      animateKpiNumber(kpiTotalAsistencias, totals.totalAsistencias || 0);
      animateKpiNumber(kpiDirectorioTotal, totals.totalPersonas || 0);
    } else {
      if (kpiNuevosIngreso) kpiNuevosIngreso.textContent = totals.nuevosPrimerIngreso || 0;
      if (kpiNuevosVisitantes) kpiNuevosVisitantes.textContent = totals.nuevosVisitantes || 0;
      if (kpiTotalAsistencias) kpiTotalAsistencias.textContent = totals.totalAsistencias || 0;
      if (kpiDirectorioTotal) kpiDirectorioTotal.textContent = totals.totalPersonas || 0;
    }

    if (kpiAsistenciasDesglose) {
      kpiAsistenciasDesglose.textContent = `${totals.asistenciasNuevo || 0} nuevos • ${totals.asistenciasConsolidado || 0} consolidados`;
    }

    renderNewPeopleList(newPeopleList || [], period);
  }

  function renderNewPeopleList(list, period) {
    if (!analyticsNewPeopleList) return;
    if (analyticsNewPeopleCount) analyticsNewPeopleCount.textContent = list.length;
    analyticsNewPeopleList.innerHTML = '';

    if (list.length === 0) {
      analyticsNewPeopleList.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 1.25rem; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; color: var(--text-muted); font-size: 0.85rem;">
          <div>No se registraron nuevos ingresos con fecha entre ${escapeHtml(formatShortDate(period.dateFrom))} y ${escapeHtml(formatShortDate(period.dateTo))}.</div>
          ${period.mode !== 'all' ? `<button type="button" class="btn btn-sm btn-outline" id="btnAnalyticsShowAllFromEmpty" style="margin-top: 0.6rem;"><i class="fa-sharp-duotone fa-solid fa-clock-rotate-left"></i> Ver todo el historial</button>` : ''}
        </div>
      `;
      const btnShowAll = document.getElementById('btnAnalyticsShowAllFromEmpty');
      if (btnShowAll) {
        btnShowAll.addEventListener('click', () => {
          setAnalyticsPreset('all');
        });
      }
      return;
    }

    list.forEach((p) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'analytics-person-chip';
      btn.innerHTML = `
        <div style="min-width: 0;">
          <div class="analytics-person-chip-name">${escapeHtml(p.nombre)}</div>
          <div class="analytics-person-chip-sub">
            <i class="fa-sharp-duotone fa-solid fa-calendar-check"></i> ${escapeHtml(formatDisplayDate(p.primera_visita))}
            ${p.direccion ? `• ${escapeHtml(p.direccion)}` : ''}
          </div>
        </div>
        <span style="color: var(--primary); font-size: 0.8rem; font-weight: 700; flex-shrink: 0;">
          ${p.total_asistencias} ${p.total_asistencias === 1 ? 'vez' : 'veces'} <i class="fa-sharp-duotone fa-solid fa-arrow-right"></i>
        </span>
      `;
      btn.addEventListener('click', () => selectAnalyticsPerson(p.id, true));
      analyticsNewPeopleList.appendChild(btn);
    });
  }

  function setAnalyticsPreset(presetVal) {
    analyticsPresetBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.preset === String(presetVal));
    });
    if (presetVal === 'all') {
      state.analytics.filter = { ...state.analytics.filter, mode: 'all' };
    } else {
      state.analytics.filter = {
        ...state.analytics.filter,
        mode: 'preset',
        days: parseInt(presetVal, 10) || 30
      };
    }
    loadAnalyticsOverview(false);
  }

  // Person Selector & Detail
  async function loadAnalyticsPersonas(query = '', showDropdown = true) {
    if (!state.admin.token || !analyticsPersonDropdown) return;
    try {
      const res = await fetch(`/api/analytics/personas?q=${encodeURIComponent(query)}`, {
        headers: adminAuthHeaders()
      });
      if (res.status === 401) {
        await logoutAdmin(false);
        return;
      }
      const list = await res.json();
      if (showDropdown) {
        renderAnalyticsPersonDropdown(list, query);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function renderAnalyticsPersonDropdown(list, query) {
    if (!analyticsPersonDropdown) return;
    analyticsPersonDropdown.innerHTML = '';

    if (!list || list.length === 0) {
      analyticsPersonDropdown.innerHTML = `
        <div class="dropdown-empty">
          No se encontraron participantes con "<strong>${escapeHtml(query)}</strong>".
        </div>
      `;
      analyticsPersonDropdown.style.display = 'block';
      return;
    }

    list.forEach((p) => {
      const item = document.createElement('div');
      item.className = 'dropdown-item-person';
      const isNuevo = p.tipo === 'nuevo';
      const badgeClass = isNuevo ? 'badge-nuevo' : 'badge-consolidado';
      const visitsText = `${p.total_asistencias || 0} ${p.total_asistencias === 1 ? 'vez' : 'veces'}`;
      const lastText = p.ultima_asistencia ? formatDisplayDate(p.ultima_asistencia) : 'Sin fecha';

      item.innerHTML = `
        <div>
          <div class="dropdown-person-name">${escapeHtml(p.nombre)}</div>
          <div class="dropdown-person-sub">
            <span class="badge-status ${badgeClass}" style="font-size: 0.65rem; padding: 0.1rem 0.4rem;">${isNuevo ? 'Nuevo' : 'Consolidado'}</span>
            <span>${p.direccion ? escapeHtml(p.direccion) : 'Sin dirección'}</span>
            <span>• Última: ${escapeHtml(lastText)}</span>
          </div>
        </div>
        <span style="color: var(--primary); font-size: 0.8rem; font-weight: 700; white-space: nowrap;">${visitsText}</span>
      `;
      item.addEventListener('click', () => {
        analyticsPersonDropdown.style.display = 'none';
        if (analyticsPersonSearch) analyticsPersonSearch.value = p.nombre;
        if (analyticsPersonClearBtn) analyticsPersonClearBtn.style.display = 'flex';
        selectAnalyticsPerson(p.id, false);
      });
      analyticsPersonDropdown.appendChild(item);
    });

    analyticsPersonDropdown.style.display = 'block';
  }

  async function selectAnalyticsPerson(personaId, scrollToSection = false) {
    if (!state.admin.token || !personaId) return;
    state.analytics.selectedPersonId = personaId;

    try {
      const res = await fetch(`/api/analytics/personas/${personaId}`, {
        headers: adminAuthHeaders()
      });
      if (res.status === 401) {
        await logoutAdmin(false);
        return;
      }
      const detail = await res.json();
      if (!res.ok) throw new Error(detail.error || 'Error cargando persona');

      renderPersonAnalyticsDetail(detail);
      if (analyticsPersonSearch) {
        analyticsPersonSearch.value = detail.persona.nombre;
      }
      if (analyticsPersonClearBtn) analyticsPersonClearBtn.style.display = 'flex';
      if (analyticsPersonDropdown) analyticsPersonDropdown.style.display = 'none';

      if (scrollToSection && analyticsPersonSection) {
        analyticsPersonSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'No se pudo cargar el detalle de la persona', 'error');
    }
  }

  function renderPersonAnalyticsDetail(detail) {
    if (!detail || !analyticsPersonDetail) return;
    const { persona, geography, stats, history } = detail;

    if (analyticsPersonEmptyHint) analyticsPersonEmptyHint.style.display = 'none';
    analyticsPersonDetail.style.display = 'block';

    if (personDetailName) personDetailName.textContent = persona.nombre;

    const isNuevo = persona.tipo === 'nuevo';
    if (personDetailBadges) {
      personDetailBadges.innerHTML = `
        <span class="badge-status ${isNuevo ? 'badge-nuevo' : 'badge-consolidado'}">
          <i class="fa-sharp-duotone fa-solid ${isNuevo ? 'fa-seedling' : 'fa-user-check'}"></i>
          ${isNuevo ? 'Nuevo' : 'Consolidado'}
        </span>
        <span class="today-pill pill-total">
          <i class="fa-sharp-duotone fa-solid fa-location-dot"></i>
          ${escapeHtml(geography.city)}
        </span>
      `;
    }

    if (personDetailContact) {
      const waLink = formatWhatsAppLink(persona.telefono, persona.nombre);
      personDetailContact.innerHTML = persona.telefono ? `
        <a href="tel:${escapeHtml(persona.telefono)}" class="btn btn-sm btn-outline">
          <i class="fa-sharp-duotone fa-solid fa-phone"></i> ${escapeHtml(persona.telefono)}
        </a>
        ${waLink ? `<a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-success"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>` : ''}
      ` : '<span style="font-size: 0.8rem; color: var(--text-muted);">Sin teléfono registrado</span>';
    }

    if (personDetailLastVisit) {
      personDetailLastVisit.textContent = stats.ultimaVisita
        ? formatDisplayDate(stats.ultimaVisita)
        : 'Sin fecha registrada';
    }
    if (personDetailLastRelative) {
      personDetailLastRelative.textContent = formatRelativeDays(stats.diasDesdeUltimaVisita);
    }

    if (personDetailCount) {
      personDetailCount.textContent = `${stats.totalAsistencias} ${stats.totalAsistencias === 1 ? 'vez' : 'veces'}`;
    }
    if (personDetailCountNote) {
      personDetailCountNote.textContent = (stats.hasUndatedBaseline && stats.totalAsistencias === 0)
        ? 'Registrado en listado base sin fecha de visita previa'
        : 'Asistencias registradas con fecha';
    }

    if (personDetailFirstVisit) {
      personDetailFirstVisit.textContent = stats.primeraVisita
        ? formatDisplayDate(stats.primeraVisita)
        : 'Sin fecha registrada';
    }
    if (personDetailGeoTag) {
      personDetailGeoTag.textContent = geography.hasAddress
        ? `${geography.city} • ${geography.zone}`
        : 'Sin dirección registrada';
    }

    if (personDetailMetaExtra) {
      const extras = [];
      if (persona.direccion) {
        extras.push(`<span class="person-meta-chip"><i class="fa-sharp-duotone fa-solid fa-house"></i> ${escapeHtml(persona.direccion)}</span>`);
      }
      if (persona.cumpleanos) {
        extras.push(`<span class="person-meta-chip"><i class="fa-sharp-duotone fa-solid fa-cake-candles"></i> Cumpleaños: ${escapeHtml(persona.cumpleanos)}</span>`);
      }
      if (persona.notas) {
        extras.push(`<span class="person-meta-chip"><i class="fa-sharp-duotone fa-solid fa-comment-dots"></i> ${escapeHtml(persona.notas)}</span>`);
      }
      personDetailMetaExtra.innerHTML = extras.join('');
    }

    if (personDetailHistory) {
      personDetailHistory.innerHTML = '';
      if (!history || history.length === 0) {
        personDetailHistory.innerHTML = `
          <div style="font-size: 0.85rem; color: var(--text-muted); padding: 0.75rem; background: white; border: 1px dashed var(--border); border-radius: 6px;">
            Esta persona aún no tiene fechas de asistencia registradas. Cuando asista y se marque su asistencia aparecerá aquí.
          </div>
        `;
      } else {
        history.forEach((h, idx) => {
          const item = document.createElement('div');
          item.className = 'person-history-item';
          const hNuevo = h.tipo === 'nuevo';
          item.innerHTML = `
            <div>
              <div style="font-weight: 700; font-size: 0.875rem; color: var(--text-main);">
                #${history.length - idx} • ${escapeHtml(formatDisplayDate(h.fecha_hora))}
              </div>
              ${h.notas ? `<div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">${escapeHtml(h.notas)}</div>` : ''}
            </div>
            <span class="badge-status ${hNuevo ? 'badge-nuevo' : 'badge-consolidado'}" style="font-size: 0.72rem;">
              ${hNuevo ? 'Nuevo' : 'Consolidado'}
            </span>
          `;
          personDetailHistory.appendChild(item);
        });
      }
    }
  }

  // ========================================================
  // DISTRIBUCIÓN GEOGRÁFICA & ÚNICO GRÁFICO DE TORTA 3D (ANIME.JS)
  // ========================================================

  const GEO_SLICE_PALETTES = [
    { top: '#3b82f6', light: '#60a5fa', side: '#1d4ed8', cut: '#1e3a8a' },
    { top: '#8b5cf6', light: '#a78bfa', side: '#6d28d9', cut: '#4c1d95' },
    { top: '#f59e0b', light: '#fbbf24', side: '#d97706', cut: '#92400e' },
    { top: '#f43f5e', light: '#fb7185', side: '#e11d48', cut: '#9f1239' },
    { top: '#14b8a6', light: '#2dd4bf', side: '#0f766e', cut: '#115e59' },
    { top: '#f97316', light: '#fb923c', side: '#c2410c', cut: '#7c2d12' }
  ];
  const LOCAL_PALETTE = { top: '#10b981', light: '#34d399', side: '#047857', cut: '#065f46' };
  const MISSING_PALETTE = { top: '#94a3b8', light: '#cbd5e1', side: '#64748b', cut: '#475569' };

  const pieAnimState = {
    progress: 1,
    pop: 1,
    slices: []
  };

  function getCitySlicePalette(cityObj, colorIndex) {
    if (!cityObj.hasAddress) return MISSING_PALETTE;
    if (cityObj.isLocalCity) return LOCAL_PALETTE;
    return GEO_SLICE_PALETTES[colorIndex % GEO_SLICE_PALETTES.length];
  }

  function buildPie3DSlices(geography) {
    const rawCities = (geography && geography.cities) ? geography.cities : [];
    const visibleCities = state.analytics.geoIncludeMissing
      ? rawCities
      : rawCities.filter(c => c.hasAddress);

    const total = visibleCities.reduce((acc, c) => acc + c.count, 0);
    let currentAngle = -Math.PI / 2;
    let otherIdx = 0;

    return visibleCities.map((c, idx) => {
      const palette = getCitySlicePalette(c, c.hasAddress && !c.isLocalCity ? otherIdx++ : idx);
      const fraction = total > 0 ? c.count / total : 0;
      const sweep = fraction * Math.PI * 2;
      const slice = {
        ...c,
        palette,
        pctScope: total > 0 ? Math.round((c.count / total) * 1000) / 10 : 0,
        startAngle: currentAngle,
        endAngle: currentAngle + sweep
      };
      currentAngle += sweep;
      return slice;
    });
  }

  function updatePie3dInfoBanner(citySlice) {
    if (!pie3dActiveInfo) return;
    if (!citySlice) {
      pie3dActiveInfo.textContent = 'Sin datos geográficos disponibles.';
      return;
    }
    pie3dActiveInfo.textContent = `${citySlice.city}: ${citySlice.count} ${citySlice.count === 1 ? 'persona' : 'personas'} (${citySlice.pctScope}%)`;
  }

  function selectGeoCity(cityName, animatePop = true) {
    state.analytics.selectedCity = cityName;
    state.analytics.geoMode = 'city';

    if (geoCitiesList) {
      geoCitiesList.querySelectorAll('.geo-city-row').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.city === cityName);
      });
    }

    const activeSlice = pieAnimState.slices.find(s => s.city === cityName);
    if (activeSlice) updatePie3dInfoBanner(activeSlice);

    if (state.analytics.overview) {
      renderGeoDetailPanel(state.analytics.overview.geography);
    }

    if (animatePop && typeof anime === 'function') {
      anime.remove(pieAnimState);
      pieAnimState.pop = 0;
      anime({
        targets: pieAnimState,
        pop: 1,
        duration: 360,
        easing: 'easeOutBack',
        update: () => drawGeoPie3DSvg()
      });
    } else {
      pieAnimState.pop = 1;
      drawGeoPie3DSvg();
    }
  }

  function drawGeoPie3DSvg() {
    if (!geoPie3dSvg) return;
    const slices = pieAnimState.slices;
    const progress = Math.max(0, Math.min(1, pieAnimState.progress));

    if (!slices || slices.length === 0) {
      geoPie3dSvg.innerHTML = '<text x="230" y="155" text-anchor="middle" fill="#64748b" font-size="14" font-weight="600">No hay datos geográficos para mostrar</text>';
      return;
    }

    const CX = 230;
    const CY = 136;
    const RX = 158;
    const RY = 90;
    const DEPTH = 38;
    const POP_DIST = 11;
    const maxAngle = -Math.PI / 2 + Math.max(0.002, progress) * Math.PI * 2;

    const pt = (ox, oy, rad) => ({
      x: ox + RX * Math.cos(rad),
      y: oy + RY * Math.sin(rad)
    });

    const visibleSlices = [];
    for (let i = 0; i < slices.length; i++) {
      const s = slices[i];
      const a1 = s.startAngle;
      const a2 = Math.min(s.endAngle, maxAngle);
      if (a2 - a1 <= 0.002) continue;

      const mid = (a1 + a2) / 2;
      const isSelected = s.city === state.analytics.selectedCity;
      const popFactor = isSelected && progress > 0.25 ? pieAnimState.pop : 0;
      const ox = CX + Math.cos(mid) * POP_DIST * popFactor;
      const oy = CY + Math.sin(mid) * (POP_DIST * (RY / RX)) * popFactor;
      const isFrontier = progress < 0.998 && a2 >= maxAngle - 0.001;

      visibleSlices.push({
        ...s,
        a1,
        a2,
        sweep: a2 - a1,
        mid,
        ox,
        oy,
        isSelected,
        popFactor,
        isFrontier,
        gradId: `pie3dGrad_${i}`
      });
    }

    // Build SVG <defs> gradients + drop shadow
    const defsParts = [
      `<radialGradient id="pie3dFloorShadow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#0f172a" stop-opacity="0.24" />
        <stop offset="72%" stop-color="#0f172a" stop-opacity="0.09" />
        <stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
      </radialGradient>`
    ];

    visibleSlices.forEach(vs => {
      defsParts.push(`
        <linearGradient id="${vs.gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${vs.palette.light}" />
          <stop offset="100%" stop-color="${vs.palette.top}" />
        </linearGradient>
      `);
    });

    const shadowLayer = `<ellipse cx="${CX}" cy="${CY + DEPTH + 10}" rx="${RX + 10}" ry="${RY + 6}" fill="url(#pie3dFloorShadow)" />`;

    // Radial inner cut walls (visible when popped out or at active sweep frontier)
    const cutWalls = [];
    const buildRadialWall = (ox, oy, rad, color) => {
      const pEdge = pt(ox, oy, rad);
      return `<path d="M ${ox.toFixed(2)} ${oy.toFixed(2)} L ${pEdge.x.toFixed(2)} ${pEdge.y.toFixed(2)} L ${pEdge.x.toFixed(2)} ${(pEdge.y + DEPTH).toFixed(2)} L ${ox.toFixed(2)} ${(oy + DEPTH).toFixed(2)} Z" fill="${color}" />`;
    };

    visibleSlices.forEach(vs => {
      if (vs.sweep >= Math.PI * 2 - 0.002) return;
      if ((vs.isSelected && vs.popFactor > 0.04) || vs.isFrontier) {
        if (Math.cos(vs.a2) > 0.01) {
          cutWalls.push(buildRadialWall(vs.ox, vs.oy, vs.a2, vs.palette.cut));
        }
      }
      if (vs.isSelected && vs.popFactor > 0.04 && Math.cos(vs.a1) < -0.01) {
        cutWalls.push(buildRadialWall(vs.ox, vs.oy, vs.a1, vs.palette.cut));
      }
    });

    // Outer curved front skirt walls (angles intersecting [0, PI])
    const curvedWalls = [];
    visibleSlices.forEach(vs => {
      const f1 = Math.max(vs.a1, 0);
      const f2 = Math.min(vs.a2, Math.PI);
      if (f2 - f1 <= 0.002) return;

      const p1 = pt(vs.ox, vs.oy, f1);
      const p2 = pt(vs.ox, vs.oy, f2);
      const largeArc = (f2 - f1) > Math.PI ? 1 : 0;
      const d = `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${RX} ${RY} 0 ${largeArc} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} L ${p2.x.toFixed(2)} ${(p2.y + DEPTH).toFixed(2)} A ${RX} ${RY} 0 ${largeArc} 0 ${p1.x.toFixed(2)} ${(p1.y + DEPTH).toFixed(2)} Z`;

      curvedWalls.push({
        depthSort: Math.sin((f1 + f2) / 2) + (vs.isSelected ? 0.08 * vs.popFactor : 0),
        html: `<path class="pie3d-slice-group" data-city="${escapeHtml(vs.city)}" d="${d}" fill="${vs.palette.side}" stroke="rgba(255,255,255,0.22)" stroke-width="0.7" />`
      });
    });
    curvedWalls.sort((a, b) => a.depthSort - b.depthSort);

    // Top wedge faces (selected slice last so popped bevel stands out cleanly)
    const topFaces = [...visibleSlices].sort((a, b) => {
      if (a.isSelected !== b.isSelected) return a.isSelected ? 1 : -1;
      return Math.sin(a.mid) - Math.sin(b.mid);
    });

    const topHtml = topFaces.map(vs => {
      let sectorEl;
      if (vs.sweep >= Math.PI * 2 - 0.002) {
        sectorEl = `<ellipse cx="${vs.ox.toFixed(2)}" cy="${vs.oy.toFixed(2)}" rx="${RX}" ry="${RY}" fill="url(#${vs.gradId})" stroke="#ffffff" stroke-width="${vs.isSelected ? '2.4' : '1.4'}" />`;
      } else {
        const p1 = pt(vs.ox, vs.oy, vs.a1);
        const p2 = pt(vs.ox, vs.oy, vs.a2);
        const largeArc = vs.sweep > Math.PI ? 1 : 0;
        const d = `M ${vs.ox.toFixed(2)} ${vs.oy.toFixed(2)} L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${RX} ${RY} 0 ${largeArc} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} Z`;
        sectorEl = `<path d="${d}" fill="url(#${vs.gradId})" stroke="#ffffff" stroke-width="${vs.isSelected ? '2.4' : '1.4'}" stroke-linejoin="round" />`;
      }

      let labelEl = '';
      if (vs.sweep >= 0.28) {
        const lx = vs.ox + RX * 0.62 * Math.cos(vs.mid);
        const ly = vs.oy + RY * 0.62 * Math.sin(vs.mid);
        labelEl = `<text class="pie3d-label" x="${lx.toFixed(2)}" y="${ly.toFixed(2)}">${Math.round(vs.pctScope)}%</text>`;
      }

      return `<g class="pie3d-slice-group" data-city="${escapeHtml(vs.city)}">${sectorEl}${labelEl}</g>`;
    }).join('');

    geoPie3dSvg.innerHTML = `<defs>${defsParts.join('')}</defs>${shadowLayer}${cutWalls.join('')}${curvedWalls.map(w => w.html).join('')}${topHtml}`;

    geoPie3dSvg.querySelectorAll('.pie3d-slice-group').forEach(el => {
      el.addEventListener('click', () => {
        const city = el.getAttribute('data-city');
        if (city) selectGeoCity(city, true);
      });
      el.addEventListener('mouseenter', () => {
        const city = el.getAttribute('data-city');
        const hovered = pieAnimState.slices.find(s => s.city === city);
        if (hovered) updatePie3dInfoBanner(hovered);
      });
    });
  }

  function renderGeographicAnalytics(geography, animateFill = true) {
    if (!geography) return;
    const { summary } = geography;

    if (geoCitiesCountBadge) {
      geoCitiesCountBadge.textContent = `${summary.totalCiudades} ${summary.totalCiudades === 1 ? 'Ciudad' : 'Ciudades'}`;
    }

    if (btnGeoScopeAll) btnGeoScopeAll.classList.toggle('active', state.analytics.geoIncludeMissing);
    if (btnGeoScopeKnown) btnGeoScopeKnown.classList.toggle('active', !state.analytics.geoIncludeMissing);

    if (geoSummaryPills) {
      const pctLocal = summary.totalPersonas > 0 ? Math.round((summary.enSotoDelReal / summary.totalPersonas) * 100) : 0;
      const pctOther = summary.totalPersonas > 0 ? Math.round((summary.otrasCiudades / summary.totalPersonas) * 100) : 0;
      geoSummaryPills.innerHTML = `
        <span class="today-pill pill-nuevo"><i class="fa-sharp-duotone fa-solid fa-church"></i> Soto del Real: <strong>${summary.enSotoDelReal}</strong> (${pctLocal}%)</span>
        <span class="today-pill pill-consolidado"><i class="fa-sharp-duotone fa-solid fa-car-side"></i> Otras ciudades: <strong>${summary.otrasCiudades}</strong> (${pctOther}%)</span>
        <span class="today-pill pill-total"><i class="fa-sharp-duotone fa-solid fa-map-pin"></i> Con dirección: <strong>${summary.conDireccion}</strong></span>
        <span class="today-pill pill-total"><i class="fa-sharp-duotone fa-solid fa-circle-question"></i> Sin dirección: <strong>${summary.sinDireccion}</strong></span>
      `;
    }

    const slices = buildPie3DSlices(geography);
    pieAnimState.slices = slices;

    if (!state.analytics.selectedCity || !slices.some(c => c.city === state.analytics.selectedCity)) {
      state.analytics.selectedCity = slices.length > 0 ? slices[0].city : null;
    }

    const activeSlice = slices.find(s => s.city === state.analytics.selectedCity) || slices[0] || null;
    updatePie3dInfoBanner(activeSlice);

    if (geoCitiesList) {
      geoCitiesList.innerHTML = '';
      if (slices.length === 0) {
        geoCitiesList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem;">No hay participantes registrados.</div>';
      } else {
        slices.forEach((c) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.dataset.city = c.city;
          btn.className = `geo-city-row ${state.analytics.selectedCity === c.city ? 'active' : ''}`;
          btn.innerHTML = `
            <div class="geo-city-name">
              <span class="geo-legend-swatch" style="background: ${c.palette.top};"></span>
              <span>${escapeHtml(c.city)}</span>
            </div>
            <div class="geo-city-count">${c.count} (${c.pctScope}%)</div>
          `;
          btn.addEventListener('click', () => selectGeoCity(c.city, true));
          geoCitiesList.appendChild(btn);
        });
      }
    }

    renderGeoDetailPanel(geography);

    if (animateFill && typeof anime === 'function') {
      anime.remove(pieAnimState);
      pieAnimState.progress = 0;
      pieAnimState.pop = 1;
      drawGeoPie3DSvg();

      anime({
        targets: pieAnimState,
        progress: [0, 1],
        duration: 1400,
        easing: 'easeOutCubic',
        update: () => drawGeoPie3DSvg()
      });

      if (geoCitiesList) {
        anime({
          targets: geoCitiesList.querySelectorAll('.geo-city-row'),
          opacity: [0, 1],
          translateY: [10, 0],
          delay: anime.stagger(70),
          duration: 450,
          easing: 'easeOutQuad'
        });
      }
    } else {
      pieAnimState.progress = 1;
      pieAnimState.pop = 1;
      drawGeoPie3DSvg();
    }
  }

  function renderGeoDetailPanel(geography) {
    if (!geoZonesAndPeople || !geography) return;
    if (btnGeoModeCity) btnGeoModeCity.classList.toggle('active', state.analytics.geoMode === 'city');
    if (btnGeoModeAllZones) btnGeoModeAllZones.classList.toggle('active', state.analytics.geoMode === 'allZones');

    geoZonesAndPeople.innerHTML = '';

    if (state.analytics.geoMode === 'allZones') {
      if (geoSelectedCityTitle) {
        geoSelectedCityTitle.innerHTML = '<i class="fa-sharp-duotone fa-solid fa-road"></i> Zonas / Calles con Dirección Detallada';
      }
      const topZones = geography.topZones || [];
      if (topZones.length === 0) {
        geoZonesAndPeople.innerHTML = `
          <div style="font-size: 0.85rem; color: var(--text-muted); padding: 1rem; background: white; border: 1px dashed var(--border); border-radius: 8px;">
            Todavía no hay calles, barrios o urbanizaciones detalladas (en la carga base solo se registró el municipio). Al editar o registrar personas con calle/barrio aparecerán agrupadas aquí.
          </div>
        `;
        return;
      }

      const listDiv = document.createElement('div');
      listDiv.className = 'geo-zones-list';
      topZones.forEach((z) => {
        const card = document.createElement('div');
        card.className = 'geo-zone-item';
        card.innerHTML = `
          <div class="geo-zone-item-head">
            <span><i class="fa-sharp-duotone fa-solid fa-location-dot" style="color: var(--primary);"></i> ${escapeHtml(z.zone)} <small style="color: var(--text-muted); font-weight: 500;">(${escapeHtml(z.city)})</small></span>
            <span class="today-pill pill-consolidado">${z.count} ${z.count === 1 ? 'persona' : 'personas'}</span>
          </div>
        `;
        listDiv.appendChild(card);
      });
      geoZonesAndPeople.appendChild(listDiv);
      return;
    }

    const cityObj = (geography.cities || []).find(c => c.city === state.analytics.selectedCity);
    if (!cityObj) return;

    if (geoSelectedCityTitle) {
      geoSelectedCityTitle.innerHTML = `<i class="fa-sharp-duotone fa-solid fa-road"></i> ${escapeHtml(cityObj.city)} (${cityObj.count})`;
    }

    const zonesContainer = document.createElement('div');
    zonesContainer.className = 'geo-zones-list';

    (cityObj.zones || []).forEach((z) => {
      const zItem = document.createElement('div');
      zItem.className = 'geo-zone-item';

      const head = document.createElement('div');
      head.className = 'geo-zone-item-head';
      head.innerHTML = `
        <span><i class="fa-sharp-duotone fa-solid fa-signs-post" style="color: ${z.isKnownZone ? 'var(--primary)' : '#94a3b8'};"></i> ${escapeHtml(z.zone)}</span>
        <span class="today-pill pill-total">${z.count}</span>
      `;
      zItem.appendChild(head);

      const tagsWrap = document.createElement('div');
      tagsWrap.className = 'geo-zone-people-tags';
      z.personas.forEach((p) => {
        const tagBtn = document.createElement('button');
        tagBtn.type = 'button';
        tagBtn.className = 'geo-person-tag';
        tagBtn.textContent = p.nombre;
        tagBtn.title = 'Ver historial de visitas de ' + p.nombre;
        tagBtn.addEventListener('click', () => selectAnalyticsPerson(p.id, true));
        tagsWrap.appendChild(tagBtn);
      });
      zItem.appendChild(tagsWrap);
      zonesContainer.appendChild(zItem);
    });

    geoZonesAndPeople.appendChild(zonesContainer);
  }

  // Attach Analytics Navigation & Events
  if (btnOpenAnalyticsPage) btnOpenAnalyticsPage.addEventListener('click', () => openAnalyticsPage(true));
  if (btnAdminGoAnalytics) btnAdminGoAnalytics.addEventListener('click', () => openAnalyticsPage(true));
  if (btnBackToHome) btnBackToHome.addEventListener('click', () => openHomePage(true));
  if (btnRefreshAnalytics) btnRefreshAnalytics.addEventListener('click', () => syncAnalyticsAccessState());
  if (btnAnalyticsLogout) btnAnalyticsLogout.addEventListener('click', () => logoutAdmin(true));

  if (analyticsLoginForm) {
    analyticsLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const u = analyticsLoginUser ? analyticsLoginUser.value.trim() : '';
      const p = analyticsLoginPass ? analyticsLoginPass.value : '';
      if (!u || !p) return;

      if (btnAnalyticsLogin) {
        btnAnalyticsLogin.disabled = true;
        btnAnalyticsLogin.innerHTML = '<i class="fa-sharp-duotone fa-solid fa-spinner fa-spin"></i> Verificando...';
      }
      if (analyticsLoginError) analyticsLoginError.style.display = 'none';

      try {
        const user = await authenticateAdmin(u, p);
        showToast(`¡Bienvenida ${user.username}! Acceso concedido`, 'success');
        await syncAnalyticsAccessState();
      } catch (err) {
        if (analyticsLoginError) {
          analyticsLoginError.style.display = 'flex';
          analyticsLoginError.innerHTML = `<i class="fa-sharp-duotone fa-solid fa-triangle-exclamation"></i> ${escapeHtml(err.message)}`;
        }
        if (analyticsLoginPass) {
          analyticsLoginPass.focus();
          analyticsLoginPass.select();
        }
      } finally {
        if (btnAnalyticsLogin) {
          btnAnalyticsLogin.disabled = false;
          btnAnalyticsLogin.innerHTML = '<i class="fa-sharp-duotone fa-solid fa-right-to-bracket"></i> Acceder a Analíticas';
        }
      }
    });
  }

  analyticsPresetBtns.forEach(btn => {
    btn.addEventListener('click', () => setAnalyticsPreset(btn.dataset.preset));
  });

  if (btnApplySingleDate) {
    btnApplySingleDate.addEventListener('click', () => {
      const val = analyticsSingleDate ? analyticsSingleDate.value : '';
      if (!val) {
        showToast('Selecciona una fecha específica', 'error');
        return;
      }
      analyticsPresetBtns.forEach(b => b.classList.remove('active'));
      state.analytics.filter = { ...state.analytics.filter, mode: 'date', date: val };
      loadAnalyticsOverview();
    });
  }

  if (btnApplyRange) {
    btnApplyRange.addEventListener('click', () => {
      const from = analyticsDateFrom ? analyticsDateFrom.value : '';
      const to = analyticsDateTo ? analyticsDateTo.value : '';
      if (!from && !to) {
        showToast('Selecciona al menos una fecha de inicio o fin', 'error');
        return;
      }
      analyticsPresetBtns.forEach(b => b.classList.remove('active'));
      state.analytics.filter = { ...state.analytics.filter, mode: 'range', dateFrom: from, dateTo: to };
      loadAnalyticsOverview();
    });
  }

  let analyticsSearchTimer;
  if (analyticsPersonSearch) {
    analyticsPersonSearch.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (analyticsPersonClearBtn) analyticsPersonClearBtn.style.display = val ? 'flex' : 'none';
      clearTimeout(analyticsSearchTimer);
      analyticsSearchTimer = setTimeout(() => loadAnalyticsPersonas(val, true), 180);
    });
    analyticsPersonSearch.addEventListener('focus', () => {
      loadAnalyticsPersonas(analyticsPersonSearch.value.trim(), true);
    });
  }

  if (analyticsPersonClearBtn) {
    analyticsPersonClearBtn.addEventListener('click', () => {
      if (analyticsPersonSearch) analyticsPersonSearch.value = '';
      analyticsPersonClearBtn.style.display = 'none';
      loadAnalyticsPersonas('', true);
      if (analyticsPersonSearch) analyticsPersonSearch.focus();
    });
  }

  if (btnGeoModeCity) {
    btnGeoModeCity.addEventListener('click', () => {
      state.analytics.geoMode = 'city';
      if (state.analytics.overview) renderGeoDetailPanel(state.analytics.overview.geography);
    });
  }

  if (btnGeoModeAllZones) {
    btnGeoModeAllZones.addEventListener('click', () => {
      state.analytics.geoMode = 'allZones';
      if (state.analytics.overview) renderGeoDetailPanel(state.analytics.overview.geography);
    });
  }

  if (btnGeoScopeAll) {
    btnGeoScopeAll.addEventListener('click', () => {
      if (state.analytics.geoIncludeMissing) return;
      state.analytics.geoIncludeMissing = true;
      if (state.analytics.overview) renderGeographicAnalytics(state.analytics.overview.geography, true);
    });
  }

  if (btnGeoScopeKnown) {
    btnGeoScopeKnown.addEventListener('click', () => {
      if (!state.analytics.geoIncludeMissing) return;
      state.analytics.geoIncludeMissing = false;
      if (state.analytics.overview) renderGeographicAnalytics(state.analytics.overview.geography, true);
    });
  }

  document.addEventListener('click', (e) => {
    if (analyticsPersonDropdown && !e.target.closest('#analyticsPersonSection .searchable-dropdown-wrapper')) {
      analyticsPersonDropdown.style.display = 'none';
    }
  });

  window.addEventListener('popstate', () => {
    if (window.location.pathname === '/analiticas') {
      openAnalyticsPage(false);
    } else {
      openHomePage(false);
    }
  });

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAsistenciaModal();
      closeNuevoModal();
      closeEditModal();
      closeDeleteModal();
      closeAdminPanel();
      importModal.classList.remove('open');
      exportDropdown.classList.remove('open');
      asistDropdownResults.style.display = 'none';
      if (analyticsPersonDropdown) analyticsPersonDropdown.style.display = 'none';
    }
  });

  // --- INITIALIZATION ---
  startClock();
  if (window.location.pathname === '/analiticas') {
    openAnalyticsPage(false);
  } else {
    fetchStats();
    fetchAsistencias();
  }
});
