import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";

export const revalidate = 60;

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
  const [featured, offers, reviews] = await Promise.all([
    getFeaturedProducts(),
    getActiveOffers(),
    getApprovedReviews()
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-teal text-cream">
        <div className="container-lsc py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="font-body text-caramel text-sm tracking-wide mb-4">La Shefa Cafe</p>
            <h1 className="font-display italic text-4xl md:text-5xl leading-[1.1] mb-6">
              Eat quality. Stay healthy.
            </h1>
            <p className="text-cream/80 text-lg max-w-md mb-8 font-body">
              Fresh café meals, hand-pulled coffee, and cakes made to order — from our kitchen
              to your table.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/menu" className="btn-caramel">View Menu</Link>
              <Link href="/booking" className="btn-outline">Book Now</Link>
              <Link href="/track" className="btn-outline">Track Order</Link>
            </div>
          </div>
          <div className="flex justify-center">
            <Image
              src="/logo.jpg"
              alt="La Shefa Cafe logo"
              width={340}
              height={340}
              priority
              className="rounded-md"
            />
          </div>
        </div>
      </section>

      {/* Featured menu */}
      <section className="container-lsc py-16">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-display text-3xl text-brown">Featured Menu</h2>
          <Link href="/menu" className="text-teal text-sm font-medium hover:underline">
            View full menu
          </Link>
        </div>
        {featured.length === 0 ? (
          <EmptyState
            title="The menu is being set up"
            body="Featured dishes will appear here once products are added in the admin dashboard."
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featured.map((p) => (
              <div key={p.id} className="divider pt-5">
                {p.image_url && (
                  <div className="relative w-full aspect-[4/3] mb-4 overflow-hidden rounded-sm">
                    <Image src={p.image_url} alt={p.name} fill className="object-cover" />
                  </div>
                )}
                <h3 className="font-display text-xl text-brown">{p.name}</h3>
                {p.description && (
                  <p className="text-sm text-brown/70 mt-1 line-clamp-2">{p.description}</p>
                )}
                <p className="text-teal font-semibold mt-2">
                  KSh {Number(p.price).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cakes */}
      <section className="bg-cream border-y border-brown/10">
        <div className="container-lsc py-16 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-3xl text-brown mb-4">Cakes, made to order</h2>
            <p className="text-brown/75 mb-6 max-w-md">
              Birthdays, weddings, anniversaries, or just because — tell us your flavor, size,
              and design, and we'll bake it fresh for your date.
            </p>
            <Link href="/cakes" className="btn-primary">Request a Cake</Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {["Birthday", "Wedding", "Anniversary", "Custom"].map((c) => (
              <div key={c} className="bg-white border border-brown/10 rounded-sm p-6 text-center">
                <p className="font-display text-lg text-brown">{c}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why La Shefa */}
      <section className="container-lsc py-16">
        <h2 className="font-display text-3xl text-brown mb-10 text-center">Why La Shefa</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {[
            "Quality Ingredients",
            "Freshly Prepared",
            "Delicious Cakes",
            "Friendly Service",
            "Convenient Booking"
          ].map((item) => (
            <div key={item} className="text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-caramel/20 flex items-center justify-center">
                <span className="h-2 w-2 rounded-full bg-caramel" />
              </div>
              <p className="font-body text-brown text-sm">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Offers */}
      {offers.length > 0 && (
        <section className="bg-brown text-cream">
          <div className="container-lsc py-16">
            <h2 className="font-display text-3xl mb-8">Current Offers</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {offers.map((o: any) => (
                <div key={o.id} className="border border-cream/20 rounded-sm p-6">
                  <h3 className="font-display text-xl mb-2">{o.title}</h3>
                  {o.description && <p className="text-cream/75 text-sm">{o.description}</p>}
                  {o.discount_text && (
                    <p className="text-caramel font-semibold mt-3">{o.discount_text}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews */}
      <section className="container-lsc py-16">
        <h2 className="font-display text-3xl text-brown mb-10">What Customers Say</h2>
        {reviews.length === 0 ? (
          <EmptyState
            title="No reviews yet"
            body="Be the first to share your experience."
            action={{ href: "/reviews", label: "Leave a review" }}
          />
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {reviews.map((r: any) => (
              <div key={r.id} className="divider pt-5">
                <p className="text-caramel mb-2" aria-label={`${r.rating} out of 5 stars`}>
                  {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                </p>
                {r.review_text && <p className="text-brown/80 text-sm mb-3">{r.review_text}</p>}
                <p className="text-brown font-medium text-sm">{r.customer_name}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Booking CTA */}
      <section className="bg-teal text-cream">
        <div className="container-lsc py-16 text-center">
          <h2 className="font-display text-3xl mb-4">Ready to order?</h2>
          <p className="text-cream/80 mb-8 max-w-md mx-auto">
            Browse the menu, place your order, and track it in real time — no account needed.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/menu" className="btn-caramel">Order Now</Link>
            <Link href="/booking" className="btn-outline">Book a Table</Link>
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
