<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->tinyInteger('ai_score')->unsigned()->nullable()->after('rating');
            $table->json('ai_evaluation')->nullable()->after('ai_score');
            $table->timestamp('ai_evaluated_at')->nullable()->after('ai_evaluation');
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn(['ai_score', 'ai_evaluation', 'ai_evaluated_at']);
        });
    }
};
