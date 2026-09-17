"use client";

import { Call, CallRecording } from "@stream-io/video-react-sdk";
import Loader from "./Loader";
import { useGetCalls } from "@/hooks/useGetCalls";
import MeetingCard from "./MeetingCard";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  deleteMeeting,
  deleteRecording,
  updateRecordingMetadata,
  getRecordingMetadata,
  scheduleMeeting,
  updateMeeting,
} from "@/actions/stream.actions";
import { useToastManager } from "./ui/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Textarea } from "./ui/textarea";
import ReactDatePicker from "react-datepicker";

const CallList = ({ type }: { type: "ended" | "upcoming" | "recordings" }) => {
  const router = useRouter();
  const { endedCalls, upcomingCalls, callRecordings, isLoading } =
    useGetCalls();
  const [recordings, setRecordings] = useState<
    {
      recording: CallRecording;
      callId: string;
      recordingTitle?: string;
      recordingDescription?: string;
    }[]
  >([]);
  const { add } = useToastManager();
  const [deleteCallId, setDeleteCallId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editCall, setEditCall] = useState<Call | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editDateTime, setEditDateTime] = useState<Date>(new Date());
  const [editRecording, setEditRecording] = useState<CallRecording | null>(
    null,
  );
  const [editRecordingTitle, setEditRecordingTitle] = useState("");
  const [editRecordingDescription, setEditRecordingDescription] = useState("");
  const [editRecordingCallId, setEditRecordingCallId] = useState<string | null>(
    null,
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [scheduleCall, setScheduleCall] = useState<Call | null>(null);
  const [scheduleDescription, setScheduleDescription] = useState("");
  const [scheduleDateTime, setScheduleDateTime] = useState<Date>(new Date());
  const [isScheduling, setIsScheduling] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<
    "latest" | "oldest" | "az" | "za"
  >("latest");
  const [isAddingRecordingDescription, setIsAddingRecordingDescription] =
    useState(false);
  const [deleteRecordingData, setDeleteRecordingData] = useState<{
    callId: string;
    sessionId: string;
    filename: string;
  } | null>(null);

  const getCalls = () => {
    switch (type) {
      case "ended":
        return endedCalls;
      case "recordings":
        return recordings;
      case "upcoming":
        return upcomingCalls;
      default:
        return [];
    }
  };

  const getNoCallsMessage = () => {
    switch (type) {
      case "ended":
        return "No Previous Calls";
      case "upcoming":
        return "No Upcoming Calls";
      case "recordings":
        return "No Recordings";
      default:
        return "";
    }
  };

  const handleDelete = async () => {
    if (!deleteCallId) return;

    try {
      setIsDeleting(true);

      await deleteMeeting(deleteCallId);

      add({
        title: "Meeting Deleted",
      });

      setDeleteCallId(null);
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete meeting:", error);

      add({
        title: "Failed to delete meeting",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = async () => {
    if (!editCall) return;

    try {
      setIsUpdating(true);

      await updateMeeting(
        editCall.id,
        editDescription,
        editDateTime.toISOString(),
      );

      add({
        title: "Meeting Updated",
      });

      setEditCall(null);

      window.location.reload();
    } catch (error) {
      console.error("Failed to update meeting:", error);

      add({
        title: "Failed to update meeting",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditRecording = async () => {
    if (!editRecording || !editRecordingCallId) return;

    try {
      setIsUpdating(true);

      await updateRecordingMetadata(
        editRecordingCallId,
        editRecordingTitle,
        editRecordingDescription,
      );

      setEditRecording(null);
      setEditRecordingCallId(null);

      add({
        title: isAddingRecordingDescription
          ? "Description Added"
          : "Recording Updated",
      });
    } catch (error) {
      console.error("Failed to update recording:", error);

      add({
        title: "Failed to update recording",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleScheduleAgain = async () => {
    if (!scheduleCall) return;

    try {
      setIsScheduling(true);

      await scheduleMeeting(
        scheduleDescription,
        scheduleDateTime.toISOString(),
        ''
      );

      add({
        title: "Meeting Scheduled",
      });

      setScheduleCall(null);

      window.location.reload();
    } catch (error) {
      console.error("Failed to schedule meeting:", error);

      add({
        title: "Failed to schedule meeting",
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const handleDeleteRecording = async () => {
    if (!deleteRecordingData) return;

    try {
      setIsDeleting(true);

      await deleteRecording(
        deleteRecordingData.callId,
        deleteRecordingData.sessionId,
        deleteRecordingData.filename,
      );

      add({
        title: "Recording Deleted",
      });

      setDeleteRecordingData(null);

      window.location.reload();
    } catch (error) {
      console.error("Failed to delete recording:", error);

      add({
        title: "Failed to delete recording",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const fetchRecordings = async () => {
      if (!callRecordings) return;

      const recordingsWithCallId = (
        await Promise.all(
          callRecordings.map(async (meeting) => {
            try {
              const [result, metadata] = await Promise.all([
                meeting.listRecordings(),
                getRecordingMetadata(meeting.id),
              ]);

              return result.recordings.map((recording) => ({
                recording,
                callId: meeting.id,
                recordingTitle: metadata.recordingTitle,
                recordingDescription: metadata.recordingDescription,
              }));
            } catch (error) {
              console.error(
                `Failed to fetch recording metadata for ${meeting.id}:`,
                error,
              );

              const result = await meeting.listRecordings();

              return result.recordings.map((recording) => ({
                recording,
                callId: meeting.id,
                recordingTitle: "",
                recordingDescription: "",
              }));
            }
          }),
        )
      ).flat();

      setRecordings(recordingsWithCallId);
    };

    if (type === "recordings") {
      fetchRecordings();
    }
  }, [type, callRecordings]);

  const calls = getCalls();

  const filteredAndSortedCalls = useMemo(() => {
    if (!calls) return [];

    const query = searchQuery.toLowerCase().trim();

    const filtered = calls.filter((meeting) => {
      if (type === "recordings") {
        const recordingData = meeting as {
          recording: CallRecording;
          callId: string;
          recordingTitle?: string;
          recordingDescription?: string;
        };

        const title = recordingData.recordingTitle?.toLowerCase() || "";

        const description =
          recordingData.recordingDescription?.toLowerCase() || "";

        const filename = recordingData.recording.filename?.toLowerCase() || "";

        return (
          title.includes(query) ||
          description.includes(query) ||
          filename.includes(query)
        );
      }

      const call = meeting as Call;

      const description = call.state?.custom?.description?.toLowerCase() || "";

      const meetingId = call.id?.toLowerCase() || "";

      return description.includes(query) || meetingId.includes(query);
    });

    return [...filtered].sort((a, b) => {
      if (type === "recordings") {
        const recordingA = a as {
          recording: CallRecording;
          recordingTitle?: string;
        };

        const recordingB = b as {
          recording: CallRecording;
          recordingTitle?: string;
        };

        if (sortOption === "az" || sortOption === "za") {
          const aTitle =
            recordingA.recordingTitle?.toLowerCase() ||
            recordingA.recording.filename?.toLowerCase() ||
            "recording";

          const bTitle =
            recordingB.recordingTitle?.toLowerCase() ||
            recordingB.recording.filename?.toLowerCase() ||
            "recording";

          return sortOption === "az"
            ? aTitle.localeCompare(bTitle)
            : bTitle.localeCompare(aTitle);
        }

        const aDate = recordingA.recording.start_time
          ? new Date(recordingA.recording.start_time).getTime()
          : 0;

        const bDate = recordingB.recording.start_time
          ? new Date(recordingB.recording.start_time).getTime()
          : 0;

        return sortOption === "latest" ? bDate - aDate : aDate - bDate;
      }

      if (sortOption === "az" || sortOption === "za") {
        const aTitle =
          (a as Call).state?.custom?.description?.toLowerCase() || "";

        const bTitle =
          (b as Call).state?.custom?.description?.toLowerCase() || "";

        return sortOption === "az"
          ? aTitle.localeCompare(bTitle)
          : bTitle.localeCompare(aTitle);
      }

      const aDate = (a as Call).state?.startsAt?.getTime() || 0;

      const bDate = (b as Call).state?.startsAt?.getTime() || 0;

      return sortOption === "latest" ? bDate - aDate : aDate - bDate;
    });
  }, [calls, searchQuery, sortOption, type]);

  const noCallsMessage = getNoCallsMessage();

  if (isLoading) return <Loader />;

  return (
    <>
      {(type === "upcoming" || type === "ended" || type === "recordings") && (
        <div className="mb-6 flex w-full flex-col gap-3 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-lg border border-dark-3 bg-dark-1 px-4 text-white outline-none placeholder:text-gray-400 focus:border-purple-1"
            />
          </div>

          {/* Sort */}
          <select
            value={sortOption}
            onChange={(e) =>
              setSortOption(e.target.value as "latest" | "oldest" | "az" | "za")
            }
            className="h-12 rounded-lg border border-dark-3 bg-dark-1 px-4 text-white outline-none focus:border-purple-1"
          >
            <option value="latest">Latest → Oldest</option>

            <option value="oldest">Oldest → Latest</option>

            <option value="az">A → Z</option>

            <option value="za">Z → A</option>
          </select>
        </div>
      )}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {filteredAndSortedCalls.length > 0 ? (
          filteredAndSortedCalls.map(
            (
              meeting:
                | Call
                | {
                    recording: CallRecording;
                    callId: string;
                    recordingTitle?: string;
                    recordingDescription?: string;
                  },
            ) => (
              <MeetingCard
                key={
                  type === "recordings"
                    ? (meeting as { recording: CallRecording; callId: string })
                        .recording.url
                    : (meeting as Call).id
                }
                icon={
                  type === "ended"
                    ? "/icons/previous.svg"
                    : type === "upcoming"
                      ? "/icons/upcoming.svg"
                      : "/icons/recordings.svg"
                }
                title={
                  type === "recordings"
                    ? (
                        meeting as {
                          recording: CallRecording;
                          callId: string;
                          recordingTitle?: string;
                        }
                      ).recordingTitle ||
                      (
                        meeting as {
                          recording: CallRecording;
                          callId: string;
                        }
                      ).recording.filename?.substring(0, 20) ||
                      "Recording"
                    : (meeting as Call).state?.custom?.description ||
                      "No Description"
                }
                date={
                  type === "recordings"
                    ? (
                        meeting as {
                          recording: CallRecording;
                          callId: string;
                        }
                      ).recording.start_time?.toLocaleString() || "Unknown Date"
                    : (meeting as Call).state?.startsAt?.toLocaleString() ||
                      "Unknown Date"
                }
                isPreviousMeeting={type === "ended"}
                isRecording={type === "recordings"}
                link={
                  type === "recordings"
                    ? (meeting as { recording: CallRecording; callId: string })
                        .recording.url
                    : `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${(meeting as Call).id}`
                }
                buttonIcon1={
                  type === "recordings" ? "/icons/play.svg" : undefined
                }
                buttonText={type === "recordings" ? "Play" : "Start"}
                handleClick={
                  type === "recordings"
                    ? () => {
                        const recording = (
                          meeting as {
                            recording: CallRecording;
                            callId: string;
                          }
                        ).recording;

                        if (recording.url) {
                          window.open(recording.url, "_blank");
                        }
                      }
                    : () => router.push(`/meeting/${(meeting as Call).id}`)
                }
                callId={
                  type === "recordings"
                    ? (meeting as { recording: CallRecording; callId: string })
                        .callId
                    : (meeting as Call).id
                }
                onDelete={(callId) => {
                  if (type === "recordings") {
                    const recordingData = meeting as {
                      recording: CallRecording;
                      callId: string;
                    };

                    setDeleteRecordingData({
                      callId: recordingData.callId,
                      sessionId: recordingData.recording.session_id,
                      filename: recordingData.recording.filename,
                    });

                    return;
                  }

                  setDeleteCallId(callId);
                }}
                onEdit={() => {
                  if (type === "recordings") {
                    const recording = (
                      meeting as {
                        recording: CallRecording;
                        callId: string;
                      }
                    ).recording;

                    setEditRecording(recording);
                    setEditRecordingCallId(
                      (meeting as { recording: CallRecording; callId: string })
                        .callId,
                    );
                    const recordingData = meeting as {
                      recording: CallRecording;
                      callId: string;
                      recordingTitle?: string;
                      recordingDescription?: string;
                    };

                    setEditRecordingTitle(
                      recordingData.recordingTitle ||
                        recording.filename?.substring(0, 20) ||
                        "Recording",
                    );

                    setEditRecordingDescription(
                      recordingData.recordingDescription || "",
                    );

                    setIsAddingRecordingDescription(false);

                    return;
                  }

                  const call = meeting as Call;

                  setEditCall(call);
                  setEditDescription(call.state?.custom?.description || "");

                  if (call.state?.startsAt) {
                    setEditDateTime(new Date(call.state.startsAt));
                  }
                }}
                onAddDescription={(callId) => {
                  const recordingData = meeting as {
                    recording: CallRecording;
                    callId: string;
                    recordingTitle?: string;
                    recordingDescription?: string;
                  };

                  setEditRecording(recordingData.recording);

                  setEditRecordingCallId(recordingData.callId);

                  setEditRecordingTitle(
                    recordingData.recordingTitle ||
                      recordingData.recording.filename?.substring(0, 20) ||
                      "Recording",
                  );

                  setEditRecordingDescription(
                    recordingData.recordingDescription || "",
                  );

                  setIsAddingRecordingDescription(true);
                }}
                onView={(callId) => {
                  router.push(`/meeting-details/${callId}`);
                }}
                onCopyId={(callId) => {
                  navigator.clipboard.writeText(callId);

                  add({
                    title: "Meeting ID Copied",
                  });
                }}
                onScheduleAgain={(callId) => {
                  const call = meeting as Call;

                  setScheduleCall(call);

                  setScheduleDescription(call.state?.custom?.description || "");

                  // Default to tomorrow at the same time
                  const oldDate = call.state?.startsAt
                    ? new Date(call.state.startsAt)
                    : new Date();

                  const newDate = new Date(oldDate);
                  newDate.setDate(newDate.getDate() + 1);

                  setScheduleDateTime(newDate);
                }}
                description={
                  type === "recordings"
                    ? (
                        meeting as {
                          recording: CallRecording;
                          callId: string;
                          recordingDescription?: string;
                        }
                      ).recordingDescription
                    : undefined
                }
                onShareRecording={async (link) => {
                  try {
                    await navigator.clipboard.writeText(link);

                    add({
                      title: "Recording Link Copied",
                    });
                  } catch (error) {
                    console.error("Failed to copy recording link:", error);

                    add({
                      title: "Failed to copy recording link",
                    });
                  }
                }}
              />
            ),
          )
        ) : (
          <h1 className="col-span-full text-2xl font-bold text-white">
            {calls && calls.length > 0 ? "No meetings found" : noCallsMessage}
          </h1>
        )}
        <AlertDialog
          open={!!deleteCallId}
          onOpenChange={(open) => {
            if (!open && !isDeleting) {
              setDeleteCallId(null);
            }
          }}
        >
          <AlertDialogContent className="border-dark-3 bg-dark-1 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this meeting?</AlertDialogTitle>

              <AlertDialogDescription className="text-gray-400">
                This action will delete the meeting. You won't be able to access
                it from your Upcoming Meetings list.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={isDeleting}
                className="border-dark-3 bg-dark-2 text-white hover:bg-dark-3 hover:text-white"
              >
                Cancel
              </AlertDialogCancel>

              <AlertDialogAction
                disabled={isDeleting}
                onClick={handleDelete}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {isDeleting ? "Deleting..." : "Delete Meeting"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {/* For editing a meeting */}
        <AlertDialog
          open={!!editCall}
          onOpenChange={(open) => {
            if (!open && !isUpdating) {
              setEditCall(null);
            }
          }}
        >
          <AlertDialogContent className="border-dark-3 bg-dark-1 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Meeting</AlertDialogTitle>

              <AlertDialogDescription className="text-gray-400">
                Update your meeting description and scheduled time.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300">Description</label>

                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="border-none bg-dark-3 text-white focus-visible:ring-0"
                  placeholder="Meeting description"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300">Date & Time</label>

                <ReactDatePicker
                  selected={editDateTime}
                  onChange={(date: Date | null) => {
                    if (date) {
                      setEditDateTime(date);
                    }
                  }}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  timeCaption="time"
                  dateFormat="MMMM d, yyyy h:mm aa"
                  className="w-full rounded bg-dark-3 p-2 text-white focus:outline-none"
                />
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={isUpdating}
                className="border-dark-3 bg-dark-2 text-white hover:bg-dark-3 hover:text-white"
              >
                Cancel
              </AlertDialogCancel>

              <AlertDialogAction
                disabled={isUpdating}
                onClick={handleEdit}
                className="bg-blue-1 text-white hover:bg-blue-1/90"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {/* For scheduling a meeting again */}
        <AlertDialog
          open={!!scheduleCall}
          onOpenChange={(open) => {
            if (!open && !isScheduling) {
              setScheduleCall(null);
            }
          }}
        >
          <AlertDialogContent className="border-dark-3 bg-dark-1 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Schedule Again</AlertDialogTitle>

              <AlertDialogDescription className="text-gray-400">
                Create a new meeting using the details from your previous
                meeting.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300">Description</label>

                <Textarea
                  value={scheduleDescription}
                  onChange={(e) => setScheduleDescription(e.target.value)}
                  className="border-none bg-dark-3 text-white focus-visible:ring-0"
                  placeholder="Meeting description"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300">Date & Time</label>

                <ReactDatePicker
                  selected={scheduleDateTime}
                  onChange={(date: Date | null) => {
                    if (date) {
                      setScheduleDateTime(date);
                    }
                  }}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  timeCaption="time"
                  dateFormat="MMMM d, yyyy h:mm aa"
                  minDate={new Date()}
                  className="w-full rounded bg-dark-3 p-2 text-white focus:outline-none"
                />
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={isScheduling}
                className="border-dark-3 bg-dark-2 text-white hover:bg-dark-3 hover:text-white"
              >
                Cancel
              </AlertDialogCancel>

              <AlertDialogAction
                disabled={isScheduling}
                onClick={handleScheduleAgain}
                className="bg-blue-1 text-white hover:bg-blue-1/90"
              >
                {isScheduling ? "Scheduling..." : "Schedule Meeting"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {/* for adding/editing recording description */}
        <AlertDialog
          open={!!editRecording}
          onOpenChange={(open) => {
            if (!open) {
              setEditRecording(null);
              setIsAddingRecordingDescription(false);
            }
          }}
        >
          <AlertDialogContent className="border-dark-3 bg-dark-2 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {isAddingRecordingDescription
                  ? "Add Recording Description"
                  : "Edit Recording"}
              </AlertDialogTitle>

              <AlertDialogDescription className="text-gray-400">
                {isAddingRecordingDescription
                  ? "Add a description to this recording."
                  : "Update the recording title and description."}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="flex flex-col gap-4">
              {!isAddingRecordingDescription && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-white">
                    Recording Title
                  </label>

                  <input
                    value={editRecordingTitle}
                    onChange={(e) => setEditRecordingTitle(e.target.value)}
                    placeholder="Enter recording title"
                    className="w-full rounded-md border border-dark-3 bg-dark-1 px-3 py-2 text-white outline-none placeholder:text-gray-500 focus:border-blue-1"
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white">
                  Description
                </label>

                <Textarea
                  value={editRecordingDescription}
                  onChange={(e) => setEditRecordingDescription(e.target.value)}
                  placeholder="Enter recording description"
                  className="min-h-30 border-dark-3 bg-dark-1 text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={isUpdating}
                className="border-dark-3 bg-dark-1 text-white hover:bg-dark-3"
              >
                Cancel
              </AlertDialogCancel>

              <AlertDialogAction
                disabled={isUpdating}
                onClick={handleEditRecording}
                className="bg-blue-1 text-white hover:bg-blue-1/90"
              >
                {isUpdating
                  ? "Saving..."
                  : isAddingRecordingDescription
                    ? "Add Description"
                    : "Save Changes"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {/* for deleting a recording */}
        <AlertDialog
          open={!!deleteRecordingData}
          onOpenChange={(open) => {
            if (!open && !isDeleting) {
              setDeleteRecordingData(null);
            }
          }}
        >
          <AlertDialogContent className="border-dark-3 bg-dark-2 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Recording?</AlertDialogTitle>

              <AlertDialogDescription className="text-gray-400">
                Are you sure you want to delete this recording? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={isDeleting}
                className="border-dark-3 bg-dark-1 text-white hover:bg-dark-3"
              >
                Cancel
              </AlertDialogCancel>

              <AlertDialogAction
                disabled={isDeleting}
                onClick={handleDeleteRecording}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {isDeleting ? "Deleting..." : "Delete Recording"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default CallList;
