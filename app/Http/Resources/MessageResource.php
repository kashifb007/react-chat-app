<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public static $wrap = null;

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'sender_id' => $this->sender_user_id,
            'recipient_id' => $this->recipient_user_id,
            'message' => $this->message,
            'created_at' => $this->created_at,
        ];
    }
}
