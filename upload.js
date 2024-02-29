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
let collection;

client.connect(err => {
    if (err) {
        console.error('Failed to connect to MongoDB:', err);
        return;
    }
    console.log('Connected to MongoDB');
    const db = client.db('your_database');
    collection = db.collection('your_collection');
});

// Route to serve the HTML form
app.get('/', (req, res) => {
    fs.readFile('upload_form.html', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading HTML file:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.send(data);
    });
});

// Route to handle file uploads
app.post('/upload', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'text', maxCount: 1 }]), (req, res) => {
    const imageFile = req.files['image'] ? req.files['image'][0] : null;
    const textFile = req.files['text'] ? req.files['text'][0] : null;

    if (!imageFile && !textFile) {
        res.status(400).send('No files uploaded.');
        return;
    }

    if (imageFile) {
        // Example: Saving image file
        // You might want to perform additional processing here (e.g., resizing, renaming)
        // fs.renameSync(imageFile.path, 'uploads/' + imageFile.originalname);
        console.log('Image uploaded successfully.');
    }

    if (textFile) {
        // Example: Extracting data from text file and storing in MongoDB
        fs.readFile(textFile.path, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading text file:', err);
                res.status(500).send('Internal Server Error');
                return;
            }
            const lines = data.split('\n');
            lines.forEach(line => {
                collection.insertOne({ data: line }, (err, result) => {
                    if (err) {
                        console.error('Error inserting document into MongoDB:', err);
                        res.status(500).send('Internal Server Error');
                        return;
                    }
                });
            });
        });
        console.log('Text file uploaded successfully.');
    }

    res.send('Files uploaded successfully.');
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:3000`);
});
