# API Test Report — Approve & Reject Cuti

**Tanggal Test**: 23 Februari 2026, 12:50 WIB  
**Base URL**: `http://localhost:3000/api`  
**Tester**: Supervisor  

---

## 1. Login (Mendapatkan Token)

Langkah pertama adalah login untuk mendapatkan JWT token yang digunakan pada setiap request berikutnya.

- **Endpoint**: `POST /api/auth/login`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "email": "supervisor@company.com",
    "password": "12345678"
  }
  ```
- **Response (200 OK)** ✅:
  ```json
  {
    "auth": true,
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "name": "Supervisor",
      "email": "supervisor@company.com",
      "role": "supervisor",
      "permissions": [
        "manage_attendance",
        "manage_leaves_permits",
        "manage_approve_leaves_staf",
        "manage_approve_leaves_supervisor"
      ]
    }
  }
  ```

> **Catatan**: Simpan nilai `token` dari response untuk digunakan sebagai header `Authorization: Bearer <token>` di semua request berikutnya.

---

## 2. Get All Leaves (Melihat Daftar Cuti)

Melihat semua data cuti yang ada di sistem sebelum melakukan approve/reject.

- **Endpoint**: `GET /api/leaves`
- **Headers**:
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
  ```
- **Response (200 OK)** ✅:
  ```json
  [
    {
      "id": 3,
      "user_id": 2,
      "user_name": "deni",
      "leave_type": null,
      "start_date": "2026-02-22T17:00:00.000Z",
      "end_date": "2026-02-23T17:00:00.000Z",
      "reason": "coba cuti baru",
      "status": "pending",
      "approved_by": null,
      "approved_by_name": null,
      "created_at": "2026-02-23T..."
    },
    {
      "id": 2,
      "user_id": 2,
      "user_name": "deni",
      "leave_type": null,
      "start_date": "2026-02-22T17:00:00.000Z",
      "end_date": "2026-02-23T17:00:00.000Z",
      "reason": "test cuti",
      "status": "approved",
      "approved_by": 3,
      "approved_by_name": "Supervisor",
      "created_at": "2026-02-23T..."
    }
  ]
  ```

> **Status awal**: Leave ID 3 berstatus `pending`, siap untuk di-approve.

---

## 3. Test Approve Cuti ✅

Mengubah status cuti dari `pending` menjadi `approved`.

- **Endpoint**: `PUT /api/leaves/3/status`
- **Headers**:
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "status": "approved"
  }
  ```
- **Response (200 OK)** ✅:
  ```json
  {
    "message": "Leave approved"
  }
  ```

### Verifikasi setelah Approve:
| Field | Sebelum | Sesudah |
|-------|---------|---------|
| `status` | `pending` | `approved` |
| `approved_by` | `null` | `3` (ID Supervisor) |
| `approved_by_name` | `null` | `Supervisor` |

---

## 4. Create New Leave (Membuat Cuti Baru untuk Test Reject)

Membuat data cuti baru agar bisa digunakan untuk test reject.

- **Endpoint**: `POST /api/leaves`
- **Headers**:
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "user_id": 1,
    "leave_type": "sick",
    "start_date": "2026-03-01",
    "end_date": "2026-03-02",
    "reason": "test reject cuti"
  }
  ```
- **Response (201 Created)** ✅:
  ```json
  {
    "message": "Leave request created"
  }
  ```

> Cuti baru dibuat dengan ID **4** dan status otomatis `pending`.

---

## 5. Test Reject Cuti ✅

Mengubah status cuti dari `pending` menjadi `rejected`.

- **Endpoint**: `PUT /api/leaves/4/status`
- **Headers**:
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "status": "rejected"
  }
  ```
- **Response (200 OK)** ✅:
  ```json
  {
    "message": "Leave rejected"
  }
  ```

### Verifikasi setelah Reject:
| Field | Sebelum | Sesudah |
|-------|---------|---------|
| `status` | `pending` | `rejected` |
| `approved_by` | `null` | `3` (ID Supervisor) |
| `approved_by_name` | `null` | `Supervisor` |

---

## 6. Verifikasi Akhir — State Semua Cuti

Setelah semua test selesai, berikut state akhir semua data cuti di sistem:

| ID | User | Leave Type | Status | Approved By | Reason |
|----|------|------------|--------|-------------|--------|
| 4 | Super Admin | sick | **rejected** | Supervisor | test reject cuti |
| 3 | deni | - | **approved** | Supervisor | coba cuti baru |
| 2 | deni | - | **approved** | Supervisor | test cuti |

---

## 7. Test Error Case — Tanpa Permission

Jika user **tidak memiliki** permission approve, maka akan mendapatkan error 403.

- **Endpoint**: `PUT /api/leaves/:id/status`
- **Expected Response (403 Forbidden)** ❌:
  ```json
  {
    "message": "Access denied. Required permission not found."
  }
  ```

---

## 8. Test Error Case — Tanpa Token

Jika request tidak menyertakan header `Authorization`, maka akan mendapatkan error 403.

- **Endpoint**: `PUT /api/leaves/:id/status` (tanpa header Authorization)
- **Expected Response (403 Forbidden)** ❌:
  ```json
  {
    "message": "No token provided"
  }
  ```

---

## Ringkasan Hasil Test

| No | Test Case | Endpoint | Method | Status | Result |
|----|-----------|----------|--------|--------|--------|
| 1 | Login Supervisor | `/auth/login` | POST | 200 | ✅ Pass |
| 2 | Get All Leaves | `/leaves` | GET | 200 | ✅ Pass |
| 3 | Approve Cuti (ID 3) | `/leaves/3/status` | PUT | 200 | ✅ Pass |
| 4 | Create Leave | `/leaves` | POST | 201 | ✅ Pass |
| 5 | Reject Cuti (ID 4) | `/leaves/4/status` | PUT | 200 | ✅ Pass |

---

## Informasi User Test

| Field | Value |
|-------|-------|
| **Nama** | Supervisor |
| **Email** | supervisor@company.com |
| **Password** | 12345678 |
| **Role** | supervisor |
| **Permissions** | `manage_attendance`, `manage_leaves_permits`, `manage_approve_leaves_staf`, `manage_approve_leaves_supervisor` |

---

## Permission yang Diperlukan

Untuk dapat melakukan approve/reject cuti, user harus memiliki **salah satu** dari permission berikut:

| Permission | Role Target |
|------------|-------------|
| `manage_approve_leaves_staf` | Staf |
| `manage_approve_leaves_supervisor` | Supervisor |
| `manage_approve_leaves_manager` | Manager |
| `manage_approve_leaves_co_ceo` | Co-CEO |
| `manage_approve_leaves_ceo` | CEO |
| `manage_approve_leaves_co_cto` | Co-CTO |
| `manage_approve_leaves_cto` | CTO |
| `manage_approve_leaves_owners` | Owners |
