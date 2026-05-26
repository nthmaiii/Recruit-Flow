<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    const STATUS_NEW = 'new';
    const STATUS_REVIEWING = 'reviewing';
    const STATUS_INTERVIEW_SCHEDULED = 'interview_scheduled';
    const STATUS_INTERVIEWED = 'interviewed';
    const STATUS_OFFER_SENT = 'offer_sent';
    const STATUS_HIRED = 'hired';
    const STATUS_REJECTED = 'rejected';

    // role => [allowed transitions from status]
    const TRANSITIONS = [
        User::ROLE_HR => [
            self::STATUS_NEW => [self::STATUS_REVIEWING, self::STATUS_REJECTED],
            self::STATUS_REVIEWING => [self::STATUS_INTERVIEW_SCHEDULED, self::STATUS_REJECTED],
            self::STATUS_INTERVIEWED => [self::STATUS_HIRED, self::STATUS_REJECTED],
        ],
        User::ROLE_HM => [
            self::STATUS_REVIEWING => [self::STATUS_INTERVIEW_SCHEDULED, self::STATUS_REJECTED],
            self::STATUS_INTERVIEW_SCHEDULED => [self::STATUS_INTERVIEWED],
            self::STATUS_INTERVIEWED => [self::STATUS_HIRED, self::STATUS_REJECTED],
        ],
        User::ROLE_SA => [
            self::STATUS_NEW => [self::STATUS_REVIEWING, self::STATUS_REJECTED],
            self::STATUS_REVIEWING => [self::STATUS_INTERVIEW_SCHEDULED, self::STATUS_REJECTED],
            self::STATUS_INTERVIEW_SCHEDULED => [self::STATUS_INTERVIEWED],
            self::STATUS_INTERVIEWED => [self::STATUS_HIRED, self::STATUS_REJECTED],
        ],
    ];

    protected $fillable = [
        'job_id', 'candidate_id', 'status', 'cv_path', 'cv_original_name',
        'cover_letter', 'rating', 'assigned_to', 'rejection_reason',
        'ai_score', 'ai_evaluation', 'ai_evaluated_at',
    ];

    protected $casts = [
        'rating'        => 'decimal:1',
        'ai_evaluation' => 'array',
    ];

    public function job()
    {
        return $this->belongsTo(Job::class);
    }

    public function candidate()
    {
        return $this->belongsTo(Candidate::class);
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function statusHistory()
    {
        return $this->hasMany(ApplicationStatusHistory::class)->orderBy('created_at', 'desc');
    }

    public function interviews()
    {
        return $this->hasMany(Interview::class)->orderBy('scheduled_at', 'desc');
    }

    public function notes()
    {
        return $this->hasMany(ApplicationNote::class)->orderBy('created_at', 'desc');
    }

    public function canTransitionTo(string $newStatus, string $role): bool
    {
        $allowed = self::TRANSITIONS[$role][$this->status] ?? [];
        return in_array($newStatus, $allowed);
    }

    public function recalculateRating(): void
    {
        $avg = $this->interviews()
            ->join('interview_evaluations', 'interviews.id', '=', 'interview_evaluations.interview_id')
            ->avg('interview_evaluations.overall_score');

        if ($avg !== null) {
            $this->update(['rating' => round($avg, 1)]);
        }
    }
}
