document.addEventListener('DOMContentLoaded', () => {
    const bookingsTableBody = document.getElementById('bookings-table-body');
    const slotsTableBody = document.getElementById('slots-table-body');

    // --- Funkcie na interakciu s API ---

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
            if (!response.ok) {
                throw new Error((await response.json()).error || 'Serverová chyba');
            }
            // Obnov dáta po úspešnej zmene
            fetchBookings();
            fetchSlots();
        } catch (error) {
            console.error('Chyba pri zmene stavu rezervácie:', error);
            alert(`Nepodarilo sa zmeniť stav: ${error.message}`);
        }
    }

    async function deleteBooking(bookingId) {
        if (!confirm(`Naozaj chcete natrvalo odstrániť rezerváciu #${bookingId}? Táto akcia je nezvratná.`)) {
            return;
        }

        try {
            const response = await fetch(`/admin/bookings/${bookingId}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error((await response.json()).error || 'Serverová chyba');
            }
            // Obnov dáta po úspešnom odstránení
            fetchBookings();
            fetchSlots();
        } catch (error) {
            console.error('Chyba pri odstraňovaní rezervácie:', error);
            alert(`Nepodarilo sa odstrániť rezerváciu: ${error.message}`);
        }
    }


    // --- Funkcie na načítanie a zobrazenie dát ---

    async function fetchBookings() {
        try {
            const response = await fetch('/admin/bookings');
            const bookings = await response.json();

            bookingsTableBody.innerHTML = ''; // Vyčistí staré dáta

            if (bookings.length === 0) {
                 bookingsTableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4">Nenašli sa žiadne rezervácie.</td></tr>';
                 return;
            }

            bookings.forEach(booking => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${booking.id}</td>
                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${booking.slot_name}</td>
                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${booking.license_plate}</td>
                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${booking.email}</td>
                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${booking.booking_date}</td>
                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${booking.total_price.toFixed(2)} €</td>
                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <span class="relative inline-block px-3 py-1 font-semibold ${booking.status === 'confirmed' ? 'text-green-900' : 'text-red-900'} leading-tight">
                            <span aria-hidden="true" class="absolute inset-0 ${booking.status === 'confirmed' ? 'bg-green-200' : 'bg-red-200'} opacity-50 rounded-full"></span>
                            <span class="relative">${booking.status}</span>
                        </span>
                    </td>
                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <button data-action="edit" data-id="${booking.id}" data-status="${booking.status}" class="text-indigo-600 hover:text-indigo-900">Zmeniť stav</button>
                        <button data-action="delete" data-id="${booking.id}" class="text-red-600 hover:text-red-900 ml-4">Odstrániť</button>
                    </td>
                `;
                bookingsTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Chyba pri načítavaní rezervácií:', error);
            bookingsTableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4">Nepodarilo sa načítať dáta.</td></tr>';
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
                        <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${slot.id}</td>
                        <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${slot.slot_name}</td>
                        <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
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

    // Načítaj dáta pri prvom spustení
    fetchBookings();
    fetchSlots();
});