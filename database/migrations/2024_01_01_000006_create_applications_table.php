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
            $table->string('cv_path', 500);
            $table->text('cover_letter')->nullable();
            $table->enum('status', [
                'new', 'viewed', 'interview_scheduled',
                'interviewed', 'offer', 'hired', 'rejected'
            ])->default('new');
            $table->decimal('rating_avg', 2, 1)->nullable();
            $table->json('tags')->nullable();
            $table->timestamp('applied_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();

            $table->foreign('job_id')->references('id')->on('jobs')->onDelete('cascade');
            $table->foreign('candidate_id')->references('id')->on('candidates')->onDelete('cascade');

            $table->unique(['job_id', 'candidate_id']);
            $table->index(['job_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
