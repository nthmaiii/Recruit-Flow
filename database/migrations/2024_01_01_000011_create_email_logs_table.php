<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('application_id')->nullable();
            $table->string('candidate_email');
            $table->string('template_type', 50)->nullable();
            $table->string('subject')->nullable();
            $table->timestamp('sent_at')->useCurrent();

            $table->foreign('application_id')->references('id')->on('applications')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_logs');
    }
};
