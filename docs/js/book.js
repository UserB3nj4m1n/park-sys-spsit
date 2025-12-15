document.addEventListener('DOMContentLoaded', () => {
    // Left Column Elements
    const calendarDaysContainer = document.querySelector('.grid.grid-cols-7.text-center');
    const calendarMonthYear = document.querySelector('.flex.items-center.p-1.justify-between p');
    const startTimeInput = document.querySelector('input[placeholder="10:00 AM"]');
    const endTimeInput = document.querySelector('input[placeholder="12:00 PM"]');
    const durationSlider = document.getElementById('duration');
    const confirmBookingButton = document.querySelector('button.bg-primary.text-white');

    // Summary Elements
    const summarySlot = document.getElementById('summary-slot');
    const summaryDate = document.getElementById('summary-date');
    const summaryDuration = document.getElementById('summary-duration');
    const summaryPrice = document.getElementById('summary-price');

    // Right Column Elements
    const parkingMap = document.getElementById('parking-map');
    const availableSlotsDisplay = document.querySelector('#parking-map-container p.text-green-500');

    // State
    let allSlots = [];
    let selectedSlotElement = null;
    let selectedSlotId = null;
    let selectedDate = new Date(); // Default to today
    const pricePerHour = 5;

    function initialize() {
        fetchSlots();
        renderCalendar();
        addEventListeners();
        updateSummary();
    }

    function fetchSlots() {
        fetch('http://localhost:3000/api/slots')
            .then(response => response.json())
            .then(data => {
                allSlots = data.data;
                renderSlots(allSlots);
                updateAvailableSlotsCount(allSlots);
            })
            .catch(error => console.error('Error fetching slots:', error));
    }

    function renderCalendar() {
        console.log('Rendering calendar...');
        if (!calendarMonthYear || !calendarDaysContainer) return;

        calendarMonthYear.textContent = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const dayButtons = calendarDaysContainer.querySelectorAll('button');
        dayButtons.forEach(btn => {
            if (parseInt(btn.textContent) === selectedDate.getDate()) {
                btn.classList.add('bg-primary', 'text-white');
            }
        });
    }
    
    function handleCalendarClick(event) {
        console.log('Calendar clicked:', event.target);
        const clickedButton = event.target.closest('button');
        if (!clickedButton || isNaN(parseInt(clickedButton.textContent))) {
            console.log('Clicked element is not a valid date button.');
            return;
        }
    
        const dayButtons = calendarDaysContainer.querySelectorAll('button');
        dayButtons.forEach(btn => {
            btn.classList.remove('bg-primary', 'text-white');
        });
    
        clickedButton.classList.add('bg-primary', 'text-white');
    
        const day = parseInt(clickedButton.textContent);
        selectedDate.setDate(day);
        updateSummary();
        console.log('Selected date:', selectedDate);
    }

    function renderSlots(slots) {
        console.log('Rendering slots:', slots);
        if (!parkingMap) {
            console.error('Parking map container not found!');
            return;
        }
        parkingMap.innerHTML = `<div class="col-span-7 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 uppercase tracking-widest">Entrance</div>`;
        
        slots.forEach(slot => {
            const slotElement = document.createElement('div');
            slotElement.className = 'rounded p-2 flex items-center justify-center cursor-pointer border';
            slotElement.textContent = slot.slot_name;
            slotElement.dataset.slotId = slot.id;
            slotElement.dataset.slotName = slot.slot_name;
            slotElement.dataset.status = slot.status;

            updateSlotAppearance(slotElement, slot.status);

            if (slot.status === 'available') {
                slotElement.addEventListener('click', () => {
                    console.log('Slot click listener attached to:', slot.slot_name);
                    handleSlotSelection(slotElement);
                });
            } else {
                slotElement.classList.add('cursor-not-allowed');
            }
            
            parkingMap.appendChild(slotElement);
        });

        parkingMap.innerHTML += `<div class="col-span-7 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 uppercase tracking-widest">Exit</div>`;
    }

    function handleSlotSelection(slotElement) {
        console.log('Handling slot selection for:', slotElement.dataset.slotName);
        if (selectedSlotElement) {
            updateSlotAppearance(selectedSlotElement, 'available');
            console.log('Deselected previous slot:', selectedSlotElement.dataset.slotName);
        }
        selectedSlotElement = slotElement;
        selectedSlotId = slotElement.dataset.slotId;
        updateSlotAppearance(selectedSlotElement, 'selected');
        updateSummary();
        console.log('Selected slot ID:', selectedSlotId);
    }

    function updateSlotAppearance(element, status) {
        console.log('Updating appearance for slot:', element.dataset.slotName, 'to status:', status);
        const classes = {
            available: ['bg-green-500/20', 'dark:bg-green-500/30', 'border-green-500', 'text-green-700', 'dark:text-green-400', 'hover:bg-green-500/40'],
            occupied: ['bg-red-500/20', 'dark:bg-red-500/30', 'border-red-500', 'text-red-700', 'dark:text-red-400'],
            selected: ['bg-primary', 'border-primary', 'text-white'],
            default: ['bg-yellow-500/20', 'dark:bg-yellow-500/30', 'border-yellow-500', 'text-yellow-700', 'dark:text-yellow-400']
        };
        // Reset
        Object.values(classes).flat().forEach(cls => element.classList.remove(cls));

        const statusClasses = classes[status] || classes.default;
        element.classList.add(...statusClasses);
    }
    
    function updateAvailableSlotsCount(slots) {
        const availableCount = slots.filter(s => s.status === 'available').length;
        if (availableSlotsDisplay) {
            availableSlotsDisplay.textContent = `${availableCount} voľných miest`;
            console.log('Available slots count:', availableCount);
        }
    }

    function updateSummary() {
        console.log('Updating summary...');
        if (selectedSlotElement) {
            summarySlot.textContent = selectedSlotElement.dataset.slotName;
        } else {
            summarySlot.textContent = 'N/A';
        }

        summaryDate.textContent = selectedDate.toLocaleDateString('sk-SK', { month: 'long', day: 'numeric', year: 'numeric' });

        const hours = parseInt(durationSlider.value, 10);
        const price = hours * pricePerHour;
        
        const startTime = startTimeInput.value;
        let endTimeText = 'N/A';
        if (startTime) {
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const endDate = new Date();
            endDate.setHours(startHour + hours, startMinute);
            endTimeText = endDate.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit', hour12: false });
        }
        
        summaryDuration.textContent = `${hours} hodín (${startTime || 'N/A'} - ${endTimeText})`;
        summaryPrice.textContent = `${price.toFixed(2)} €`;
        console.log('Summary updated:', { slot: summarySlot.textContent, date: summaryDate.textContent, duration: summaryDuration.textContent, price: summaryPrice.textContent });
    }

    function addEventListeners() {
        console.log('Adding event listeners...');
        if(calendarDaysContainer) calendarDaysContainer.addEventListener('click', handleCalendarClick);
        if (durationSlider) durationSlider.addEventListener('change', updateSummary);
        if (startTimeInput) startTimeInput.addEventListener('input', updateSummary);
        if (confirmBookingButton) confirmBookingButton.addEventListener('click', confirmBooking);
        
        // Event delegation for parking slots
        if(parkingMap) {
            parkingMap.addEventListener('click', (event) => {
                const clickedSlot = event.target.closest('.rounded.p-2.flex'); // Find the closest slot element
                if (clickedSlot && clickedSlot.dataset.status === 'available') {
                    console.log('Delegated click on available slot:', clickedSlot.dataset.slotName);
                    handleSlotSelection(clickedSlot);
                } else if (clickedSlot) {
                    console.log('Delegated click on non-available slot:', clickedSlot.dataset.slotName, 'Status:', clickedSlot.dataset.status);
                }
            });
        }
    }

    function confirmBooking() {
        const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
        if (!loggedInUser) {
            alert('Pre rezerváciu miesta musíte byť prihlásený.');
            window.location.href = 'login.html';
            return;
        }

        if (!selectedSlotId) {
            alert('Prosím, vyberte si parkovacie miesto.');
            return;
        }
        
        const endTime = summaryDuration.textContent.split(' - ')[1].replace(')', '');
        const bookingData = {
            userId: loggedInUser.id,
            slotId: selectedSlotId,
            date: selectedDate.toISOString().split('T')[0],
            startTime: startTimeInput.value,
            endTime: endTime,
            price: parseFloat(summaryPrice.textContent.replace('€', '').trim())
        };

        fetch('http://localhost:3000/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData),
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Booking created successfully.') {
                alert('Rezervácia prebehla úspešne!');
                fetchSlots();
                selectedSlotElement = null;
                selectedSlotId = null;
                updateSummary();
            } else {
                alert('Rezervácia zlyhala: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error during booking:', error);
            alert('Počas rezervácie sa vyskytla chyba. Skúste to prosím znova.');
        });
    }

    initialize();
});

