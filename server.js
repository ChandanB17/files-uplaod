const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const multer = require('multer');
const fs = require('fs');

dotenv.config();

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB successfully"))
    .catch((err) => console.error("Failed to connect to MongoDB"));

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: 'uploads/' });

app.listen(port, () => {
    console.log(`Server is running on port ${port}!`);
});

const orderSchema = new mongoose.Schema({
    invoiceId: String,
    userInfo: {
        name: String,
        email: String,
    },
    paymentDetails: {
        amount: Number,
        paymentMethod: String,
    },
    feedback: {
        rating: Number, // Rating from 1 to 5
        image: String, // URL/path to uploaded image
        textData: String, // Extracted data from text file
    }
});

const Order = mongoose.model('Order', orderSchema);

app.post('/api/pay', async (req, res) => {
    try {
        const { invoiceId, userInfo, paymentDetails } = req.body;
        const newOrder = new Order({ invoiceId, userInfo, paymentDetails });
        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to handle file uploads and feedback submission
app.post('/api/submit-feedback', upload.fields([{ name: 'image' }, { name: 'textFile' }]), (req, res) => {
    const { invoiceId, rating } = req.body;
    const imageFile = req.files['image'][0]; // Uploaded image file
    const textFile = req.files['textFile'][0]; // Uploaded text file

    // Handle image file
    const imagePath = imageFile ? `uploads/${imageFile.filename}` : null;

    // Handle text file
    let textData = null;
    if (textFile) {
        textData = fs.readFileSync(`uploads/${textFile.filename}`, 'utf-8');
    }

    // Update order document with feedback information
    Order.findOneAndUpdate(
        { invoiceId },
        { $set: { 'feedback.rating': rating, 'feedback.image': imagePath, 'feedback.textData': textData } },
        { new: true },
        (err, order) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Failed to submit feedback' });
            } else {
                res.json({ success: true, order });
            }
        }
    );
});
