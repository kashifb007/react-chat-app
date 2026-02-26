<?php

namespace App\Http\Controllers;

use App\Events\MessageCreatedEvent;
use App\Http\Requests\MessageRequest;
use App\Http\Requests\UserRequest;
use App\Http\Resources\MessageResource;
use App\Http\Resources\UserResource;
use App\Models\Chat;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class MessageController extends Controller
{
    /**
     * @return \Inertia\Response
     * Initial list of recipients in left column.
     */
    public function index()
    {
        $users = User::query()->where('id', '!=', auth()->id())->get();

        return Inertia::render('messages',
            [
                'chats' => UserResource::collection($users)->resolve(),
                'messages' => null,
            ]
        );
    }

    /**
     * @return \Illuminate\Http\JsonResponse
     * Receive a user ID and return the chat ID for that user and the authenticated user.
     * If no chat exists, create one and return the ID.
     */
    public function userSelected(UserRequest $request)
    {
        $chat = Chat::firstWhere([
            'sender_user_id' => auth()->id(),
            'recipient_user_id' => $request->user_id,
        ]);
        if (! $chat) {
            $chat = Chat::firstWhere([
                'sender_user_id' => $request->user_id,
                'recipient_user_id' => auth()->id(),
            ]);
        }
        if (! $chat) {
            $chat = Chat::create([
                'sender_user_id' => auth()->id(),
                'recipient_user_id' => $request->user_id,
            ]);
        }

        return response()->json(['chat_id' => $chat->id]);
    }

    /**
     * @return \Illuminate\Http\RedirectResponse|\Inertia\Response
     * Once a chat url is hit, return the messages.
     */
    public function chatIndex(Request $request, int $chatId)
    {
        $users = User::query()->where('id', '!=', auth()->id())->get();

        // basic validation to confirm the user is authorized to access the chat
        $chat = Chat::firstWhere([
            'id' => $chatId,
            'sender_user_id' => auth()->id(),
        ]);
        if (! $chat) {
            $chat = Chat::firstWhere([
                'id' => $chatId,
                'recipient_user_id' => auth()->id(),
            ]);
        }

        if (! $chat) {
            Log::error("Chat with id = $chatId not found for user id = ".auth()->id());

            return redirect()->route('messages');
        }

        if ($chat->sender_user_id === auth()->id()) {
            $sender = User::find($chat->recipient_user_id);
        } else {
            $sender = User::find($chat->sender_user_id);
        }

        return Inertia::render('messages',
            [
                'chats' => UserResource::collection($users)->resolve(),
                'messages' => MessageResource::collection($chat->messages()->get())->resolve(),
                'recipient' => UserResource::make($sender)->resolve(),
            ]
        );
    }

    /**
     * @return \Illuminate\Http\JsonResponse
     * Store the message and broadcast to Pusher.
     */
    public function store(MessageRequest $request)
    {
        try {
            $message = Message::create([
                'chat_id' => $request->chat_id,
                'sender_user_id' => auth()->id(),
                'recipient_user_id' => $request->recipient_id,
                'message' => $request->message,
            ]);

            broadcast(new MessageCreatedEvent($message))->toOthers();
        } catch (\Exception $e) {
            Log::error("Error creating message for chat id = $request->chat_id", [$e->getMessage()]);
        }

        $chat = Chat::find($request->chat_id);
        $messages = MessageResource::collection($chat->messages()->get())->resolve();

        // return json array of chat messages to update the chat in real time with status 200
        return response()->json(['messages' => $messages]);
    }
}
