const axios = require('axios');

// ==== KONFIGURÁCIA ====
// DÔLEŽITÉ: Nahraďte túto IP adresu skutočnou IP adresou vašej ESP32, ktorá ovláda rampu.
const BARRIER_ESP32_IP = '192.168.1.101'; 
// ======================

async function openBarrier() {
  try {
    const url = `http://${BARRIER_ESP32_IP}/open-barrier`;
    console.log(`Posiela sa príkaz na otvorenie rampy na adresu: ${url}`);
    const response = await axios.get(url);
    console.log('Odpoveď z ESP32 (rampa):', response.data);
    return { success: true, message: response.data };
  } catch (error) {
    console.error('Nepodarilo sa poslať príkaz na ESP32 (rampa):', error.message);
    return { success: false, message: 'Rampa je offline alebo neodpovedá.' };
  }
}

module.exports = { openBarrier };
