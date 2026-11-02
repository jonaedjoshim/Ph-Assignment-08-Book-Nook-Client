import type { Metadata } from "next";

import { MyProfileView } from "@/components/profile/my-profile-view";

export const metadata: Metadata = {
  title: "BookNook | My Profile",
  description: "View your BookNook account and reading profile.",
};

export default function MyProfilePage() {
  return <MyProfileView />;
}
