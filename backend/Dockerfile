FROM php:8.2-cli-alpine

RUN apk add --no-cache \
    libpq-dev \
    libzip-dev \
    oniguruma-dev \
    curl \
    && docker-php-ext-install \
        pdo pdo_pgsql pdo_mysql \
        zip bcmath mbstring opcache

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www
COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction \
    && chmod +x start.sh \
    && mkdir -p storage/logs storage/framework/cache/data \
                storage/framework/sessions storage/framework/views \
                storage/app/public \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8000
CMD ["bash", "start.sh"]
