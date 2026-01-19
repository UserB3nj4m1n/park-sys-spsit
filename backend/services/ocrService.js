/// In backend/services/ocrService.js
const { recognizeLicensePlate: ocrRecognize } = require('../ocr/ocr.js'); 

async function recognizeLicensePlate(imagePath) {
  try {
    console.log(`Performing OCR on image: ${imagePath}`);
    const licensePlate = await ocrRecognize(imagePath);
    
    if (!licensePlate) {
      throw new Error('OCR did not detect a license plate.');
    }

    console.log(`OCR Result: ${licensePlate}`);
    return licensePlate;
  } catch (error) {
    console.error('OCR Service Error:', error.message);
    // Return null or throw the error to be handled by the controller
    return null; 
  }
}

module.exports = { recognizeLicensePlate };
