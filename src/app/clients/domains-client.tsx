import Image from "next/image";

const Domains = () => {
  return (
    <div className="bg-black w-full min-h-screen text-white font-sans overflow-hidden hide-scrollbar p-4">
      <header className="px-8 pt-8">
        <h1 className="text-5xl font-bold drop-shadow-sm">ACM - VIT</h1>
      </header>

      <main className="max-w-450 mx-auto px-0 pt-6 pb-12">
        <h2
          className="text-center text-6xl font-bold mb-20 text-black [text-shadow:2px_2px_0_#fff,2px_-2px_0_#fff,-2px_2px_0_#fff,-2px_-2px_0_#fff,4px_4px_0_#fff,-4px_-4px_0_#fff,4px_-4px_0_#fff,-4px_4px_0_#fff]
"
        >
          <span>Domains</span>
        </h2>

        <section className="flex flex-row items-center mb-20 gap-[7.5rem]">
          <div className="w-2/5 mb-6 mr-6">
            <div className="rounded-xl border-4 border-lime-300 overflow-hidden relative h-60">
              <Image
                fill
                src="/images/domains/cc.svg"
                alt="Competitive Coding"
                className="object-cover opacity-60"
              />
              <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white">
                Competitive Coding
              </span>
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

        <section className="flex flex-row items-center mb-20 gap-[7.5rem]">
          <div className="w-3/5 text-gray-300 text-2xl">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam
              vel nisi at nisi luctus tincidunt. Aliquam semper erat et nibh
              scelerisque vulputate.
            </p>
          </div>
          <div className="w-1/2 mb-6 ml-6">
            <div className="rounded-xl border-4 border-[#013D62] overflow-hidden relative h-60">
              <Image
                fill
                src="/images/domains/design.svg"
                alt="Design"
                className="object-cover opacity-60"
              />
              <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white">
                Design
              </span>
            </div>
          </div>
        </section>

        <section className="flex flex-row items-center mb-20 gap-[7.5rem]">
          <div className="w-2/5 mb-6 mr-6">
            <div className="rounded-xl border-4 border-red-400 overflow-hidden relative h-60">
              <Image
                fill
                src="/images/domains/management.svg"
                alt="Management"
                className="object-cover opacity-60"
              />
              <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white">
                Management
              </span>
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
        <section className="flex flex-row items-center mb-20 gap-[7.5rem]">
          <div className="w-3/5 text-gray-300 text-2xl">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam
              vel nisi at nisi luctus tincidunt. Aliquam semper erat et nibh
              scelerisque vulputate.
            </p>
          </div>
          <div className="w-1/2 mb-6 ml-6">
            <div className="rounded-xl border-4 border-[#521D4E] overflow-hidden relative h-60">
              <Image
                src="/images/domains/research.svg"
                alt="Research"
                fill
                className="object-cover opacity-60"
              />
              <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white">
                Research
              </span>
            </div>
          </div>
        </section>

        <section className="flex flex-row items-center mb-20 gap-[7.5rem]">
          <div className="w-2/5 mb-6 mr-6">
            <div className="rounded-xl border-4 border-[#FF53A7] overflow-hidden relative h-60 ">
              <Image
                src="/images/domains/tech.svg"
                alt="Tech"
                fill
                className="object-cover opacity-60"
              />
              <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white">
                Tech
              </span>
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

export default Domains;
