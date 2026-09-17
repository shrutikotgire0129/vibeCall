'use client';

import { ReactNode, useEffect, useState } from 'react';
import {
  StreamVideoClient,
  StreamVideo,
} from '@stream-io/video-react-sdk';
import { useUser } from '@clerk/nextjs';

import { tokenProvider } from '@/actions/stream.actions';
import Loader from '@/components/Loader';

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] =
    useState<StreamVideoClient | null>(null);

  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      setVideoClient(null);
      return;
    }

    if (!API_KEY) {
      throw new Error('Stream API key is missing');
    }

    const client = new StreamVideoClient({
      apiKey: API_KEY,
      user: {
        id: user.id,
        name: user.username || user.id,
        image: user.imageUrl,
      },
      tokenProvider,
    });

    setVideoClient(client);

    return () => {
      client.disconnectUser();
    };
  }, [user, isLoaded]);

  // Clerk is still checking authentication
  if (!isLoaded) {
    return <Loader />;
  }

  // User is not authenticated — don't initialize Stream
  if (!user) {
    return <>{children}</>;
  }

  // Authenticated, but Stream client is still initializing
  if (!videoClient) {
    return <Loader />;
  }

  return (
    <StreamVideo client={videoClient}>
      {children}
    </StreamVideo>
  );
};

export default StreamVideoProvider;