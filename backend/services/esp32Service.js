const axios = require('axios');

// IMPORTANT: Replace with the actual IP of the barrier ESP32
const BARRIER_ESP32_IP = '192.168.1.101'; 

async function openBarrier() {
  try {
    console.log(`Sending 'open' command to barrier at ${BARRIER_ESP32_IP}...`);
    const response = await axios.get(`http://${BARRIER_ESP32_IP}/open`);
    console.log('Barrier ESP32 responded:', response.data);
    return { success: true, message: response.data };
  } catch (error) {
    console.error('Failed to send command to barrier ESP32:', error.message);
    return { success: false, message: 'Barrier is offline or did not respond.' };
  }
}

module.exports = { openBarrier };
