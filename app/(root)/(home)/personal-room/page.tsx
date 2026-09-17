"use client";

import { useUser } from "@clerk/nextjs";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useGetCallById } from "@/hooks/useGetCallById";
import { Button } from "@/components/ui/button";
import { useToastManager } from "@/components/ui/toast";
import {
  createPersonalRoom,
  updatePersonalRoomTopic,
  deletePersonalRoom,
  getPersonalRooms,
} from "@/actions/stream.actions";
const Table = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <div className="flex flex-col items-start gap-2 xl:flex-row">
      <h1 className="text-base font-medium text-sky-1 lg:text-xl xl:min-w-32">
        {title}:
      </h1>
      <h1 className="truncate text-sm font-bold max-sm:max-w-[320px] lg:text-xl">
        {description}
      </h1>
    </div>
  );
};

type PersonalRoomData = {
  roomId: string;
  topic: string;
};

const PersonalRoom = () => {
  const router = useRouter();
  const { user } = useUser();
  const client = useStreamVideoClient();
  const { add } = useToastManager();
  const [topic, setTopic] = useState(`${user?.username}'s Meeting Room`);
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [isSavingTopic, setIsSavingTopic] = useState(false);

  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [newRoomTopic, setNewRoomTopic] = useState("");
  const [additionalRooms, setAdditionalRooms] = useState<PersonalRoomData[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest" | "az" | "za">(
    "latest",
  );

  const meetingId = user?.id;

  const { call } = useGetCallById(meetingId!);

  useEffect(() => {
    if (call?.state?.custom?.description) {
      setTopic(call.state.custom.description);
    }
  }, [call]);

  useEffect(() => {
    const loadAdditionalRooms = async () => {
      if (!user) return;

      try {
        const rooms = await getPersonalRooms();

        setAdditionalRooms(rooms);
      } catch (error) {
        console.error("Failed to load personal rooms:", error);

        add({
          title: "Failed to load rooms",
        });
      }
    };

    loadAdditionalRooms();
  }, [user]);

  const filteredAndSortedRooms = [...additionalRooms]
    .filter((room) => {
      const query = searchQuery.toLowerCase().trim();

      if (!query) return true;

      return (
        room.topic.toLowerCase().includes(query) ||
        room.roomId.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sortOrder === "az") {
        return a.topic.localeCompare(b.topic);
      }

      if (sortOrder === "za") {
        return b.topic.localeCompare(a.topic);
      }

      if (sortOrder === "oldest") {
        return a.roomId.localeCompare(b.roomId);
      }

      return b.roomId.localeCompare(a.roomId);
    });

  const startRoom = async () => {
    if (!client || !user) return;

    const newCall = client.call("default", meetingId!);

    if (!call) {
      await newCall.getOrCreate({
        data: {
          starts_at: new Date().toISOString(),
        },
      });
    }

    router.push(`/meeting/${meetingId}?personal=true`);
  };

  const saveTopic = async () => {
    if (!meetingId || !topic.trim()) return;

    try {
      setIsSavingTopic(true);

      await updatePersonalRoomTopic(meetingId, topic.trim());

      setIsEditingTopic(false);

      add({
        title: "Topic Updated",
      });

      window.location.reload();
    } catch (error) {
      console.error("Failed to update topic:", error);

      add({
        title: "Failed to update topic",
      });
    } finally {
      setIsSavingTopic(false);
    }
  };

  const createAnotherRoom = async () => {
    if (!newRoomTopic.trim()) {
      add({
        title: "Please enter a room topic",
      });

      return;
    }

    try {
      setIsCreatingRoom(true);

      const result = await createPersonalRoom(newRoomTopic.trim());

      setAdditionalRooms((prev) => [
        ...prev,
        {
          roomId: result.roomId,
          topic: result.topic,
        },
      ]);

      add({
        title: "New Room Created",
      });

      setNewRoomTopic("");
      setIsCreateRoomOpen(false);
    } catch (error) {
      console.error("Failed to create room:", error);

      add({
        title: "Failed to create room",
      });
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this room?",
    );

    if (!confirmed) return;

    try {
      await deletePersonalRoom(roomId);

      setAdditionalRooms((prev) =>
        prev.filter((room) => room.roomId !== roomId),
      );

      add({
        title: "Room Deleted",
      });
    } catch (error) {
      console.error("Failed to delete room:", error);

      add({
        title: "Failed to delete room",
      });
    }
  };

  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${meetingId}?personal=true`;

  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <h1 className="text-xl font-bold lg:text-3xl">Personal Meeting Room</h1>
      <div className="flex w-full flex-col gap-8 xl:max-w-[900px]">
        <div className="flex flex-col items-start gap-2 xl:flex-row">
          <h1 className="text-base font-medium text-sky-1 lg:text-xl xl:min-w-32">
            Topic:
          </h1>

          {isEditingTopic ? (
            <div className="flex w-full max-w-[650px] items-center gap-3">
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="h-11 flex-1 rounded-md border border-dark-3 bg-dark-1 px-3 text-sm font-medium text-white outline-none focus:border-purple-1 lg:text-lg"
                placeholder="Enter meeting topic"
              />

              <Button
                onClick={saveTopic}
                disabled={isSavingTopic}
                className="h-11 shrink-0 bg-purple-1 px-5"
              >
                {isSavingTopic ? "Saving..." : "Save"}
              </Button>

              <Button
                onClick={() => {
                  setTopic(
                    call?.state?.custom?.description ||
                      `${user?.username}'s Meeting Room`,
                  );
                  setIsEditingTopic(false);
                }}
                disabled={isSavingTopic}
                className="h-11 shrink-0 bg-dark-3 px-5"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="truncate text-sm font-bold max-sm:max-w-[320px] lg:text-xl">
                {topic}
              </h1>

              <Button
                onClick={() => setIsEditingTopic(true)}
                className="bg-dark-3"
              >
                Edit
              </Button>
            </div>
          )}
        </div>
        <Table title="Meeting ID" description={meetingId!} />
        <Table title="Invite Link" description={meetingLink} />
        <div className="flex flex-wrap gap-5">
          <Button className="bg-blue-1" onClick={startRoom}>
            Start Meeting
          </Button>

          <Button
            className="bg-dark-3"
            onClick={() => {
              navigator.clipboard.writeText(meetingLink);

              add({
                title: "Link Copied",
              });
            }}
          >
            Copy Invitation
          </Button>

          <Button
            className="bg-purple-1"
            onClick={() => {
              setNewRoomTopic("");
              setIsCreateRoomOpen(true);
            }}
          >
            Create Another Room
          </Button>

          {isCreateRoomOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-md rounded-xl bg-dark-2 p-6 shadow-xl">
                <h2 className="mb-2 text-xl font-semibold text-white">
                  Create Another Room
                </h2>

                <p className="mb-5 text-sm text-gray-400">
                  Enter a topic for your new personal meeting room.
                </p>

                <input
                  type="text"
                  value={newRoomTopic}
                  onChange={(e) => {
                    console.log("Input changed:", e.target.value);
                    setNewRoomTopic(e.target.value);
                  }}
                  placeholder="Enter room topic"
                  autoFocus
                  className="mb-5 w-full rounded-md border border-dark-3 bg-dark-1 px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:bg-dark-1"
                />

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    className="bg-dark-3"
                    onClick={() => {
                      setNewRoomTopic("");
                      setIsCreateRoomOpen(false);
                    }}
                    disabled={isCreatingRoom}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    className="bg-purple-1"
                    onClick={createAnotherRoom}
                    disabled={isCreatingRoom}
                  >
                    {isCreatingRoom ? "Creating..." : "Create Room"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {additionalRooms.length > 0 && (
        <div className="flex w-full flex-col gap-6 xl:max-w-[900px]">
          {/* Search + Sort */}
          <div className="flex w-full flex-col gap-4 sm:flex-row">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search personal rooms..."
              className="h-11 flex-1 rounded-md border border-dark-3 bg-dark-1 px-4 text-sm text-white outline-none placeholder:text-gray-500 focus:border-purple-1"
            />

            <select
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(
                  e.target.value as "latest" | "oldest" | "az" | "za",
                )
              }
              className="h-11 rounded-md border border-dark-3 bg-dark-1 px-4 text-sm text-white outline-none focus:border-purple-1"
            >
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
              <option value="az">A-Z</option>
              <option value="za">Z-A</option>
            </select>
          </div>
          {filteredAndSortedRooms.length === 0 && (
            <div className="rounded-xl border border-dark-3 bg-dark-2 p-6 text-center text-gray-400">
              No personal room found.
            </div>
          )}

          {filteredAndSortedRooms.map((room) => {
            const roomLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${room.roomId}?personal=true`;

            return (
              <div
                key={room.roomId}
                className="flex w-full flex-col gap-6 rounded-xl border border-dark-3 bg-dark-2 p-6"
              >
                <h2 className="text-xl font-bold text-white">{room.topic}</h2>

                <div className="flex w-full flex-col gap-4">
                  <Table title="Topic" description={room.topic} />

                  <Table title="Meeting ID" description={room.roomId} />

                  <Table title="Invite Link" description={roomLink} />
                </div>

                <div className="flex flex-wrap gap-5">
                  <Button
                    className="bg-blue-1"
                    onClick={() =>
                      router.push(`/meeting/${room.roomId}?personal=true`)
                    }
                  >
                    Start Meeting
                  </Button>

                  <Button
                    className="bg-dark-3"
                    onClick={() => {
                      navigator.clipboard.writeText(roomLink);

                      add({
                        title: "Link Copied",
                      });
                    }}
                  >
                    Copy Invitation
                  </Button>

                  <Button
                    className="bg-red-600"
                    onClick={() => handleDeleteRoom(room.roomId)}
                  >
                    Delete Room
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default PersonalRoom;