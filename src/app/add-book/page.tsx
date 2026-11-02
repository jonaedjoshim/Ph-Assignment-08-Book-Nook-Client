import type { Metadata } from "next";

import AddBookForm from "@/components/books/add-book-form";

export const metadata: Metadata = {
  title: "Add a Book",
  description:
    "Add a book to the BookNook community library and share it with other readers.",
};

export default function AddBookPage() {
  return <AddBookForm />;
}
