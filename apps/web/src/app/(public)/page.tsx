import { API_BASE_URL } from "@/lib/api-config";

export default function Home() {
  return (
    <main className="home-page">
      <a className="login-link" href={`${API_BASE_URL}/auth/google`}>
        Login with Google
      </a>
    </main>
  );
}
