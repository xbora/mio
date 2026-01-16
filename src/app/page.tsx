import { withAuth } from "@workos-inc/authkit-nextjs";
import { MioLanding } from "./components/mio-landing";
import { redirect } from "next/navigation";
import { getSupabaseUser } from "@/lib/supabase-users";

export default async function HomePage() {
  const { user } = await withAuth();
  
  if (user) {
    // Redirect authenticated users to chat
    redirect('/chat');
  }

  return <MioLanding />;
}
