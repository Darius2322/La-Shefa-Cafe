import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Leaf,
  Clock3,
  CakeSlice,
  Users,
  CalendarCheck,
  Star,
  Tag,
  Gift,
  Heart,
  Sparkles
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getFeatureFlags } from "@/lib/settings";
import { Reveal } from "@/components/Reveal";
import { MenuMarquee } from "@/components/MenuMarquee";
import type { Product } from "@/lib/types";

const WHY_ITEMS = [
  { label: "Quality Ingredients", icon: Leaf },
  { label: "Freshly Prepared", icon: Clock3 },
  { label: "Delicious Cakes", icon: CakeSlice },
  { label: "Friendly Service", icon: Users },
  { label: "Convenient Booking", icon: CalendarCheck }
];

const CAKE_TYPES = [
  { label: "Birthday", icon: Gift },
  { label: "Wedding", icon: Heart },
  { label: "Anniversary", icon: Sparkles },
  { label: "Custom", icon: CakeSlice }
];


export const revalidate = 60;

async function getMenuHighlights() {
  // A broader pull than "featured" alone (which can be just a handful of
  // items) so the carousel has enough variety to loop nicely — still real
  // menu data, never invented.
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("is_hidden", false)
    .eq("is_available", true)
    .not("image_url", "is", null)
    .order("is_featured", { ascending: false })
    .limit(14);
  return (data as Product[]) ?? [];
}

async function getFeaturedProducts() {
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("is_hidden", false)
    .eq("is_available", true)
    .eq("is_featured", true)
    .limit(6);
  return (data as Product[]) ?? [];
}

async function getActiveOffers() {
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from("offers")
    .select("*")
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
    .limit(3);
  return data ?? [];
}

async function getApprovedReviews() {
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(3);
  return data ?? [];
}

export default async function HomePage() {
  const [highlights, featured, offers, reviews, flags] = await Promise.all([
    getMenuHighlights(),
    getFeaturedProducts(),
    getActiveOffers(),
    getApprovedReviews(),
    getFeatureFlags()
  ]);

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CafeOrCoffeeShop",
            name: "La Shefa Cafe",
            servesCuisine: "Café",
            slogan: "Eat quality, stay healthy"
          })
        }}
      />
      {/* Hero — text-led, on-brand teal ground with a subtle warm texture rather
          than a generic stock photo. When a real featured product photo exists
          it's shown as the visual anchor (actual La Shefa imagery); otherwise
          the layout stands on typography and the logo alone. */}
      <section className="relative bg-teal text-cream overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #F8F4EE 1px, transparent 0)",
            backgroundSize: "28px 28px"
          }}
          aria-hidden
        />
        <div className="container-lsc py-14 sm:py-20 md:py-24 grid md:grid-cols-2 gap-10 md:gap-12 items-center relative">
          <div>
            <p className="font-body text-caramel text-xs sm:text-sm tracking-[0.15em] uppercase mb-4">
              La Shefa Cafe
            </p>
            <h1 className="font-display italic text-display-lg sm:text-display-xl mb-5">
              Eat quality. Stay healthy.
            </h1>
            <p className="text-cream/80 text-base sm:text-lg max-w-md mb-7 font-body leading-relaxed">
              Fresh café meals, hand-pulled coffee, and cakes made to order — from our kitchen
              to your table.
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Link href="/menu" className="btn-caramel">
                View Menu
                <ArrowRight size={16} strokeWidth={2} />
              </Link>
              {flags.booking_enabled && (
                <Link href="/booking" className="btn-outline">Book Now</Link>
              )}
              <Link href="/track" className="btn-outline">Track Order</Link>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            {featured[0]?.image_url ? (
              <div className="relative w-full max-w-sm aspect-square rounded-md overflow-hidden shadow-soft-lg border border-cream/10">
                <Image
                  src={featured[0].image_url}
                  alt={featured[0].name}
                  fill
                  priority
                  sizes="(max-width: 768px) 90vw, 384px"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brown-dark/80 to-transparent p-4">
                  <p className="font-display text-cream text-sm">{featured[0].name}</p>
                </div>
              </div>
            ) : (
              <Image
                src="/logo.jpg"
                alt="La Shefa Cafe logo"
                width={300}
                height={300}
                priority
                className="rounded-md shadow-soft-lg"
              />
            )}
          </div>
        </div>
      </section>

      {/* Animated food carousel — real menu items with photos, auto-scrolling.
          Replaces an earlier category-icon version per feedback: this is
          more appetizing and shows actual dishes rather than abstract
          category labels. */}
      {highlights.length > 0 && (
        <section className="py-10 sm:py-14 border-b border-brown/10 overflow-hidden">
          <Reveal className="container-lsc">
            <h2 className="font-display text-display-sm sm:text-display-md text-brown mb-6 sm:mb-8">
              From Our Menu
            </h2>
          </Reveal>
          <MenuMarquee items={highlights.map((p) => ({ id: p.id, name: p.name, price: Number(p.price), image_url: p.image_url }))} />
        </section>
      )}

      {/* Featured menu */}
      <section className="container-lsc py-12 sm:py-16">
        <Reveal className="flex items-baseline justify-between mb-6 sm:mb-8">
          <h2 className="font-display text-display-sm sm:text-display-md text-brown">Featured Menu</h2>
          <Link href="/menu" className="text-teal text-sm font-medium hover:underline flex items-center gap-1">
            View full menu
            <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </Reveal>
        {featured.length === 0 ? (
          <EmptyState
            title="The menu is being set up"
            body="Featured dishes will appear here once products are added in the admin dashboard."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {featured.map((p, i) => (
              <Reveal key={p.id} delay={i * 60}>
                <div className="divider pt-3 sm:pt-5 card-hover rounded-sm">
                  {p.image_url && (
                    <div className="relative w-full aspect-square sm:aspect-[4/3] mb-3 sm:mb-4 overflow-hidden rounded-sm">
                      <Image
                        src={p.image_url}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <h3 className="font-display text-base sm:text-xl text-brown leading-tight">{p.name}</h3>
                  {p.description && (
                    <p className="text-xs sm:text-sm text-brown/70 mt-1 line-clamp-2 hidden sm:block">
                      {p.description}
                    </p>
                  )}
                  <p className="text-teal font-semibold mt-1.5 sm:mt-2 text-sm sm:text-base">
                    KSh {Number(p.price).toLocaleString()}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Cakes */}
      <section className="bg-cream border-y border-brown/10">
        <div className="container-lsc py-12 sm:py-16 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <Reveal>
            <h2 className="font-display text-display-sm sm:text-display-md text-brown mb-3 sm:mb-4">
              Cakes, made to order
            </h2>
            <p className="text-brown/75 mb-6 max-w-md text-sm sm:text-base leading-relaxed">
              Birthdays, weddings, anniversaries, or just because — tell us your flavor, size,
              and design, and we'll bake it fresh for your date.
            </p>
            <Link href="/cakes" className="btn-primary">
              Request a Cake
              <ArrowRight size={16} strokeWidth={2} />
            </Link>
          </Reveal>
          <Reveal delay={100} className="grid grid-cols-2 gap-3 sm:gap-4">
            {CAKE_TYPES.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="bg-white border border-brown/10 rounded-sm p-5 sm:p-6 text-center card-hover"
              >
                <Icon size={22} strokeWidth={1.75} className="mx-auto mb-2 text-caramel" />
                <p className="font-display text-sm sm:text-lg text-brown">{label}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Why La Shefa */}
      <section className="container-lsc py-12 sm:py-16">
        <Reveal>
          <h2 className="font-display text-display-sm sm:text-display-md text-brown mb-8 sm:mb-10 text-center">
            Why La Shefa
          </h2>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
          {WHY_ITEMS.map(({ label, icon: Icon }, i) => (
            <Reveal key={label} delay={i * 60} className="text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-caramel/20 flex items-center justify-center">
                <Icon size={22} strokeWidth={1.75} className="text-caramel" />
              </div>
              <p className="font-body text-brown text-xs sm:text-sm">{label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Offers */}
      {offers.length > 0 && (
        <section className="bg-brown text-cream">
          <div className="container-lsc py-12 sm:py-16">
            <Reveal>
              <h2 className="font-display text-display-sm sm:text-display-md mb-8 flex items-center gap-2">
                <Tag size={20} strokeWidth={1.75} className="text-caramel" />
                Current Offers
              </h2>
            </Reveal>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
              {offers.map((o: any, i: number) => (
                <Reveal key={o.id} delay={i * 60}>
                  <div className="border border-cream/20 rounded-sm p-4 sm:p-6 h-full card-hover">
                    <h3 className="font-display text-base sm:text-xl mb-2">{o.title}</h3>
                    {o.description && (
                      <p className="text-cream/75 text-xs sm:text-sm">{o.description}</p>
                    )}
                    {o.discount_text && (
                      <p className="text-caramel font-semibold mt-2 sm:mt-3 text-sm">
                        {o.discount_text}
                      </p>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews — horizontal scroll rail on mobile, grid on larger screens */}
      <section className="container-lsc py-12 sm:py-16">
        <Reveal>
          <h2 className="font-display text-display-sm sm:text-display-md text-brown mb-8 sm:mb-10">
            What Customers Say
          </h2>
        </Reveal>
        {reviews.length === 0 ? (
          <EmptyState
            title="No reviews yet"
            body="Be the first to share your experience."
            action={{ href: "/reviews", label: "Leave a review" }}
          />
        ) : (
          <div className="scroll-rail gap-4 -mx-5 px-5 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:gap-8">
            {reviews.map((r: any) => (
              <div
                key={r.id}
                className="divider pt-5 flex-shrink-0 w-[78vw] xs:w-72 sm:w-auto"
              >
                <div className="flex gap-0.5 mb-2" aria-label={`${r.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={15}
                      strokeWidth={1.75}
                      className={i < r.rating ? "text-caramel fill-caramel" : "text-brown/20"}
                    />
                  ))}
                </div>
                {r.review_text && (
                  <p className="text-brown/80 text-sm mb-3 line-clamp-4">{r.review_text}</p>
                )}
                <p className="text-brown font-medium text-sm">{r.customer_name}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Booking CTA */}
      <section className="bg-teal text-cream">
        <div className="container-lsc py-12 sm:py-16 text-center">
          <h2 className="font-display text-display-sm sm:text-display-md mb-4">Ready to order?</h2>
          <p className="text-cream/80 mb-7 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
            Browse the menu, place your order, and track it in real time — no account needed.
          </p>
          <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
            <Link href="/menu" className="btn-caramel">
              Order Now
              <ArrowRight size={16} strokeWidth={2} />
            </Link>
            {flags.booking_enabled && (
              <Link href="/booking" className="btn-outline">Book a Table</Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function EmptyState({
  title,
  body,
  action
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="border border-dashed border-brown/25 rounded-sm p-10 text-center">
      <p className="font-display text-xl text-brown mb-2">{title}</p>
      <p className="text-brown/60 text-sm max-w-sm mx-auto">{body}</p>
      {action && (
        <Link href={action.href} className="inline-block mt-4 text-teal font-medium hover:underline">
          {action.label}
        </Link>
      )}
    </div>
  );
}
