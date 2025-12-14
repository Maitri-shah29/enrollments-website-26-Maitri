"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

type About = {
  slug: string;
  accent: string;
  text: string;
  image: string;
  title: string;
  description: string;
  logo: string;
};

const domains: About[] = [
  {
    slug: "about-1",
    accent: "#ff6a5c",
    text: "#ffffff",
    image: "/images/about/Rectangle 4453-3.svg",
    title: "ACM INDIA",
    description:
      "ACM India is the national organisation of the Association for Computing Machinery. It is dedicated to supporting and strengthening the computing community across the country. It brings together educators, researchers, students and industry professionals to exchange ideas, collaborate and advance computing knowledge.\n\nCurrently led by Dr. Meenakshi D'Souza, who also joined us as a guest speaker at Code2Create 6.0, ACM India supports research and education through conferences, talks, awards, and outreach, while helping individuals grow professionally and stay connected to the computing community.",
    logo: "/images/about/Group.svg",
  },
  {
    slug: "about-2",
    accent: "#7ed957",
    text: "#ffffff",
    image: "/images/about/Rectangle 4453.svg",
    title: "ACM - VIT",
    description:
      "ACM-VIT is a student chapter of the Association for Computing Machinery at Vellore Institute of Technology. Since our inception, we've been at the forefront of technological innovation and education on campus.\n\nOur chapter focuses on fostering a passion for computing through workshops, hackathons, and industry collaborations. We provide students with opportunities to expand their technical skills, work on real-world projects, and connect with industry professionals, creating a vibrant community of future tech leaders.",
    logo: "/images/about/Vector.svg",
  },
  {
    slug: "about-3",
    accent: "#4ea8de",
    text: "#292625",
    image: "/images/about/Rectangle 4453-1.svg",
    title: "ACM-W VIT",
    description:
      "ACM-W VIT is dedicated to supporting, celebrating, and advocating for women in computing at Vellore Institute of Technology. As part of the global ACM Women initiative, we work to create a more inclusive computing environment.\n\nOur programs include mentorship opportunities, technical workshops, networking events, and outreach activities designed specifically to encourage women's participation in computer science and related fields. We celebrate achievements of women in computing and provide resources for academic and professional growth.",
    logo: "/images/about/Component 2.svg",
  },
  {
    slug: "about-4",
    accent: "#9b5de5",
    text: "#ffffff",
    image: "/images/about/Rectangle 4453-2.svg",
    title: "ACM\nINTERNATIONAL",
    description:
      "The Association for Computing Machinery (ACM) is the world's largest educational and scientific computing society. Founded in 1947, ACM brings together computing educators, researchers, and professionals to inspire dialogue, share resources, and address the field's challenges.\n\nACM strengthens the computing profession's collective voice through strong leadership, promotion of the highest standards, and recognition of technical excellence. ACM supports the professional growth of its members by providing opportunities for life-long learning, career development, and professional networking.",
    logo: "/images/about/Group.svg",
  },
];

const CARD_OFFSET = 22;
const SCALE_FACTOR = 0.045;

const About = () => {
  const [cards, setCards] = useState(domains);
  const [showScrollHint, setShowScrollHint] = useState(true);

  useEffect(() => {
    // Show initially for 4 seconds
    const hideTimer = setTimeout(() => {
      setShowScrollHint(false);
    }, 4000);

    // Then show again every 60 seconds
    const intervalTimer = setInterval(() => {
      setShowScrollHint(true);
      setTimeout(() => {
        setShowScrollHint(false);
      }, 4000);
    }, 15000);

    return () => {
      clearTimeout(hideTimer);
      clearInterval(intervalTimer);
    };
  }, []);

  useEffect(() => {
    let isScrolling = false;

    const handleWheel = (e: WheelEvent) => {
      if (isScrolling) return;
      isScrolling = true;

      setCards((prev) => {
        const next = [...prev];
        if (e.deltaY > 0) {
          const first = next.shift();
          if (first) next.push(first);
        } else {
          const last = next.pop();
          if (last) next.unshift(last);
        }
        return next;
      });

      setTimeout(() => {
        isScrolling = false;
      }, 600);
    };

    window.addEventListener("wheel", handleWheel, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return (
    <div className="relative h-full w-full bg-black text-white font-doppio overflow-hidden">
      <div
        className="absolute top-[3%] left-[3%] z-20 font-bold tracking-wide"
        style={{ fontSize: "max(2rem, min(3.5vw, 3rem))" }}
      >
        ACM – VIT
      </div>

      <div
        className="absolute w-full text-center z-10"
        style={{ top: "max(5%, min(1.5vh, 9%))" }}
      >
        <h2
          className="font-poppins"
          style={{
            color: "transparent",
            WebkitTextStroke: "2px white",
            filter:
              "drop-shadow(0 4px 20px rgba(255, 255, 255, 0.3)) drop-shadow(0 0 40px rgba(255, 255, 255, 0.2))",
            fontSize: "max(2.5rem, min(4.5vw, 3.75rem))",
          }}
        >
          About ACM
        </h2>
      </div>

      {showScrollHint && (
        <motion.div
          className="absolute right-[8%] top-[60%] -translate-y-1/2 z-30 flex flex-col items-center"
          style={{ gap: "max(1rem, min(1.5vw, 1.5rem))" }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            className="text-white font-monopoly-bold tracking-wide"
            style={{ fontSize: "max(1.5rem, min(2.2vw, 1.875rem))" }}
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div
              className="flex flex-col items-center"
              style={{ gap: "max(0.5rem, min(1vw, 0.75rem))" }}
            >
              <span>Scroll</span>
              <span>to view</span>
              <span>more</span>
            </div>
          </motion.div>
          <motion.div
            animate={{ y: [0, 15, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.2,
            }}
          >
            <svg
              className="w-[2.5vw] h-[3.75vw] min-w-[30px] min-h-[45px] max-w-[40px] max-h-[60px]"
              viewBox="0 0 40 60"
              fill="none"
              aria-label="Scroll down arrow"
            >
              <title>Scroll down arrow</title>
              <path
                d="M20 0L20 52M20 52L10 42M20 52L30 42"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        </motion.div>
      )}

      <div
        className="relative z-10 flex h-full items-center justify-center"
        style={{ paddingTop: "calc(25vh - 2vw)" }}
      >
        <div className="relative w-[43vw] aspect-[760/447] min-w-[250px] max-w-[1100px]">
          {cards.map((card, index) => (
            <motion.div
              key={card.slug}
              className="absolute inset-0"
              style={{ transformOrigin: "top center" }}
              animate={{
                top: index * -CARD_OFFSET,
                scale: 1 - index * SCALE_FACTOR,
                zIndex: cards.length - index,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
            >
              <div
                className="relative h-full w-full rounded-2xl overflow-hidden"
                style={{
                  filter: `drop-shadow(0 30px 70px ${card.accent}55)`,
                }}
              >
                <Image
                  src={card.image}
                  alt={`${card.title} card background`}
                  fill
                  className="object-contain pointer-events-none"
                  draggable={false}
                />
                {index === 0 && (
                  <div
                    className="relative text-left"
                    style={{
                      top: "8%",
                      left: "max(3%, min(1.5vw, 5%))",
                      right: "max(3%, min(1.5vw, 5%))",
                    }}
                  >
                    <div
                      className="flex items-center"
                      style={{
                        gap: "max(0.3rem, min(1vw, 0.8rem))",
                        marginBottom: "0.5%",
                      }}
                    >
                      <Image
                        src={card.logo}
                        alt="ACM Logo"
                        width={80}
                        height={80}
                        className="w-[8vw] h-[8vw] min-w-[50px] min-h-[50px] max-w-[70px] max-h-[70px]"
                      />
                      <h3
                        className="font-bold tracking-wide font-monopoly-bold whitespace-pre-line"
                        style={{
                          color: card.text,
                          fontSize: "calc(0.6rem + 1vw)",
                        }}
                      >
                        {card.title}
                      </h3>
                    </div>

                    <div
                      className="w-2/3"
                      style={{
                        backgroundColor: card.text,
                        height: "max(2px, min(0.2vw, 3px))",
                        marginBottom: "2%",
                      }}
                    />

                    <p
                      className="max-w-[90%] font-monopoly-bold whitespace-pre-line"
                      style={{
                        color: card.text,
                        fontSize: "max(0.5rem, min(1.2vw, 1.25rem))",
                        lineHeight: "max(0.7rem, min(1.5vw, 1.5rem))",
                      }}
                    >
                      {card.description}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
