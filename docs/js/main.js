// Overriding default tailwind colors for a more modern palette
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                // Using slate for backgrounds and a vibrant indigo for the primary accent
                primary: {
                    DEFAULT: 'rgb(79 70 229)', // indigo-600
                    '50': 'rgb(238 242 255)',
                    '100': 'rgb(224 231 255)',
                    '200': 'rgb(199 210 254)',
                    '300': 'rgb(165 180 252)',
                    '400': 'rgb(129 140 248)',
                    '500': 'rgb(99 102 241)',
                    '600': 'rgb(79 70 229)',
                    '700': 'rgb(67 56 202)',
                    '800': 'rgb(55 48 163)',
                    '900': 'rgb(49 46 129)',
                    '950': 'rgb(30 27 75)',
                },
                background: {
                    light: 'rgb(241 245 249)', // slate-100
                    dark: 'rgb(15 23 42)'     // slate-900
                },
            },
            fontFamily: {
                "display": ["Manrope", "sans-serif"]
            },
            borderRadius: { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" },
        },
    },
}

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const parkingMap = document.getElementById('parking-map');
    const bookingFormContainer = document.getElementById('booking-form-container');
    const summaryNoSlot = document.getElementById('summary-no-slot');
    const summaryWithSlot = document.getElementById('summary-with-slot');

    // Form Elements
    const summarySlotEl = document.getElementById('summary-slot');
    const licensePlateInput = document.getElementById('license-plate');
    const dateInput = document.getElementById('date');
    const startTimeInput = document.getElementById('start-time');
    const durationInput = document.getElementById('duration');
    const summaryPriceEl = document.getElementById('summary-price');
    const confirmBookingButton = document.getElementById('confirm-booking-button');

    // --- State ---
    let allSlots = [];
    let selectedSlot = null;
    const pricePerHour = 5;

    // --- Initialization ---
    function initialize() {
        fetchSlots();
        setupEventListeners();
        setInitialDateTime();
    }

    // --- Data Fetching ---
    async function fetchSlots() {
        try {
            const response = await fetch('http://localhost:3000/api/slots');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            allSlots = data.data;
            renderSlots();
        } catch (error) {
            console.error('Error fetching slots:', error);
            if (parkingMap) parkingMap.innerHTML = '<p class="sm:col-span-2 text-red-500">Pripojenie na server nefunguje</p>';
        }
    }

    // --- Rendering ---
    function renderSlots() {
        if (!parkingMap) return;
        parkingMap.innerHTML = ''; // Clear previous content

        allSlots.forEach(slot => {
            const isAvailable = slot.status === 'available';
            const isSelected = selectedSlot && selectedSlot.id === slot.id;

            const slotCard = document.createElement('div');
            slotCard.className = `p-4 rounded-xl border-2 flex flex-col justify-between transition-all duration-300 ${getSlotClasses(slot, isSelected)}`;
            slotCard.innerHTML = `
                <div>
                    <div class="flex justify-between items-center">
                        <span class="text-2xl font-bold text-black dark:text-white">${slot.slot_name}</span>
                        <span class="material-symbols-outlined text-3xl text-black dark:text-white">${getSlotIcon(slot)}</span>
                    </div>
                    <p class="text-sm font-medium mt-1 text-black dark:text-white">${slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}</p>
                </div>
                <p class="text-xs font-semibold mt-4 text-black dark:text-white">€${pricePerHour.toFixed(2)} / hodina</p>
            `;

            if (isAvailable) {
                slotCard.addEventListener('click', () => handleSlotSelection(slot));
            }

            parkingMap.appendChild(slotCard);
        });
    }

    function getSlotClasses(slot, isSelected) {
        if (isSelected) {
            return 'border-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20 ring-4 ring-indigo-500/50 scale-105 shadow-xl';
        }
        if (slot.status === 'available') {
            return 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer hover:scale-105 hover:border-indigo-500 hover:shadow-md';
        }
        return 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed';
    }

    function getSlotIcon(slot) {
        switch (slot.type) {
            case 'EV Charging': return 'ev_station';
            case 'Accessible': return 'accessible';
            default: return 'directions_car';
        }
    }

    // --- Event Handlers & Logic ---
    function setupEventListeners() {
        dateInput?.addEventListener('change', updateSummary);
        startTimeInput?.addEventListener('input', updateSummary);
        durationInput?.addEventListener('input', updateSummary);
        confirmBookingButton?.addEventListener('click', handleConfirmBooking);
    }

    function setInitialDateTime() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        if(dateInput) {
            dateInput.value = `${year}-${month}-${day}`;
            dateInput.min = `${year}-${month}-${day}`;
        }
    }

    function handleSlotSelection(slot) {
        selectedSlot = slot;
        renderSlots(); // Re-render to show selection
        showBookingForm();
        updateSummary();
    }

    function showBookingForm() {
        bookingFormContainer.classList.remove('opacity-0');
        summaryNoSlot.classList.add('hidden');
        summaryWithSlot.classList.remove('hidden');
        summaryWithSlot.classList.add('flex');
    }

    function updateSummary() {
        if (!selectedSlot) return;

        summarySlotEl.textContent = selectedSlot.slot_name;

        const duration = parseInt(durationInput.value, 10) || 0;
        const price = duration * pricePerHour;
        summaryPriceEl.textContent = `€${price.toFixed(2)}`;
    }

    // Basic license plate validation
    function isValidLicensePlate(plate) {
        // Example: Allows alphanumeric characters and hyphens, 5 to 8 characters long
        const regex = /^[a-zA-Z0-9-]{5,8}$/;
        return regex.test(plate);
    }

    async function handleConfirmBooking() {
        if (!selectedSlot) {
            alert('Prosím, najprv si vyberte parkovacie miesto.');
            return;
        }

        const licensePlate = licensePlateInput.value.trim();
        if (!licensePlate) {
            alert('Prosím, zadajte svoju ŠPZ.');
            return;
        }
        if (!isValidLicensePlate(licensePlate)) {
            alert('Prosím, zadajte platnú ŠPZ (5-8 alfanumerických znakov alebo pomlčiek).');
            return;
        }

        const bookingData = {
            slotId: selectedSlot.id,
            licensePlate: licensePlate,
            date: dateInput.value,
            startTime: startTimeInput.value,
            endTime: (() => {
                const [h, m] = startTimeInput.value.split(':').map(Number);
                const endDate = new Date();
                endDate.setHours(h + (parseInt(durationInput.value, 10) || 0), m);
                return endDate.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit', hour12: false });
            })(),
            price: parseFloat(summaryPriceEl.textContent.replace('€', ''))
        };

        confirmBookingButton.disabled = true;
        confirmBookingButton.textContent = 'Rezervujem...';

        try {
            const response = await fetch('http://localhost:3000/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Rezervácia zlyhala');

            alert('Rezervácia prebehla úspešne!');
            selectedSlot = null;
            fetchSlots();
            bookingFormContainer.classList.add('opacity-0');
            setTimeout(() => {
                summaryWithSlot.classList.add('hidden');
                summaryNoSlot.classList.remove('hidden');
            }, 500);

        } catch (error) {
            console.error('Error during booking:', error);
            alert(`Rezervácia zlyhala: ${error.message}`);
        } finally {
            confirmBookingButton.disabled = false;
            confirmBookingButton.textContent = 'Potvrdiť Rezerváciu';
        }
    }

    // --- Start the App ---
    initialize();
});
