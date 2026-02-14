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
      .toBuffer();
    
    fs.writeFileSync('processed_image.jpg', processedImageBuffer);
    console.log('Processed image saved. Top half excluded.');

  } catch (sharpError) {
    console.error('Error during image pre-processing:', sharpError);
    return null;
  }

  try {
    const base64Image = processedImageBuffer.toString('base64');
    console.log('Base64 image length:', base64Image.length); // Debugging line
    const apiUrl = 'https://api.platerecognizer.com/v1/plate-reader/';

    const params = {
      // Plate Recognizer uses headers for auth, and does not require these params for basic recognition.
      // TopN might be relevant if multiple plates are expected, but for now we take the first.
    };

    const config = {
      headers: {
        'Authorization': `Token ${PLATE_RECOGNIZER_API_KEY}`
        // Removed 'Content-Type': 'application/json' to let Axios infer
      },
      params: {
        // Optional: Specify country if needed, e.g., 'country': 'sk' for Slovakia
        'regions': 'sk', // Assuming Slovakia based on previous context, can be adjusted
        'topn': 1
      }
    };

    const data = {
      upload: base64Image
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