const fs = require('fs').promises;
const path = require('path');

async function cleanupUploads(directory, ageThresholdHours) {
    const now = Date.now();
    const ageThresholdMs = ageThresholdHours * 10 * 10 * 1000; // Prevedie hodiny na milisekundy

    console.log(`[Služba čistenia] Spúšťam čistenie v adresári ${directory}. Mažem súbory staršie ako ${ageThresholdHours} hodín.`);

    try {
        const files = await fs.readdir(directory);

        for (const file of files) {
            const filePath = path.join(directory, file);
            try {
                const stats = await fs.stat(filePath);
                if (stats.isFile()) {
                    // Skontroluje, či je čas poslednej úpravy súboru starší ako prah
                    if ((now - stats.mtime.getTime()) > ageThresholdMs) {
                        await fs.unlink(filePath);
                        console.log(`[Služba čistenia] Starý súbor vymazaný: ${filePath}`);
                    }
                }
            } catch (fileError) {
                console.error(`[Služba čistenia] Chyba pri spracovaní súboru ${filePath}:`, fileError);
            }
        }
        console.log(`[Služba čistenia] Čistenie dokončené.`);
    } catch (dirError) {
        console.error(`[Služba čistenia] Chyba pri čítaní adresára ${directory}:`, dirError);
    }
}

module.exports = { cleanupUploads };
