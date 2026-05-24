<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interview_evaluations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('interview_id');
            $table->unsignedBigInteger('evaluator_id');
            $table->decimal('technical_score', 3, 1)->nullable();
            $table->decimal('communication_score', 3, 1)->nullable();
            $table->decimal('attitude_score', 3, 1)->nullable();
            $table->decimal('overall_score', 3, 1)->nullable();
            $table->text('strengths')->nullable();
            $table->text('weaknesses')->nullable();
            $table->text('recommendation')->nullable();
            $table->enum('result', ['pass', 'fail', 'consider'])->nullable();
            $table->timestamps();

            $table->unique(['interview_id', 'evaluator_id']);
            $table->foreign('interview_id')->references('id')->on('interviews')->cascadeOnDelete();
            $table->foreign('evaluator_id')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interview_evaluations');
    }
};
