"use client";

import React from "react"
import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const navLinks = [
  { name: "Home", href: "#home" },
  { name: "Speech Master", href: "speechmaster" },
  { name: "About Us", href: "#about" },
  { name: "Contact Us", href: "#contact" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSpeechMasterDialog, setShowSpeechMasterDialog] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href === "speechmaster") {
      e.preventDefault();
      setShowSpeechMasterDialog(true);
    }
  };

  const handleConfirmSpeechMaster = () => {
    setShowSpeechMasterDialog(false);
    window.open("https://forms.google.com", "_blank");
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-border"
            : "bg-transparent"
        }`}
      >
        <nav className="container mx-auto px-8 sm:px-6 lg:px-8 max-w-4xl">
          <div className="flex items-center justify-between h-10 lg:h-12">
            {/* Logo */}
            <Link href="#home" className="flex items-center gap-2">
              <div className="w-7 h-7 relative">
                <Image
                  src="/logo.png"
                  alt="Gavel Club USJ"
                  fill
                  className="object-contain"
                />
              </div>
              <span className={`font-semibold text-sm transition-colors ${
                isScrolled ? "text-foreground" : "text-white"
              }`}>
                Gavel Club USJ
              </span>
            </Link>

            {/* Desktop Navigation - aligned right */}
            <div className="hidden lg:flex items-center gap-5">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href === "speechmaster" ? "#" : link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`transition-colors font-medium text-sm ${
                    isScrolled 
                      ? "text-foreground/80 hover:text-[#781007]" 
                      : "text-white/90 hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2 transition-colors ${
                isScrolled ? "text-foreground" : "text-white"
              }`}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden overflow-hidden bg-white rounded-b-2xl shadow-lg"
              >
                <div className="py-4 space-y-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href === "speechmaster" ? "#" : link.href}
                      onClick={(e) => {
                        handleNavClick(e, link.href);
                        if (link.href !== "speechmaster") {
                          setIsMobileMenuOpen(false);
                        }
                      }}
                      className="block px-4 py-3 text-foreground/80 hover:text-[#781007] hover:bg-muted transition-colors"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </motion.header>

      {/* Speech Master Registration Dialog */}
      <Dialog open={showSpeechMasterDialog} onOpenChange={setShowSpeechMasterDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Register for Speech Master
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              You will be redirected to the registration form. Would you like to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setShowSpeechMasterDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSpeechMaster}
              className="flex-1 bg-[#781007] hover:bg-[#781007]/90 text-white"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
