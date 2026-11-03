# BookNook — A Small Online Library

BookNook is an online library where readers can discover books, share titles with others, borrow available copies, and return them when they are done.

> Great stories deserve to be shared.

## Live Website

[Visit BookNook](https://book-nook-mj.vercel.app/)

## Features

- **Browse the library:** View books in a responsive grid, search by title or author, and filter by category.
- **Discover new arrivals:** See the six latest books added to the library on the homepage.
- **Create an account:** Register and sign in with email and password, or use Google sign-in.
- **Add books:** Add book details and upload a cover image through ImgBB.
- **Manage your collection:** View, edit, and delete books you have added.
- **Borrow and return:** Borrow an available book and return it from your borrowing history.
- **Track copy availability:** Available copies update as books are borrowed and returned.
- **Prevent duplicate borrowing:** A reader cannot have two active borrows for the same book.
- **Seven-day borrowing period:** Borrow records include a borrowing date and due date.
- **Read on any device:** Responsive mobile, tablet, and desktop layouts with light and dark themes.

## Tech Stack

- **Frontend:** Next.js App Router, React, TypeScript
- **Styling and UI:** Tailwind CSS, shadcn/ui
- **Authentication:** Better Auth, MongoDB adapter, Google OAuth
- **API authorization:** JWT
- **Notifications:** Sonner
- **Image upload:** ImgBB
- **Icons and slider:** Lucide, Swiper

## Pages

| Route | Access | Description |
| --- | --- | --- |
| `/` | Public | Homepage, book slider, new arrivals, and library sections |
| `/books` | Public | Browse, search, and filter books |
| `/books/[id]` | Signed-in users | View a book and borrow an available copy |
| `/add-book` | Signed-in users | Add a book to the library |
| `/my-books` | Signed-in users | Manage books you added |
| `/my-borrows` | Signed-in users | View borrowing history and return books |
| `/my-profile` | Signed-in users | View your BookNook profile |

## API Server

The Client uses the separate BookNook Express Server:

[BookNook API — Render](https://book-nook-server-gz2l.onrender.com/books)

The Server source code is maintained in a separate repository.

## Run Locally

1. Install the Client dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file in the Client project root. Configure the environment variables required by your local setup:

   - `MONGODB_URI`
   - `DB_NAME`
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL`
   - `NEXT_PUBLIC_BETTER_AUTH_URL`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXT_PUBLIC_API_URL`
   - `DNS_SERVERS`
   - `IMGBB_API_KEY`

   Keep secret values in your local environment file or deployment environment. Do not commit them.

3. Start the Express Server in its own terminal, then start the Client:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

For local development, `NEXT_PUBLIC_API_URL` should point to the local Express Server. In production, it should point to the deployed Render API.

## Checks

```bash
npm run lint
npm run build
```

## Security

Never commit `.env`, `.env.local`, MongoDB credentials, authentication secrets, Google OAuth secrets, or the ImgBB API key. Keep the ImgBB key server-side and do not expose it using a `NEXT_PUBLIC_` variable.
