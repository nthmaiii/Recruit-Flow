<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('application_status_history', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('application_id');
            $table->string('from_status', 50)->nullable();
            $table->string('to_status', 50);
            $table->text('note');
            $table->string('rejection_reason', 100)->nullable();
            $table->unsignedBigInteger('changed_by');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('application_id')->references('id')->on('applications')->onDelete('cascade');
            $table->foreign('changed_by')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('application_status_history');
    }
};
