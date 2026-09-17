"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  DeviceSettings,
  VideoPreview,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { useUser } from "@clerk/nextjs";

import Alert from "./Alert";
import { Button } from "./ui/button";
import { api } from "@/convex/_generated/api";

const MeetingSetup = ({
  setIsSetupComplete,
  isHost,
}: {
  setIsSetupComplete: (value: boolean) => void;
  isHost: boolean;
}) => {
  const { useCallEndedAt, useCallStartsAt } = useCallStateHooks();
  const callStartsAt = useCallStartsAt();
  const callEndedAt = useCallEndedAt();

  const callTimeNotArrived =
    callStartsAt && new Date(callStartsAt) > new Date();

  const callHasEnded = !!callEndedAt;

  const call = useCall();
  const { user } = useUser();

  const requestToJoin = useMutation(api.meetingLobby.requestToJoin);
  const lobbyStatus = useQuery(
    api.meetingLobby.getMyLobbyStatus,
    user && call
      ? {
          callId: call.id,
          userId: user.id,
        }
      : "skip",
  );

  const [isMicCamToggled, setIsMicCamToggled] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  if (!call) {
    throw new Error(
      "useStreamCall must be used within a StreamCall component.",
    );
  }

  useEffect(() => {
    if (isMicCamToggled) {
      call.camera.disable();
      call.microphone.disable();
    } else {
      call.camera.enable();
      call.microphone.enable();
    }

    return () => {
      call.camera.disable();
      call.microphone.disable();
    };
  }, [isMicCamToggled, call]);

  useEffect(() => {
    if (lobbyStatus?.status === "admitted") {
      call.join();
      setIsSetupComplete(true);
    }
  }, [lobbyStatus, call, setIsSetupComplete]);

  if (callTimeNotArrived)
    return (
      <Alert
        title={`Your Meeting has not started yet. It is scheduled for ${callStartsAt.toLocaleString()}`}
      />
    );

  if (callHasEnded)
    return (
      <Alert
        title="The call has been ended by the host"
        iconUrl="/icons/call-ended.svg"
      />
    );

  const handleJoin = async () => {
    if (!user) return;

    if (isHost) {
      await call.join();
      setIsSetupComplete(true);
      return;
    }

    try {
      setIsRequesting(true);

      await requestToJoin({
        callId: call.id,
        userId: user.id,
        userName: user.fullName || user.username || "Guest",
      });
    } catch (error) {
      console.error("Failed to request to join:", error);
      setIsRequesting(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 text-white">
      <h1 className="text-center text-2xl font-bold">Setup</h1>

      <VideoPreview />

      <div className="flex h-16 items-center justify-center gap-3">
        <label className="flex items-center justify-center gap-2 font-medium">
          <input
            type="checkbox"
            checked={isMicCamToggled}
            onChange={(e) => setIsMicCamToggled(e.target.checked)}
          />
          Join with mic and camera off
        </label>

        <DeviceSettings />
      </div>

      {!lobbyStatus ? (
        <Button
          className="rounded-md bg-green-500 px-4 py-2.5"
          onClick={handleJoin}
          disabled={isRequesting}
        >
          {isRequesting
            ? "Requesting..."
            : isHost
              ? "Join Meeting"
              : "Request to Join"}
        </Button>
      ) : lobbyStatus.status === "waiting" ? (
        <p className="rounded-md bg-yellow-500 px-4 py-2.5 font-medium text-white">
          Waiting for host to admit you...
        </p>
      ) : lobbyStatus.status === "rejected" ? (
        <div className="flex flex-col items-center gap-3">
          <p className="rounded-md bg-red-500 px-4 py-2.5 font-medium text-white">
            Your request to join was rejected.
          </p>

          <Button
            className="rounded-md bg-green-500 px-4 py-2.5"
            onClick={handleJoin}
            disabled={isRequesting}
          >
            {isRequesting ? "Requesting..." : "Request Again"}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default MeetingSetup;
