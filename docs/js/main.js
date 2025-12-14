tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "primary": "#2b7cee",
              "background-light": "#f6f7f8",
              "background-dark": "#101822",
            },
            fontFamily: {
              "display": ["Manrope", "sans-serif"]
            },
            borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
          },
        },
      }
    
document.addEventListener('DOMContentLoaded', () => {
    const parkingSpotTemplate = document.getElementById('parking-spot-template');
    const parkingGrid = document.querySelector('.grid.grid-cols-4');
    const availableSpotsEl = document.getElementById('available-spots');
    const totalSpotsEl = document.getElementById('total-spots');
    const occupancyEl = document.getElementById('occupancy');

    const parkingData = [
        { id: 'A-01', type: 'standard', status: 'available' },
        { id: 'A-02', type: 'standard', status: 'occupied' },
        { id: 'A-03', type: 'standard', status: 'occupied' },
        { id: 'A-04', type: 'standard', status: 'available' },
        { id: 'A-05', type: 'accessible', status: 'reserved' },
        { id: 'A-06', type: 'standard', status: 'available' },
        { id: 'A-07', type: 'standard', status: 'occupied' },
        { id: 'A-08', type: 'ev-charging', status: 'available' },
        { id: 'B-01', type: 'standard', status: 'available' },
        { id: 'B-02', type: 'standard', status: 'available' },
        { id: 'B-03', type: 'standard', status: 'occupied' },
        { id: 'B-04', type: 'standard', status: 'available' },
        { id: 'B-05', type: 'standard', status: 'available' },
        { id: 'B-06', type: 'standard', status: 'occupied' },
        { id: 'B-07', type: 'standard', status: 'available' },
        { id: 'B-08', type: 'accessible', status: 'available' },
        { id: 'C-01', type: 'standard', status: 'available' },
        { id: 'C-02', type: 'standard', status: 'occupied' },
        { id: 'C-03', type: 'standard', status: 'available' },
        { id: 'C-04', type: 'standard', status: 'available' },
    ];

    function updateStats() {
        if (!availableSpotsEl || !totalSpotsEl || !occupancyEl) return;

        const totalSpots = parkingData.length;
        const availableSpots = parkingData.filter(spot => spot.status === 'available').length;
        const occupiedSpots = totalSpots - availableSpots;
        const occupancyPercentage = Math.round((occupiedSpots / totalSpots) * 100);

        availableSpotsEl.textContent = availableSpots;
        totalSpotsEl.textContent = totalSpots;
        occupancyEl.textContent = `${occupancyPercentage}%`;
    }

    function renderParkingSpots(filter = 'apps') {
        if (!parkingGrid || !parkingSpotTemplate) return;

        parkingGrid.innerHTML = ''; // Clear existing spots
        
        let filteredData = parkingData;

        if (filter !== 'apps') {
            filteredData = parkingData.filter(spot => spot.type === filter || (filter === 'bookmark' && spot.status === 'reserved'));
        }

        filteredData.forEach(spotData => {
            const spot = parkingSpotTemplate.cloneNode(true);
            spot.id = `spot-${spotData.id}`;
            spot.classList.remove('hidden');
            spot.dataset.type = spotData.type;
            spot.dataset.status = spotData.status;

            const idSpan = spot.querySelector('.text-xs');
            const iconSpan = spot.querySelector('.material-symbols-outlined');

            idSpan.textContent = spotData.id;

            // Set icon based on type
            switch (spotData.type) {
                case 'ev-charging':
                    iconSpan.textContent = 'ev_station';
                    break;
                case 'accessible':
                    iconSpan.textContent = 'accessible';
                    break;
                case 'reserved':
                    iconSpan.textContent = 'bookmark';
                    break;
                default:
                    iconSpan.textContent = 'directions_car';
            }

            // Set color based on status
            switch (spotData.status) {
                case 'available':
                    spot.classList.add('border-green-500', 'bg-green-500/10');
                    idSpan.classList.add('text-green-800', 'dark:text-green-300');
                    iconSpan.classList.add('text-green-500');
                    break;
                case 'occupied':
                    spot.classList.add('border-red-500', 'bg-red-500/10');
                    idSpan.classList.add('text-red-800', 'dark:text-red-300');
                    iconSpan.classList.add('text-red-500');
                    break;
                case 'reserved':
                    spot.classList.add('border-blue-500', 'bg-blue-500/10');
                    idSpan.classList.add('text-blue-800', 'dark:text-blue-300');
                    iconSpan.classList.add('text-blue-500');
                    iconSpan.textContent = 'bookmark'; // Reserved spots always have a bookmark icon
                    break;
            }

            parkingGrid.appendChild(spot);
        });
    }

    if (parkingGrid) {
        // Initial render
        updateStats();
        renderParkingSpots();
    }

    // Filter functionality
    const filterButtons = document.querySelectorAll('.flex.flex-col.gap-3 button');

    if (filterButtons.length > 0 && parkingGrid) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove selected class from all buttons
                filterButtons.forEach(btn => {
                    btn.classList.remove('bg-primary', 'text-white');
                    btn.classList.add('bg-gray-100', 'dark:bg-[#233348]', 'text-gray-700', 'dark:text-gray-300');
                });
                // Add selected class to clicked button
                button.classList.remove('bg-gray-100', 'dark:bg-[#233348]', 'text-gray-700', 'dark:text-gray-300');
                button.classList.add('bg-primary', 'text-white');

                const filterType = button.querySelector('.material-symbols-outlined').textContent.trim();
                let filterValue;

                switch (filterType) {
                    case 'ev_station':
                        filterValue = 'ev-charging';
                        break;
                    case 'accessible':
                        filterValue = 'accessible';
                        break;
                    case 'bookmark':
                        filterValue = 'bookmark';
                        break;
                    default:
                        filterValue = 'apps';
                }
                renderParkingSpots(filterValue);
            });
        });
        // Set initial state for the "All Spots" button
        filterButtons[0].classList.remove('bg-gray-100', 'dark:bg-[#233348]', 'text-gray-700', 'dark:text-gray-300');
        filterButtons[0].classList.add('bg-primary', 'text-white');
    }

    // Theme toggle functionality
    const themeToggleButton = document.getElementById('theme-toggle');
    if (themeToggleButton) {
        const htmlElement = document.documentElement;

        // Set initial theme
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            htmlElement.classList.add('dark');
        } else {
            htmlElement.classList.remove('dark');
        }

        themeToggleButton.addEventListener('click', () => {
            htmlElement.classList.toggle('dark');
            
            // Save theme preference to local storage
            if (htmlElement.classList.contains('dark')) {
                localStorage.setItem('theme', 'dark');
            } else {
                localStorage.setItem('theme', 'light');
            }
        });
    }
});
