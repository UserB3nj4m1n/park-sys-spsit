// Súbor: backend/services/ocrService.js
const ocrRecognize = require('../ocr/ocr.js'); 

async function recognizeLicensePlate(imagePath) {
  try {
    console.log(`Spúšťam OCR na obrázku: ${imagePath}`);
    const licensePlate = await ocrRecognize(imagePath);
    
    if (!licensePlate) {
      throw new Error('OCR nerozoznalo žiadnu ŠPZ.');
    }

    console.log(`Výsledok z OCR: ${licensePlate}`);
    return licensePlate;
  } catch (error) {
    console.error('Chyba v OCR službe:', error.message);
    // Vrátim null, aby aplikácia nespadla a v server.js to budem vedieť ošetriť
    return null; 
  }
}

module.exports = { recognizeLicensePlate };
