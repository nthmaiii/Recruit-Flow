<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    public $timestamps = false;
    const CREATED_AT = 'created_at';

    protected $fillable = ['user_id', 'action', 'details', 'ip_address'];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function record(int $userId, string $action, ?string $details = null, ?string $ip = null): void
    {
        static::create([
            'user_id' => $userId,
            'action' => $action,
            'details' => $details,
            'ip_address' => $ip ?? request()->ip(),
        ]);
    }
}
