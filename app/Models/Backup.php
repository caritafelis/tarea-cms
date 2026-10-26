<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Backup extends Model
{
    protected $fillable = ['disk', 'path', 'size_bytes', 'status', 'type'];
}
