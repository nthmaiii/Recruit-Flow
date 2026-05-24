<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Interview extends Model
{
    protected $fillable = [
        'application_id', 'interviewer_id', 'scheduled_at', 'duration_minutes',
        'type', 'location', 'meeting_link', 'status', 'confirmation_token',
        'confirmed_at', 'notes', 'round',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'confirmed_at' => 'datetime',
    ];

    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    public function interviewer()
    {
        return $this->belongsTo(User::class, 'interviewer_id');
    }

    public function evaluations()
    {
        return $this->hasMany(InterviewEvaluation::class);
    }

    public static function generateToken(): string
    {
        return Str::random(64);
    }

    public function getConfirmationUrl(): string
    {
        return config('app.frontend_url') . "/confirm-interview/{$this->confirmation_token}";
    }
}
