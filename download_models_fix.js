const fs = require('fs');
const https = require('https');
const path = require('path');

const modelsDir = path.join(__dirname, 'public/models');
if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const files = [
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2', // Added missing shard
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
];

async function downloadFile(file) {
    return new Promise((resolve, reject) => {
        const fileUrl = `${baseUrl}/${file}`;
        const filePath = path.join(modelsDir, file);

        console.log(`Downloading ${file}...`);
        const fileStream = fs.createWriteStream(filePath);
        https.get(fileUrl, function (response) {
            if (response.statusCode !== 200) {
                fileStream.close();
                fs.unlink(filePath, () => { });
                reject(new Error(`Failed to download ${file}: Status ${response.statusCode}`));
                return;
            }
            response.pipe(fileStream);
            fileStream.on('finish', function () {
                fileStream.close();
                console.log(`Downloaded ${file}`);
                resolve();
            });
        }).on('error', function (err) {
            fs.unlink(filePath, () => { });
            reject(err);
        });
    });
}

async function main() {
    for (const file of files) {
        try {
            await downloadFile(file);
        } catch (error) {
            console.error(error.message);
        }
    }
}

main();
