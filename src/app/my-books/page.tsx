import type { Metadata } from "next";
import MyBooksView from "@/components/books/my-books-view";

export const metadata: Metadata = {
  title: "My Books",
  description:
    "Manage the books you have added to the BookNook community bookshelf.",
};

export default function MyBooksPage() {
  return <MyBooksView />;
}
