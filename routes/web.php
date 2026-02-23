<?php

use App\Http\Controllers\MessageController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('messages', [MessageController::class, 'index'])
        ->name('messages');

    // fetch this route when new message received or sent
    Route::get('messages/{chat_id}', [MessageController::class, 'chatIndex'])
        ->whereNumber('chat_id')
        ->name('messages.chat-id');

    Route::post('user_selected', [MessageController::class, 'userSelected'])
        ->name('user-selected');

    Route::post('send_message', [MessageController::class, 'store'])
        ->name('send-message');
});

require __DIR__.'/settings.php';
