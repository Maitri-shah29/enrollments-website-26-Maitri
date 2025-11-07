export default function MobileBlocker() {
  return (
    <div
      className="font-doppio md:hidden fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#031927] text-white p-6 text-center space-y-10"
      role="alert"
      aria-live="assertive"
    >
      <img
        src="images/acm-mobile-logo.svg"
        alt="ACM Mobile logo"
        className="w-70 h-auto mx-auto"
      />

      <h1 className="text-xl">
        Are you really trying to apply to a tech chapter from your phone?
      </h1>
      <p className="text-md">
        Come back here from your laptop and keep the screen maximized!
      </p>
    </div>
  );
}
