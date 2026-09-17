'use server';

import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';
import { StreamClient } from '@stream-io/node-sdk';

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_SECRET_KEY;

const hashPasscode = (passcode: string) =>
  crypto.createHash('sha256').update(passcode).digest('hex');

export const tokenProvider = async () => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('User is not authenticated');
  }

  if (!STREAM_API_KEY) {
    throw new Error('Stream API key is missing');
  }

  if (!STREAM_API_SECRET) {
    throw new Error('Stream API secret is missing');
  }

  const streamClient = new StreamClient(
    STREAM_API_KEY,
    STREAM_API_SECRET
  );

  const expirationTime = Math.floor(Date.now() / 1000) + 3600;
  const issuedAt = Math.floor(Date.now() / 1000) - 60;

  return streamClient.createToken(
    userId,
    expirationTime,
    issuedAt
  );
};

export const deleteMeeting = async (callId: string) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User is not authenticated");
  }

  if (!STREAM_API_KEY) {
    throw new Error("Stream API key is missing");
  }

  if (!STREAM_API_SECRET) {
    throw new Error("Stream API secret is missing");
  }

  const streamClient = new StreamClient(
    STREAM_API_KEY,
    STREAM_API_SECRET
  );

  const call = streamClient.video.call("default", callId);

  const response = await call.get();

  const creatorId = response.call?.created_by?.id;

  if (creatorId !== userId) {
    throw new Error("You are not allowed to delete this meeting");
  }

  await call.delete({
    hard: false,
  });

  return { success: true };
};

export const updateMeeting = async (
  callId: string,
  description: string,
  startsAt: string
) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User is not authenticated");
  }

  if (!STREAM_API_KEY) {
    throw new Error("Stream API key is missing");
  }

  if (!STREAM_API_SECRET) {
    throw new Error("Stream API secret is missing");
  }

  const streamClient = new StreamClient(
    STREAM_API_KEY,
    STREAM_API_SECRET
  );

  const call = streamClient.video.call("default", callId);

  // Get existing meeting
  const response = await call.get();

  // Only the creator can edit the meeting
  const creatorId = response.call?.created_by?.id;

  if (creatorId !== userId) {
    throw new Error("You are not allowed to edit this meeting");
  }

  await call.update({
    starts_at: new Date(startsAt),
    custom: {
      description: description || "Scheduled Meeting",
    },
  });

  return { success: true };
};

export const scheduleMeeting = async (
  description: string,
  startsAt: string,
  passcode: string
) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User is not authenticated");
  }

  if (!STREAM_API_KEY) {
    throw new Error("Stream API key is missing");
  }

  if (!STREAM_API_SECRET) {
    throw new Error("Stream API secret is missing");
  }

  const streamClient = new StreamClient(
    STREAM_API_KEY,
    STREAM_API_SECRET
  );

  const callId = crypto.randomUUID();

  const call = streamClient.video.call("default", callId);

  await call.getOrCreate({
    data: {
      created_by: {
        id: userId,
      },
      starts_at: new Date(startsAt),
      custom: {
        description: description || "Scheduled Meeting",
        passcode: passcode ? hashPasscode(passcode) : undefined,
      },
    },
  });

  return {
    success: true,
    callId,
  };
};

export const deleteRecording = async (
  callId: string,
  sessionId: string,
  filename: string
) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User is not authenticated");
  }

  if (!STREAM_API_KEY) {
    throw new Error("Stream API key is missing");
  }

  if (!STREAM_API_SECRET) {
    throw new Error("Stream API secret is missing");
  }

  const streamClient = new StreamClient(
    STREAM_API_KEY,
    STREAM_API_SECRET
  );

  await streamClient.video.deleteRecording({
    type: "default",
    id: callId,
    session: sessionId,
    filename,
  });

  return { success: true };
};

export const updateRecordingMetadata = async (
  callId: string,
  title: string,
  description: string
) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User is not authenticated");
  }

  if (!STREAM_API_KEY) {
    throw new Error("Stream API key is missing");
  }

  if (!STREAM_API_SECRET) {
    throw new Error("Stream API secret is missing");
  }

  const streamClient = new StreamClient(
    STREAM_API_KEY,
    STREAM_API_SECRET
  );

  const call = streamClient.video.call("default", callId);

  const response = await call.get();
  const creatorId = response.call?.created_by?.id;

  if (creatorId !== userId) {
    throw new Error("You are not allowed to edit this recording");
  }

  const updatedCustom = {
  ...(response.call?.custom || {}),
  recordingTitle: title || "Recording",
  recordingDescription: description || "",
};

const updateResponse = await call.update({
  custom: updatedCustom,
});

return {
  success: true,
  custom: updatedCustom,
};
};

export const getRecordingMetadata = async (callId: string) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User is not authenticated");
  }

  if (!STREAM_API_KEY || !STREAM_API_SECRET) {
    throw new Error("Stream API credentials are missing");
  }

  const streamClient = new StreamClient(
    STREAM_API_KEY,
    STREAM_API_SECRET
  );

  const call = streamClient.video.call("default", callId);
  const response = await call.get();

  const creatorId = response.call?.created_by?.id;

  if (creatorId !== userId) {
    throw new Error("You are not allowed to access this recording");
  }

  return {
    recordingTitle: response.call?.custom?.recordingTitle || "",
    recordingDescription:
      response.call?.custom?.recordingDescription || "",
  };
};

export const createPersonalRoom = async (topic: string) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User is not authenticated");
  }

  if (!STREAM_API_KEY || !STREAM_API_SECRET) {
    throw new Error("Stream API credentials are missing");
  }

  const streamClient = new StreamClient(
    STREAM_API_KEY,
    STREAM_API_SECRET
  );

  const roomId = crypto.randomUUID();

  const call = streamClient.video.call("default", roomId);

  await call.getOrCreate({
    data: {
      created_by: {
        id: userId,
      },
      custom: {
        description: topic || "Personal Meeting Room",
      },
    },
  });

  return {
    success: true,
    roomId,
    topic: topic.trim() || "Personal Meeting Room",
  };
};

export const updatePersonalRoomTopic = async (
  roomId: string,
  topic: string
) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User is not authenticated");
  }

  if (!STREAM_API_KEY || !STREAM_API_SECRET) {
    throw new Error("Stream API credentials are missing");
  }

  if (roomId !== userId) {
    throw new Error("You are not allowed to edit this room");
  }

  const streamClient = new StreamClient(
    STREAM_API_KEY,
    STREAM_API_SECRET
  );

  const call = streamClient.video.call("default", roomId);

  await call.getOrCreate({
    data: {
      created_by: {
        id: userId,
      },
      custom: {
        description: topic.trim() || "Personal Meeting Room",
      },
    },
  });

  await call.update({
    custom: {
      description: topic.trim() || "Personal Meeting Room",
    },
  });

  return {
    success: true,
    topic: topic.trim() || "Personal Meeting Room",
  };
};

export const deletePersonalRoom = async (roomId: string) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User is not authenticated");
  }

  if (!STREAM_API_KEY || !STREAM_API_SECRET) {
    throw new Error("Stream API credentials are missing");
  }

  if (roomId === userId) {
    throw new Error("The main personal room cannot be deleted");
  }

  const streamClient = new StreamClient(
    STREAM_API_KEY,
    STREAM_API_SECRET
  );

  const call = streamClient.video.call("default", roomId);

  await call.delete();

  return {
    success: true,
  };
}; 

export const getPersonalRooms = async () => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User is not authenticated");
  }

  if (!STREAM_API_KEY || !STREAM_API_SECRET) {
    throw new Error("Stream API credentials are missing");
  }

  const streamClient = new StreamClient(
    STREAM_API_KEY,
    STREAM_API_SECRET
  );

  const response = await streamClient.video.queryCalls({
    filter_conditions: {
      type: "default",
      created_by_user_id: userId,
    },
  });

  return response.calls
    .map((item) => item.call)
    .filter((call) => call.id !== userId)
    .map((call) => ({
      roomId: call.id,
      topic:
        (call.custom?.description as string) ||
        "Personal Meeting Room",
    }));
};

export const verifyMeetingPasscode = async (
  callId: string,
  passcode: string
) => {
  if (!callId || !passcode) {
    return { success: false };
  }

  if (!STREAM_API_KEY || !STREAM_API_SECRET) {
    throw new Error('Stream API credentials are missing');
  }

  const streamClient = new StreamClient(
    STREAM_API_KEY,
    STREAM_API_SECRET
  );

  const call = streamClient.video.call('default', callId);

  const response = await call.get();

  const storedPasscode = response.call?.custom?.passcode as
    | string
    | undefined;

  // No passcode means the meeting is not protected
  if (!storedPasscode) {
    return { success: true };
  }

  const hashedPasscode = hashPasscode(passcode);

  return {
    success: hashedPasscode === storedPasscode,
  };
};

export const generateChatToken = async () => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User is not authenticated");
  }

  if (!STREAM_API_KEY || !STREAM_API_SECRET) {
    throw new Error("Stream API credentials are missing");
  }

  const streamClient = new StreamClient(
    STREAM_API_KEY,
    STREAM_API_SECRET
  );

  const token = streamClient.generateUserToken({
    user_id: userId,
  });

  return {
    token,
    userId,
    apiKey: STREAM_API_KEY,
  };
};