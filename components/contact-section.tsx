"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { MapPin, Mail, Phone } from "lucide-react";
import Image from "next/image";

const contactInfo = [
  {
    icon: MapPin,
    title: "Address",
    content: "University of Sri Jayewardenepura, Nugegoda, Sri Lanka",
  },
  {
    icon: Mail,
    title: "Email",
    content: "gavelclubusj@gmail.com",
  },
];

const teamContacts = [
  {
    name: "Hrithika Sarvodayan",
    position: "President",
    phone: "+94 776220192",
    image: "/exco/18.jpg",
  },
  {
    name: "Ranugi Fonseka",
    position: "Vice President – Education",
    phone: "+94 741547722",
    image: "/exco/17.jpg",
  },
  {
    name: "Abina Jude",
    position: "Vice President – Membership",
    phone: "+94 775453105",
    image: "/exco/16.jpg",
  },
  {
    name: "Nabeel Nawzar",
    position: "Vice President – Public Relations",
    phone: "+94 710827804",
    image: "/exco/15.jpg",
  },
];

export function ContactSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="contact" className="py-20 bg-[#EEF1F4]">
      <div className="container mx-auto px-8 sm:px-6 lg:px-8 max-w-5xl" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-[#781007] to-[#000000] bg-clip-text text-transparent">
              Contact Us
            </span>
          </h2>
        </motion.div>

        {/* Contact Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8"
        >
          {contactInfo.map((info) => (
            <div
              key={info.title}
              className="flex items-start gap-4 p-6 rounded-xl bg-white border border-border"
            >
              <div className="w-12 h-12 rounded-lg bg-[#781007] flex items-center justify-center flex-shrink-0">
                <info.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{info.title}</h3>
                <p className="text-muted-foreground text-sm">{info.content}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Team Contact Cards - without heart icon */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto"
        >
          {teamContacts.map((contact, index) => (
            <div key={index} className="p-5 rounded-xl bg-white border border-border text-center">
              {/* Avatar */}
              <div className="w-28 h-28 mx-auto rounded-full overflow-hidden bg-[#EEF1F4] mb-2 relative">
                <Image
                  src={contact.image}
                  alt={contact.name}
                  fill
                  className="object-cover"
                />
              </div>

              <h3 className="font-bold text-foreground mb-1 text-base break-words">{contact.name}</h3>
              <p className="text-[#781007] text-sm font-medium mb-2 line-clamp-2 min-h-[2rem]">{contact.position}</p>
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span className="break-all">{contact.phone}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
