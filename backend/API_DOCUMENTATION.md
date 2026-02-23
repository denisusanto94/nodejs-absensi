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
- **Success Response (200)**:
  ```json
  {
    "auth": true,
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "name": "Admin",
      "email": "admin@company.com",
      "role": "super_admin",
      "permissions": [
        "manage_attendance",
        "manage_leaves_permits",
        "manage_approve_leaves_staf",
        "manage_approve_leaves_supervisor",
        "..."
      ]
    }
  }
  ```

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

### Get Current User Profile & Permissions
Mendapatkan profil dan daftar permissions user yang sedang login berdasarkan token JWT.
- **URL**: `/auth/me`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Success Response (200)**:
  ```json
  {
    "name": "Deni",
    "email": "deni@gmail.com",
    "role": "staf",
    "permissions": [
      "manage_attendance",
      "manage_leaves_permits",
      "manage_approve_leaves_staf"
    ]
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

## 4. Attendance Photo / Selfie (Upload Foto Absensi)

API ini merupakan bagian dari serangkaian proses absensi. Setelah check-in/check-out, user dapat mengunggah foto selfie sebagai bukti kehadiran.

### Upload Check-in Photo
Mengunggah foto selfie saat check-in. User harus sudah melakukan check-in pada hari itu.
- **URL**: `/attendance-foto/checkin`
- **Method**: `POST`
- **Headers**:
  ```
  Authorization: Bearer <token>
  Content-Type: multipart/form-data
  ```
- **Request Body** (form-data):
  | Field | Type | Required | Keterangan |
  |-------|------|----------|------------|
  | `foto` | File | Ya | File foto selfie (JPEG/PNG/WebP, maks 5MB) |

- **Success Response (200)**:
  ```json
  {
    "message": "Check-in photo uploaded successfully",
    "filename": "2_1708678800000.jpg",
    "attendance_id": 5
  }
  ```
- **Error Response (400)** — Belum check-in:
  ```json
  {
    "message": "No check-in found for today. Please check in first."
  }
  ```
- **Error Response (400)** — Tidak ada file:
  ```json
  {
    "message": "No photo uploaded."
  }
  ```

### Upload Check-out Photo
Mengunggah foto selfie saat check-out. User harus sudah memiliki record absensi pada hari itu.
- **URL**: `/attendance-foto/checkout`
- **Method**: `POST`
- **Headers**:
  ```
  Authorization: Bearer <token>
  Content-Type: multipart/form-data
  ```
- **Request Body** (form-data):
  | Field | Type | Required | Keterangan |
  |-------|------|----------|------------|
  | `foto` | File | Ya | File foto selfie (JPEG/PNG/WebP, maks 5MB) |

- **Success Response (200)**:
  ```json
  {
    "message": "Check-out photo uploaded successfully",
    "filename": "2_1708678900000.jpg",
    "attendance_id": 5
  }
  ```
- **Error Response (400)** — Belum ada absensi hari ini:
  ```json
  {
    "message": "No attendance record found for today."
  }
  ```

### Akses Foto yang Diupload
Foto yang sudah diupload dapat diakses melalui URL statis:
```
GET http://localhost:3000/uploads/upload_absensi/<filename>
```
Contoh: `http://localhost:3000/uploads/upload_absensi/2_1708678800000.jpg`

> **Catatan**: Format penamaan file otomatis: `{userId}_{timestamp}.{ext}`

---

## 5. Leaves / Perks (Izin & Cuti)

### Get All Leaves
- **URL**: `/leaves`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Success Response (200)**:
  ```json
  [
    {
      "id": 1,
      "user_id": 2,
      "user_name": "Deni",
      "leave_type": "sick",
      "start_date": "2026-02-23",
      "end_date": "2026-02-24",
      "reason": "Sakit demam",
      "status": "pending",
      "approved_by": null,
      "approved_by_name": null,
      "created_at": "2026-02-23T03:00:00.000Z"
    }
  ]
  ```

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

### Update Leave Status (Approve / Reject)
Menyetujui atau menolak permintaan cuti. Hanya user yang memiliki salah satu permission berikut yang diizinkan:
- `manage_approve_leaves_staf`
- `manage_approve_leaves_supervisor`
- `manage_approve_leaves_manager`
- `manage_approve_leaves_co_ceo`
- `manage_approve_leaves_ceo`
- `manage_approve_leaves_co_cto`
- `manage_approve_leaves_cto`
- `manage_approve_leaves_owners`

- **URL**: `/leaves/:id/status`
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "status": "approved"
  }
  ```
  Nilai `status` yang valid: `approved`, `rejected`
- **Success Response (200)**:
  ```json
  {
    "message": "Leave approved"
  }
  ```
- **Error Response (403)** — Jika user tidak memiliki permission:
  ```json
  {
    "message": "Access denied. Required permission not found."
  }
  ```

### Delete Leave
Menghapus data cuti (hanya Admin).
- **URL**: `/leaves/:id`
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer <token>`

---

## 6. Attendance Transum Foto (Upload Foto Transum)

API untuk mengunggah foto selfie sebagai bukti kehadiran transportasi umum (Absensi Rabu).

### Upload Check-in Transum Photo
Mengunggah foto selfie saat check-in transum. User harus sudah melakukan check-in transum pada hari itu.
- **URL**: `/attendance-transum-foto/checkin`
- **Method**: `POST`
- **Headers**:
  ```
  Authorization: Bearer <token>
  Content-Type: multipart/form-data
  ```
- **Request Body** (form-data):
  | Field | Type | Required | Keterangan |
  |-------|------|----------|------------|
  | `foto` | File | Ya | File foto selfie (JPEG/PNG/WebP, maks 5MB) |

- **Success Response (200)**:
  ```json
  {
    "message": "Transum check-in photo uploaded successfully",
    "filename": "transum_2_1708678800000.jpg",
    "attendance_transum_id": 5
  }
  ```
- **Error Response (400)** — Belum check-in:
  ```json
  {
    "message": "No transum check-in found for today. Please check in first."
  }
  ```

### Upload Check-out Transum Photo
Mengunggah foto selfie saat check-out transum.
- **URL**: `/attendance-transum-foto/checkout`
- **Method**: `POST`
- **Headers**:
  ```
  Authorization: Bearer <token>
  Content-Type: multipart/form-data
  ```
- **Request Body** (form-data):
  | Field | Type | Required | Keterangan |
  |-------|------|----------|------------|
  | `foto` | File | Ya | File foto selfie (JPEG/PNG/WebP, maks 5MB) |

- **Success Response (200)**:
  ```json
  {
    "message": "Transum check-out photo uploaded successfully",
    "filename": "transum_2_1708678900000.jpg",
    "attendance_transum_id": 5
  }
  ```
- **Error Response (400)** — Belum ada absensi hari ini:
  ```json
  {
    "message": "No transum record found for today."
  }
  ```

### Akses Foto Transum
Foto transum yang sudah diupload dapat diakses melalui URL statis:
```
GET http://localhost:3000/uploads/upload_transum/<filename>
```
> **Format penamaan file**: `transum_{userId}_{timestamp}.{ext}`

---

## Catatan Keamanan
Semua API (kecuali Login) memerlukan Header Authorization:
`Authorization: Bearer <YOUR_JWT_TOKEN>`

