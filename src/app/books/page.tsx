import type { Metadata } from "next";

import { AllBooksView } from "@/components/books/all-books-view";

export const metadata: Metadata = {
  title: "BookNook | All Books",
  description:
    "Browse books in the BookNook online library by title, author, and category.",
};

export default function BooksPage() {
  return <AllBooksView />;
}
