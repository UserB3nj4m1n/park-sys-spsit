const { createWorker } = require('tesseract.js');

async function recognizeLicensePlate(imagePath) {
  const worker = await createWorker('eng');
  const ret = await worker.recognize(imagePath);
  const cleanedText = ret.data.text.replace(/[^A-PR-Z0-9]/g, "");
  console.log(cleanedText);
  await worker.terminate();
  return cleanedText;
}

module.exports = { recognizeLicensePlate };
