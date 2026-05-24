<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Interview extends Model
{
    use HasFactory;

    public $timestamps = false;
    const CREATED_AT = 'created_at';

    protected $fillable = [
        'application_id', 'round', 'interviewer_id',
        'scheduled_at', 'duration_minutes', 'location',
        'meeting_link', 'confirmation_token', 'confirmed_at',
        'status', 'created_by',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($interview) {
            $interview->confirmation_token = Str::random(64);
        });
    }

    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    public function interviewer()
    {
        return $this->belongsTo(User::class, 'interviewer_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function evaluation()
    {
        return $this->hasOne(InterviewEvaluation::class);
    }
}
