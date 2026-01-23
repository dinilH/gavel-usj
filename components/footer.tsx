"use client";

import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Youtube } from "lucide-react";

const footerLinks = [
  { name: "Home", href: "#home" },
  { name: "Speech Master", href: "#speech-master" },
  { name: "About Us", href: "#about" },
  { name: "Contact Us", href: "#contact" },
];

const socialLinks = [
  { name: "Facebook", icon: Facebook, href: "https://www.facebook.com/gavelclubofusjp" },
  { name: "Instagram", icon: Instagram, href: "https://www.instagram.com/gavelclub.usj/" },
  { name: "YouTube", icon: Youtube, href: "https://www.youtube.com/@gavelclubusj8286" },
  { name: "LinkedIn", icon: Linkedin, href: "https://www.linkedin.com/company/gavel-club-of-university-of-sri-jayewardenepura/" },
];

export function Footer() {
  return (
    <footer className="bg-white border-t border-border">
      <div className="container mx-auto px-8 sm:px-6 lg:px-8 max-w-3xl py-4">
        {/* Social Links */}
        <div className="flex justify-center gap-2 mb-3">
          {socialLinks.map((social) => (
            <Link
              key={social.name}
              href={social.href}
              className="w-7 h-7 rounded-full bg-[#EEF1F4] flex items-center justify-center hover:bg-[#781007] hover:text-white transition-colors text-muted-foreground"
              aria-label={social.name}
              target="_blank"
            >
              <social.icon className="w-3.5 h-3.5" />
            </Link>
          ))}
        </div>

        {/* Navigation Links */}
        <div className="flex flex-wrap justify-center gap-6 mb-3">
          {footerLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-xs text-muted-foreground hover:text-[#781007] transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            2026 Gavel Club USJ. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
