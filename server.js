require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'frontend')));

// MongoDB Connection
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connect() {
    await client.connect();
    return client.db('doctor_portal');
}

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).send('Token missing');

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.doctorId = verified.doctorId;
        next();
    } catch (err) {
        res.status(400).send('Invalid token');
    }
};

// Register Doctor
app.post('/register', async (req, res) => {
    const { doctor_name, hospital_name, registration_number, email, password } = req.body;

    const db = await connect();
    const doctors = db.collection('doctors');

    // Check if doctor already exists
    const existingDoctor = await doctors.findOne({ $or: [{ email }, { registration_number }] });
    if (existingDoctor) {
        return res.status(400).json({ error: 'Doctor already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new doctor
    await doctors.insertOne({ doctor_name, hospital_name, registration_number, email, password: hashedPassword });
    res.status(201).json({ message: 'Doctor registered successfully!' });
});

// Login Doctor
app.post('/login', async (req, res) => {
    const { email, registration_number, password } = req.body;

    const db = await connect();
    const doctors = db.collection('doctors');

    // Find doctor
    const doctor = await doctors.findOne({ email, registration_number });
    if (!doctor) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, doctor.password);
    if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ doctorId: doctor.registration_number }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', doctor, token });
});

// Create Patient
app.post('/create-patient', verifyToken, async (req, res) => {
    const { name, phone_number, health_issue, medicine, visit_date, other_details } = req.body;
    const doctorId = req.doctorId;

    const db = await connect();
    const patients = db.collection('patients');

    // Insert new patient
    await patients.insertOne({ name, phone_number, health_issue, medicine, visit_date, other_details, doctor_id: doctorId });
    res.status(201).json({ message: 'Patient created successfully!' });
});

// Fetch Patient by ID
app.post('/fetch-patient', async (req, res) => {
    const { patient_id } = req.body;

    const db = await connect();
    const patients = db.collection('patients');

    const patient = await patients.findOne({ _id: new ObjectId(patient_id) });
    if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
});

// Get All Patients
// Get All Patients
app.get('/get-all-patients', verifyToken, async (req, res) => {
    const doctorId = req.doctorId;

    const db = await connect();
    const patients = db.collection('patients');

    try {
        const patientList = await patients.find({ doctor_id: doctorId }).toArray();
        res.json(patientList);
    } catch (err) {
        console.error('Error fetching patients:', err);
        res.status(500).json({ error: 'Failed to fetch patients' });
    }
});
// app.get('/get-all-patients', verifyToken, async (req, res) => {
//     const doctorId = req.doctorId;

//     const db = await connect();
//     const patients = db.collection('patients');

//     const patientList = await patients.find({ doctor_id: doctorId }).toArray();
//     res.json(patientList);
// });

// Delete Patient
// Delete Patient
app.delete('/delete-patient/:id', async (req, res) => {
    const { id } = req.params;

    const db = await connect();
    const patients = db.collection('patients');

    try {
        const result = await patients.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        res.status(200).json({ message: 'Patient deleted successfully' });
    } catch (err) {
        console.error('Error deleting patient:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Fetch Patient by ID for Editing
app.get('/get-patient/:id', async (req, res) => {
    const { id } = req.params;

    const db = await connect();
    const patients = db.collection('patients');

    const patient = await patients.findOne({ _id: new ObjectId(id) });
    if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
});

// Update Patient
app.post('/update-patient/:id', async (req, res) => {
    const { id } = req.params;
    const { name, phone_number, health_issue, medicine, other_details } = req.body;

    const db = await connect();
    const patients = db.collection('patients');

    const result = await patients.updateOne(
        { _id: new ObjectId(id) },
        { $set: { name, phone_number, health_issue, medicine, other_details } }
    );

    if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Patient not found' });
    }

    res.status(200).json({ message: 'Patient updated successfully' });
});

// Logout
app.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully!' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));