<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interviews', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('application_id');
            $table->tinyInteger('round')->default(1);
            $table->unsignedBigInteger('interviewer_id');
            $table->dateTime('scheduled_at');
            $table->integer('duration_minutes')->default(60);
            $table->string('location')->nullable();
            $table->string('meeting_link', 500)->nullable();
            $table->string('confirmation_token', 100)->nullable()->unique();
            $table->timestamp('confirmed_at')->nullable();
            $table->enum('status', ['scheduled', 'confirmed', 'completed', 'cancelled'])->default('scheduled');
            $table->unsignedBigInteger('created_by');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('application_id')->references('id')->on('applications')->onDelete('cascade');
            $table->foreign('interviewer_id')->references('id')->on('users');
            $table->foreign('created_by')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interviews');
    }
};
