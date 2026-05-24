<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InterviewEvaluation extends Model
{
    protected $fillable = [
        'interview_id', 'evaluator_id', 'technical_score', 'communication_score',
        'attitude_score', 'overall_score', 'strengths', 'weaknesses',
        'recommendation', 'result',
    ];

    protected $casts = [
        'technical_score' => 'decimal:1',
        'communication_score' => 'decimal:1',
        'attitude_score' => 'decimal:1',
        'overall_score' => 'decimal:1',
    ];

    public function interview()
    {
        return $this->belongsTo(Interview::class);
    }

    public function evaluator()
    {
        return $this->belongsTo(User::class, 'evaluator_id');
    }

    public function getAvgScore(): float
    {
        $scores = array_filter([
            $this->technical_score,
            $this->communication_score,
            $this->attitude_score,
        ]);
        return count($scores) ? round(array_sum($scores) / count($scores), 1) : 0;
    }
}
