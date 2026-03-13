import { getSidebarDataForUser } from "@/lib/dashboard/sidebar-data";
import type { ExtendedUser } from "@/lib/types";
import { DosenProfileContent } from "./dosen-profile-content";
import Nav from "./nav";
import { ProfileContent } from "./profile-content";
import Sidebar from "./sidebar";

interface ProfileLayoutProps {
  user: ExtendedUser;
}

export async function ProfileLayout({ user }: ProfileLayoutProps) {
  const sidebarData = await getSidebarDataForUser(user);

  return (
    <main className="bg-accent px-10 py-8 h-screen flex flex-col overflow-hidden">
      <div className="mb-8">
        <Nav user={user} />
      </div>
      <div className="grid grid-cols-[auto_1fr] flex-1 min-h-0">
        <Sidebar user={sidebarData.user} notStartedCount={sidebarData.notStartedCount} />
        <div className="px-8 pb-0 min-h-0">
          {user.role === "TEACHER" ? (
            <DosenProfileContent user={user} />
          ) : (
            <ProfileContent user={user} />
          )}
        </div>
      </div>
    </main>
  );
}
