type ButtonProps = {
  label: string;
};

function Button({ label }: ButtonProps) {
  return (
    <div className="flex flex-col h-fit bg-[#16171B] w-full">
      <div className="mt-auto flex justify-end font-ShareTechMono px-10 py-30">
        <div className="p-0.2 bg-[#c9eb3e] skew-x-30">
          <button
            type="button"
            className="py-2 px-8 cursor-pointer border-0 outline-none"
            style={{
              backgroundColor: "#16171b",
              color: "#c9eb3e",
              transition: "background 0.2s, color 0.2s",
              border: "2px solid #c9eb3e",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#c9eb3e";
              e.currentTarget.style.color = "#16171b";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#16171b";
              e.currentTarget.style.color = "#c9eb3e";
            }}
          >
            <span
              className="inline-block -skew-x-30"
              style={{ fontFamily: "var(--font-share-tech)" }}
            >
              {label}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Button;
