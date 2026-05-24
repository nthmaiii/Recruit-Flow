<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApplicationNote extends Model
{
    protected $fillable = ['application_id', 'user_id', 'content', 'is_private'];

    protected $casts = ['is_private' => 'boolean'];

    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
