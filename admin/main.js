document.addEventListener('DOMContentLoaded', () => {
    // Elementy hlavnej stránky
    const bookingsTableBody = document.getElementById('bookings-table-body');
    const slotsTableBody = document.getElementById('slots-table-body');

    // Elementy modálneho okna
    const modal = document.getElementById('edit-modal');
    const editBookingIdInput = document.getElementById('edit-booking-id');
    const editEmailInput = document.getElementById('edit-email');
    const editLicensePlateInput = document.getElementById('edit-license-plate');
    const saveButton = document.getElementById('save-edit');
    const cancelButton = document.getElementById('cancel-edit');

    // --- Funkcie na interakciu s API ---

    // Zmení stav rezervácie (confirmed/cancelled)
    async function updateBookingStatus(bookingId, currentStatus) {
        const newStatus = currentStatus === 'confirmed' ? 'cancelled' : 'confirmed';
        if (!confirm(`Naozaj chcete zmeniť stav rezervácie #${bookingId} na "${newStatus}"?`)) {
            return;
        }
        try {
            const response = await fetch(`/admin/bookings/${bookingId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newStatus })
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Serverová chyba');
            fetchBookings();
            fetchSlots();
        } catch (error) {
            alert(`Nepodarilo sa zmeniť stav: ${error.message}`);
        }
    }

    // Odstráni rezerváciu
    async function deleteBooking(bookingId) {
        if (!confirm(`Naozaj chcete natrvalo odstrániť rezerváciu #${bookingId}? Táto akcia je nezvratná.`)) {
            return;
        }
        try {
            const response = await fetch(`/admin/bookings/${bookingId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error((await response.json()).error || 'Serverová chyba');
            fetchBookings();
            fetchSlots();
        } catch (error) {
            alert(`Nepodarilo sa odstrániť rezerváciu: ${error.message}`);
        }
    }
    
    // Uloží zmeny z modálneho okna
    async function saveBookingChanges() {
        const bookingId = editBookingIdInput.value;
        const data = {
            email: editEmailInput.value,
            license_plate: editLicensePlateInput.value
        };

        try {
            const response = await fetch(`/admin/bookings/${bookingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Serverová chyba');
            closeModal();
            fetchBookings();
        } catch (error) {
            alert(`Nepodarilo sa uložiť zmeny: ${error.message}`);
        }
    }

    // --- Funkcie pre modálne okno ---
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

    // --- Funkcie na načítanie a zobrazenie dát ---

    async function fetchBookings() {
        try {
            const response = await fetch('/admin/bookings');
            const bookings = await response.json();
            bookingsTableBody.innerHTML = ''; 

            if (bookings.length === 0) {
                 bookingsTableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4">Nenašli sa žiadne rezervácie.</td></tr>';
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
                        <button data-action="edit" class="text-blue-600 hover:text-blue-900">Upraviť</button>
                        <button data-action="toggle" class="text-indigo-600 hover:text-indigo-900 ml-4">Zmeniť stav</button>
                        <button data-action="delete" class="text-red-600 hover:text-red-900 ml-4">Odstrániť</button>
                    </td>
                `;
                
                row.querySelector('[data-action="edit"]').addEventListener('click', () => openModal(booking));
                row.querySelector('[data-action="toggle"]').addEventListener('click', () => updateBookingStatus(booking.id, booking.status));
                row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteBooking(booking.id));

                bookingsTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Chyba pri načítavaní rezervácií:', error);
            bookingsTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Nepodarilo sa načítať dáta.</td></tr>';
        }
    }

    async function fetchSlots() {
        try {
            const response = await fetch('/admin/slots');
            const slots = await response.json();

            slotsTableBody.innerHTML = ''; // Vyčistí staré dáta

            if (slots.length === 0) {
                 slotsTableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4">Nenašli sa žiadne parkovacie miesta.</td></tr>';
                 return;
            }

            slots.forEach(slot => {
                const row = `
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
                slotsTableBody.innerHTML += row;
            });
        } catch (error) {
            console.error('Chyba pri načítavaní parkovacích miest:', error);
            slotsTableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4">Nepodarilo sa načítať dáta.</td></tr>';
        }
    }


    // Event listener pre celú tabuľku rezervácií
    bookingsTableBody.addEventListener('click', (event) => {
        const target = event.target;
        const action = target.dataset.action;
        const id = target.dataset.id;

        if (action === 'edit') {
            const status = target.dataset.status;
            updateBookingStatus(id, status);
        } else if (action === 'delete') {
            deleteBooking(id);
        }
    });

    // Event listener pre celú tabuľku rezervácií
    // Teraz sa priama akcia vykonáva cez event listenery priradené k tlačidlám priamo v ich riadku
    // bookingsTableBody.addEventListener('click', (event) => { ... });

    // Načítaj dáta pri prvom spustení
    fetchBookings();
    fetchSlots(); // ODkomentované
});