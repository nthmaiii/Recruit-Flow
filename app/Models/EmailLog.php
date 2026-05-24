<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailLog extends Model
{
    public $timestamps = false;
    const CREATED_AT = 'sent_at';

    protected $fillable = [
        'application_id', 'candidate_email', 'template_type', 'subject',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    public function application()
    {
        return $this->belongsTo(Application::class);
    }
}
