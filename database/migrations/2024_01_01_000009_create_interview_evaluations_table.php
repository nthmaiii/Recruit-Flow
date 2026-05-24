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
            $table->tinyInteger('technical_score')->unsigned();
            $table->tinyInteger('soft_score')->unsigned();
            $table->text('comment');
            $table->enum('recommendation', ['pass', 'fail']);
            $table->unsignedBigInteger('evaluated_by');
            $table->timestamp('evaluated_at')->useCurrent();

            $table->foreign('interview_id')->references('id')->on('interviews')->onDelete('cascade');
            $table->foreign('evaluated_by')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interview_evaluations');
    }
};
