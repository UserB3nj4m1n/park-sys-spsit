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
    const filterButtons = document.querySelectorAll('.flex.flex-col.gap-3 button');
    const parkingSpots = document.querySelectorAll('.grid .flex.cursor-pointer');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filterType = button.querySelector('.material-symbols-outlined').textContent.trim();

            parkingSpots.forEach(spot => {
                const spotType = spot.querySelector('.material-symbols-outlined').textContent.trim();
                const isReserved = spot.classList.contains('border-blue-500');

                if (filterType === 'apps') { // All spots
                    spot.style.display = 'flex';
                } else if (filterType === 'bookmark') { // Reserved
                    if (isReserved) {
                        spot.style.display = 'flex';
                    } else {
                        spot.style.display = 'none';
                    }
                } else {
                    if (spotType === filterType) {
                        spot.style.display = 'flex';
                    } else {
                        spot.style.display = 'none';
                    }
                }
            });
        });
    });
});