const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'e.bilolov', 'Desktop', 'lugat', 'lugat.json');

function sortLugat() {
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`Error: ${filePath} not found.`);
            return;
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const sortedData = {};

        for (const category in data) {
            const words = data[category];
            const sortedWords = words.sort((a, b) => {
                const valA = (a.uz || a.translation || '').toLowerCase();
                const valB = (b.uz || b.translation || '').toLowerCase();
                return valA.localeCompare(valB, 'uz');
            });
            sortedData[category] = sortedWords;
        }

        fs.writeFileSync(filePath, JSON.stringify(sortedData, null, 2), 'utf-8');
        console.log("Alphabetical sorting completed successfully.");
    } catch (err) {
        console.error("An error occurred during sorting:", err);
    }
}

sortLugat();
