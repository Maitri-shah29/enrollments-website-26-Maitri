"use client";
import Image from "next/image";
import Button from "./button";

type Props = {
  onGetStarted?: () => void;
  loading?: boolean;
  hasRoundUser?: boolean;
  onContinue?: () => void;
  showResults?: boolean;
  onViewResults?: () => void;
};

const Homepage: React.FC<Props> = ({
  onGetStarted,
  loading = false,
  hasRoundUser = false,
  onContinue,
  showResults = false,
  onViewResults,
}) => {
  const showResultsCta = showResults && !!onViewResults;
  const cells = Array.from({ length: 8 }, (_, idx) => `cell-${idx + 1}`);
  return (
    <div className="w-full h-full relative overflow-hidden">
      <div className="w-full h-full bg-[#121216]">
        <div className="absolute inset-x-0 top-[22%] z-0 hidden sm:grid grid-cols-2 grid-rows-4 gap-x-0 gap-y-0 w-full h-[75%]">
          {cells.map((id, i) => (
            <div
              key={id}
              className={`flex items-center ${
                i % 2 === 0 ? "justify-end" : "justify-start"
              } w-full h-full z-[0] transform scale-[1.09]`}
              style={{
                letterSpacing: "2%",
                marginLeft: i % 2 === 0 ? "-5%" : "5%",
                opacity: 0.45,
              }}
            >
              {}
              <Image
                src="/images/ACM.svg"
                alt={`ACM-${i}`}
                width={200}
                height={200}
                className="w-[200%] h-auto max-h-[90%]"
                style={{ color: "#C9EB3E" }}
                priority={i < 2}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col justify-center items-center h-full w-full relative z-10 translate-y-[75px]">
          <h1
            className="text-xl sm:text-2xl font-normal mb-4 text-center"
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              color: "#C9EB3E",
              letterSpacing: "0.15em",
            }}
          >
            Welcome to
          </h1>
          <h1
            className="text-6xl sm:text-8xl md:text-[228px] font-normal leading-none mb-8 text-center"
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              color: "#C9EB3E",
            }}
          >
            <span
              style={{
                color: "transparent",
                WebkitTextStroke: "3px #C9EB3E",
              }}
            >
              &lt;
            </span>
            ACM
            <span className="relative mx-4" style={{ display: "inline-block" }}>
              <span
                style={{
                  position: "absolute",
                  left: "5%",
                  color: "transparent",
                  WebkitTextStroke: "3px #C9EB3E",
                  zIndex: 0,
                }}
              >
                /
              </span>
              <span
                style={{
                  position: "absolute",
                  left: "calc(50% + 5%)",
                  top: "-4px",
                  color: "transparent",
                  WebkitTextStroke: "3px #C9EB3E",
                  zIndex: 0,
                }}
              >
                /
              </span>
              <span style={{ position: "relative", zIndex: 1 }}>{"//"}</span>
            </span>
            CC
            <span
              style={{
                color: "transparent",
                WebkitTextStroke: "3px #C9EB3E",
              }}
            >
              &gt;
            </span>
          </h1>
          <Button
            label={
              showResultsCta
                ? "View Results →"
                : hasRoundUser
                  ? "Continue →"
                  : loading
                    ? "Loading..."
                    : "Get Started →"
            }
            onClick={
              showResultsCta
                ? onViewResults
                : hasRoundUser
                  ? onContinue
                  : onGetStarted
            }
            buttonClassName="py-3 !px-[30px] text-lg"
            disabled={loading && !hasRoundUser && !showResultsCta}
          />
        </div>
      </div>
    </div>
  );
};

export default Homepage;
