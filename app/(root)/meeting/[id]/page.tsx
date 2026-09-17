"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import { useParams } from "next/navigation";
import { Loader } from "lucide-react";
import { useGetCallById } from "@/hooks/useGetCallById";
import Alert from "@/components/Alert";
import MeetingSetup from "@/components/MeetingSetup";
import MeetingRoom from "@/components/MeetingRoom";
import { verifyMeetingPasscode } from "@/actions/stream.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MeetingPage = () => {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { isLoaded, user } = useUser();
  const { call, isCallLoading } = useGetCallById(id);

  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [isPasscodeVerified, setIsPasscodeVerified] = useState(false);
  const [isVerifyingPasscode, setIsVerifyingPasscode] = useState(false);
  const [passcodeError, setPasscodeError] = useState("");

  const handleVerifyPasscode = async () => {
    if (!passcode.trim()) {
      setPasscodeError("Please enter the meeting passcode");
      return;
    }

    try {
      setIsVerifyingPasscode(true);
      setPasscodeError("");

      const result = await verifyMeetingPasscode(id, passcode);

      if (!result.success) {
        setPasscodeError("Incorrect meeting passcode");
        return;
      }

      setIsPasscodeVerified(true);
    } catch (error) {
      console.error("Passcode verification failed:", error);
      setPasscodeError("Unable to verify passcode. Please try again.");
    } finally {
      setIsVerifyingPasscode(false);
    }
  };

  if (!isLoaded || isCallLoading) return <Loader />;

  if (!call)
    return (
      <p className="text-center text-3xl font-bold text-white">
        Call Not Found
      </p>
    );

  const isHost = call?.state.createdBy?.id === user?.id;

  // get more info about custom call type:
  // https://getstream.io/video/docs/react/guides/configuring-call-types/
  const notAllowed =
    call.type === "invited" &&
    (!user || !call.state.members.find((m) => m.user.id === user.id));

  if (notAllowed)
    return <Alert title="You are not allowed to join this meeting" />;

  const hasPasscode = Boolean(call.state.custom?.passcode);

  if (hasPasscode && !isPasscodeVerified) {
    return (
      <main className="flex h-screen w-full items-center justify-center bg-dark-1 px-4">
        <div className="w-full max-w-md rounded-2xl bg-dark-2 p-8 shadow-xl">
          <h1 className="mb-2 text-center text-2xl font-bold text-white">
            Meeting Passcode
          </h1>

          <p className="mb-6 text-center text-sm text-sky-2">
            Enter the passcode to join this meeting.
          </p>

          <Input
            type="password"
            placeholder="Enter passcode"
            value={passcode}
            onChange={(e) => {
              setPasscode(e.target.value);
              setPasscodeError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleVerifyPasscode();
              }
            }}
            className="mb-3 border-none bg-dark-3 text-white focus-visible:ring-0"
          />

          {passcodeError && (
            <p className="mb-4 text-sm text-red-400">{passcodeError}</p>
          )}

          <Button
            onClick={handleVerifyPasscode}
            disabled={isVerifyingPasscode}
            className="w-full bg-blue-1 text-white"
          >
            {isVerifyingPasscode ? "Verifying..." : "Continue"}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-full">
      <StreamCall call={call}>
        <StreamTheme>
          {!isSetupComplete ? (
            <MeetingSetup
              setIsSetupComplete={setIsSetupComplete}
              isHost={isHost}
            />
          ) : (
            <MeetingRoom isHost={isHost} />
          )}
        </StreamTheme>
      </StreamCall>
    </main>
  );
};

export default MeetingPage;
