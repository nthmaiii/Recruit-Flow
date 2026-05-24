# RecruitFlow – Hệ thống quản lý tuyển dụng

## Tổng quan
Web application đơn tenant, quản lý toàn bộ vòng đời tuyển dụng.

**Stack:** Laravel 10 (PHP 8.1+) + React 18 + Vite + MySQL 8 + Redis + Pusher

## Cài đặt nhanh

```bash
# 1. Cài dependencies
composer install
npm install

# 2. Cấu hình env
cp .env.example .env
php artisan key:generate

# 3. Điền vào .env: DB_*, MAIL_*, PUSHER_*

# 4. Migrate + Seed
php artisan migrate --seed

# 5. Storage symlink
php artisan storage:link

# 6. Chạy dev server
php artisan serve       # http://localhost:8000
npm run dev             # http://localhost:5173
```

## Tài khoản mặc định (sau khi seed)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@recruitflow.com | Admin@123 |
| HR | hr1@recruitflow.com | HR@123456 |
| Hiring Manager IT | hm.it@recruitflow.com | HM@123456 |
| Hiring Manager Sales | hm.sales@recruitflow.com | HM@123456 |

## Cấu trúc thư mục

```
app/
├── Http/Controllers/Api/     # API controllers (JSON responses)
│   └── Admin/                # Admin-only controllers
├── Http/Middleware/
│   ├── CheckRole.php          # role:SA,HR,HM - kiểm tra vai trò
│   └── CheckDepartmentAccess.php  # HM chỉ được xem dept của mình
├── Models/                   # Eloquent models
├── Services/
│   ├── ApplicationService.php  # Logic chuyển trạng thái
│   ├── InterviewService.php    # Schedule + evaluate
│   └── EmailService.php        # Build variables, render template
├── Jobs/
│   ├── SendEmailJob.php        # Gửi email đơn (queue)
│   ├── SendBulkEmailJob.php    # Gửi hàng loạt
│   └── SendInterviewReminderJob.php  # Nhắc nhở tự động
├── Events/                   # Pusher broadcast events
└── Exports/                  # Laravel Excel exports

database/
├── migrations/               # 14 migration files (thứ tự quan trọng)
└── seeders/

resources/js/
├── AppRouter.jsx             # React Router config
├── pages/                   # Page components
│   ├── Login.jsx
│   ├── Dashboard/           # HRDashboard, HMDashboard
│   ├── Jobs/                # JobList, JobForm, JobDetail
│   ├── Applications/        # ApplicationList, ApplicationDetail, ScheduleInterviewModal
│   ├── Public/              # ApplyForm (public)
│   ├── Candidate/           # CandidatePortal
│   ├── Admin/               # UserManagement, DepartmentManagement, EmailTemplates
│   └── Reports/             # Reports page
├── components/
│   ├── Layout/              # AppLayout, Sidebar, Header, NotificationDropdown
│   └── Common/              # StatusBadge, Modal
├── hooks/
│   ├── useAuth.js           # Wrapper cho authStore
│   └── useNotifications.js  # Pusher + API notifications
├── stores/
│   └── authStore.js         # Zustand auth state
└── utils/
    ├── api.js               # Axios instance với interceptors
    └── constants.js         # STATUS_LABELS, COLORS, etc.
```

## Roles & Permissions

| Role | Code | Quyền |
|------|------|-------|
| Super Admin | SA | Toàn quyền |
| Nhân sự | HR | CRUD Jobs, quản lý hồ sơ, gửi email |
| Hiring Manager | HM | Xem + đánh giá hồ sơ bộ phận mình |
| Ứng viên | CANDIDATE | Xem đơn đã nộp, xác nhận phỏng vấn |

## Workflow trạng thái hồ sơ

```
new → viewed → interview_scheduled → interviewed → offer → hired
         ↘                        ↘             ↘       ↘
                              rejected ←←←←←←←←←←←←←←←←←←←
```

- **HR** chuyển: new→viewed, viewed→interview_scheduled, interviewed→offer, offer→hired, bất kỳ→rejected
- **HM** chuyển: interview_scheduled→interviewed, interviewed→offer/rejected

## Queue & Cron

```bash
# Chạy queue worker (cần thiết để gửi email)
php artisan queue:work

# Hoặc dùng Horizon
php artisan horizon

# Cron (thêm vào crontab)
* * * * * cd /path/to/project && php artisan schedule:run >> /dev/null 2>&1
```

Schedule tasks (app/Console/Kernel.php):
- `hourly`: Gửi reminder cho phỏng vấn trong 1 giờ tới

## API Base URL

Tất cả API: `GET/POST/PUT/DELETE /api/v1/...`
Auth: `Authorization: Bearer {token}`

## Email Templates

4 loại template (quản lý tại Admin > Template Email):
- `cv_received` – Xác nhận nhận hồ sơ
- `interview_invitation` – Mời phỏng vấn (có link xác nhận)
- `rejection` – Thông báo từ chối
- `offer_letter` – Thư offer

Biến hỗ trợ: `{{candidate_name}}`, `{{job_title}}`, `{{interview_date}}`, `{{interview_link}}`, `{{company_name}}`, `{{confirmation_link}}`

## Real-time (Pusher)

Cần cấu hình `PUSHER_*` trong `.env`. Channels:
- `hr-notifications` (public channel): new_application, status_changed
- `private-user.{id}`: interview_confirmed, personal notifications

## Build production

```bash
npm run build
php artisan optimize
php artisan config:cache
php artisan route:cache
```

## Lưu ý quan trọng

1. **Migration thứ tự**: departments → users → departments_fk → jobs → candidates → applications → ...
2. **Windows**: `app.jsx` và `App.jsx` là cùng file. AppRouter được export từ `AppRouter.jsx`
3. **CV upload**: Lưu tại `storage/app/cvs/{job_id}/`. Cần `php artisan storage:link` để truy cập public
4. **HM restriction**: Middleware `CheckDepartmentAccess` chạy sau `auth:sanctum`
5. **Soft delete Jobs**: Dùng `SoftDeletes` trait, thêm `deleted_at` column tự động
