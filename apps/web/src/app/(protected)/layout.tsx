import type { ReactNode } from "react";
import { AuthRouteGuard } from "@/components/auth-route-guard";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <AuthRouteGuard mode="protected">{children}</AuthRouteGuard>;
}
