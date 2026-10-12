"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type AuthRouteGuardProps = {
  children: ReactNode;
  mode: "public" | "protected";
};

export function AuthRouteGuard({ children, mode }: AuthRouteGuardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "allowed" | "unavailable">(
    "checking",
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    api
      .get("/auth/me")
      .then(() => {
        if (!active) return;
        if (mode === "public") {
          router.replace("/dashboard");
          return;
        }
        setStatus("allowed");
      })
      .catch((error: unknown) => {
        if (!active) return;

        if (axios.isAxiosError(error) && error.response?.status === 401) {
          if (mode === "protected") {
            router.replace("/");
            return;
          }
          setStatus("allowed");
          return;
        }

        setStatus("unavailable");
      });

    return () => {
      active = false;
    };
  }, [attempt, mode, router]);

  if (status === "allowed") return children;
  if (status === "unavailable") {
    return (
      <button type="button" onClick={() => setAttempt((value) => value + 1)}>
        Retry
      </button>
    );
  }
  return null;
}
