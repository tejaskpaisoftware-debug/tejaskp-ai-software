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
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
];

files.forEach(file => {
    const fileUrl = `${baseUrl}/${file}`;
    const filePath = path.join(modelsDir, file);

    if (fs.existsSync(filePath)) {
        console.log(`Skipping ${file}, already exists.`);
        return;
    }

    console.log(`Downloading ${file}...`);
    const fileStream = fs.createWriteStream(filePath);
    https.get(fileUrl, function (response) {
        if (response.statusCode !== 200) {
            console.error(`Failed to download ${file}: Status ${response.statusCode}`);
            return;
        }
        response.pipe(fileStream);
        fileStream.on('finish', function () {
            fileStream.close();
            console.log(`Downloaded ${file}`);
        });
    }).on('error', function (err) {
        fs.unlink(filePath, () => { });
        console.error(`Error downloading ${file}: ${err.message}`);
    });
});
