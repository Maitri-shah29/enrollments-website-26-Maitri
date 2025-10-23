type ButtonProps = {
  label: string;
};

function Button({ label }: ButtonProps) {
  return (
    <button
      type="button"
      className="py-2 px-8 font-bold cursor-pointer border-none outline-none skew-x-[20deg]"
      style={{
        clipPath: "polygon(0 0, 85% 0, 100% 100%, 15% 100%)",
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
      <span className="inline-block skew-x-[-20deg]">{label}</span>
    </button>
  );
}

export default Button;
