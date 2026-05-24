# RecruitFlow

Hệ thống quản lý tuyển dụng nội bộ.

## Cấu trúc dự án

```
recruitflow/
├── backend/     # Laravel 10 API
└── frontend/    # React 18 + Vite
```

## Cài đặt Backend (Laravel)

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

## Cài đặt Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

## Tài khoản mặc định (sau khi seed)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@recruitflow.local | password |
| HR Manager | hr@recruitflow.local | password |
| HR Staff | hr2@recruitflow.local | password |
| Hiring Manager | hm@recruitflow.local | password |
| Hiring Manager 2 | hm2@recruitflow.local | password |

## URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/v1
- Public apply form: http://localhost:5173/jobs/{slug}/apply
- Candidate portal: http://localhost:5173/my-applications
- Laravel Horizon: http://localhost:8000/horizon

## Queue (Redis required)

```bash
php artisan horizon
```

## Cron (Interview Reminders)

```bash
php artisan schedule:run
```
