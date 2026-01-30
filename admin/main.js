document.addEventListener('DOMContentLoaded', () => {
    console.log("Admin JS sa spustil.");

    const bookingsContainer = document.getElementById('bookings-container');
    const slotsContainer = document.getElementById('slots-container');

    async function fetchData() {
        console.log("Načítavam dáta...");
        try {
            // Načítanie rezervácií
            const bookingsRes = await fetch('/admin/bookings');
            if (!bookingsRes.ok) throw new Error('Nepodarilo sa načítať rezervácie');
            const bookings = await bookingsRes.json();
            
            bookingsContainer.innerHTML = ''; // Vyčistiť "Načítavam..."
            const bookingsTable = document.createElement('table');
            bookingsTable.className = 'min-w-full';
            bookingsTable.innerHTML = `
                <thead><tr>
                    <th class="px-5 py-3 border-b-2 text-left">ID</th>
                    <th class="px-5 py-3 border-b-2 text-left">EČV</th>
                    <th class="px-5 py-3 border-b-2 text-left">Email</th>
                    <th class="px-5 py-3 border-b-2 text-left">Stav</th>
                </tr></thead>
            `;
            const bookingsTbody = document.createElement('tbody');
            bookings.forEach(b => {
                bookingsTbody.innerHTML += `
                    <tr>
                        <td class="px-5 py-5 border-b">${b.id}</td>
                        <td class="px-5 py-5 border-b">${b.license_plate}</td>
                        <td class="px-5 py-5 border-b">${b.email}</td>
                        <td class="px-5 py-5 border-b">${b.status}</td>
                    </tr>`;
            });
            bookingsTable.appendChild(bookingsTbody);
            bookingsContainer.appendChild(bookingsTable);
            console.log("Rezervácie načítané.");

            // Načítanie parkovacích miest
            const slotsRes = await fetch('/admin/slots');
            if (!slotsRes.ok) throw new Error('Nepodarilo sa načítať parkovacie miesta');
            const slots = await slotsRes.json();
            
            slotsContainer.innerHTML = ''; // Vyčistiť "Načítavam..."
            const slotsTable = document.createElement('table');
            slotsTable.className = 'min-w-full';
            slotsTable.innerHTML = `
                <thead><tr>
                    <th class="px-5 py-3 border-b-2 text-left">ID</th>
                    <th class="px-5 py-3 border-b-2 text-left">Názov miesta</th>
                    <th class="px-5 py-3 border-b-2 text-left">Stav</th>
                </tr></thead>
            `;
            const slotsTbody = document.createElement('tbody');
            slots.forEach(s => {
                slotsTbody.innerHTML += `
                    <tr>
                        <td class="px-5 py-5 border-b">${s.id}</td>
                        <td class="px-5 py-5 border-b">${s.slot_name}</td>
                        <td class="px-5 py-5 border-b">${s.status}</td>
                    </tr>`;
            });
            slotsTable.appendChild(slotsTbody);
            slotsContainer.appendChild(slotsTable);
            console.log("Miesta načítané.");

        } catch (error) {
            console.error("Fatálna chyba pri načítaní dát:", error);
            bookingsContainer.innerHTML = `<p class="text-red-500">Chyba: ${error.message}</p>`;
            slotsContainer.innerHTML = `<p class="text-red-500">Chyba: ${error.message}</p>`;
        }
    }

    fetchData();
});