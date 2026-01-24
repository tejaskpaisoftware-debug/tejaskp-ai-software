
const GUJARAT_CITIES = {
    "Ahmedabad": { "Navrangpura": [] },
    "Surat": { "Athwalines": [] },
    "Vadodara": { "Manjalpur": [] },
    "Rajkot": { "Kalawad Road": [] },
    "Visnagar": { "Main": [] },
    "Gandhinagar": { "Sector 11": [] }
};

const transform = (cities) => {
    const result = {};
    for (const city in cities) {
        result[city] = {};
        for (const area in cities[city]) {
            result[city][area] = [];
        }
    }
    return result;
}

const hierarchy = transform(GUJARAT_CITIES);
console.log("Keys in hierarchy:", Object.keys(hierarchy));
console.log("Is Visnagar present?", "Visnagar" in hierarchy);
console.log("Index of Visnagar:", Object.keys(hierarchy).indexOf("Visnagar"));
