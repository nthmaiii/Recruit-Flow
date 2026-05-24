<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Job extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title', 'slug', 'department_id', 'quantity', 'description',
        'requirements', 'location', 'salary_range', 'deadline',
        'status', 'created_by',
    ];

    protected $casts = [
        'deadline' => 'date',
        'quantity' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($job) {
            if (empty($job->slug)) {
                $job->slug = static::generateSlug($job->title);
            }
        });

        static::updating(function ($job) {
            if ($job->isDirty('status') && $job->status === 'published' && empty($job->slug)) {
                $job->slug = static::generateSlug($job->title);
            }
        });
    }

    public static function generateSlug(string $title): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $count = 1;
        while (static::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $count++;
        }
        return $slug;
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    public function hasApplications(): bool
    {
        return $this->applications()->exists();
    }

    public function getApplyUrlAttribute(): string
    {
        return url('/jobs/' . $this->slug . '/apply');
    }
}
