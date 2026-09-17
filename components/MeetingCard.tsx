"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { avatarImages } from "@/constants";
import { useToastManager } from "./ui/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface MeetingCardProps {
  title: string;
  date: string;
  icon: string;
  isPreviousMeeting?: boolean;
  isRecording?: boolean;
  buttonIcon1?: string;
  buttonText?: string;
  handleClick: () => void;
  link: string;

  callId?: string;
  onDelete?: (callId: string) => void;
  onEdit?: (callId: string) => void;
  onView?: (callId: string) => void;
  onCopyId?: (callId: string) => void;
  onScheduleAgain?: (callId: string) => void;
  onShareRecording?: (link: string) => void;
  onAddDescription?: (callId: string) => void;
  description?: string;
}

const MeetingCard = ({
  icon,
  title,
  date,
  isPreviousMeeting,
  isRecording,
  buttonIcon1,
  handleClick,
  link,
  buttonText,
  callId,
  onDelete,
  onEdit,
  onView,
  onCopyId,
  onScheduleAgain,
  onShareRecording,
  onAddDescription,
  description,
}: MeetingCardProps) => {
  const { add } = useToastManager();

  return (
    <section className="flex min-h-[280px] w-full flex-col justify-between rounded-[14px] bg-dark-1 px-5 py-8 xl:max-w-[568px]">
      <article className="flex flex-col gap-5">
        {/* Icon + Three dot menu */}
        <div className="flex items-start justify-between">
          <Image
            src={icon}
            alt="meeting"
            width={28}
            height={28}
            className="h-auto w-6"
          />

          {/* Three dot menu */}
          {callId && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-white hover:bg-dark-3"
              >
                ⋮
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-48 border-dark-3 bg-dark-2 text-white"
              >
                {isRecording ? (
                  <>
                    <DropdownMenuItem
                      className="cursor-pointer focus:bg-dark-3 focus:text-white"
                      onClick={() => onEdit?.(callId)}
                    >
                      Edit Recording
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="cursor-pointer focus:bg-dark-3 focus:text-white"
                      onClick={() => onAddDescription?.(callId)}
                    >
                      Add Description
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="cursor-pointer focus:bg-dark-3 focus:text-white"
                      onClick={() => onShareRecording?.(link)}
                    >
                      Share Recording
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="cursor-pointer text-red-400 focus:bg-dark-3 focus:text-red-400"
                      onClick={() => onDelete?.(callId)}
                    >
                      Delete Recording
                    </DropdownMenuItem>
                  </>
                ) : isPreviousMeeting ? (
                  <>
                    <DropdownMenuItem
                      className="cursor-pointer focus:bg-dark-3 focus:text-white"
                      onClick={() => onView?.(callId)}
                    >
                      View Meeting
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="cursor-pointer focus:bg-dark-3 focus:text-white"
                      onClick={() => onCopyId?.(callId)}
                    >
                      Copy Meeting ID
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="cursor-pointer focus:bg-dark-3 focus:text-white"
                      onClick={() => onScheduleAgain?.(callId)}
                    >
                      Schedule Again
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="cursor-pointer text-red-400 focus:bg-dark-3 focus:text-red-400"
                      onClick={() => onDelete?.(callId)}
                    >
                      Delete Meeting
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem
                      className="cursor-pointer focus:bg-dark-3 focus:text-white"
                      onClick={() => onEdit?.(callId)}
                    >
                      Edit Meeting
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="cursor-pointer text-red-400 focus:bg-dark-3 focus:text-red-400"
                      onClick={() => onDelete?.(callId)}
                    >
                      Delete Meeting
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Meeting title + date */}
        <div className="flex justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="max-w-full truncate text-2xl font-bold">
              {title}
            </h1>

            <p className="text-base font-normal">
              {date}
            </p>
            {description && (
              <p className="line-clamp-2 text-sm text-gray-400">
                {description}
              </p>
            )}
          </div>
        </div>
      </article>

      <article className={cn("relative flex justify-center", {})}>
        {/* Avatar section - kept as it is */}
        <div className="relative flex w-full max-sm:hidden">
          {avatarImages.map((img, index) => (
            <Image
              key={index}
              src={img}
              alt="attendees"
              width={40}
              height={40}
              className={cn("rounded-full", {
                absolute: index > 0,
              })}
              style={{
                top: 0,
                left: index * 28,
              }}
            />
          ))}

          <div className="flex-center absolute left-[136px] size-10 rounded-full border-[5px] border-dark-3 bg-dark-4">
            +5
          </div>
        </div>

        {/* Recording: Play button only */}
        {isRecording ? (
          <div className="flex shrink-0 items-center">
            <Button
              onClick={handleClick}
              className="flex shrink-0 items-center whitespace-nowrap rounded bg-blue-1 px-6"
            >
              {buttonIcon1 && (
                <Image
                  src={buttonIcon1}
                  alt="play"
                  width={15}
                  height={15}
                />
              )}

              &nbsp; {buttonText || "Play"}
            </Button>
          </div>
        ) : (
          /* Upcoming meeting: Start + Copy Link */
          !isPreviousMeeting && (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                onClick={handleClick}
                className="flex shrink-0 items-center whitespace-nowrap rounded bg-blue-1 px-6"
              >
                {buttonIcon1 && (
                  <Image
                    src={buttonIcon1}
                    alt="feature"
                    width={15}
                    height={15}
                  />
                )}

                &nbsp; {buttonText}
              </Button>

              <Button
                onClick={() => {
                  navigator.clipboard.writeText(link);

                  add({
                    title: "Link Copied",
                  });
                }}
                className="flex shrink-0 items-center whitespace-nowrap bg-dark-4 px-6"
              >
                <Image
                  src="/icons/copy.svg"
                  alt="copy"
                  width={20}
                  height={20}
                  className="h-auto w-6"
                />

                &nbsp; Copy Link
              </Button>
            </div>
          )
        )}
      </article>
    </section>
  );
};

export default MeetingCard;