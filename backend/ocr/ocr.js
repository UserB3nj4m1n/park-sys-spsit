const { createWorker } = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');

async function recognizeText(imagePath) {
  const worker = await createWorker('eng');
  
  await worker.setParameters({
    tessedit_pageseg_mode: 7, 
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  });

  let processedImageBuffer;

  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Could not retrieve image dimensions.');
    }

    const halfHeight = Math.round(metadata.height * 0.5);

    processedImageBuffer = await image
      .rotate(180) 
      .flop()      
      .extract({ 
        left: 0, 
        top: halfHeight,
        width: metadata.width, 
        height: metadata.height - halfHeight 
      })
      .resize(1000) // 1. Upscale: Bigger letters = better recognition
      .grayscale()
      .sharpen({ sigma: 2 }) // 2. Sharpen: Defines the edges of that 'C'
      .modulate({ brightness: 1.2, contrast: 2 }) // 3. Boost contrast: Separates text from metal
      .threshold(100) // 4. Threshold: Adjust this between 130-150
      .toBuffer();
    
    fs.writeFileSync('processed_image.jpg', processedImageBuffer);
    console.log('Processed image saved. Top half excluded.');

  } catch (sharpError) {
    console.error('Error during image pre-processing:', sharpError);
    await worker.terminate();
    return null;
  }

  try {
    const { data: { text } } = await worker.recognize(processedImageBuffer);
    await worker.terminate();
    return text.trim();
  } catch (tesseractError) {
    console.error('Error during OCR:', tesseractError);
    await worker.terminate();
    return null;
  }
}

module.exports = recognizeText;