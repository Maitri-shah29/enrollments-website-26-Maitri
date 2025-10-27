"use client";

type ManagementLandingProps = {
  onGetStarted: () => void;
};

const ManagementLanding = ({ onGetStarted }: ManagementLandingProps) => {
  return (
    <div className="relative bg-rose-100/50 backdrop-blur-md rounded-lg w-[90%] max-w-4xl h-auto shadow-lg flex flex-col items-center text-black p-6">
      <div className="w-full mt-4">
        <h1 className="text-3xl font-bold text-center mb-6">
          Welcome to Best domain
        </h1>

        <div className="flex items-start space-x-4 mt-8">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>User icon</title>
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center">
              <span className="font-semibold">Mgmt</span>
              <span className="text-gray-500 text-sm ml-2">
                &lt;loremipsum@gmail.com&gt;
              </span>
            </div>
            <div className="text-gray-500 text-sm">
              to me{" "}
              <svg
                className="inline-block w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Dropdown arrow</title>
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="text-gray-800 space-y-4 text-base mt-6">
          <p>MANAGEMENT</p>
        </div>
      </div>

      {/* Get Started Button */}
      <div className="w-full mt-8 flex justify-start">
        <button
          type="button"
          onClick={onGetStarted}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default ManagementLanding;
