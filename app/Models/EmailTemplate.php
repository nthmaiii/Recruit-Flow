<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    public $timestamps = false;
    const UPDATED_AT = 'updated_at';

    protected $fillable = ['type', 'subject', 'body_html', 'updated_by'];

    protected $casts = [
        'updated_at' => 'datetime',
    ];

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function render(array $variables): string
    {
        $body = $this->body_html;
        foreach ($variables as $key => $value) {
            $body = str_replace('{{' . $key . '}}', $value, $body);
        }
        return $body;
    }
}
