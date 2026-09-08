import Link from "next/link";

export function OrderCta() {
  return (
    <div className="mt-16 border-t border-brown/10 pt-10 text-center">
      <p className="font-display text-2xl text-brown mb-4">Hungry? Order online.</p>
      <Link href="/menu" className="btn-caramel">
        Order Now
      </Link>
    </div>
  );
}
