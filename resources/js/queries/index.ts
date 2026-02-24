export async function fetchChatId(csrfToken: string, chat: { user_id: number }) {
    const response = await fetch('/user_selected', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': csrfToken,
            Accept: 'application/json',
        },
        body: JSON.stringify({ user_id: chat.user_id }),
    });

    if (!response.ok) {
        throw await response.json();
    }

    return await response.json();
}

export async function postMessage(
    csrfToken: string,
    chatId: number,
    selectedRecipient: React.RefObject<{
        userId: number | null;
        name: string | null;
        initials: string | null;
    }>,
    messageText: string,
) {
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

    if (!response.ok) {
        throw await response.json();
    }

    return await response.json();
}
