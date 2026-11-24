"use client";

import { useMemo, useState } from "react";
import { AccountShell } from "../../../components/AccountShell";
import { useAuth } from "../../../lib/auth";
import { corridors } from "../../../lib/delivery";
import { MedusaApiError } from "../../../lib/medusa-browser";

const inputClass =
  "mt-2 w-full rounded-xl border border-white/15 bg-ink px-3 py-2.5 text-sm text-cream outline-none placeholder:text-cream/35 focus:border-mustard/60";

export default function AccountAddressesPage() {
  const { customer, addresses, createAddress, deleteAddress } = useAuth();
  const corridorGroups = useMemo(() => corridors(), []);
  const [label, setLabel] = useState("Home");
  const [areaId, setAreaId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !areaId) return;
    const areaOption = corridorGroups
      .flatMap(([, items]) => items)
      .find((a) => a.id === areaId);
    if (!areaOption) return;

    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await createAddress({
        address_name: label.trim() || "Saved address",
        first_name: customer.first_name || "Customer",
        last_name: customer.last_name || "Photon",
        phone: customer.phone || "",
        address_1: areaOption.area,
        city: "Nairobi",
        province: areaOption.corridor,
        country_code: "ke",
        postal_code: "00100",
        metadata: {
          area_id: areaOption.id,
          method: "delivery",
          fee: areaOption.fee,
        },
      });
      setMessage("Address saved.");
      setAreaId("");
    } catch (err) {
      setError(
        err instanceof MedusaApiError ? err.message : "Could not save address."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AccountShell title="Saved addresses">
      <div className="grid gap-8 lg:grid-cols-2">
        <form
          onSubmit={onSave}
          className="rounded-2xl border border-white/10 bg-ink-soft p-5"
        >
          <h2 className="font-display text-2xl text-cream">Add delivery area</h2>
          <p className="mt-2 text-sm text-cream/60">
            Reuse Nairobi delivery areas at checkout.
          </p>
          <label className="mt-4 block">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-mustard">
              Label
            </span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={inputClass}
              placeholder="Home"
            />
          </label>
          <label className="mt-4 block">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-mustard">
              Area
            </span>
            <select
              required
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className={inputClass}
            >
              <option value="">Select area…</option>
              {corridorGroups.map(([corridor, items]) => (
                <optgroup key={corridor} label={corridor}>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.area} — KES {item.fee.toLocaleString("en-KE")}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          {message && <p className="mt-3 text-sm text-mustard">{message}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-5 rounded-full bg-mustard px-5 py-3 text-sm font-semibold text-ink hover:bg-mustard-bright disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save address"}
          </button>
        </form>

        <div className="space-y-3">
          {!addresses.length ? (
            <p className="rounded-2xl border border-white/10 bg-ink-soft p-5 text-cream/65">
              No saved addresses yet.
            </p>
          ) : (
            addresses.map((addr) => (
              <div
                key={addr.id}
                className="rounded-2xl border border-white/10 bg-ink-soft p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-cream">
                      {addr.address_name || "Address"}
                    </p>
                    <p className="mt-1 text-sm text-cream/65">
                      {addr.address_1}
                      {addr.province ? ` · ${addr.province}` : ""}
                    </p>
                    {typeof addr.metadata?.area_id === "string" && (
                      <p className="mt-1 text-xs text-cream/45">
                        Area id: {addr.metadata.area_id}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void deleteAddress(addr.id)}
                    className="text-sm text-cream/50 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AccountShell>
  );
}
