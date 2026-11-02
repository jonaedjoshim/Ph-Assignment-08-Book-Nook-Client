import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

interface ImgBBResponse {
  success?: boolean;
  data?: {
    url?: string;
  };
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Sign in to upload a book cover." },
        { status: 401 },
      );
    }

    const apiKey = process.env.IMGBB_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "Image upload is not configured." },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Choose an image to upload." },
        { status: 400 },
      );
    }

    if (image.size === 0 || image.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "Choose an image smaller than 4 MB.",
        },
        { status: 400 },
      );
    }

    if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Use a JPG, PNG, or WebP image.",
        },
        { status: 400 },
      );
    }

    const uploadData = new FormData();
    uploadData.append("image", image, image.name);

    const uploadResponse = await fetch(
      `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        body: uploadData,
        cache: "no-store",
      },
    );

    const result = (await uploadResponse
      .json()
      .catch(() => null)) as ImgBBResponse | null;

    if (!uploadResponse.ok || !result?.success || !result.data?.url) {
      console.error("ImgBB rejected the image upload.");

      return NextResponse.json(
        { success: false, message: "The image could not be uploaded." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { imageUrl: result.data.url },
    });
  } catch (error) {
    console.error("Image upload failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to upload the image." },
      { status: 500 },
    );
  }
}
