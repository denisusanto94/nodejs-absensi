# Amazfit Bip 6 Attendance System

This project contains a full attendance system with a Node.js backend and a Zepp OS app for Amazfit Bip 6.

## Structure

- `backend/`: Node.js Express API.
- `zeppos-app/`: Zepp OS Application (Device + Side Service).
- `database/`: MySQL Schema.

## Deployment Instructions

### Part 1: Database Setup

1. Install MySQL Server (XAMPP or standalone).
2. Open your MySQL client (e.g., PHPMyAdmin or Workbench).
3. Create a database named `absensi_amazfit`.
4. Import the schema file: `database/schema.sql`.
5. This will create tables: `users`, `attendance`, `office_locations` and seed a default admin/user.

### Part 2: Backend Setup

1. Navigate to `backend/` directory.
2. Open `.env` file and configure your Database credentials:
   ```
   DB_USER=root
   DB_PASSWORD=your_password
   ```
   Also update `OFFICE_LAT` and `OFFICE_LONG` to your testing location if needed.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   # or
   node src/app.js
   ```
   Server runs on `http://localhost:3000`.

### Part 3: Zepp OS App Setup

1. **Prerequisite**: Install Zepp OS CLI or use Zepp OS Simulator.
2. Navigate to `zeppos-app/` directory.
3. **IMPORTANT**: Update the Backend IP in `zeppos-app/app-side/index.js`.
   - Find `const BACKEND_URL = "http://192.168.1.10:3000/api/attendance";`
   - Replace `192.168.1.10` with your PC's local IP address (run `ipconfig` to find it).
   - *Do not use `localhost` because the phone/emulator is a separate device.*
4. Build/Run:
   ```bash
   zeus dev
   ```
   (Or use the Zepp Simulator to load the project directory).

### Part 4: Usage

**1. Admin Dashboard**
- Open `http://localhost:3000` in your browser.
- Login with:
  - Username: `admin`
  - Password: `password` (Assuming you updated the hash or used the provided `authController` logic which compares hash. **Note**: The seed data has a placeholder hash. You might need to update the password in DB manually or use the `register` route via Postman first. The current code assumes valid bcrypt hash in DB matching 'password').
  - *Tip*: Use Postman to `POST /api/auth/register` to create a new admin/user if login fails with dummy hash.

**2. Watch App**
- Open the app on the Simulator/Watch.
- Allow GPS permission.
- Wait for GPS signal (Latitude/Longitude to appear).
- Click **CHECK IN**.
- The app will send coordinates to the backend.
- Backend verifies location (within 100m of Office) and time.
- Returns Success or Error (e.g., "Outside office radius").

**Features Implemented:**
- **Geo-fencing**: Backend validates distance using `geolib`.
- **Prevent Double Check-in**: Checks if `check_in` exists for today.
- **Admin Export**: Export attendance to Excel via Dashboard.
- **Shift Validation**: Checks shift start time vs check-in time.
- **Clean Architecture**: MVC pattern in Backend.

## Security Note
- Passwords should be properly hashed in production.
- JWT Secret should be changed in `.env`.
