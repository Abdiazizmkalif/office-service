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
        res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Submission Successful</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin: 0;
                    padding: 20px;
                }
                .success-card {
                    background: #ffffff;
                    max-width: 500px;
                    width: 100%;
                    padding: 40px 30px;
                    border-radius: 20px;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.1);
                    text-align: center;
                }
                .icon-wrapper {
                    width: 70px;
                    height: 70px;
                    background: #e6f7ed;
                    color: #28a745;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 35px;
                    margin: 0 auto 25px auto;
                }
                h1 {
                    color: #28a745;
                    font-size: 26px;
                    margin-bottom: 10px;
                    font-weight: 700;
                }
                h2 {
                    color: #333333;
                    font-size: 20px;
                    margin-bottom: 20px;
                    font-weight: 600;
                }
                .divider {
                    height: 1px;
                    background: #e1e5eb;
                    margin: 20px 0;
                }
                p {
                    color: #555555;
                    font-size: 15px;
                    line-height: 1.6;
                    margin-bottom: 15px;
                }
                .somali-text {
                    color: #0056b3;
                    font-weight: 500;
                    background: #f0f7ff;
                    padding: 15px;
                    border-radius: 10px;
                    border-left: 4px solid #007bff;
                }
                .btn {
                    display: inline-block;
                    margin-top: 25px;
                    padding: 12px 30px;
                    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 15px;
                    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
                    transition: all 0.2s ease;
                }
                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 15px rgba(0, 123, 255, 0.3);
                }
            </style>
        </head>
        <body>
            <div class="success-card">
                <div class="icon-wrapper">✓</div>
                <h1>Success!</h1>
                <h2>Macluumaadka Waa la Keydiyay</h2>
                
                <p>Your information has been successfully saved to our database.</p>
                
                <div class="divider"></div>
                
                <p class="somali-text">
                    <strong>Fariin:</strong> Fadlan sug inta laga soo dhajinayo magacaaga iyo xilliga imtixaankaaga kanaalka <strong>Telegram-ka</strong>.
                </p>
                
                <a href="/" class="btn">Go Back / Dib u Noqo</a>
            </div>
        </body>
        </html>
    `);
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