type IconProps = { className?: string };

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M13.5 21v-7.5h2.5l.4-3H13.5V8.5c0-.87.24-1.46 1.49-1.46H16.5V4.34C16.18 4.3 15.1 4.2 13.85 4.2c-2.6 0-4.38 1.59-4.38 4.5V10.5H7v3h2.47V21h4.03z" />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="3.7" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TiktokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16.7 3h-2.9v12.4a2.6 2.6 0 1 1-1.9-2.5v-3a5.6 5.6 0 1 0 4.8 5.5V9.3a7.6 7.6 0 0 0 4.3 1.3V7.7a4.7 4.7 0 0 1-4.3-4.7z" />
    </svg>
  );
}

export function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M4 4l7 8.6L4.3 20h2.1l5.9-6.5 4.5 6.5H20l-7.3-9.1L19.4 4h-2.1l-5.4 6-4.1-6H4z" />
    </svg>
  );
}

export function YoutubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="2.5" y="6" width="19" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.3 9.5v5l4.4-2.5z" />
    </svg>
  );
}

export function WhatsappIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 3.5a8.4 8.4 0 0 0-7.2 12.7L3.5 20.5l4.4-1.3A8.4 8.4 0 1 0 12 3.5zm0 1.6a6.8 6.8 0 1 1-3.6 12.5l-.3-.2-2.6.8.8-2.5-.2-.3A6.8 6.8 0 0 1 12 5.1zm-3.1 3.4c-.2 0-.4.1-.5.3-.2.2-.6.6-.6 1.4 0 .8.6 1.6.7 1.7.1.1 1.3 2.1 3.3 2.9 1.6.7 1.9.5 2.3.5.4 0 1.2-.5 1.4-.9.2-.5.2-.9.1-1-.1-.1-.2-.2-.5-.3l-1.4-.7c-.2-.1-.3-.1-.5.1l-.6.8c-.1.1-.2.2-.4.1-.2-.1-.9-.3-1.7-1-.6-.6-1-1.3-1.2-1.5-.1-.2 0-.3.1-.4l.4-.5c.1-.1.1-.3 0-.4l-.6-1.5c-.1-.3-.3-.3-.5-.3h-.3z" />
    </svg>
  );
}
