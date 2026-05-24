<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Candidate extends Model
{
    protected $fillable = [
        'full_name', 'email', 'phone', 'dob', 'address',
        'linkedin_url', 'portfolio_url', 'summary',
    ];

    protected $casts = [
        'dob' => 'date',
    ];

    public function applications()
    {
        return $this->hasMany(Application::class);
    }
}
