import Link from "next/link";
import Image from "next/image";
import {
  FacebookIcon,
  InstagramIcon,
  TiktokIcon,
  XIcon,
  YoutubeIcon,
  WhatsappIcon
} from "./SocialIcons";

type SocialLinks = Partial<{
  facebook: string;
  instagram: string;
  tiktok: string;
  x: string;
  youtube: string;
  whatsapp: string;
}>;

export function Footer({
  bookingEnabled = true,
  socialLinks
}: {
  bookingEnabled?: boolean;
  socialLinks?: SocialLinks;
}) {
  const year = new Date().getFullYear();
  const social = socialLinks ?? {};
  const hasSocial = Object.values(social).some((v) => v && v.trim());

  return (
    <footer className="bg-teal text-cream mt-24">
      <div className="container-lsc py-14 grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Image src="/logo.jpg" alt="La Shefa Cafe" width={40} height={40} className="rounded-sm" />
            <span className="font-display text-lg">La Shefa Cafe</span>
          </div>
          <p className="text-sm text-cream/75 max-w-xs mb-4">
            Eat quality, stay healthy. Fresh café food and made-to-order cakes, prepared daily.
          </p>
          {hasSocial && (
            <div className="flex items-center gap-3">
              {social.facebook && (
                <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-cream/80 hover:text-caramel">
                  <FacebookIcon className="w-5 h-5" />
                </a>
              )}
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-cream/80 hover:text-caramel">
                  <InstagramIcon className="w-5 h-5" />
                </a>
              )}
              {social.tiktok && (
                <a href={social.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-cream/80 hover:text-caramel">
                  <TiktokIcon className="w-5 h-5" />
                </a>
              )}
              {social.x && (
                <a href={social.x} target="_blank" rel="noopener noreferrer" aria-label="X" className="text-cream/80 hover:text-caramel">
                  <XIcon className="w-5 h-5" />
                </a>
              )}
              {social.youtube && (
                <a href={social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-cream/80 hover:text-caramel">
                  <YoutubeIcon className="w-5 h-5" />
                </a>
              )}
              {social.whatsapp && (
                <a href={social.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-cream/80 hover:text-caramel">
                  <WhatsappIcon className="w-5 h-5" />
                </a>
              )}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-body text-sm font-semibold mb-3 text-caramel">Quick Links</h3>
          <ul className="space-y-2 text-sm text-cream/80">
            <li><Link href="/menu" className="hover:text-caramel">Menu</Link></li>
            <li><Link href="/cakes" className="hover:text-caramel">Cakes</Link></li>
            {bookingEnabled && (
              <li><Link href="/booking" className="hover:text-caramel">Booking</Link></li>
            )}
            <li><Link href="/track" className="hover:text-caramel">Track Order</Link></li>
            <li><Link href="/faq" className="hover:text-caramel">FAQ</Link></li>
            <li><Link href="/contact" className="hover:text-caramel">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-body text-sm font-semibold mb-3 text-caramel">Legal</h3>
          <ul className="space-y-2 text-sm text-cream/80">
            <li><Link href="/terms" className="hover:text-caramel">Terms &amp; Conditions</Link></li>
            <li><Link href="/privacy" className="hover:text-caramel">Privacy Policy</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-body text-sm font-semibold mb-3 text-caramel">Visit Us</h3>
          <p className="text-sm text-cream/80 leading-relaxed">
            Contact details and opening hours are managed from the admin dashboard and will appear here once configured.
          </p>
        </div>
      </div>
      <div className="border-t border-cream/15">
        <div className="container-lsc py-4 text-xs text-cream/60">
          © {year} La Shefa Cafe. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
