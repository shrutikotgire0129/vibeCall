"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useGetCallById } from "@/hooks/useGetCallById";
import { Loader } from "lucide-react";
import { Button } from "@/components/ui/button";

const MeetingDetailsPage = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const router = useRouter();

  const { id } = use(params);

  const { call, isCallLoading } = useGetCallById(id);

  if (isCallLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="animate-spin" />
      </div>
    );
  }

  if (!call) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-center text-2xl font-bold text-white">
          Meeting Not Found
        </p>
      </div>
    );
  }

  const description = call.state?.custom?.description || "No description";

  const startsAt = call.state?.startsAt ? new Date(call.state.startsAt) : null;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-2xl rounded-2xl bg-dark-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Meeting Details</h1>

          <p className="mt-2 text-sky-2">
            View meeting information before joining.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm text-sky-2">Description</p>

            <p className="mt-1 text-xl font-semibold text-white">
              {description}
            </p>
          </div>

          <div>
            <p className="text-sm text-sky-2">Meeting ID</p>

            <p className="mt-1 break-all text-lg text-white">{call.id}</p>
          </div>

          <div>
            <p className="text-sm text-sky-2">Scheduled Time</p>

            <p className="mt-1 text-lg text-white">
              {startsAt ? startsAt.toLocaleString() : "Not scheduled"}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => router.back()}
              className="bg-dark-3 text-white"
            >
              Back
            </Button>

            <Button
              onClick={() => router.push(`/meeting/${call.id}`)}
              className="bg-blue-1 text-white"
            >
              Join Meeting
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default MeetingDetailsPage;
