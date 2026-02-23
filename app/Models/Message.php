<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class Message extends Model
{
    protected $guarded = [
        'id',
        'created_at',
        'updated_at',
    ];

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_user_id');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_user_id');
    }

    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class, 'chat_id');
    }

    protected function message(): Attribute
    {
        return Attribute::make(
            get: fn (string $value) => Crypt::decryptString(strip_tags($value)),
            set: fn (string $value) => Crypt::encryptString(strip_tags($value)),
        );
    }
}
