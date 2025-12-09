type ButtonProps = {
  label: string;
  onClick?: () => void;
  className?: string;
  fullWidth?: boolean;
  buttonClassName?: string;
  disabled?: boolean;
  loading?: boolean;
};

function Button({
  label,
  onClick,
  className,
  fullWidth = false,
  buttonClassName = "",
  disabled = false,
  loading = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <div
      className={`p-0.2 bg-[#c9eb3e] skew-x-30 w-fit ${className ?? ""} ${isDisabled ? "opacity-50" : ""}`}
    >
      <button
        type="button"
        className={`${fullWidth ? "w-full" : ""} py-2 px-8 border-0 outline-none font-ShareTechMono ${buttonClassName} ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
        style={{
          backgroundColor: "#16171b",
          color: "#c9eb3e",
          transition: "background 0.2s, color 0.2s",
          border: "2px solid #c9eb3e",
        }}
        onClick={isDisabled ? undefined : onClick}
        disabled={isDisabled}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.backgroundColor = "#c9eb3e";
            e.currentTarget.style.color = "#16171b";
          }
        }}
        onMouseLeave={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.backgroundColor = "#16171b";
            e.currentTarget.style.color = "#c9eb3e";
          }
        }}
      >
        <span
          className="inline-block -skew-x-30"
          style={{ fontFamily: "var(--font-share-tech)" }}
        >
          {loading ? "Loading..." : label}
        </span>
      </button>
    </div>
  );
}

export default Button;
