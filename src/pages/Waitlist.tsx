import React, { useState } from "react";
import emailjs from "emailjs-com";
import Logo from "@/assets/svg/logo-name.svg?react";
import HeroSectionMobile from "@/assets/png/waitlist-hero-section-mobile.png";
import HeroSection from "@/assets/png/waitlist-hero-section.png";
import Features from "@/assets/png/features.png";
import WorldMap from "@/assets/png/world-map.png";

const RedditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
  </svg>
);
const InstagramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
);
const DiscordIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const WaitlistForm = ({ variant = "hero" }: { variant?: "hero" | "cta" }) => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      alert("Please enter your email");
      return;
    }

    const templateParams = {
      email: email.trim(),
    };

    try {
      await emailjs.send(
        "service_3njspp3",
        "template_1tovcvz",
        templateParams,
        "aVlcpCM9wGNQUzgan",
      );

      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setEmail("");
    } catch (err) {
      console.error("EmailJS error:", err);
      alert("Failed to join waitlist. Please try again.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex max-w-[400px] mx-auto rounded-lg overflow-hidden bg-[rgba(15,15,15,0.8)] ${
        variant === "cta"
          ? "border border-[#00FF66]"
          : "border border-[#1e2e24]"
      }`}
    >
      <input
        id={`${variant}-email-input`}
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="flex-1 py-3 px-4 bg-transparent border-none outline-none text-white text-sm font-[inherit] placeholder:text-[#a0a0a0]"
      />
      <button
        type="submit"
        className="py-3 px-5 bg-[#00FF66] text-black font-bold text-[13px] border-none cursor-pointer tracking-wider font-[inherit] transition-colors whitespace-nowrap hover:bg-[#33FF88]"
      >
        {submitted ? "✓ JOINED!" : "JOIN WAITLIST"}
      </button>
    </form>
  );
};

const Waitlist = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="bg-black text-white font-['DM_Sans',system-ui,sans-serif] min-h-screen overflow-x-hidden">
      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-[50] bg-black/95 transition-transform duration-300 md:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex justify-between items-center mb-12">
            <Logo className="h-7" />
            <button onClick={() => setIsMenuOpen(false)} className="p-2">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col gap-8 text-2xl font-bold">
            <a
              href="#"
              onClick={() => setIsMenuOpen(false)}
              className="hover:text-[#00FF66]"
            >
              About Us
            </a>
            <button
              className="mt-4 bg-[#00FF66] text-black py-4 rounded-lg text-lg"
              onClick={() => {
                setIsMenuOpen(false);
                document
                  .getElementById("cta-section")
                  ?.scrollIntoView({ behavior: "smooth" });
                setTimeout(() => {
                  document.getElementById("cta-email-input")?.focus();
                }, 800);
              }}
            >
              JOIN WAITLIST
            </button>
          </div>
        </div>
      </div>
      <header className="relative w-full bg-white/[0.06] backdrop-blur-md border-b border-white/10 overflow-hidden">
        {/* Glow Ellipse */}
        <div
          className="absolute top-[-40px] left-1/2 -translate-x-1/2 w-[288px] h-[84px] bg-[#15FF56] opacity-30 pointer-events-none"
          style={{ filter: "blur(188px)", borderRadius: "100%" }}
        />
        <nav className="flex justify-between items-center py-3 md:py-4 px-5 md:px-10 relative z-10 max-w-[1400px] mx-auto">
          <Logo className="h-7 md:h-8" />

          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(true)}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4 md:gap-8">
            <a
              href="#"
              className="text-sm text-[#a0a0a0] hover:text-white transition-colors"
            >
              About Us
            </a>
            <div className="w-[1px] h-4 bg-white/10" />
            <button
              className="bg-[#00FF66] text-black font-bold text-[13px] px-5 py-2.5 hover:bg-[#33FF88] transition-all"
              onClick={() => {
                document
                  .getElementById("cta-section")
                  ?.scrollIntoView({ behavior: "smooth" });
                setTimeout(() => {
                  document.getElementById("cta-email-input")?.focus();
                }, 800);
              }}
            >
              JOIN WAITLIST
            </button>
          </div>
        </nav>
      </header>

      {/* ─── Hero ─── */}
      <section className="flex flex-col items-center relative text-center px-5 pb-[60px] max-w-[1200px] mx-auto overflow-visible">
        <img
          src={HeroSection}
          alt="Hero Section"
          className="hidden md:block absolute "
        />
        <img
          src={HeroSectionMobile}
          alt="Hero Section"
          className="md:hidden absolute w-full  "
        />

        <div className="relative z-[2] pt-48">
          <h1 className="font-bold text-[56px] text-[clamp(32px,6vw,56px)] leading-none tracking-[-0.04em] text-center mb-5">
            Opinions are free.
            <br />
            <span className="bg-gradient-to-br from-[#00FF66] via-[#33FF88] to-[#00CC44] bg-clip-text text-transparent border border-white/10 px-5 py-1  inline-block mt-2">
              Conviction pays.
            </span>
          </h1>
          <p className="text-[clamp(13px,2vw,16px)] text-[#a0a0a0] leading-relaxed mx-auto mb-8 max-w-[600px]">
            Non-custodial prediction markets for sports, crypto, and culture.
            Your wallet, your positions, instant settlement. No house. No limits
            on winners.
          </p>
          <WaitlistForm variant="hero" />
          <p className="text-[13px] text-[#a0a0a0] mt-3.5">
            <span className="font-bold text-white">2,847+</span> traders on the
            waitlist
          </p>
        </div>
        <div className="flex gap-3 mt-8 sm:gap-4">
          {[
            {
              Icon: RedditIcon,
              label: "Reddit",
              link: "https://www.reddit.com/user/YeNoMarket",
            },
            {
              Icon: InstagramIcon,
              label: "Instagram",
              link: "https://www.instagram.com/yenomarket/",
            },
            {
              Icon: DiscordIcon,
              label: "Discord",
              link: "https://discord.com/channels/1463617307375833229/1463764855298330624",
            },
            { Icon: XIcon, label: "X", link: "https://x.com/YeNoMarket" },
          ].map(({ Icon, label, link }) => (
            <a
              key={label}
              href={link}
              aria-label={label}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.06] text-[#ccc] transition-all hover:bg-[#00FF66] hover:text-black hover:-translate-y-0.5"
            >
              <Icon />
            </a>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="flex flex-col items-center gap-10 py-10 px-5 text-center max-w-[800px] mx-auto">
        <h2 className="z-[2] font-open-sauce font-bold text-[48px] leading-none tracking-[-0.04em] text-center mb-[60px]">
          Built for <span className="text-[#67FF93]">Speed </span> <br />
          Designed for Security.
        </h2>

        <div className="relative mx-auto">
          <img
            src={Features}
            alt="Features"
            className="w-[320px] h-[290px] md:w-[752px] md:h-[602px]  object-cover"
          />
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section
        id="cta-section"
        className="relative text-center px-5 pt-20 pb-10 overflow-hidden "
      >
        {/* Background Image */}
        <img
          src={WorldMap}
          alt="World Map Background"
          className="absolute inset-0 w-full h-full  pointer-events-none"
        />
        {/* Glow */}

        {/* Particles */}
        <div className="relative z-[2]">
          <h2 className="text-[clamp(28px,5vw,42px)] font-bold leading-[1.15] mb-8">
            Join the community of
            <br />
            world's top traders.
          </h2>
          <WaitlistForm variant="cta" />
          <p className="text-[13px] text-[#a0a0a0] mt-3">
            <span className="font-bold text-white">2,847+ </span> traders on the
            waitlist
          </p>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-6 px-6 bg-[#001E08] border-t border-white/[0.06] w-full  flex flex-col">
        <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-8 sm:gap-0">
          <div className="flex flex-col items-center sm:items-center gap-3">
            <Logo className="h-7" />
            <p className="text-xs text-[#a0a0a0] m-0 ">
              © copyright 2026 by Yeno Pvt. Ltd.
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-center gap-4">
            <p className="font-open-sauce font-normal text-[12px] leading-none opacity-50 text-center">
              Join our socials
            </p>
            <div className="flex gap-3 sm:gap-4">
              {[
                {
                  Icon: RedditIcon,
                  label: "Reddit",
                  link: "https://www.reddit.com/user/YeNoMarket",
                },
                {
                  Icon: InstagramIcon,
                  label: "Instagram",
                  link: "https://www.instagram.com/yenomarket/",
                },
                {
                  Icon: DiscordIcon,
                  label: "Discord",
                  link: "https://discord.com/channels/1463617307375833229/1463764855298330624",
                },
                { Icon: XIcon, label: "X", link: "https://x.com/YeNoMarket" },
              ].map(({ Icon, label, link }) => (
                <a
                  key={label}
                  href={link}
                  aria-label={label}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.06] text-[#ccc] transition-all hover:bg-[#00FF66] hover:text-black hover:-translate-y-0.5"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Waitlist;
