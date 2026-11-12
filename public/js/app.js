// ControlNVSR - Client Application
document.addEventListener('DOMContentLoaded', () => {
  // App State
  const state = {
    personas: [],
    stats: { total: 0, nuevos: 0, consolidados: 0, hoy: 0 },
    filters: {
      search: '',
      tipo: 'todos',
      dateFilter: 'todos'
    },
    editingId: null,
    deleteId: null
  };

  // DOM Elements
  const form = document.getElementById('personaForm');
  const inputNombre = document.getElementById('inputNombre');
  const inputTelefono = document.getElementById('inputTelefono');
  const inputDireccion = document.getElementById('inputDireccion');
  const inputCumpleanos = document.getElementById('inputCumpleanos');
  const inputFechaHora = document.getElementById('inputFechaHora');
  const inputNotas = document.getElementById('inputNotas');
  const btnSetNow = document.getElementById('btnSetNow');
  const btnReset = document.getElementById('btnReset');

  // Radio Options for Nuevo / Consolidado
  const optionNuevo = document.getElementById('optionNuevo');
  const optionConsolidado = document.getElementById('optionConsolidado');
  const radioNuevo = document.getElementById('radioNuevo');
  const radioConsolidado = document.getElementById('radioConsolidado');

  // Stats Elements
  const statTotal = document.getElementById('statTotal');
  const statNuevos = document.getElementById('statNuevos');
  const statConsolidados = document.getElementById('statConsolidados');
  const statHoy = document.getElementById('statHoy');

  // Table and Toolbar Elements
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

  // Modals
  const editModal = document.getElementById('editModal');
  const editForm = document.getElementById('editForm');
  const closeEditModalBtn = document.getElementById('closeEditModalBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  // Delete Modal
  const deleteModal = document.getElementById('deleteModal');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const deletePersonName = document.getElementById('deletePersonName');

  // Import Modal
  const importModal = document.getElementById('importModal');
  const btnOpenImport = document.getElementById('btnOpenImport');
  const closeImportModalBtn = document.getElementById('closeImportModalBtn');
  const fileInput = document.getElementById('fileInput');
  const dropzone = document.getElementById('dropzone');
  const btnProcessImport = document.getElementById('btnProcessImport');
  const selectedFileName = document.getElementById('selectedFileName');

  // Clock
  const clockElement = document.getElementById('headerClock');

  // --- HELPER FUNCTIONS ---

  // Format date-time for datetime-local input: "YYYY-MM-DDTHH:mm"
  function getLocalDateTimeString(date = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${y}-${m}-${d}T${h}:${min}`;
  }

  // Set default current time in registration form
  function resetDateTimeInput() {
    if (inputFechaHora) {
      inputFechaHora.value = getLocalDateTimeString();
    }
  }

  // Format human readable date
  function formatDisplayDate(dateStr) {
    if (!dateStr) return '-';
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

  // Live Clock in Header
  function startClock() {
    const update = () => {
      const now = new Date();
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
      if (clockElement) {
        const text = now.toLocaleDateString('es-ES', options);
        clockElement.textContent = text.charAt(0).toUpperCase() + text.slice(1);
      }
    };
    update();
    setInterval(update, 1000);
  }

  // Toast Notification
  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✅' : '⚠️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Handle Radio Option Styling
  function updateTypeSelection(selectedType) {
    if (selectedType === 'nuevo') {
      radioNuevo.checked = true;
      optionNuevo.classList.add('selected');
      optionConsolidado.classList.remove('selected');
    } else {
      radioConsolidado.checked = true;
      optionConsolidado.classList.add('selected');
      optionNuevo.classList.remove('selected');
    }
  }

  optionNuevo.addEventListener('click', () => updateTypeSelection('nuevo'));
  optionConsolidado.addEventListener('click', () => updateTypeSelection('consolidado'));

  if (btnSetNow) {
    btnSetNow.addEventListener('click', () => {
      resetDateTimeInput();
      showToast('Fecha y hora actualizadas al momento actual', 'success');
    });
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

  async function fetchPersonas() {
    try {
      const params = new URLSearchParams();
      if (state.filters.search) params.append('search', state.filters.search);
      if (state.filters.tipo && state.filters.tipo !== 'todos') params.append('tipo', state.filters.tipo);

      if (state.filters.dateFilter === 'hoy') {
        const todayStr = new Date().toISOString().slice(0, 10);
        params.append('dateFrom', `${todayStr} 00:00:00`);
        params.append('dateTo', `${todayStr} 23:59:59`);
      }

      const res = await fetch(`/api/personas?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar datos');
      const data = await res.json();
      state.personas = data;
      renderTable();
    } catch (err) {
      console.error(err);
      showToast('No se pudieron cargar los registros', 'error');
    }
  }

  // Render Stats
  function renderStats() {
    const { total, nuevos, consolidados, hoy } = state.stats;
    statTotal.textContent = total;
    statNuevos.textContent = nuevos;
    statConsolidados.textContent = consolidados;
    statHoy.textContent = hoy;
  }

  // Clean phone number for WhatsApp link
  function formatWhatsAppLink(phone, name) {
    if (!phone) return null;
    let clean = phone.replace(/\D/g, '');
    if (clean.length === 9) {
      // Spain mobile without country code
      clean = '34' + clean;
    }
    const message = encodeURIComponent(`¡Hola ${name || ''}! Te saludamos cordialmente de la Iglesia Nueva Vida de Soto del Real. Nos alegramos de tenerte con nosotros.`);
    return `https://wa.me/${clean}?text=${message}`;
  }

  // Render Table Rows
  function renderTable() {
    tableBody.innerHTML = '';

    if (totalCountLabel) {
      totalCountLabel.textContent = `${state.personas.length} registro${state.personas.length === 1 ? '' : 's'}`;
    }

    if (state.personas.length === 0) {
      tableBody.parentElement.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    tableBody.parentElement.style.display = 'table';
    emptyState.style.display = 'none';

    state.personas.forEach((p, index) => {
      const tr = document.createElement('tr');

      const isNuevo = p.tipo === 'nuevo';
      const badgeClass = isNuevo ? 'badge-nuevo' : 'badge-consolidado';
      const badgeText = isNuevo ? '🟢 Nuevo' : '🔵 Consolidado';

      const waLink = formatWhatsAppLink(p.telefono, p.nombre);

      tr.innerHTML = `
        <td style="font-weight: 600; color: #64748b; width: 40px; text-align: center;">${index + 1}</td>
        <td>
          <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem;">${escapeHtml(p.nombre)}</div>
          ${p.notas ? `<div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;" title="${escapeHtml(p.notas)}">📝 ${escapeHtml(p.notas)}</div>` : ''}
        </td>
        <td>
          ${p.telefono ? `
            <div style="display: flex; align-items: center;">
              <a href="tel:${escapeHtml(p.telefono)}" class="phone-link">${escapeHtml(p.telefono)}</a>
              ${waLink ? `
                <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="whatsapp-btn" title="Contactar por WhatsApp">
                  💬
                </a>
              ` : ''}
            </div>
          ` : '<span style="color: #94a3b8;">-</span>'}
        </td>
        <td>${p.direccion ? escapeHtml(p.direccion) : '<span style="color: #94a3b8;">-</span>'}</td>
        <td style="white-space: nowrap;">${p.cumpleanos ? `🎂 ${escapeHtml(p.cumpleanos)}` : '<span style="color: #94a3b8;">-</span>'}</td>
        <td>
          <span class="badge-status ${badgeClass}">${badgeText}</span>
        </td>
        <td class="cell-date">${formatDisplayDate(p.fecha_hora_registro)}</td>
        <td style="text-align: right; white-space: nowrap;">
          <div class="row-actions" style="justify-content: flex-end;">
            <button class="action-btn btn-edit" data-id="${p.id}" title="Editar registro">✏️</button>
            <button class="action-btn btn-delete" data-id="${p.id}" data-name="${escapeHtml(p.nombre)}" title="Eliminar registro">🗑️</button>
          </div>
        </td>
      `;

      tableBody.appendChild(tr);
    });

    // Attach Event Listeners to Action Buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => openDeleteModal(btn.dataset.id, btn.dataset.name));
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  // --- FORM SUBMISSION ---

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = inputNombre.value.trim();
    if (!nombre) {
      showToast('Por favor ingrese el nombre', 'error');
      inputNombre.focus();
      return;
    }

    const tipo = radioNuevo.checked ? 'nuevo' : 'consolidado';
    const telefono = inputTelefono.value.trim();
    const direccion = inputDireccion.value.trim();
    const cumpleanos = inputCumpleanos.value.trim();
    const notas = inputNotas.value.trim();

    // Use input datetime or current time
    let fechaHora = inputFechaHora.value.trim();
    if (fechaHora) {
      fechaHora = fechaHora.replace('T', ' ') + ':00';
    } else {
      fechaHora = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    const payload = {
      nombre,
      telefono,
      direccion,
      cumpleanos,
      tipo,
      fecha_hora_registro: fechaHora,
      notas
    };

    try {
      const res = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al guardar');
      }

      showToast(`¡Registro de "${nombre}" guardado con éxito!`, 'success');

      // Reset form
      form.reset();
      updateTypeSelection('nuevo');
      resetDateTimeInput();
      inputNombre.focus();

      // Refresh data and stats
      await fetchPersonas();
      await fetchStats();
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    }
  });

  btnReset.addEventListener('click', () => {
    form.reset();
    updateTypeSelection('nuevo');
    resetDateTimeInput();
  });

  // --- FILTERS & SEARCH ---

  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.filters.search = e.target.value;
      fetchPersonas();
    }, 250);
  });

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      state.filters.search = '';
      fetchPersonas();
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
      } else {
        state.filters.tipo = filterType;
        state.filters.dateFilter = 'todos';
      }

      fetchPersonas();
    });
  });

  // --- EXPORT TO EXCEL ---

  // Toggle Dropdown
  exportBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    exportDropdown.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!exportDropdown.contains(e.target)) {
      exportDropdown.classList.remove('open');
    }
  });

  function downloadExcel(format) {
    const params = new URLSearchParams();
    params.append('format', format);
    if (state.filters.search) params.append('search', state.filters.search);
    if (state.filters.tipo && state.filters.tipo !== 'todos') params.append('tipo', state.filters.tipo);
    if (state.filters.dateFilter === 'hoy') {
      const todayStr = new Date().toISOString().slice(0, 10);
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

  // --- EDIT MODAL ---

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
      await fetchPersonas();
      await fetchStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // --- DELETE MODAL ---

  function openDeleteModal(id, name) {
    state.deleteId = id;
    deletePersonName.textContent = `"${name}"`;
    deleteModal.classList.add('open');
  }

  function closeDeleteModal() {
    deleteModal.classList.remove('open');
    state.deleteId = null;
  }

  cancelDeleteBtn.addEventListener('click', closeDeleteModal);

  confirmDeleteBtn.addEventListener('click', async () => {
    if (!state.deleteId) return;

    try {
      const res = await fetch(`/api/personas/${state.deleteId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Error al eliminar');

      showToast('Registro eliminado', 'success');
      closeDeleteModal();
      await fetchPersonas();
      await fetchStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // --- IMPORT EXCEL ---

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
    selectedFileName.textContent = `Archivo seleccionado: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
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
      await fetchPersonas();
      await fetchStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btnProcessImport.disabled = false;
      btnProcessImport.textContent = 'Procesar e Importar';
    }
  });

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeEditModal();
      closeDeleteModal();
      importModal.classList.remove('open');
      exportDropdown.classList.remove('open');
    }
  });

  // --- INITIALIZATION ---
  startClock();
  resetDateTimeInput();
  updateTypeSelection('nuevo');
  fetchStats();
  fetchPersonas();
});

