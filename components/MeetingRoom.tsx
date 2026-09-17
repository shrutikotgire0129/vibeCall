"use client";
import { useState } from "react";
import {
  CallControls,
  CallParticipantsList,
  CallStatsButton,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
  useCall,
} from "@stream-io/video-react-sdk";
import { useRouter, useSearchParams } from "next/navigation";
import { Users, LayoutList, Share2, MessageSquare } from "lucide-react";
import MeetingChat from "./MeetingChat";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import Loader from "./Loader";
import EndCallButton from "./EndCallButton";
import { cn } from "@/lib/utils";
import MeetingLobby from "./MeetingLobby";

type CallLayoutType = "grid" | "speaker-left" | "speaker-right";

const MeetingRoom = ({ isHost }: { isHost: boolean }) => {
  const call = useCall();
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  if (!call) {
    return null;
  }
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get("personal");
  const router = useRouter();
  const [layout, setLayout] = useState<CallLayoutType>("speaker-left");
  const [showParticipants, setShowParticipants] = useState(false);
  const { useCallCallingState, useOwnCapabilities } = useCallStateHooks();
  const [showChat, setShowChat] = useState(false);

  // for more detail about types of CallingState see: https://getstream.io/video/docs/react/ui-cookbook/ringing-call/#incoming-call-panel
  const callingState = useCallCallingState();
  const ownCapabilities = useOwnCapabilities();
  const canUpdateCallPermissions =
    ownCapabilities?.includes("update-call-permissions") ?? false;

  console.log({
    isHost,
    ownCapabilities,
    canUpdateCallPermissions,
  });

  if (callingState !== CallingState.JOINED) return <Loader />;

  const CallLayout = () => {
    switch (layout) {
      case "grid":
        return <PaginatedGridLayout />;
      case "speaker-right":
        return <SpeakerLayout participantsBarPosition="left" />;
      default:
        return <SpeakerLayout participantsBarPosition="right" />;
    }
  };

  const handleShareMeeting = async () => {
    const meetingUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Join my meeting",
          text: "Join my VibeCall meeting",
          url: meetingUrl,
        });
      } else {
        await navigator.clipboard.writeText(meetingUrl);
        alert("Meeting link copied!");
      }
    } catch (error) {
      console.error("Failed to share meeting:", error);
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden pt-4 text-white">
      <div className="absolute left-5 top-5 z-20 rounded-full bg-dark-1 px-4 py-2 text-sm font-medium text-white shadow-lg">
        {participants.length}{" "}
        {participants.length === 1 ? "Participant" : "Participants"}
      </div>
      <div className="relative flex size-full items-center justify-center">
        <div className=" flex size-full max-w-[1000px] items-center">
          <CallLayout />
        </div>
        <div
          className={cn("h-[calc(100vh-86px)] hidden ml-2", {
            "show-block": showParticipants,
          })}
        >
          <CallParticipantsList onClose={() => setShowParticipants(false)} />
        </div>
        {showChat && (
          <div className="absolute right-5 top-20 z-30 h-[calc(100vh-140px)] w-[350px] overflow-hidden rounded-2xl bg-dark-1 shadow-2xl">
            <MeetingChat callId={call.id} onClose={() => setShowChat(false)} />
          </div>
        )}
      </div>
      {/* video layout and call controls */}
      <div className="fixed bottom-0 flex w-full items-center justify-center gap-5">
        <CallControls onLeave={() => router.push(`/`)} />

        <DropdownMenu>
          <div className="flex items-center">
            <DropdownMenuTrigger className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]  ">
              <LayoutList size={20} className="text-white" />
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent className="border-dark-1 bg-dark-1 text-white">
            {["Grid", "Speaker-Left", "Speaker-Right"].map((item, index) => (
              <div key={index}>
                <DropdownMenuItem
                  onClick={() =>
                    setLayout(item.toLowerCase() as CallLayoutType)
                  }
                >
                  {item}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-dark-1" />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <CallStatsButton />
        <button
          onClick={handleShareMeeting}
          className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]"
          title="Share meeting"
        >
          <Share2 size={20} className="text-white" />
        </button>
        <button onClick={() => setShowParticipants((prev) => !prev)}>
          <div className=" cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]  ">
            <Users size={20} className="text-white" />
          </div>
        </button>
        <button onClick={() => setShowChat((prev) => !prev)}>
          <div className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
            <MessageSquare size={20} className="text-white" />
          </div>
        </button>
        {!isPersonalRoom && <EndCallButton />}
      </div>
      {isHost && <MeetingLobby callId={call.id} />}
    </section>
  );
};

export default MeetingRoom;
