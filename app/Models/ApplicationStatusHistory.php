<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApplicationStatusHistory extends Model
{
    public $timestamps = false;
    const CREATED_AT = 'created_at';

    protected $fillable = [
        'application_id', 'from_status', 'to_status',
        'note', 'rejection_reason', 'changed_by',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    public function changedBy()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
