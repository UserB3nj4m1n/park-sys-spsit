document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const parkingMap = document.getElementById('parking-map');
    const bookingFormContainer = document.getElementById('booking-form-container');
    const summaryNoSlot = document.getElementById('summary-no-slot');
    const summaryWithSlot = document.getElementById('summary-with-slot');

    // Form Elements
    const summarySlotEl = document.getElementById('summary-slot');
    const emailInput = document.getElementById('email');
    const licensePlateInput = document.getElementById('license-plate');
    const cardholderNameInput = document.getElementById('cardholder-name');
    const cardNumberInput = document.getElementById('card-number');
    const cardExpDateInput = document.getElementById('card-exp-date');
    const cardCvvInput = document.getElementById('card-cvv');
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
            const response = await fetch('/api/slots');
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

    // --- Validation Functions ---
    function isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    function isValidLicensePlate(plate) {
        const regex = /^[a-zA-Z0-9-]{5,8}$/;
        return regex.test(plate);
    }

    function isValidCardholderName(name) {
        return name.trim().length > 2;
    }

    function isValidCardNumber(number) {
        const regex = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/;
        // A simple Luhn algorithm check would be better for a real app.
        return regex.test(number.replace(/\s/g, ''));
    }

    function isValidExpiryDate(date) {
        const regex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
        if (!regex.test(date)) return false;
        
        const [month, year] = date.split('/');
        const expiry = new Date(`20${year}`, month - 1);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Compare dates only
        
        return expiry >= today;
    }

    function isValidCvv(cvv) {
        const regex = /^[0-9]{3,4}$/;
        return regex.test(cvv);
    }
    // --- End Validation Functions ---


    async function handleConfirmBooking() {
        if (!selectedSlot) {
            alert('Prosím, najprv si vyberte parkovacie miesto.');
            return;
        }

        // --- Data Retrieval and Validation ---
        const email = emailInput.value.trim();
        const licensePlate = licensePlateInput.value.trim();
        const cardholderName = cardholderNameInput.value.trim();
        const cardNumber = cardNumberInput.value.trim();
        const cardExpDate = cardExpDateInput.value.trim();
        const cardCvv = cardCvvInput.value.trim();

        if (!isValidEmail(email)) {
            alert('Prosím, zadajte platnú emailovú adresu.');
            return;
        }
        if (!isValidLicensePlate(licensePlate)) {
            alert('Prosím, zadajte platnú ŠPZ (5-8 alfanumerických znakov alebo pomlčiek).');
            return;
        }
        if (!isValidCardholderName(cardholderName)) {
            alert('Prosím, zadajte meno držiteľa karty.');
            return;
        }
        if (!isValidCardNumber(cardNumber)) {
            alert('Prosím, zadajte platné číslo karty.');
            return;
        }
        if (!isValidExpiryDate(cardExpDate)) {
            alert('Prosím, zadajte platný dátum expirácie (MM/YY).');
            return;
        }
        if (!isValidCvv(cardCvv)) {
            alert('Prosím, zadajte platné CVV (3-4 číslice).');
            return;
        }
        // --- End Data Retrieval and Validation ---


        const bookingData = {
            slotId: selectedSlot.id,
            licensePlate: licensePlate,
            email: email,
            cardholderName: cardholderName,
            cardNumber: cardNumber,
            cardExpDate: cardExpDate,
            cardCvv: cardCvv,
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
            const response = await fetch('/api/bookings', {
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
