import Image from "next/image";

const Events = () => {
  const handleNavigate = (url: string) => {
    window.parent.postMessage({ type: "NAVIGATE_TO", url: url }, "*");
  };
  return (
    <div className="bg-black w-full min-h-screen text-white font-doppio overflow-hidden hide-scrollbar p-20">
      <header className="px-8 pt-8">
        <h1 className="text-5xl font-bold drop-shadow-sm">ACM - VIT</h1>
      </header>

      <main className="max-w-450 mx-auto px-0 pt-6 pb-12">
        <h2
          className="text-center text-6xl font-bold mb-20 text-black [text-shadow:2px_2px_0_#fff,2px_-2px_0_#fff,-2px_2px_0_#fff,-2px_-2px_0_#fff,4px_4px_0_#fff,-4px_-4px_0_#fff,4px_-4px_0_#fff,-4px_4px_0_#fff]
  "
        >
          <span>Events and Projects</span>
        </h2>

        <section
          className="flex flex-row items-center mb-20 gap-[7.5rem]"
          onClick={() => handleNavigate("https://c2c.acmvit.in")}
        >
          <div className="w-2/5 mb-6 mr-6">
            <div className="rounded-xl overflow-hidden relative h-55">
              <Image
                fill
                src="/images/events/c2c.svg"
                alt="C2C"
                className="object-contain "
              />
            </div>
          </div>
          <div className="w-1/2 text-gray-300 text-2xl">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam
              vel nisi at nisi luctus tincidunt. Aliquam semper erat et nibh
              scelerisque vulputate.
            </p>
          </div>
        </section>

        <section
          className="flex flex-row items-center mb-20 gap-[7.5rem]"
          onClick={() => handleNavigate("https://cryptichunt.acmvit.in")}
        >
          <div className="w-3/5 text-gray-300 text-2xl">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam
              vel nisi at nisi luctus tincidunt. Aliquam semper erat et nibh
              scelerisque vulputate.
            </p>
          </div>
          <div className="w-1/2 mb-6 ml-6">
            <div className="rounded-xl overflow-hidden relative h-57.5">
              <Image
                fill
                src="/images/events/ch.svg"
                alt="Cryptic hunt"
                className="object-contain "
              />
            </div>
          </div>
        </section>

        <section
          className="flex flex-row items-center mb-20 gap-[7.5rem]"
          onClick={() => handleNavigate("https://rcpc.acmvit.in/")}
        >
          <div className="w-2/5 mb-6 mr-6">
            <div className="rounded-xl  -400 overflow-hidden relative h-55">
              <Image
                fill
                src="/images/events/rc.svg"
                alt="RC"
                className="object-contain "
              />
            </div>
          </div>
          <div className="w-1/2 text-gray-300 text-2xl">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam
              vel nisi at nisi luctus tincidunt. Aliquam semper erat et nibh
              scelerisque vulputate.
            </p>
          </div>
        </section>
        <section
          className="flex flex-row items-center mb-20 gap-[7.5rem]"
          onClick={() => handleNavigate("https://examcooker.acmvit.in")}
        >
          <div className="w-3/5 text-gray-300 text-2xl">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam
              vel nisi at nisi luctus tincidunt. Aliquam semper erat et nibh
              scelerisque vulputate.
            </p>
          </div>
          <div className="w-1/2 mb-6 ml-6">
            <div className="rounded-xl overflow-hidden relative h-57.5">
              <Image
                src="/images/events/examcooker.svg"
                alt="Examcooker"
                fill
                className="object-contain "
              />
            </div>
          </div>
        </section>

        <section
          className="flex flex-row items-center mb-20 gap-[7.5rem]"
          onClick={() => handleNavigate("https://unipool.acmvit.in")}
        >
          <div className="w-2/5 mb-6 mr-6">
            <div className="rounded-xl overflow-hidden relative h-55 ">
              <Image
                src="/images/events/unipool.svg"
                alt="Unipool"
                fill
                className="object-contain "
              />
            </div>
          </div>
          <div className="w-1/2 text-gray-300 text-2xl">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam
              vel nisi at nisi luctus tincidunt. Aliquam semper erat et nibh
              scelerisque vulputate.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Events;
