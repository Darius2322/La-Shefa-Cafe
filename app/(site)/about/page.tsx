import Image from "next/image";
import { OrderCta } from "@/components/OrderCta";

export const metadata = { title: "About — La Shefa Cafe" };

export default function AboutPage() {
  return (
    <div className="container-lsc py-16 max-w-prose">
      <h1 className="font-display text-4xl text-brown mb-8">About La Shefa Cafe</h1>
      <div className="flex justify-center mb-10">
        <Image src="/logo.jpg" alt="La Shefa Cafe" width={160} height={160} className="rounded-sm" />
      </div>
      <p className="text-brown/80 leading-relaxed mb-4">
        La Shefa Cafe was built on one idea: eat quality, stay healthy. From our coffee to our
        cakes, everything is prepared fresh, with care, for people who want good food without
        compromise.
      </p>
      <p className="text-brown/80 leading-relaxed">
        Whether you're stopping in for a quick coffee, sitting down for a full meal, or ordering
        a cake for a celebration, we aim to make it warm, simple, and genuinely delicious.
      </p>
      <OrderCta />
    </div>
  );
}
