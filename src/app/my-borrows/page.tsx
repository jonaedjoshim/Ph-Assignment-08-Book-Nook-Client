import type { Metadata } from "next";

import { MyBorrowsView } from "@/components/borrows/my-borrows-view";

export const metadata: Metadata = {
  title: "BookNook | My Borrows",
  description:
    "View your borrowed books, due dates, and return status in BookNook.",
};

export default function MyBorrowsPage() {
  return <MyBorrowsView />;
}
