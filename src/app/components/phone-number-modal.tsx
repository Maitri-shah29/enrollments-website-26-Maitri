"use client";

import { useEffect, useState } from "react";
import fetchUser from "@/app/actions/fetch-user";
import savePhoneNumber from "@/app/actions/save-phone-number";
import { useSessionContext } from "./session-provider";

const PhoneNumberModal = () => {
  const { session, isPending } = useSessionContext();
  const [open, setOpen] = useState(false);
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

    checkPhone().catch((err) => console.error(err));
  }, [session, isPending, hasChecked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = phone.trim();

    if (!trimmed) {
      setError("Please enter your mobile number");
      return;
    }

    setSaving(true);
    setError(null);

    const result = await savePhoneNumber(trimmed);

    if (result && typeof result === "object" && "error" in result) {
      setError(result.error ?? "Unable to save phone number");
    } else {
      setOpen(false);
    }

    setSaving(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Add your mobile number
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          We&apos;ll use this to contact you about your enrollment status.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="phone"
              className="text-sm font-medium text-gray-800"
            >
              Mobile number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Enter your mobile number"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white font-medium transition hover:bg-blue-700 disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save number"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PhoneNumberModal;
