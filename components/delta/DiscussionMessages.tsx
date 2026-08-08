import type { ComprehensionContextInput } from "@/types/comprehension";
import type { Message } from "@/types/discussion";
import { MessageSpeaker } from "./MessageSpeaker";
import { ReplyBar } from "./ReplyBar";

export function DiscussionMessages({
  messages,
  onReply,
  context,
}: {
  messages: Message[];
  onReply: (text: string) => void;
  context?: ComprehensionContextInput;
}) {
  return (
    <div className="px-5 py-4">
      <div className="space-y-5">
        {messages.map((message) => (
          <article key={message.id}>
            <div className="flex min-w-0 items-center gap-2 text-[12px]">
              <MessageSpeaker
                author={message.author}
                role={message.role}
              />
              <span className="shrink-0 text-text-tertiary">{message.time}</span>
            </div>
            <p className="mt-2 text-[14px] leading-6 text-text-secondary">{message.text}</p>
          </article>
        ))}
      </div>

      <div className="mt-4">
        <ReplyBar
          onSubmit={onReply}
          variant="inline"
          context={context}
        />
      </div>
    </div>
  );
}
