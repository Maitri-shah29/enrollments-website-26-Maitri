"use client";

import { useEffect, useState } from "react";
import fetchUser from "@/app/actions/fetch-user";
import savePhoneNumber from "@/app/actions/save-phone-number";
import { useSessionContext } from "./session-provider";

const COUNTRY_CODES = [
  { code: "+1", country: "US/CA", minLength: 10, maxLength: 10 },
  { code: "+44", country: "UK", minLength: 10, maxLength: 10 },
  { code: "+91", country: "India", minLength: 10, maxLength: 10 },
  { code: "+60", country: "Malaysia", minLength: 9, maxLength: 10 },
  { code: "+977", country: "Nepal", minLength: 10, maxLength: 10 },
  { code: "+880", country: "Bangladesh", minLength: 10, maxLength: 10 },
  { code: "+234", country: "Nigeria", minLength: 10, maxLength: 10 },
  { code: "+61", country: "Australia", minLength: 9, maxLength: 9 },
  { code: "+65", country: "Singapore", minLength: 8, maxLength: 8 },
  { code: "+971", country: "UAE", minLength: 9, maxLength: 9 },
  { code: "+966", country: "Saudi Arabia", minLength: 9, maxLength: 9 },
];

const PhoneNumberModal = () => {
  const { session, isPending } = useSessionContext();
  const [open, setOpen] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (isPending) return;

    if (!session?.data?.user) {
      setOpen(false);
      setHasChecked(false);
      return;
    }

    if (hasChecked) return;

    const checkPhone = async () => {
      try {
        const user = await fetchUser();
        if (
          user &&
          typeof user === "object" &&
          "phone" in user &&
          !user.phone
        ) {
          setOpen(true);
        }
      } catch (err) {
        console.error("Failed to check user phone", err);
      } finally {
        setHasChecked(true);
      }
    };

    checkPhone();
  }, [session, isPending, hasChecked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = phone.trim();

    if (!trimmed) {
      setError("Please enter your mobile number");
      return;
    }

    const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode);
    if (!selectedCountry) {
      setError("Invalid country code selected");
      return;
    }

    if (!/^\d+$/.test(trimmed)) {
      setError("Mobile number must contain only digits");
      return;
    }

    if (trimmed.length < selectedCountry.minLength) {
      setError(
        `Mobile number must be at least ${selectedCountry.minLength} digits for ${selectedCountry.country}`,
      );
      return;
    }

    if (trimmed.length > selectedCountry.maxLength) {
      setError(
        `Mobile number must not exceed ${selectedCountry.maxLength} digits for ${selectedCountry.country}`,
      );
      return;
    }

    setSaving(true);
    setError(null);

    const fullPhoneNumber = `${countryCode}${trimmed}`;
    const result = await savePhoneNumber(fullPhoneNumber);

    if (result && typeof result === "object" && "error" in result) {
      setError(result.error ?? "Unable to save phone number");
    } else {
      setOpen(false);
    }

    setSaving(false);
  };

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode);
  const maxLength = selectedCountry?.maxLength || 15;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl bg-[#252525] p-6 shadow-2xl border border-white/10">
        <h2 className="text-2xl font-semibold text-white mb-2">
          Add your mobile number
        </h2>
        <p className="text-sm text-neutral-400 mb-6 font-poppinsReg">
          We&apos;ll use this to contact you about your enrollment status.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="phone"
              className="text-sm font-medium text-neutral-300"
            >
              Mobile number
            </label>
            <div className="flex gap-2">
              <div className="relative shrink-0">
                <select
                  value={countryCode}
                  onChange={(e) => {
                    setCountryCode(e.target.value);
                    setPhone("");
                    setError(null);
                  }}
                  className="w-36 appearance-none rounded-lg border border-white/10 bg-[#333] px-3 py-2 text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 pr-8"
                >
                  {COUNTRY_CODES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.code} {country.country}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-400">
                  <svg
                    className="h-4 w-4 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <title>Dropdown arrow</title>
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/\D/g, "")
                    .slice(0, maxLength);
                  setPhone(value);
                  setError(null);
                }}
                className="w-full min-w-0 flex-1 rounded-lg border border-white/10 bg-[#333] px-3 py-2 text-white placeholder-neutral-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder={
                  selectedCountry
                    ? `Enter ${
                        selectedCountry.minLength === selectedCountry.maxLength
                          ? selectedCountry.minLength
                          : `${selectedCountry.minLength}-${selectedCountry.maxLength}`
                      } digit number`
                    : "Enter mobile number"
                }
              />
            </div>
            {selectedCountry && (
              <p className="text-xs text-neutral-500">
                Expected format: {selectedCountry.minLength}
                {selectedCountry.minLength !== selectedCountry.maxLength &&
                  `-${selectedCountry.maxLength}`}{" "}
                digits for {selectedCountry.country}
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white font-medium transition hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save number"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PhoneNumberModal;
