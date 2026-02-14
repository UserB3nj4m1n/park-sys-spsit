const sharp = require('sharp');
const fs = require('fs');
const axios = require('axios');

const PLATE_RECOGNIZER_API_KEY = '1fee067971c8b3e84c33bd0a2b68db9d02e514d2'; 

async function recognizeText(imagePath) {
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
    return null;
  }

  try {
    const base64Image = processedImageBuffer.toString('base64');
    const apiUrl = 'https://api.platerecognizer.com/v1/plate-reader/';

    const params = {
      // Plate Recognizer uses headers for auth, and does not require these params for basic recognition.
      // TopN might be relevant if multiple plates are expected, but for now we take the first.
    };

    const config = {
      headers: {
        'Authorization': `Token ${PLATE_RECOGNIZER_API_KEY}`,
        'Content-Type': 'application/json' // Explicitly set content type for base64 image
      },
      params: {
        // Optional: Specify country if needed, e.g., 'country': 'sk' for Slovakia
        'regions': 'sk', // Assuming Slovakia based on previous context, can be adjusted
        'topn': 1
      }
    };

    const data = {
      image_base64: base64Image
    };

    const response = await axios.post(apiUrl, data, config);

    if (response.data && response.data.results && response.data.results.length > 0) {
      const plate = response.data.results[0].plate;
      const processedText = plate.replace(/\s/g, '').substring(0, 7);
      return processedText;
    } else {
      console.log('No license plates detected by Plate Recognizer.');
      return null;
    }

  } catch (plateRecognizerError) {
    console.error('Error during Plate Recognizer OCR:', plateRecognizerError.response ? plateRecognizerError.response.data : plateRecognizerError.message);
    return null;
  }
}

module.exports = recognizeText;