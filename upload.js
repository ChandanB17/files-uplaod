const express = require('express');
const multer = require('multer');
const { MongoClient } = require('mongodb');
const fs = require('fs');

const app = express();
const port = 3000;

// Multer setup for handling file uploads
const upload = multer({ dest: 'uploads/' });

// MongoDB connection setup
const uri = 'mongodb://localhost:27017/Files';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    if (err) {
        console.error('Failed to connect to MongoDB:', err);
        return;
    }
    console.log('Connected to MongoDB');
    const db = client.db('Files');
    collection = db.collection('Upload');
});

// Route to serve the HTML form
app.get('/', (req, res) => {
    fs.readFile('image.html', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading HTML file:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.send(data);
    });
});

// Route to handle file uploads
app.post('/upload', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'text', maxCount: 1 }]), async (req, res) => {
    const imageFile = req.files['image'] ? req.files['image'][0] : null;
    const textFile = req.files['text'] ? req.files['text'][0] : null;

    if (!imageFile && !textFile) {
        res.status(400).send('No files uploaded.');
        return;
    }

    try {
        if (imageFile) {
            // Handle image upload
            console.log('Image uploaded successfully.');
        }

        if (textFile) {
            // Extract data from text file and store in MongoDB
            const data = fs.readFileSync(textFile.path, 'utf8');
            const lines = data.split('\n');
            const orders = lines.map(line => {
                const [customer, product, quantity] = line.split(',');
                return { customer, product, quantity: parseInt(quantity) };
            });

            // Store orders in MongoDB collection
            const result = await collection.insertMany(orders);
            console.log(`${result.insertedCount} orders inserted successfully.`);
        }

        res.send('Files uploaded successfully.');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
