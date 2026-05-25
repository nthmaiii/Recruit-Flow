<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Thêm cột nếu chưa tồn tại (có thể đã được thêm bởi migration khác)
        Schema::table('jobs', function (Blueprint $table) {
            if (!Schema::hasColumn('jobs', 'approved_by')) {
                $table->unsignedBigInteger('approved_by')->nullable()->after('created_by');
                $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('jobs', 'approval_note')) {
                $table->text('approval_note')->nullable()->after('approved_by');
            }
        });

        // Mở rộng ENUM status để thêm 'pending_approval'
        DB::statement("ALTER TABLE jobs MODIFY COLUMN status ENUM('draft','pending_approval','published','closed') NOT NULL DEFAULT 'draft'");
    }

    public function down(): void
    {
        DB::statement("UPDATE jobs SET status = 'draft' WHERE status = 'pending_approval'");
        DB::statement("ALTER TABLE jobs MODIFY COLUMN status ENUM('draft','published','closed') NOT NULL DEFAULT 'draft'");
    }
};
