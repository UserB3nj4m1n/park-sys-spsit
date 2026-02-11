const { createWorker } = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs'); // Node.js file system module

async function recognizeText(imagePath) {
  const worker = await createWorker('eng'); // 'eng' for English language
  await worker.setParameters({
    tessedit_pageseg_mode: 7, // PSM_SINGLE_LINE
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', // Whitelist alphanumeric characters for license plates
  });

  let processedImageBuffer;
  try {
    const image = sharp(imagePath);
    processedImageBuffer = await image
      .rotate(180) // Rotate the image 180 degrees
      .grayscale() // Convert to grayscale
      .linear(1.5, 0) // Increase contrast
      .toBuffer();
    
    // Save the processed image
    fs.writeFileSync('processed_image.jpg', processedImageBuffer);
    console.log('Processed image saved to processed_image.jpg');

  } catch (sharpError) {
    console.error('Error during image pre-processing with sharp:', sharpError);
    await worker.terminate();
    return null;
  }

  try {
    const { data: { text } } = await worker.recognize(processedImageBuffer); // Pass the buffer
    await worker.terminate();
    return text;
  } catch (tesseractError) {
    await worker.terminate();
    console.error('Error during OCR with Tesseract:', tesseractError);
    return null;
  }
}
module.exports = recognizeText;