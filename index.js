const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { MongoClient, ConnectionPoolMonitoringEvent, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        // Connect to MongoDB
        // await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db('assignment');
        const collection = db.collection('users');
        const supplyCollection = db.collection("supply")
        const goodCollection = db.collection("goods")

        // User Registration
        app.post('/api/v1/register', async (req, res) => {
            const { name, email, password } = req.body;

            // Check if email already exists
            const existingUser = await collection.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exists'
                });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user into the database
            await collection.insertOne({ name, email, password: hashedPassword });

            res.status(201).json({
                success: true,
                message: 'User registered successfully'
            });
        });

        // User Login
        app.post('/api/v1/login', async (req, res) => {
            const { email, password } = req.body;

            // Find user by email
            const user = await collection.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            // Compare hashed password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            // Generate JWT token
            const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.EXPIRES_IN });

            res.json({
                success: true,
                message: 'Login successful',
                token
            });
        });


        //supplyCollection
        app.post('/api/v1/create-supply', async (req, res) => {
            const supplyItem = req.body
            const response = await supplyCollection.insertOne(supplyItem)

            res.status(201).json({
                success: true,
                message: "New Item Created Successfully",
                response
            });

        })

        app.get("/api/v1/get-supply", async (req, res) => {
            const result = await supplyCollection.find().toArray()
            res.status(201).json({
                success: true,
                message: "Get All Supplies",
                result
            });
        })

        app.get("/api/v1/get-single-supply/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await supplyCollection.findOne(query)
            res.status(201).json({
                success: true,
                message: "Get Single Supply",
                result
            });
        })

        app.put("/api/v1/update-supply/:id", async (req, res) => {
            const item = req.body;
            const id = req.params.id
            console.log(id, item)
            const query = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    title: item.title,
                    category: item.category,
                    amount: item.amount,
                    description: item.description,
                    image: item.image
                }
            };
            const result = await supplyCollection.updateOne(query, updateDoc)
            res.status(201).json({
                success: true,
                message: "Supply Item Deleted",
                result
            });

        })

        app.delete("/api/v1/delete-supply/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            await supplyCollection.deleteOne(query)
            res.status(201).json({
                success: true,
                message: "Supply Item Deleted",
            });

        })

        //goods collection

        app.get("/api/v1/get-goods", async (req, res) => {
            const result = await goodCollection.find().toArray()
            console.log(result)
            res.status(201).json({
                success: true,
                message: "Get All Goods",
                result
            });
        })

        app.get("/api/v1/get-goods-detail/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await goodCollection.findOne(query)
            res.status(201).json({
                success: true,
                message: "Get Single Supply",
                result
            });
        })

        // Start the server
        app.listen(port, () => {
            console.log(`Relief Server is running on http://localhost:${port}`);
        });

    } finally {
    }
}

run().catch(console.dir);

// Test route
app.get('/', (req, res) => {
    const serverStatus = {
        message: 'Server is running smoothly',
        timestamp: new Date()
    };
    res.json(serverStatus);
});