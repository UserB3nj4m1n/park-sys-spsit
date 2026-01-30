document.addEventListener('DOMContentLoaded', () => {
    // --- Elementy stránky ---
    const bookingsTableBody = document.getElementById('bookings-table-body');
    const slotsTableBody = document.getElementById('slots-table-body');
    
    // --- Elementy modálneho okna ---
    const modal = document.getElementById('edit-modal');
    const editBookingIdInput = document.getElementById('edit-booking-id');
    const editEmailInput = document.getElementById('edit-email');
    const editLicensePlateInput = document.getElementById('edit-license-plate');
    const saveButton = document.getElementById('save-edit');
    const cancelButton = document.getElementById('cancel-edit');

    // --- API Funkcie ---

    const api = {
        get: (url) => fetch(url).then(res => res.json()),
        put: (url, data) => fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(res => res.json()),
        delete: (url) => fetch(url, { method: 'DELETE' }).then(res => res.json())
    };

    // --- Logika Modálneho Okna ---

    function openModal(booking) {
        editBookingIdInput.value = booking.id;
        editEmailInput.value = booking.email;
        editLicensePlateInput.value = booking.license_plate;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    function closeModal() {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    async function handleSaveChanges() {
        const id = editBookingIdInput.value;
        const data = {
            email: editEmailInput.value,
            license_plate: editLicensePlateInput.value
        };
        const result = await api.put(`/admin/bookings/${id}`, data);
        if (result.error) {
            alert('Chyba: ' + result.error);
        } else {
            closeModal();
            loadData();
        }
    }

    // --- Logika Načítania a Vykreslenia Dát ---

    async function renderBookings() {
        const bookings = await api.get('/admin/bookings');
        bookingsTableBody.innerHTML = '';
        if (!bookings || bookings.length === 0) {
            bookingsTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Nenašli sa žiadne rezervácie.</td></tr>';
            return;
        }
        bookings.forEach(booking => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-5 py-5 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">${booking.id}</td>
                <td class="px-5 py-5 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">${booking.license_plate}</td>
                <td class="px-5 py-5 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">${booking.email}</td>
                <td class="px-5 py-5 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
                    <span class="relative inline-block px-3 py-1 font-semibold ${booking.status === 'confirmed' ? 'text-green-900' : 'text-red-900'} leading-tight">
                        <span aria-hidden="true" class="absolute inset-0 ${booking.status === 'confirmed' ? 'bg-green-200' : 'bg-red-200'} opacity-50 rounded-full"></span>
                        <span class="relative">${booking.status}</span>
                    </span>
                </td>
                <td class="px-5 py-5 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
                    <button class="text-blue-600 hover:text-blue-900" data-action="edit">Upraviť</button>
                    <button class="text-indigo-600 hover:text-indigo-900 ml-4" data-action="toggle-status">Zmeniť stav</button>
                    <button class="text-red-600 hover:text-red-900 ml-4" data-action="delete">Odstrániť</button>
                </td>
            `;
            bookingsTableBody.appendChild(row);

            row.addEventListener('click', async (e) => {
                const action = e.target.dataset.action;
                if (action === 'edit') {
                    openModal(booking);
                } else if (action === 'toggle-status') {
                    if (confirm(`Naozaj chcete zmeniť stav rezervácie #${booking.id}?`)) {
                        await api.put(`/admin/bookings/${booking.id}/status`, { newStatus: booking.status === 'confirmed' ? 'cancelled' : 'confirmed' });
                        loadData();
                    }
                } else if (action === 'delete') {
                    if (confirm(`Naozaj chcete natrvalo odstrániť rezerváciu #${booking.id}?`)) {
                        await api.delete(`/admin/bookings/${booking.id}`);
                        loadData();
                    }
                }
            });
        });
    }

    async function renderSlots() {
        const slots = await api.get('/admin/slots');
        slotsTableBody.innerHTML = '';
        if (!slots || slots.length === 0) {
            slotsTableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4">Nenašli sa žiadne parkovacie miesta.</td></tr>';
            return;
        }
        slots.forEach(slot => {
            slotsTableBody.innerHTML += `
                <tr>
                    <td class="px-5 py-5 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">${slot.id}</td>
                    <td class="px-5 py-5 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">${slot.slot_name}</td>
                    <td class="px-5 py-5 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
                        <span class="relative inline-block px-3 py-1 font-semibold ${slot.status === 'available' ? 'text-green-900' : 'text-yellow-900'} leading-tight">
                            <span aria-hidden="true" class="absolute inset-0 ${slot.status === 'available' ? 'bg-green-200' : 'bg-yellow-200'} opacity-50 rounded-full"></span>
                            <span class="relative">${slot.status}</span>
                        </span>
                    </td>
                </tr>
            `;
        });
    }
    
    // --- Inicializácia ---

    function loadData() {
        renderBookings();
        renderSlots();
    }

    cancelButton.addEventListener('click', closeModal);
    saveButton.addEventListener('click', handleSaveChanges);
    
    loadData();
});
