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
            $table->integer('quantity')->default(1);
            $table->text('description');
            $table->text('requirements');
            $table->string('location')->default('Van phong HCM');
            $table->string('salary_range', 100)->nullable();
            $table->date('deadline');
            $table->enum('status', ['draft', 'published', 'closed'])->default('draft');
            $table->unsignedBigInteger('created_by');
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
