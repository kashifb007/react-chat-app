import type { Chat } from '@/types/chat';

type RecipientProps = {
    chat: Chat;
    initials: string;
    isActive: boolean;
    onClick: () => void;
};

export default function Recipient({ chat, initials, isActive, onClick }: RecipientProps) {
    return (
        <button
            key={chat.user_id}
            onClick={onClick}
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
}
