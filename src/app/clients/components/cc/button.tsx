type ButtonProps = {
  label: string;
  onClick?: () => void;
  className?: string;
  fullWidth?: boolean;
  buttonClassName?: string;
};

<<<<<<< Updated upstream
function Button({
  label,
  onClick,
  className,
  fullWidth = false,
  buttonClassName = "",
}: ButtonProps) {
=======
function Button({ label, onClick, className, fullWidth = false, buttonClassName = "" }: ButtonProps) {
>>>>>>> Stashed changes
  return (
    <div className={`p-0.2 bg-[#c9eb3e] skew-x-30 w-fit ${className ?? ""}`}>
      <button
        type="button"
        className={`${fullWidth ? "w-full" : ""} py-2 px-8 cursor-pointer border-0 outline-none font-ShareTechMono ${buttonClassName}`}
        style={{
          backgroundColor: "#16171b",
          color: "#c9eb3e",
          transition: "background 0.2s, color 0.2s",
          border: "2px solid #c9eb3e",
        }}
        onClick={onClick}
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
  );
}

export default Button;
