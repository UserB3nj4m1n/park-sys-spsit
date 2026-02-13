document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elementy ---
    const parkingMap = document.getElementById('parking-map');
    const bookingFormContainer = document.getElementById('booking-form-container');
    const summaryNoSlot = document.getElementById('summary-no-slot');
    const summaryWithSlot = document.getElementById('summary-with-slot');

    // Tieto premenné si držia elementy z formulára
    const summarySlotEl = document.getElementById('summary-slot');
    const emailInput = document.getElementById('email');
    const licensePlateInput = document.getElementById('license-plate');
    const cardholderNameInput = document.getElementById('cardholder-name');
    const cardNumberInput = document.getElementById('card-number');
    const cardExpDateInput = document.getElementById('card-exp-date');
    const cardCvvInput = document.getElementById('card-cvv');
    const dateInput = document.getElementById('date');
    const startHourInput = document.getElementById('start-hour');
    const startMinuteInput = document.getElementById('start-minute');
    const durationInput = document.getElementById('duration');
    const summaryPriceEl = document.getElementById('summary-price');
    const confirmBookingButton = document.getElementById('confirm-booking-button');

    // --- Premenné, čo si pamätajú stav stránky ---
    let allSlots = [];
    let selectedSlot = null;
    const pricePerHour = 2;

    // --- Funkcie, čo sa spustia na začiatku ---
    function initialize() {
        populateHourOptions();
        fetchSlots();
        setupEventListeners();
        setInitialDateTime();
    }

    function populateHourOptions() {
        if (!startHourInput) return;
        for (let i = 0; i < 24; i++) {
            const hour = String(i).padStart(2, '0');
            const option = new Option(hour, hour);
            startHourInput.add(option);
        }
    }

    // --- Komunikácia so serverom ---
    async function fetchSlots() {
        try {
            const response = await fetch('/api/slots');
            if (!response.ok) throw new Error('Server neodpovedal správne');
            const data = await response.json();
            allSlots = data.data;
            renderSlots();
        } catch (error) {
            console.error('Chyba, nepodarilo sa načítať parkovacie miesta:', error);
            if (parkingMap) parkingMap.innerHTML = '<p class="sm:col-span-2 text-red-500">Pripojenie na server nefunguje</p>';
        }
    }

    // --- Vykreslenie dát na stránku ---
    function translateStatus(status) {
        switch (status) {
            case 'available':
                return 'Voľné';
            case 'reserved':
                return 'Rezervované';
            default:
                return status; // Vráti pôvodný stav, ak nie je známy
        }
    }

    function renderSlots() {
        if (!parkingMap) return;
        parkingMap.innerHTML = ''; // Najprv všetko vymažem, aby som nemal duplikáty

        allSlots.forEach(slot => {
            const isAvailable = slot.status === 'available';
            const isSelected = selectedSlot && selectedSlot.id === slot.id;

            const translatedStatus = translateStatus(slot.status);

            const slotCard = document.createElement('div');
            slotCard.className = `p-4 rounded-xl border-2 flex flex-col justify-between transition-all duration-300 ${getSlotClasses(slot, isSelected)}`;
            slotCard.innerHTML = `
                <div>
                    <div class="flex justify-between items-center">
                        <span class="text-2xl font-bold text-black dark:text-white">${slot.slot_name}</span>
                        <span class="material-symbols-outlined text-3xl text-black dark:text-white">${getSlotIcon(slot)}</span>
                    </div>
                    <p class="text-sm font-medium mt-1 text-black dark:text-white">${translatedStatus}</p>
                </div>
                <p class="text-xs font-semibold mt-4 text-black dark:text-white">${pricePerHour.toFixed(2)} € / hodina</p>
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
        return 'directions_car';
    }

    // --- Logika stránky a kliknutia ---
    function setupEventListeners() {
        dateInput?.addEventListener('change', updateSummary);
        startHourInput?.addEventListener('change', updateSummary);
        startMinuteInput?.addEventListener('change', updateSummary);
        durationInput?.addEventListener('input', updateSummary);
        confirmBookingButton?.addEventListener('click', handleConfirmBooking);

        // Pre automatické formátovanie dátumu expirácie (MM/YY)
        cardExpDateInput?.addEventListener('input', (event) => {
            let input = event.target;
            let value = input.value.replace(/\D/g, ''); // Odstráni všetky nečíselné znaky
            let formattedValue = '';

            if (value.length > 0) {
                formattedValue = value.substring(0, 2); // Prvé dve číslice pre mesiac
                if (value.length >= 3) {
                    formattedValue += '/' + value.substring(2, 4); // Ďalšie dve číslice pre rok
                }
            }
            input.value = formattedValue;
        });

        // Pre automatické formátovanie čísla karty (XXXX XXXX XXXX XXXX)
        cardNumberInput?.addEventListener('input', (event) => {
            let input = event.target;
            let value = input.value.replace(/\D/g, ''); // Odstráni všetky nečíselné znaky
            let formattedValue = '';

            // Rozdelí číslo karty do skupín po 4 číslice s medzerou
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0) {
                    formattedValue += ' ';
                }
                formattedValue += value[i];
            }
            // Obmedzenie na max. dĺžku (napr. 19 číslic + 3 medzery = 22 znakov)
            input.value = formattedValue.substring(0, 19); 
        });
    }

    function setInitialDateTime() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        if (dateInput) {
            dateInput.value = `${year}-${month}-${day}`;
            dateInput.min = `${year}-${month}-${day}`;
        }

        if (startHourInput) {
            const currentHour = String(today.getHours()).padStart(2, '0');
            startHourInput.value = currentHour;
        }
    }

    function handleSlotSelection(slot) {
        selectedSlot = slot;
        renderSlots(); // Vykreslím parkovisko nanovo, aby sa zvýraznilo vybrané miesto
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
        summaryPriceEl.textContent = `${price.toFixed(2)} €`;
    }

    // --- Funkcie na kontrolu správnosti vstupov (Validácia) ---
    function validateEmail(email) {
        if (!email) return "Emailová adresa je povinná.";
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(email)) return "Neplatný formát emailu.";
        return null; // null znamená, že je všetko v poriadku
    }

    function validateLicensePlate(plate) {
        if (!plate) return "EČV je povinné.";
        const regex = /^[A-Z0-9-]{5,8}$/;
        if (!regex.test(plate.toUpperCase())) return "Neplatný formát EČV (napr. KE123AB).";
        return null;
    }

    function validateCardholderName(name) {
        if (!name) return "Meno držiteľa karty je povinné.";
        if (name.trim().split(' ').length < 2) return "Zadajte meno aj priezvisko.";
        return null;
    }

    function validateCardNumber(number) {
        if (!number) return "Číslo karty je povinné.";
        // Jednoduchý regex na kontrolu formátu (neoveruje platnosť karty)
        const regex = /^[0-9]{13,19}$/;
        if (!regex.test(number.replace(/\s/g, ''))) return "Neplatné číslo karty.";
        return null;
    }

    function validateExpiryDate(date) {
        if (!date) return "Dátum expirácie je povinný.";
        const regex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
        if (!regex.test(date)) return "Neplatný formát (MM/YY).";
        
        const [month, year] = date.split('/');
        const expiry = new Date(`20${year}`, month - 1);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Karta je platná do konca posledného dňa mesiaca

        if (expiry < today) return "Karta je exspirovaná.";
        return null;
    }

    function validateCvv(cvv) {
        if (!cvv) return "CVV je povinné.";
        const regex = /^[0-9]{3,4}$/;
        if (!regex.test(cvv)) return "CVV musí mať 3 alebo 4 číslice.";
        return null;
    }


    async function handleConfirmBooking() {
        if (!selectedSlot) {
            alert('Prosím, najprv si vyberte parkovacie miesto.');
            return;
        }

        let isFormValid = true;

        // --- Nová, podrobnejšia validačná logika ---
        const validateField = (inputElement, validationFunction) => {
            const value = inputElement.value;
            const errorElement = document.getElementById(`${inputElement.id}-error`);
            const errorMessage = validationFunction(value);

            // Najprv skryjem starú chybu a odstránim červený rámik
            errorElement.classList.add('hidden');
            errorElement.textContent = '';
            inputElement.classList.remove('border-red-500');

            if (errorMessage) {
                // Ak validácia vráti chybovú správu, zobrazím ju
                isFormValid = false;
                inputElement.classList.add('border-red-500');
                errorElement.textContent = errorMessage;
                errorElement.classList.remove('hidden');
            }
        };
        
        // Spustím validáciu pre každé pole
        validateField(emailInput, validateEmail);
        validateField(licensePlateInput, validateLicensePlate);
        validateField(cardholderNameInput, validateCardholderName);
        validateField(cardNumberInput, validateCardNumber);
        validateField(cardExpDateInput, validateExpiryDate);
        validateField(cardCvvInput, validateCvv);

        if (!isFormValid) {
            return; // Ak niečo chýba alebo je zlé, tak sa ďalej nejde
        }

        const bookingData = {
            slotId: selectedSlot.id,
            licensePlate: licensePlateInput.value.trim().toUpperCase(),
            email: emailInput.value.trim(),
            cardholderName: cardholderNameInput.value.trim(),
            cardNumber: cardNumberInput.value.trim(),
            cardExpDate: cardExpDateInput.value.trim(),
            cardCvv: cardCvvInput.value.trim(),
            date: dateInput.value,
            startTime: `${startHourInput.value}:${startMinuteInput.value}`,
            endTime: (() => {
                const [h, m] = [startHourInput.value, startMinuteInput.value].map(Number);
                const endDate = new Date();
                endDate.setHours(h + (parseInt(durationInput.value, 10) || 0), m);
                return endDate.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit', hour12: false });
            })(),
            price: parseFloat(summaryPriceEl.textContent.replace('€', '').trim())
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
            if (!response.ok) throw new Error(result.sprava || 'Rezervácia zlyhala');

            alert('Rezervácia prebehla úspešne!');
            // Reset formulára a parkoviska
            selectedSlot = null;
            document.getElementById('summary-with-slot').querySelectorAll('input').forEach(input => input.value = '');
            fetchSlots();
            bookingFormContainer.classList.add('opacity-0');
            setTimeout(() => {
                summaryWithSlot.classList.add('hidden');
                summaryNoSlot.classList.remove('hidden');
            }, 500);

        } catch (error) {
            console.error('Chyba pri vytváraní rezervácie:', error);
            alert(`Rezervácia zlyhala: ${error.message}`);
        } finally {
            confirmBookingButton.disabled = false;
            confirmBookingButton.textContent = 'Potvrdiť Rezerváciu';
        }
    }

    // --- Týmto to celé spustím ---
    initialize();
});
