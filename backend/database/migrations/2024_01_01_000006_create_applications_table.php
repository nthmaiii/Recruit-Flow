<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('job_id');
            $table->unsignedBigInteger('candidate_id');
            $table->enum('status', [
                'new', 'reviewing', 'interview_scheduled',
                'interviewed', 'offer_sent', 'hired', 'rejected'
            ])->default('new');
            $table->string('cv_path');
            $table->string('cv_original_name');
            $table->text('cover_letter')->nullable();
            $table->decimal('rating', 3, 1)->nullable();
            $table->unsignedBigInteger('assigned_to')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->unique(['job_id', 'candidate_id']);
            $table->foreign('job_id')->references('id')->on('jobs');
            $table->foreign('candidate_id')->references('id')->on('candidates');
            $table->foreign('assigned_to')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
