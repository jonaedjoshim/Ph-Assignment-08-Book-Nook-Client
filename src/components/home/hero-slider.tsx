"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ArrowLeft, ArrowRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";

import { Button } from "@/components/ui/button";
import Container from "@/components/layout/container";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const slides = [
  {
    id: 1,
    eyebrow: "A HOME FOR BOOK LOVERS",
    title: "A quiet corner for",
    highlight: "curious minds.",
    description:
      "Step into a world of thoughtful reads, timeless stories, and unexpected discoveries. Your next chapter begins here.",
    image:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&q=85",
    imageAlt: "Warm and inviting library filled with books",
    number: "01",
  },
  {
    id: 2,
    eyebrow: "SHARE THE JOY OF READING",
    title: "Great stories deserve",
    highlight: "to be shared.",
    description:
      "Discover books worth passing along. Borrow a story, explore new perspectives, and keep the love of reading alive.",
    image:
      "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=1200&q=85",
    imageAlt: "Beautiful collection of books on wooden shelves",
    number: "02",
  },
  {
    id: 3,
    eyebrow: "YOUR NEXT CHAPTER AWAITS",
    title: "Your next favorite book",
    highlight: "is waiting.",
    description:
      "From captivating fiction to fascinating discoveries, find the books that speak to you and make every page count.",
    image:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=85",
    imageAlt: "Bookshelves in a cozy library",
    number: "03",
  },
];

export default function HeroSlider() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        slidesPerView={1}
        loop
        speed={900}
        autoplay={{
          delay: 6000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        navigation={{
          prevEl: ".hero-prev",
          nextEl: ".hero-next",
        }}
        pagination={{
          el: ".hero-pagination",
          clickable: true,
          bulletClass: "hero-bullet",
          bulletActiveClass: "hero-bullet-active",
        }}
        className="hero-swiper"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <Container>
              <div className="grid min-h-162.5 items-center gap-12 py-16 lg:min-h-180 lg:grid-cols-2 lg:gap-20 lg:py-20">
                {/* Content */}
                <div className="relative z-10 max-w-xl">
                  <div className="mb-8 flex items-center gap-3">
                    <span className="h-px w-8 bg-primary" />
                    <span className="text-[11px] font-semibold tracking-[0.22em] text-primary">
                      {slide.eyebrow}
                    </span>
                  </div>

                  <h1 className="font-serif text-[clamp(3.5rem,6vw,6.5rem)] leading-[0.95] font-medium tracking-[-0.045em] text-foreground">
                    {slide.title}
                    <br />
                    <span className="italic text-primary">
                      {slide.highlight}
                    </span>
                  </h1>

                  <p className="mt-8 max-w-md text-base leading-8 text-muted-foreground sm:text-lg">
                    {slide.description}
                  </p>

                  <div className="mt-10 flex flex-wrap items-center gap-6">
                    <Button
                      nativeButton={false}
                      render={<Link href="/books" />}
                      size="lg"
                      className="h-12 rounded-md px-7"
                    >
                      Browse Books
                      <ArrowUpRight className="ml-2 size-4" />
                    </Button>

                    <span className="text-xs tracking-[0.15em] text-muted-foreground">
                      READ · DISCOVER · BELONG
                    </span>
                  </div>
                </div>

                {/* Visual */}
                <div className="relative mx-auto w-full max-w-135 lg:ml-auto">
                  <div className="absolute -top-6 -left-6 hidden h-32 w-32 rounded-full border border-primary/20 lg:block" />

                  <div className="absolute -right-5 -bottom-5 hidden h-40 w-40 rounded-full bg-primary/5 lg:block" />

                  <div className="relative aspect-4/4.5 overflow-hidden rounded-t-[45%] rounded-b-md bg-muted">
                    <Image
                      src={slide.image}
                      alt={slide.imageAlt}
                      fill
                      priority={slide.id === 1}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />

                    <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />

                    <div className="absolute right-6 bottom-6 left-6 flex items-end justify-between text-white">
                      <div>
                        <p className="mb-1 text-[10px] tracking-[0.2em] uppercase">
                          The BookNook Collection
                        </p>

                        <p className="font-serif text-2xl italic">
                          Stories live here.
                        </p>
                      </div>

                      <span className="font-serif text-4xl">
                        {slide.number}
                      </span>
                    </div>
                  </div>

                  <div className="absolute -bottom-5 -left-5 hidden rounded-md border border-border bg-card px-6 py-4 shadow-sm sm:block">
                    <p className="font-serif text-xl italic text-foreground">
                      A little more wonder,
                    </p>
                    <p className="text-xs tracking-wide text-muted-foreground">
                      one page at a time.
                    </p>
                  </div>
                </div>
              </div>
            </Container>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Slider Controls */}
      <Container>
        <div className="relative z-10 flex items-center justify-between border-t border-border py-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold tracking-widest text-primary">
              FEATURED STORIES
            </span>

            <div className="hero-pagination flex items-center gap-2" />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Previous slide"
              className="hero-prev flex size-10 cursor-pointer items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              <ArrowLeft className="size-4" />
            </button>

            <button
              type="button"
              aria-label="Next slide"
              className="hero-next flex size-10 cursor-pointer items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}
