// import { publicAssetUrl } from "@/lib/public-asset-url";

export default function MobileBlocker() {
  return (
    <div
      className="font-doppio lg:hidden fixed inset-0 z-[9999]"
      style={{
        backgroundImage: `url(/images/acm-guy.png)`,
        backgroundSize: "auto 80%",
        backgroundPosition: "left bottom",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#000",
      }}
    >
      <div className="absolute inset-0 bg-[#000]/40" />
      <div
        className="relative z-10 flex h-full flex-col items-center justify-center text-white p-6 text-center space-y-10"
        role="alert"
        aria-live="assertive"
      >
        <div
          className="text-white text-center font-extrabold leading-normal font-poppins text-[37.056px] custom-text-shadow"
          style={{ textShadow: "0 3px 1.705px #838384" }}
        >
          ACM - VIT
        </div>
        <h1 className="text-xl">
          Are you really trying to apply to a tech chapter from your phone?
        </h1>
        <p className="text-md">
          Come back here from your laptop and keep the screen maximized!
        </p>
      </div>
    </div>
  );
}
