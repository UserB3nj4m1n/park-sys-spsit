document.addEventListener('DOMContentLoaded', () => {
    fetchParkingHistory();
});

async function fetchParkingHistory() {
    const tableBody = document.getElementById('parking-history-body');
    try {
        const response = await fetch('http://localhost:3000/api/parking/history');
        const result = await response.json();

        if (result.message !== 'success') {
            throw new Error('Failed to fetch parking history.');
        }

        tableBody.innerHTML = ''; // Clear previous entries

        if (result.data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" class="py-3 px-4 text-center text-gray-500">No parking history available.</td></tr>`;
            return;
        }

        result.data.forEach(entry => {
            const entryTime = new Date(entry.entry_time).toLocaleString();
            const exitTime = entry.exit_time ? new Date(entry.exit_time).toLocaleString() : 'N/A';
            
            const row = `
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td class="py-3 px-4 text-sm text-gray-900 dark:text-white">${entry.license_plate}</td>
                    <td class="py-3 px-4 text-sm text-gray-900 dark:text-white">${entryTime}</td>
                    <td class="py-3 px-4 text-sm text-gray-900 dark:text-white">${exitTime}</td>
                    <td class="py-3 px-4">
                        <img src="http://localhost:3000/${entry.image_path}" alt="License Plate Image" class="w-20 h-auto rounded-md object-cover">
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });

    } catch (error) {
        console.error('Error fetching parking history:', error);
        tableBody.innerHTML = `<tr><td colspan="4" class="py-3 px-4 text-center text-red-500">Could not load history from the server.</td></tr>`;
    }
}
