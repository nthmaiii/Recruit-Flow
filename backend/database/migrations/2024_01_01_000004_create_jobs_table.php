<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->unsignedBigInteger('department_id');
            $table->unsignedBigInteger('created_by');
            $table->text('description');
            $table->text('requirements');
            $table->text('benefits')->nullable();
            $table->string('location');
            $table->enum('type', ['full_time', 'part_time', 'contract', 'internship']);
            $table->enum('level', ['intern', 'junior', 'mid', 'senior', 'lead', 'manager']);
            $table->decimal('salary_min', 15, 2)->nullable();
            $table->decimal('salary_max', 15, 2)->nullable();
            $table->enum('status', ['draft', 'published', 'closed'])->default('draft');
            $table->date('deadline')->nullable();
            $table->integer('vacancies')->default(1);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('department_id')->references('id')->on('departments');
            $table->foreign('created_by')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jobs');
    }
};
