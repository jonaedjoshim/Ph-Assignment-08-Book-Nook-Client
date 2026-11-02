import type { Metadata } from "next";

import { BookDetailsView } from "@/components/books/book-details-view";

type BookDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: BookDetailsPageProps): Promise<Metadata> {
  await params;

  return {
    title: "BookNook | Book Details",
    description:
      "Read book details and check availability in the BookNook online library.",
  };
}

export default async function BookDetailsPage({
  params,
}: BookDetailsPageProps) {
  const { id } = await params;

  return <BookDetailsView bookId={id} />;
}
