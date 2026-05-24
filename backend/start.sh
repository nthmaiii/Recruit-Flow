#!/bin/bash
set -e

# Tạo thư mục storage cần thiết
mkdir -p storage/logs \
         storage/framework/cache/data \
         storage/framework/sessions \
         storage/framework/views \
         storage/app/public

# Quyền truy cập
chmod -R 775 storage bootstrap/cache

# Storage link
php artisan storage:link --force 2>/dev/null || true

# Cache config/route/view
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Chạy migration tự động
php artisan migrate --force

# Chạy queue worker nền (gửi email)
php artisan queue:work --sleep=3 --tries=3 --max-time=3600 &

# Khởi động web server
echo "Starting server on port ${PORT:-8000}..."
php -S 0.0.0.0:${PORT:-8000} -t public
