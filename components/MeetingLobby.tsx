"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "./ui/button";

const MeetingLobby = ({ callId }: { callId: string }) => {
  const waitingParticipants = useQuery(
    api.meetingLobby.getWaitingParticipants,
    { callId },
  );

  const admitParticipant = useMutation(api.meetingLobby.admitParticipant);

  const rejectParticipant = useMutation(api.meetingLobby.rejectParticipant);

  if (!waitingParticipants || waitingParticipants.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-5 top-5 z-50 w-80 rounded-2xl bg-dark-1 p-5 text-white shadow-xl">
      <h2 className="mb-4 text-xl font-bold">Waiting Room</h2>

      <div className="flex flex-col gap-3">
        {waitingParticipants.map((participant) => (
          <div key={participant._id} className="rounded-xl bg-dark-2 p-3">
            <p className="font-semibold">{participant.userName}</p>

            <div className="mt-3 flex gap-2">
              <Button
                className="flex-1 bg-green-500 text-white"
                onClick={() =>
                  admitParticipant({
                    callId,
                    userId: participant.userId,
                  })
                }
              >
                Admit
              </Button>

              <Button
                className="flex-1 bg-red-500 text-white"
                onClick={() =>
                  rejectParticipant({
                    callId,
                    userId: participant.userId,
                  })
                }
              >
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MeetingLobby;
