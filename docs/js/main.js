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
    const parkingGrid = parkingSpotTemplate ? parkingSpotTemplate.parentElement : null;
    const availableSpotsEl = document.getElementById('available-spots');
    const totalSpotsEl = document.getElementById('total-spots');
    const occupancyEl = document.getElementById('occupancy');
    
    let parkingData = [];

    function fetchData() {
        fetch('http://localhost:3000/api/slots')
            .then(response => response.json())
            .then(data => {
                parkingData = data.data.map(slot => ({
                    id: slot.slot_name,
                    type: slot.type.toLowerCase().replace(' ', '-'),
                    status: slot.status
                }));
                updateStats();
                renderParkingSpots();
            })
            .catch(error => console.error('Error fetching parking data:', error));
    }

    function updateStats() {
        if (!availableSpotsEl || !totalSpotsEl || !occupancyEl || parkingData.length === 0) return;

        const totalSpots = parkingData.length;
        const availableSpots = parkingData.filter(spot => spot.status === 'available').length;
        const occupiedSpots = totalSpots - availableSpots;
        const occupancyPercentage = totalSpots > 0 ? Math.round((occupiedSpots / totalSpots) * 100) : 0;

        availableSpotsEl.textContent = availableSpots;
        totalSpotsEl.textContent = totalSpots;
        occupancyEl.textContent = `${occupancyPercentage}%`;
    }

    function renderParkingSpots(filter = 'apps') {
        if (!parkingGrid || !parkingSpotTemplate) return;

        parkingGrid.innerHTML = ''; // Clear existing spots
        
        let filteredData = parkingData;

        // Note: The filter values from the HTML (ev_station, accessible) need to match the data.
        // My seeding script creates 'EV Charging' and 'Accessible'. I've mapped them to 'ev-charging' and 'accessible'.
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
                default:
                     iconSpan.textContent = 'directions_car';
            }
             // Status overrides icon for reserved
            if (spotData.status === 'reserved') {
                 iconSpan.textContent = 'bookmark';
            }


            // Set color based on status
            spot.classList.remove('border-green-500', 'bg-green-500/10', 'border-red-500', 'bg-red-500/10', 'border-blue-500', 'bg-blue-500/10');
            idSpan.classList.remove('text-green-800', 'dark:text-green-300', 'text-red-800', 'dark:text-red-300', 'text-blue-800', 'dark:text-blue-300');
            iconSpan.classList.remove('text-green-500', 'text-red-500', 'text-blue-500');

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
                    break;
            }

            parkingGrid.appendChild(spot);
        });
    }

    if (parkingGrid) {
        fetchData();
    }

    // Filter functionality
    const filterButtons = document.querySelectorAll('.flex.flex-col.gap-3 button');

    if (filterButtons.length > 0 && parkingGrid) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => {
                    btn.classList.remove('bg-primary', 'text-white');
                    btn.classList.add('bg-gray-100', 'dark:bg-[#233348]', 'text-gray-700', 'dark:text-gray-300');
                });
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
                        filterValue = 'reserved';
                        break;
                    default:
                        filterValue = 'apps';
                }
                renderParkingSpots(filterValue);
            });
        });
        if (filterButtons.length > 0) {
            filterButtons[0].classList.remove('bg-gray-100', 'dark:bg-[#233348]', 'text-gray-700', 'dark:text-gray-300');
            filterButtons[0].classList.add('bg-primary', 'text-white');
        }
    }
});
