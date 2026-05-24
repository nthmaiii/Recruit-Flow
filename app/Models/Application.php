<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    use HasFactory;

    const UPDATED_AT = 'updated_at';
    const CREATED_AT = 'applied_at';

    protected $fillable = [
        'job_id', 'candidate_id', 'cv_path', 'cover_letter',
        'status', 'rating_avg', 'tags',
    ];

    protected $casts = [
        'tags' => 'array',
        'applied_at' => 'datetime',
        'rating_avg' => 'decimal:1',
    ];

    public const STATUS_TRANSITIONS = [
        'HR' => [
            'new'                  => ['viewed', 'rejected'],
            'viewed'               => ['interview_scheduled', 'rejected'],
            'interview_scheduled'  => ['rejected'],
            'interviewed'          => ['offer', 'rejected'],
            'offer'                => ['hired', 'rejected'],
        ],
        'HM' => [
            'interview_scheduled'  => ['interviewed'],
            'interviewed'          => ['offer', 'rejected'],
        ],
    ];

    public function job()
    {
        return $this->belongsTo(Job::class);
    }

    public function candidate()
    {
        return $this->belongsTo(Candidate::class);
    }

    public function statusHistory()
    {
        return $this->hasMany(ApplicationStatusHistory::class)->orderBy('created_at', 'desc');
    }

    public function interviews()
    {
        return $this->hasMany(Interview::class)->orderBy('round');
    }

    public function latestInterview()
    {
        return $this->hasOne(Interview::class)->latestOfMany('created_at');
    }

    public function canTransitionTo(string $newStatus, string $role): bool
    {
        $allowed = self::STATUS_TRANSITIONS[$role][$this->status] ?? [];
        return in_array($newStatus, $allowed);
    }
}
