"use client";

import { useState, useEffect } from "react";
import { useGetCalls } from "@/hooks/useGetCalls";
import { Call } from "@stream-io/video-react-sdk";
import { useRouter } from "next/navigation";
import {
  scheduleMeeting,
  updateMeeting,
  deleteMeeting,
} from "@/actions/stream.actions";
import { CalendarDays, ExternalLink } from "lucide-react";

const CalendarPage = () => {
  const router = useRouter();
  const { callRecordings, isLoading } = useGetCalls();
  const [googleConnected, setGoogleConnected] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [meetingDescription, setMeetingDescription] = useState("");
  const [meetingTime, setMeetingTime] = useState("00:00");
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Call | null>(null);
  const [isEditingMeeting, setIsEditingMeeting] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [editTime, setEditTime] = useState("10:00");
  const [isUpdatingMeeting, setIsUpdatingMeeting] = useState(false);
  const [isDeletingMeeting, setIsDeletingMeeting] = useState(false);
  const [googleEventLink, setGoogleEventLink] = useState<string | null>(null);
  const [googleEventIds, setGoogleEventIds] = useState<Record<string, string>>(
    {},
  );
  const [meetingEmails, setMeetingEmails] = useState("");
  const [editMeetingEmails, setEditMeetingEmails] = useState("");

  const handleScheduleMeeting = async () => {
    if (!selectedDate || !meetingDescription.trim()) return;

    try {
      setIsScheduling(true);

      const [hours, minutes] = meetingTime.split(":").map(Number);

      const startsAt = new Date(selectedDate);

      startsAt.setHours(hours, minutes, 0, 0);

      const result = await scheduleMeeting(
        meetingDescription.trim(),
        startsAt.toISOString(),
        "",
      );

      // Check Google Calendar connection at the time of scheduling
      const statusResponse = await fetch("/api/google-calendar/status");
      const statusData = await statusResponse.json();

      if (statusData.connected) {
        const endsAt = new Date(startsAt);
        endsAt.setHours(endsAt.getHours() + 1);

        const meetingUrl = `${window.location.origin}/meeting/${result.callId}`;

        const googleResponse = await fetch("/api/google-calendar/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: meetingDescription.trim(),
            description: `VibeCall Meeting\n\nJoin: ${meetingUrl}`,
            startTime: startsAt.toISOString(),
            endTime: endsAt.toISOString(),
            meetingUrl,
            callId: result.callId,
            attendees: meetingEmails
              .split(",")
              .map((email) => email.trim())
              .filter(Boolean),
          }),
        });

        if (!googleResponse.ok) {
          const data = await googleResponse.json();

          console.error("Failed to create Google Calendar event:", data.error);

          if (googleResponse.status === 401 && data.connected === false) {
            setGoogleConnected(false);
          }
        }
      }

      setSelectedDate(null);
      setMeetingDescription("");
      setMeetingTime("10:00");
      setMeetingEmails("");

      window.location.reload();
    } catch (error) {
      console.error("Failed to schedule meeting:", error);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleUpdateMeeting = async () => {
    if (!selectedMeeting?.state.startsAt || !editDescription.trim()) {
      return;
    }

    try {
      setIsUpdatingMeeting(true);

      const startsAt = new Date(selectedMeeting.state.startsAt);

      const [hours, minutes] = editTime.split(":").map(Number);

      startsAt.setHours(hours, minutes, 0, 0);

      await updateMeeting(
        selectedMeeting.id,
        editDescription.trim(),
        startsAt.toISOString(),
      );

      // Check if this meeting has a Google Calendar event
      const googleEventResponse = await fetch(
        `/api/google-calendar/events?callId=${selectedMeeting.id}`,
      );

      if (googleEventResponse.ok) {
        const googleEventData = await googleEventResponse.json();

        if (googleEventData.googleEventId) {
          if (googleEventData.googleEventLink) {
            console.log(
              "Google Calendar event:",
              googleEventData.googleEventLink,
            );
          }
          const endsAt = new Date(startsAt);
          endsAt.setHours(endsAt.getHours() + 1);

          const meetingUrl = `${window.location.origin}/meeting/${selectedMeeting.id}`;

          const updateResponse = await fetch(
            `/api/google-calendar/events/${googleEventData.googleEventId}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                title: editDescription.trim(),
                description: `VibeCall Meeting\n\nJoin: ${meetingUrl}`,
                startTime: startsAt.toISOString(),
                endTime: endsAt.toISOString(),
                meetingUrl,
                attendees: editMeetingEmails
                  .split(",")
                  .map((email) => email.trim())
                  .filter(Boolean),
              }),
            },
          );

          if (!updateResponse.ok) {
            const data = await updateResponse.json();

            console.error(
              "Failed to update Google Calendar event:",
              data.error,
            );

            if (updateResponse.status === 401 && data.connected === false) {
              setGoogleConnected(false);
            }
          }
        }
      }

      setIsEditingMeeting(false);
      setSelectedMeeting(null);
      setEditMeetingEmails("");

      window.location.reload();
    } catch (error) {
      console.error("Failed to update meeting:", error);
    } finally {
      setIsUpdatingMeeting(false);
    }
  };

  const handleDeleteMeeting = async () => {
    if (!selectedMeeting) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this meeting?",
    );

    if (!confirmed) return;

    try {
      setIsDeletingMeeting(true);

      // Find the Google Calendar event linked to this meeting
      const googleEventResponse = await fetch(
        `/api/google-calendar/events?callId=${selectedMeeting.id}`,
      );

      if (googleEventResponse.ok) {
        const googleEventData = await googleEventResponse.json();

        if (googleEventData.googleEventId) {
          const deleteResponse = await fetch(
            `/api/google-calendar/events/${googleEventData.googleEventId}?callId=${selectedMeeting.id}`,
            {
              method: "DELETE",
            },
          );
          if (!deleteResponse.ok) {
            const data = await deleteResponse.json();

            console.error(
              "Failed to delete Google Calendar event:",
              data.error,
            );

            if (deleteResponse.status === 401 && data.connected === false) {
              setGoogleConnected(false);
            }
          }
        }
      }

      // Delete the VibeCall meeting
      await deleteMeeting(selectedMeeting.id);

      setSelectedMeeting(null);

      window.location.reload();
    } catch (error) {
      console.error("Failed to delete meeting:", error);
    } finally {
      setIsDeletingMeeting(false);
    }
  };

  const isPastDate = (day: number) => {
    const date = new Date(year, month, day);

    const today = new Date();

    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return date < today;
  };

  useEffect(() => {
    const checkGoogleConnection = async () => {
      try {
        const response = await fetch("/api/google-calendar/status");
        const data = await response.json();

        setGoogleConnected(data.connected);
      } catch (error) {
        console.error("Failed to check Google Calendar status:", error);
      }
    };

    checkGoogleConnection();
  }, []);

  useEffect(() => {
    if (!callRecordings || callRecordings.length === 0) {
      setGoogleEventIds({});
      return;
    }

    const loadGoogleEventIds = async () => {
      const eventIds: Record<string, string> = {};

      await Promise.all(
        callRecordings.map(async (meeting) => {
          try {
            const response = await fetch(
              `/api/google-calendar/events?callId=${meeting.id}`,
            );

            if (response.ok) {
              const data = await response.json();

              if (data.googleEventId) {
                eventIds[meeting.id] = data.googleEventId;
              }
            }
          } catch (error) {
            console.error(
              `Failed to load Google Calendar event for ${meeting.id}:`,
              error,
            );
          }
        }),
      );

      setGoogleEventIds(eventIds);
    };

    loadGoogleEventIds();
  }, [callRecordings]);

  const monthName = currentDate.toLocaleString("default", {
    month: "long",
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const firstDayWeekday = firstDayOfMonth.getDay();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const previousMonthDays = new Date(year, month, 0).getDate();

  const calendarDays = [];

  // Previous month's days
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    calendarDays.push({
      day: previousMonthDays - i,
      currentMonth: false,
    });
  }

  // Current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day,
      currentMonth: true,
    });
  }

  // Next month's days
  let nextMonthDay = 1;

  while (calendarDays.length < 42) {
    calendarDays.push({
      day: nextMonthDay,
      currentMonth: false,
    });

    nextMonthDay++;
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const today = new Date();
  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const getMeetingsForDay = (day: number) => {
    const date = new Date(year, month, day);
    const dateKey = getDateKey(date);

    return (
      callRecordings?.filter((call: Call) => {
        if (!call.state.startsAt) return false;

        return getDateKey(new Date(call.state.startsAt)) === dateKey;
      }) || []
    );
  };

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  return (
    <section className="flex size-full flex-col gap-8 text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold lg:text-3xl">Calendar</h1>

          <p className="mt-1 text-sm text-gray-400">
            View and manage your scheduled meetings.
          </p>
          {!googleConnected && (
            <a
              href="/api/auth/google"
              className="rounded-lg bg-purple-1 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Connect Google Calendar
            </a>
          )}

          {googleConnected && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-green-500/20 px-4 py-2 text-sm font-medium text-green-400">
                Google Calendar Connected
              </span>

              <button
                onClick={async () => {
                  const confirmed = window.confirm(
                    "Are you sure you want to disconnect Google Calendar?",
                  );

                  if (!confirmed) return;

                  try {
                    const response = await fetch(
                      "/api/google-calendar/disconnect",
                      {
                        method: "POST",
                      },
                    );

                    if (!response.ok) {
                      const data = await response.json();

                      console.error(
                        "Failed to disconnect Google Calendar:",
                        data.error,
                      );

                      return;
                    }

                    setGoogleConnected(false);
                  } catch (error) {
                    console.error(
                      "Failed to disconnect Google Calendar:",
                      error,
                    );
                  }
                }}
                className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/30"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="flex h-10 w-10 items-center justify-center rounded-md bg-dark-2 text-xl transition hover:bg-dark-3"
          >
            ‹
          </button>

          <button
            onClick={goToToday}
            className="h-10 rounded-md bg-purple-1 px-4 text-sm font-medium transition hover:opacity-90"
          >
            Today
          </button>

          <button
            onClick={goToNextMonth}
            className="flex h-10 w-10 items-center justify-center rounded-md bg-dark-2 text-xl transition hover:bg-dark-3"
          >
            ›
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-dark-2 p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-center">
          <h2 className="text-xl font-semibold sm:text-2xl">
            {monthName} {year}
          </h2>
        </div>

        {isLoading && (
          <p className="mb-4 text-center text-sm text-gray-400">
            Loading meetings...
          </p>
        )}

        {/* Weekdays */}
        <div className="grid grid-cols-7">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="border-b border-dark-3 py-3 text-center text-xs font-semibold text-gray-400 sm:text-sm"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar dates */}
        <div className="grid grid-cols-7">
          {calendarDays.map((calendarDay, index) => {
            const meetings = calendarDay.currentMonth
              ? getMeetingsForDay(calendarDay.day)
              : [];

            return (
              <div
                key={index}
                onClick={() => {
                  if (
                    calendarDay.currentMonth &&
                    !isPastDate(calendarDay.day)
                  ) {
                    setSelectedDate(new Date(year, month, calendarDay.day));
                  }
                }}
                className={`min-h-[110px] border-b border-r border-dark-3 p-2 transition sm:min-h-[140px] ${
                  !calendarDay.currentMonth
                    ? "cursor-default opacity-30"
                    : isPastDate(calendarDay.day)
                      ? "cursor-default opacity-60"
                      : "cursor-pointer hover:bg-dark-3"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                    calendarDay.currentMonth && isToday(calendarDay.day)
                      ? "bg-purple-1 font-bold text-white"
                      : "text-gray-300"
                  }`}
                >
                  {calendarDay.day}
                </div>

                <div className="mt-2 flex flex-col gap-1">
                  {meetings.map((meeting) => {
                    const meetingIsPast =
                      meeting.state.startsAt &&
                      new Date(meeting.state.startsAt) < new Date();

                    return (
                      <button
                        key={meeting.id}
                        onClick={async (e) => {
                          e.stopPropagation();
                          setSelectedMeeting(meeting);
                          setGoogleEventLink(null);

                          try {
                            const response = await fetch(
                              `/api/google-calendar/events?callId=${meeting.id}`,
                            );

                            if (response.ok) {
                              const data = await response.json();

                              setGoogleEventLink(data.googleEventLink ?? null);
                            }
                          } catch (error) {
                            console.error(
                              "Failed to load Google Calendar event:",
                              error,
                            );
                          }
                        }}
                        className={`w-full rounded-md px-2 py-1.5 text-left text-xs text-white transition ${
                          meetingIsPast
                            ? "bg-dark-3 hover:bg-dark-3"
                            : "bg-purple-1/80 hover:bg-purple-1"
                        }`}
                      >
                        <p className="font-semibold">
                          {meeting.state.startsAt
                            ? new Date(
                                meeting.state.startsAt,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </p>

                        <div className="mt-0.5 flex items-center gap-1">
                          <p className="min-w-0 flex-1 truncate text-[11px] text-white/80">
                            {(meeting.state.custom?.description as string) ||
                              "Scheduled Meeting"}
                          </p>

                          {googleEventIds[meeting.id] && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={async (e) => {
                                e.stopPropagation();

                                try {
                                  const response = await fetch(
                                    `/api/google-calendar/events?callId=${meeting.id}`,
                                  );

                                  if (!response.ok) return;

                                  const data = await response.json();

                                  if (data.googleEventLink) {
                                    window.open(
                                      data.googleEventLink,
                                      "_blank",
                                      "noopener,noreferrer",
                                    );
                                  }
                                } catch (error) {
                                  console.error(
                                    "Failed to open Google Calendar event:",
                                    error,
                                  );
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }
                              }}
                              title="Open in Google Calendar"
                              className="shrink-0 cursor-pointer text-green-300 transition hover:text-green-200"
                            >
                              <ExternalLink size={12} />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-dark-2 p-6 shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Schedule Meeting</h2>

              <p className="mt-1 text-sm text-gray-400">
                {selectedDate.toLocaleDateString("default", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Meeting description
                </label>

                <input
                  type="text"
                  value={meetingDescription}
                  onChange={(e) => setMeetingDescription(e.target.value)}
                  placeholder="e.g. Team Meeting"
                  className="h-11 w-full rounded-md border border-dark-3 bg-dark-1 px-4 text-sm text-white outline-none placeholder:text-gray-500 focus:border-purple-1"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Time
                </label>

                <input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="h-11 w-full rounded-md border border-dark-3 bg-dark-1 px-4 text-sm text-white outline-none focus:border-purple-1"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Participant emails
                </label>

                <input
                  type="text"
                  value={meetingEmails}
                  onChange={(e) => setMeetingEmails(e.target.value)}
                  placeholder="e.g. john@gmail.com, priya@gmail.com"
                  className="h-11 w-full rounded-md border border-dark-3 bg-dark-1 px-4 text-sm text-white outline-none placeholder:text-gray-500 focus:border-purple-1"
                />

                <p className="mt-1.5 text-xs text-gray-500">
                  Separate multiple emails with commas.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedDate(null)}
                  className="h-11 rounded-md bg-dark-3 px-5 text-sm font-medium text-white transition hover:opacity-80"
                >
                  Cancel
                </button>

                <button
                  onClick={handleScheduleMeeting}
                  disabled={isScheduling || !meetingDescription.trim()}
                  className="h-11 rounded-md bg-purple-1 px-5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isScheduling ? "Scheduling..." : "Schedule Meeting"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Details Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-dark-2 p-6 shadow-xl">
            {!isEditingMeeting ? (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white">
                    {(selectedMeeting.state.custom?.description as string) ||
                      "Scheduled Meeting"}
                  </h2>

                  <p className="mt-2 text-sm text-gray-400">
                    {selectedMeeting.state.startsAt
                      ? new Date(
                          selectedMeeting.state.startsAt,
                        ).toLocaleDateString("default", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Date not available"}
                  </p>

                  <p className="mt-1 text-sm text-gray-400">
                    {selectedMeeting.state.startsAt
                      ? new Date(
                          selectedMeeting.state.startsAt,
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Time not available"}
                  </p>
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    onClick={async () => {
                      if (selectedMeeting.state.startsAt) {
                        const startDate = new Date(
                          selectedMeeting.state.startsAt,
                        );

                        setEditDescription(
                          (selectedMeeting.state.custom
                            ?.description as string) || "Scheduled Meeting",
                        );

                        setEditTime(
                          `${String(startDate.getHours()).padStart(
                            2,
                            "0",
                          )}:${String(startDate.getMinutes()).padStart(
                            2,
                            "0",
                          )}`,
                        );
                      }

                      try {
                        const response = await fetch(
                          `/api/google-calendar/events?callId=${selectedMeeting.id}`,
                        );

                        if (response.ok) {
                          const data = await response.json();

                          if (data.googleEventId) {
                            const eventResponse = await fetch(
                              `/api/google-calendar/events/${data.googleEventId}`,
                            );

                            if (eventResponse.ok) {
                              const eventData = await eventResponse.json();

                              setEditMeetingEmails(
                                Array.isArray(eventData.attendees)
                                  ? eventData.attendees.join(", ")
                                  : "",
                              );
                            }
                          } else {
                            setEditMeetingEmails("");
                          }
                        }
                      } catch (error) {
                        console.error(
                          "Failed to load meeting participants:",
                          error,
                        );
                      }

                      setIsEditingMeeting(true);
                    }}
                    className="h-11 rounded-md bg-dark-3 px-5 text-sm font-medium text-white transition hover:opacity-80"
                  >
                    Edit
                  </button>

                  <button
                    onClick={handleDeleteMeeting}
                    disabled={isDeletingMeeting}
                    className="h-11 rounded-md bg-red-500/80 px-5 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDeletingMeeting ? "Deleting..." : "Delete"}
                  </button>

                  {googleEventLink && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-green-400">
                        Synced with Google Calendar
                      </span>

                      <button
                        onClick={async () => {
                          window.open(
                            googleEventLink,
                            "_blank",
                            "noopener,noreferrer",
                          );
                        }}
                        className="h-11 rounded-md bg-green-600/80 px-5 text-sm font-medium text-white transition hover:bg-green-600"
                      >
                        Open in Google Calendar
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedMeeting(null)}
                    className="h-11 rounded-md bg-dark-3 px-5 text-sm font-medium text-white transition hover:opacity-80"
                  >
                    Close
                  </button>

                  <button
                    onClick={() =>
                      router.push(`/meeting/${selectedMeeting.id}`)
                    }
                    className="h-11 rounded-md bg-purple-1 px-5 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    Join Meeting
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white">Edit Meeting</h2>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Meeting description
                    </label>

                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="h-11 w-full rounded-md border border-dark-3 bg-dark-1 px-4 text-sm text-white outline-none focus:border-purple-1"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Time
                    </label>

                    <input
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="h-11 w-full rounded-md border border-dark-3 bg-dark-1 px-4 text-sm text-white outline-none focus:border-purple-1"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Participant emails
                    </label>

                    <input
                      type="text"
                      value={editMeetingEmails}
                      onChange={(e) => setEditMeetingEmails(e.target.value)}
                      placeholder="e.g. john@gmail.com, priya@gmail.com"
                      className="h-11 w-full rounded-md border border-dark-3 bg-dark-1 px-4 text-sm text-white outline-none placeholder:text-gray-500 focus:border-purple-1"
                    />

                    <p className="mt-1.5 text-xs text-gray-500">
                      Separate multiple emails with commas.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setIsEditingMeeting(false)}
                      className="h-11 rounded-md bg-dark-3 px-5 text-sm font-medium text-white transition hover:opacity-80"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleUpdateMeeting}
                      disabled={isUpdatingMeeting || !editDescription.trim()}
                      className="h-11 rounded-md bg-purple-1 px-5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isUpdatingMeeting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default CalendarPage;
