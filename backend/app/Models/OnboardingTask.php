<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OnboardingTask extends Model
{
    protected $fillable = [
        'application_id', 'title', 'description', 'category',
        'is_completed', 'completed_at', 'completed_by', 'assigned_to',
        'due_date', 'sort_order',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
        'due_date' => 'date',
    ];

    public function application() { return $this->belongsTo(Application::class); }
    public function completedBy() { return $this->belongsTo(User::class, 'completed_by'); }
    public function assignedTo() { return $this->belongsTo(User::class, 'assigned_to'); }
}
