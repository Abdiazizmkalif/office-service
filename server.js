const express = require('express');
const path = require('path'); // 👈 Added this to handle absolute directory locations safely
const { PrismaClient } = require('@prisma/client');
const adminRouter = require('./admin'); // Import your new router file

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Serve static files from your 'public' folder (makes logo.png and minibus.png work)
app.use(express.static(path.join(__dirname, 'public')));

// 2. Main Root Route - Sends the beautiful registration page to the user
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 3. User Form Submission Route
app.post('/submit', async (req, res) => {
    try {
        const { name, mobile_number, car_type, tin_number } = req.body;
        
        await prisma.carSubmission.create({
            data: {
                name,
                mobileNumber: mobile_number,
                carType: car_type,
                tinNumber: tin_number
            }
        });
        res.send("<h1>Success!</h1><p>Data has been saved to the database.</p><a href='/'>Go Back</a>");
    } catch (e) {
        console.error(e);
        res.status(500).send("Error saving data");
    }
});

// 4. Link the Admin Router Module
// This tells Express: any request that starts with "/admin" should go to admin.js
app.use('/admin', adminRouter(prisma));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});