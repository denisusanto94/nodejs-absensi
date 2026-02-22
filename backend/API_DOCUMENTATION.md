# API Documentation - Absensi App

Dokumentasi ini berisi daftar endpoint API yang tersedia untuk integrasi aplikasi (contoh: Mobile).

**Base URL**: `http://localhost:3000/api` (Sesuaikan dengan IP server jika running di jaringan lokal).

---

## 1. Authentication

### Login Admin/Dashboard
Digunakan untuk login ke sistem dashboard admin (mengembalikan token dashboard).
- **URL**: `/auth/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "admin@company.com",
    "password": "yourpassword"
  }
  ```
- **Response**: Mengembalikan token JWT dan data user.

### Login User (Mobile)
Endpoint khusus dengan format response yang ringan untuk perangkat mobile.
- **URL**: `/auth/login_user`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "deni@gmail.com",
    "password": "yourpassword"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "id_user": 2,
    "email": "deni@gmail.com",
    "roles": "staf",
    "divisi": "general_office"
  }
  ```

---

## 2. Offices

### Get All Offices
Mendapatkan daftar lokasi kantor yang terdaftar untuk validasi radius.
- **URL**: `/offices`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Array of Objects (id, office_name, latitude, longitude, radius_meter, address).

---

## 3. Attendance (Presensi)

### Check In (Real-time)
Melakukan check-in real-time dari aplikasi. Server akan memvalidasi radius.
- **URL**: `/attendance/checkin`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "latitude": -6.2000,
    "longitude": 106.8166
  }
  ```

### Check Out (Real-time)
Melakukan check-out real-time dari aplikasi.
- **URL**: `/attendance/checkout`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "latitude": -6.2000,
    "longitude": 106.8166
  }
  ```

### Submit Attendance (Sync Data)
Mengirimkan data presensi lengkap (Check-in & Check-out) sekaligus (Berguna untuk sinkronisasi data offline).
- **URL**: `/attendance/submit`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "id_user": 2,
    "office_id": 1,
    "check_in": "2026-02-22 08:00:00",
    "check_in_lat": "-6.2000",
    "check_in_long": "106.8166",
    "check_out": "2026-02-22 17:00:00",
    "check_out_lat": "-6.2000",
    "check_out_long": "106.8166"
  }
  ```

---

## 4. Leaves / Perks (Izin & Cuti)

### Get My Leaves
- **URL**: `/leaves`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`

### Create Leave Request
- **URL**: `/leaves`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "user_id": 2,
    "leave_type": "sick",
    "start_date": "2026-02-23",
    "end_date": "2026-02-24",
    "reason": "Sakit demam"
  }
  ```

---

## Catatan Keamanan
Semua API (kecuali Login) memerlukan Header Authorization:
`Authorization: Bearer <YOUR_JWT_TOKEN>`
