import { Head, router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { useEffect, useRef, useState } from 'react';
import { useInitials } from '@/hooks/use-initials';
import AppLayout from '@/layouts/app-layout';
import type { Auth } from '@/types/auth';
import type { Chat } from '@/types/chat';
import type { Message } from '@/types/message';

type PageProps = {
    auth: Auth;
    chats: Chat[];
    messages: Message[] | null;
    recipient: Chat | null; // for 'messages.chat-id' route
};

export default function Messages() {
    const { auth, chats, messages, recipient } = usePage<PageProps>().props;
    const getInitials = useInitials();

    // store the selected chat ID, initially null
    const [chatId, setChatId] = useState<number | null>(null);

    // set recipient highlight and the chat header, initially null
    const [recipientUserId, setRecipientUserId] = useState<number | null>(null);
    const [recipientName, setRecipientName] = useState<string | null>(null);
    const [recipientInitials, setRecipientInitials] = useState<string | null>(
        null,
    );

    // messages list
    const [messagesList, setMessages] = useState<Message[]>(messages ?? []);

    // message text box
    const [messageText, setMessageText] = useState('');

    // useRef holds the latest recipient
    const selectedRecipient = useRef<{
        userId: number | null;
        name: string | null;
        initials: string | null;
    }>({ userId: null, name: null, initials: null });

    // called on chat load and pusher event.
    function fetchMessages() {
        // only run when on /messages/{chat_id}
        const chatIdInt = parseInt(
            window.location.pathname.split('/').pop() ?? '',
        );
        // not a number
        if (isNaN(chatIdInt)) return;

        router.reload({ only: ['messages'] });
    }

    // watch 'messages' prop, refresh messages
    useEffect(() => {
        setMessages(messages ?? []);
    }, [messages]);

    // when 'messages.chat-id' loads it returns 'recipient' prop.
    useEffect(() => {
        if (!recipient) return;

        // get chat_id from URL: /messages/{chat_id}
        const chatIdInt = parseInt(
            window.location.pathname.split('/').pop() ?? '',
        );
        if (!isNaN(chatIdInt)) setChatId(chatIdInt);

        const initials = getInitials(recipient.name);
        setRecipientUserId(recipient.user_id);
        setRecipientName(recipient.name);
        setRecipientInitials(initials);
        selectedRecipient.current = {
            userId: recipient.user_id,
            name: recipient.name,
            initials,
        };

        // Load messages for this chat
        fetchMessages();
    }, [recipient]);

    // recipient clicked
    async function handleSelectUser(chat: Chat) {
        const initials = getInitials(chat.name);

        // update selected recipient
        setRecipientUserId(chat.user_id);
        setRecipientName(chat.name);
        setRecipientInitials(initials);
        selectedRecipient.current = {
            userId: chat.user_id,
            name: chat.name,
            initials,
        };

        // security
        const csrfToken = decodeURIComponent(
            document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
        );

        // POST to 'user-selected' route to retrieve a chat ID
        const response = await fetch('/user_selected', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': csrfToken,
                Accept: 'application/json',
            },
            body: JSON.stringify({ user_id: chat.user_id }),
        });

        const data = await response.json();

        // Save chat_id
        setChatId(data.chat_id);

        // chat selected, go to messages URL
        router.visit(`/messages/${data.chat_id}`);
    }

    // Send button clicked
    async function sendMessage() {
        // validation
        if (!chatId || !selectedRecipient.current.userId || !messageText.trim())
            return;

        // security
        const csrfToken = decodeURIComponent(
            document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
        );

        // POST to 'send-message' route
        const response = await fetch('/send_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': csrfToken,
                Accept: 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                recipient_id: selectedRecipient.current.userId,
                message: messageText.trim(),
            }),
        });

        const data = await response.json();

        // reload messages
        setMessages(data.messages);

        // reset input
        setMessageText('');
    }

    // check if a recipient is selected to enable message input and sending
    const hasRecipient = recipientUserId !== null;

    useEcho(`App.Models.User.${auth.user.id}`, 'MessageCreatedEvent', () => {
        // Pusher — reload the messages list
        fetchMessages();
    });

    return (
        <AppLayout>
            <Head title="Messages" />

            <div className="mx-auto flex h-full w-full max-w-7xl overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-700">
                <div className="flex w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                    <div className="border-b border-gray-200 px-4 py-3 dark:border-zinc-700">
                        <h2 className="text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-zinc-400">
                            Chats
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {chats.map((chat) => {
                            const initials = getInitials(chat.name);
                            const isActive = recipientUserId === chat.user_id;
                            return (
                                <button
                                    key={chat.user_id}
                                    onClick={() => handleSelectUser(chat)}
                                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                                        isActive
                                            ? 'bg-gray-100 dark:bg-zinc-800'
                                            : 'hover:bg-gray-50 dark:hover:bg-zinc-800/60'
                                    }`}
                                >
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500">
                                        <span className="text-sm font-semibold text-white">
                                            {initials}
                                        </span>
                                    </div>
                                    <span className="truncate text-sm font-medium text-gray-900 dark:text-zinc-100">
                                        {chat.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col bg-gray-50 dark:bg-zinc-950">
                    <div className="flex h-14 flex-shrink-0 items-center border-b border-gray-200 bg-white px-4 dark:border-zinc-700 dark:bg-zinc-900">
                        {hasRecipient ? (
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500">
                                    <span className="text-xs font-semibold text-white">
                                        {recipientInitials}
                                    </span>
                                </div>
                                <span className="font-medium text-gray-900 dark:text-zinc-100">
                                    {recipientName}
                                </span>
                            </div>
                        ) : (
                            <span className="text-sm text-gray-400 dark:text-zinc-500">
                                Select a conversation
                            </span>
                        )}
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto p-4">
                        {messagesList.map((msg, index) => {
                            const myMessage = auth.user.id === msg.sender_id;
                            return (
                                <div
                                    key={index}
                                    className={`flex ${myMessage ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[60%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                                            myMessage
                                                ? 'rounded-br-sm bg-green-500 text-white'
                                                : 'rounded-bl-sm bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
                                        }`}
                                    >
                                        {msg.message}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
                        <div className="flex items-end gap-3">
                            <textarea
                                rows={1}
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                onKeyDown={(e) => {
                                    // Enter key to submit; Shift+Enter inserts a new line
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                                disabled={!hasRecipient}
                                placeholder={
                                    hasRecipient
                                        ? 'Type a message...'
                                        : 'Select a chat to start messaging'
                                }
                                className="flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!hasRecipient || !messageText.trim()}
                                className="flex-shrink-0 rounded-lg bg-green-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-600 active:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
