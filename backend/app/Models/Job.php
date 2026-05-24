<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Job extends Model
{
    use SoftDeletes;

    const STATUS_DRAFT = 'draft';
    const STATUS_PENDING_APPROVAL = 'pending_approval';
    const STATUS_PUBLISHED = 'published';
    const STATUS_CLOSED = 'closed';

    protected $fillable = [
        'title', 'slug', 'department_id', 'created_by', 'description',
        'requirements', 'benefits', 'location', 'type', 'level',
        'salary_min', 'salary_max', 'status', 'deadline', 'vacancies',
        'approval_note', 'approved_by',
    ];

    protected $casts = [
        'salary_min' => 'decimal:2',
        'salary_max' => 'decimal:2',
        'deadline' => 'date',
    ];

    public function department() { return $this->belongsTo(Department::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function approvedBy() { return $this->belongsTo(User::class, 'approved_by'); }
    public function applications() { return $this->hasMany(Application::class); }

    public static function generateSlug(string $title): string
    {
        $slug = Str::slug($title);
        $count = static::withTrashed()->where('slug', 'like', "{$slug}%")->count();
        return $count ? "{$slug}-{$count}" : $slug;
    }

    public function getApplicationUrl(): string
    {
        return config('app.frontend_url') . "/jobs/{$this->slug}/apply";
    }

    public function hasApplications(): bool
    {
        return $this->applications()->exists();
    }
}
