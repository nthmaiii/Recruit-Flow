<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'phone', 'role',
        'department_id', 'is_active', 'must_change_password',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
        'must_change_password' => 'boolean',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function candidate()
    {
        return $this->hasOne(Candidate::class);
    }

    public function managedDepartments()
    {
        return $this->hasMany(Department::class, 'manager_id');
    }

    public function createdJobs()
    {
        return $this->hasMany(Job::class, 'created_by');
    }

    public function interviews()
    {
        return $this->hasMany(Interview::class, 'interviewer_id');
    }

    public function notifications()
    {
        return $this->hasMany(AppNotification::class);
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'SA';
    }

    public function isHR(): bool
    {
        return in_array($this->role, ['SA', 'HR']);
    }

    public function isHM(): bool
    {
        return $this->role === 'HM';
    }

    public function isCandidate(): bool
    {
        return $this->role === 'CANDIDATE';
    }
}
