<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'application_id', 'to_email', 'to_name', 'subject', 'body',
        'template_code', 'status', 'error_message', 'sent_by',
    ];

    protected $casts = ['sent_at' => 'datetime'];

    public function application()
    {
        return $this->belongsTo(Application::class);
    }
}
