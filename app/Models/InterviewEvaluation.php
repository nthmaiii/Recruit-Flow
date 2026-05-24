<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InterviewEvaluation extends Model
{
    public $timestamps = false;
    const CREATED_AT = 'evaluated_at';

    protected $fillable = [
        'interview_id', 'technical_score', 'soft_score',
        'comment', 'recommendation', 'evaluated_by',
    ];

    protected $casts = [
        'technical_score' => 'integer',
        'soft_score' => 'integer',
        'evaluated_at' => 'datetime',
    ];

    public function interview()
    {
        return $this->belongsTo(Interview::class);
    }

    public function evaluator()
    {
        return $this->belongsTo(User::class, 'evaluated_by');
    }

    public function getAverageScoreAttribute(): float
    {
        return round(($this->technical_score + $this->soft_score) / 2, 1);
    }
}
