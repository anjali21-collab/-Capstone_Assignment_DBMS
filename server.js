const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'car_rental_db'
});

// 🚗 GET AVAILABLE CARS
app.get('/cars', (req, res) => {
    db.query("SELECT * FROM cars WHERE availability = 1", (err, result) => {
        if (err) return res.send(err);
        res.json(result);
    });
});

// 🚗 BOOK CAR
app.post('/book', (req, res) => {
    const { name, phone, email, car_id, start, end } = req.body;

    db.query(
        "INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)",
        [name, phone, email],
        (err, result) => {
            if (err) return res.send(err);

            const customer_id = result.insertId;

            db.query(
                "INSERT INTO bookings (customer_id, car_id, start_date, end_date, status) VALUES (?, ?, ?, ?, 'Booked')",
                [customer_id, car_id, start, end],
                (err) => {
                    if (err) return res.send(err);

                    db.query(
                        "UPDATE cars SET availability = 0 WHERE car_id = ?",
                        [car_id]
                    );

                    res.send("✅ Booking Successful!");
                }
            );
        }
    );
});

// 📜 BOOKING HISTORY
app.get('/bookings', (req, res) => {
    db.query(`
        SELECT 
            b.booking_id,
            c.name,
            car.model,
            b.start_date,
            b.end_date,
            b.status
        FROM bookings b
        JOIN customers c ON b.customer_id = c.customer_id
        JOIN cars car ON b.car_id = car.car_id
    `, (err, result) => {
        if (err) return res.send(err);
        res.json(result);
    });
});

// 🔄 RETURN CAR
app.post('/return', (req, res) => {
    const { booking_id } = req.body;

    db.query(
        "SELECT car_id, status FROM bookings WHERE booking_id = ?",
        [booking_id],
        (err, result) => {
            if (err) return res.send(err);

            if (result.length === 0) {
                return res.send("❌ Invalid booking ID");
            }

            if (result[0].status === "Returned") {
                return res.send("⚠️ Already Returned");
            }

            const car_id = result[0].car_id;

            db.query(
                "UPDATE bookings SET status = 'Returned' WHERE booking_id = ?",
                [booking_id],
                (err) => {
                    if (err) return res.send(err);

                    db.query(
                        "UPDATE cars SET availability = 1 WHERE car_id = ?",
                        [car_id]
                    );

                    res.send("🚗 Car Returned Successfully!");
                }
            );
        }
    );
});

// ❌ CANCEL BOOKING
app.post('/cancel', (req, res) => {
    const { booking_id } = req.body;

    db.query(
        "SELECT car_id, status FROM bookings WHERE booking_id = ?",
        [booking_id],
        (err, result) => {
            if (err) return res.send(err);

            if (result.length === 0) {
                return res.send("❌ Invalid booking ID");
            }

            if (result[0].status === "Cancelled") {
                return res.send("⚠️ Already Cancelled");
            }

            const car_id = result[0].car_id;

            db.query(
                "UPDATE bookings SET status = 'Cancelled' WHERE booking_id = ?",
                [booking_id],
                (err) => {
                    if (err) return res.send(err);

                    db.query(
                        "UPDATE cars SET availability = 1 WHERE car_id = ?",
                        [car_id]
                    );

                    res.send("❌ Booking Cancelled!");
                }
            );
        }
    );
});

app.listen(3000, () => {
    console.log("🔥 Server running on http://localhost:3000");
});