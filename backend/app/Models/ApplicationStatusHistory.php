<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApplicationStatusHistory extends Model
{
    public $timestamps = false;

    protected $table = 'application_status_history';

    protected $fillable = ['application_id', 'from_status', 'to_status', 'changed_by', 'note'];

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
