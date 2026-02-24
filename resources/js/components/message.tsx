import type { Message } from '@/types/message';

type MessageProps = {
    msg: Message;
    myMessage: boolean;
};

export default function MessageItem({ msg, myMessage }: MessageProps) {
    return (
        <div className={`flex ${myMessage ? 'justify-end' : 'justify-start'}`}>
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
}
