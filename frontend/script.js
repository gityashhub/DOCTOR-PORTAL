const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const createPatientForm = document.getElementById('createPatientForm');
const fetchPatientForm = document.getElementById('fetchPatientForm');
const showPatientsBtn = document.getElementById('showPatientsBtn');
const patientList = document.getElementById('patientList');
const logoutButton = document.getElementById('logout');

// Register Doctor
if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const doctor_name = document.getElementById('name').value;
        const hospital_name = document.getElementById('hospital_name').value;
        const registration_number = document.getElementById('registration_number').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doctor_name, hospital_name, registration_number, email, password }),
        });

        const result = await response.json();
        alert(result.message || result.error);
        if (response.ok) window.location.href = '/login.html';
    });
}

// Login Doctor
if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const registration_number = document.getElementById('registration_number').value;
        const password = document.getElementById('password').value;

        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, registration_number, password }),
        });

        const result = await response.json();
        if (response.ok) {
            localStorage.setItem('token', result.token);
            window.location.href = '/dashboard.html';
        } else {
            alert(result.error);
        }
    });
}

// Create Patient
if (createPatientForm) {
    createPatientForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(createPatientForm);
        const patientData = {
            name: formData.get('name'),
            phone_number: formData.get('phone_number'),
            health_issue: formData.get('health_issue'),
            medicine: formData.get('medicine'),
            visit_date: formData.get('visit_date'),
            other_details: formData.get('other_details'),
        };

        const token = localStorage.getItem('token');

        const response = await fetch('/create-patient', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(patientData),
        });

        const result = await response.json();
        alert(result.message || result.error);
        if (response.ok) window.location.href = '/dashboard.html';
    });
}

// Fetch Patient by ID
if (fetchPatientForm) {
    fetchPatientForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const patientId = document.getElementById('fetch_patient_id').value;

        const response = await fetch('/fetch-patient', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patient_id: patientId }),
        });

        const result = await response.json();
        const patientRecords = document.getElementById('patientRecords');

        if (response.ok) {
            patientRecords.innerHTML = `
                <h3>Patient Records:</h3>
                <p>Name: ${result.name}</p>
                <p>Phone: ${result.phone_number}</p>
                <p>Health Issue: ${result.health_issue}</p>
                <p>Medicine: ${result.medicine}</p>
                <p>Visit Date: ${result.visit_date}</p>
                <p>Other Details: ${result.other_details}</p>
            `;
        } else {
            patientRecords.innerHTML = `<p>${result.error}</p>`;
        }
    });
}

// Show All Patients
// Function to fetch and display all patients
// async function fetchAllPatients() {
//     const token = localStorage.getItem('token');

//     try {
//         const response = await fetch('/get-all-patients', {
//             headers: { Authorization: `Bearer ${token}` },
//         });

//         const patients = await response.json();
//         const patientList = document.getElementById('patientList');
//         patientList.innerHTML = ''; // Clear previous data

//         if (patients.length === 0) {
//             patientList.innerHTML = '<p>No patients found.</p>';
//             return;
//         }

//         // Create a table to display patients
//         const table = document.createElement('table');
//         table.innerHTML = `
//             <thead>
//                 <tr>
//                     <th>Patient ID</th>
//                     <th>Name</th>
                   
//                 </tr>
//             </thead>
//             <tbody>
//                 ${patients.map(patient => `
//                     <tr>
//                         <td>${patient._id}</td>
//                         <td>${patient.name}</td>
                        
//                     </tr>
//                 `).join('')}
//             </tbody>
//         `;

//         patientList.appendChild(table);
//     } catch (error) {
//         console.error('Error fetching patients:', error);
//         alert('An error occurred while fetching patients.');
//     }
// }

async function fetchAllPatients() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/get-all-patients', {
            headers: { Authorization: `Bearer ${token}` },
        });

        const patients = await response.json();
        const patientList = document.getElementById('patientList');
        patientList.innerHTML = ''; // Clear previous data

        if (patients.length === 0) {
            patientList.innerHTML = '<p>No patients found.</p>';
            return;
        }

        // Create a list of patients
        patients.forEach(patient => {
            const patientDiv = document.createElement('div');
            patientDiv.innerHTML = `
                <p><strong>Patient ID:</strong> ${patient._id}</p>
                <p><strong>Name:</strong> ${patient.name}</p>
                <hr> <!-- Optional: Add a horizontal line between patients -->
            `;
            patientList.appendChild(patientDiv);
        });
    } catch (error) {
        console.error('Error fetching patients:', error);
        alert('An error occurred while fetching patients.');
    }
}
// if (showPatientsBtn) {
//     showPatientsBtn.addEventListener('click', async () => {
//         const token = localStorage.getItem('token');

//         const response = await fetch('/get-all-patients', {
//             headers: { Authorization: `Bearer ${token}` },
//         });

//         const result = await response.json();
//         patientList.innerHTML = '';

//         if (response.ok) {
//             result.forEach((patient) => {
//                 patientList.innerHTML += `<p>${patient.name} - ${patient.phone_number}</p>`;
//             });
//         } else {
//             patientList.innerHTML = `<p>${result.error}</p>`;
//         }
//     });
// }
// Delete Patient
async function handleDelete() {
    const patientId = document.getElementById('patientId').value;

    if (!patientId) {
        alert('Please enter a valid Patient ID!');
        return;
    }

    try {
        const response = await fetch(`/delete-patient/${patientId}`, {
            method: 'DELETE',
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            window.location.href = '/dashboard.html'; // Redirect to dashboard
        } else {
            alert(result.message || 'Failed to delete patient');
        }
    } catch (error) {
        console.error('Error deleting patient:', error);
        alert('An error occurred while deleting the patient.');
    }
}
// Logout
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    });
}

// Fetch Patient Data for Editing
async function fetchPatientData() {
    const patientId = document.getElementById('patientId').value;

    if (!patientId) {
        alert('Please enter a Patient ID!');
        return;
    }

    try {
        const response = await fetch(`/get-patient/${patientId}`);
        const patient = await response.json();

        if (response.ok) {
            document.getElementById('patientData').innerHTML = `
                <label for="name">Name:</label>
                <input type="text" id="name" value="${patient.name}" required>

                <label for="phone_number">Phone Number:</label>
                <input type="text" id="phone_number" value="${patient.phone_number}" required>

                <label for="health_issue">Health Issue:</label>
                <textarea id="health_issue" required>${patient.health_issue}</textarea>

                <label for="medicine">Medicine:</label>
                <input type="text" id="medicine" value="${patient.medicine}">

                <label for="other_details">Other Details:</label>
                <textarea id="other_details">${patient.other_details}</textarea>

                <button type="button" onclick="updatePatient('${patientId}')">Save Changes</button>
            `;
        } else {
            alert(patient.error);
        }
    } catch (error) {
        console.error('Error fetching patient data:', error);
        alert('An error occurred while fetching patient data.');
    }
}

// Update Patient Data
async function updatePatient(patientId) {
    const updatedData = {
        name: document.getElementById('name').value,
        phone_number: document.getElementById('phone_number').value,
        health_issue: document.getElementById('health_issue').value,
        medicine: document.getElementById('medicine').value,
        other_details: document.getElementById('other_details').value,
    };

    try {
        const response = await fetch(`/update-patient/${patientId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
        });

        const result = await response.json();
        alert(result.message);

        if (response.ok) {
            window.location.href = '/dashboard.html';
        }
    } catch (error) {
        console.error('Error updating patient data:', error);
        alert('An error occurred while updating patient data.');
    }
}