<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    const ROLE_SA = 'super_admin';
    const ROLE_HR = 'hr';
    const ROLE_HM = 'hiring_manager';
    const ROLE_CANDIDATE = 'candidate';

    protected $fillable = [
        'name', 'email', 'password', 'role', 'department_id',
        'phone', 'avatar', 'is_active', 'must_change_password',
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

    public function notifications()
    {
        return $this->hasMany(AppNotification::class);
    }

    public function isSuperAdmin(): bool { return $this->role === self::ROLE_SA; }
    public function isHR(): bool { return $this->role === self::ROLE_HR; }
    public function isHM(): bool { return $this->role === self::ROLE_HM; }
    public function isCandidate(): bool { return $this->role === self::ROLE_CANDIDATE; }

    public function isStaff(): bool
    {
        return in_array($this->role, [self::ROLE_SA, self::ROLE_HR, self::ROLE_HM]);
    }
}
