import { useState, useEffect } from "react";
import { Field, Input, Select, PrimaryBtn, GhostBtn, ErrorBanner } from "../ui/index.jsx";

const EMPTY = {
  origin: "", destination: "",
  departureDateFrom: "", departureDateTo: "",
  returnDateFrom: "", returnDateTo: "",
  tripType: "one_way", cabinClass: "economy",
  passengers: 1, targetPrice: "", alertThresholdPct: 20, currency: "INR",
};

export default function RouteModal({ open, onClose, onSave, editRoute = null }) {
  const [form, setForm]   = useState(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editRoute) {
      setForm({
        origin: editRoute.origin ?? "",
        destination: editRoute.destination ?? "",
        departureDateFrom: editRoute.departureDateFrom?.slice(0, 10) ?? "",
        departureDateTo: editRoute.departureDateTo?.slice(0, 10) ?? "",
        returnDateFrom: editRoute.returnDateFrom?.slice(0, 10) ?? "",
        returnDateTo: editRoute.returnDateTo?.slice(0, 10) ?? "",
        tripType: editRoute.tripType ?? "one_way",
        cabinClass: editRoute.cabinClass ?? "economy",
        passengers: editRoute.passengers ?? 1,
        targetPrice: editRoute.targetPrice ?? "",
        alertThresholdPct: editRoute.alertThresholdPct ?? 20,
        currency: editRoute.currency ?? "INR",
      });
    } else {
      setForm(EMPTY);
    }
    setError("");
  }, [editRoute, open]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.origin || form.origin.length !== 3) {
      setError("Origin must be a 3-letter IATA code (e.g. MAA).");
      return;
    }
    if (!form.destination || form.destination.length !== 3) {
      setError("Destination must be a 3-letter IATA code (e.g. DXB).");
      return;
    }
    if (!form.departureDateFrom) {
      setError("Please select a departure date.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        origin: form.origin.toUpperCase(),
        destination: form.destination.toUpperCase(),
        passengers: Number(form.passengers),
        targetPrice: form.targetPrice !== "" ? Number(form.targetPrice) : null,
        alertThresholdPct: Number(form.alertThresholdPct),
        departureDateTo: form.departureDateTo || null,
        returnDateFrom: form.tripType === "round_trip" ? form.returnDateFrom || null : null,
        returnDateTo: form.tripType === "round_trip" ? form.returnDateTo || null : null,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors?.length) {
        setError(apiErrors.map((e) => e.message).join(" · "));
      } else {
        setError(err.response?.data?.message || "Failed to save route.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(14,31,51,0.35)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full rounded-2xl overflow-y-auto"
        style={{
          maxWidth: 540,
          maxHeight: "90vh",
          background: "#FFFFFF",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          fontFamily: "'Work Sans', sans-serif",
        }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-0 flex items-start justify-between">
          <div>
            <h3 style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: "#0E1F33", margin: 0 }}>
              {editRoute ? "Edit route" : "Add a route"}
            </h3>
            <p className="text-sm mt-1" style={{ color: "#8FA3B1" }}>
              {editRoute ? "Update your monitoring criteria." : "Set up a new flight to monitor."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ background: "#F0EDE7", border: "none", color: "#8FA3B1", cursor: "pointer", flexShrink: 0 }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSave} className="px-8 py-6 flex flex-col gap-4">

          {/* Origin / Destination */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Origin (IATA)" id="origin">
              <Input id="origin" placeholder="MAA" maxLength={3}
                value={form.origin} onChange={set("origin")}
                style={{ textTransform: "uppercase" }} required />
            </Field>
            <Field label="Destination (IATA)" id="dest">
              <Input id="dest" placeholder="DXB" maxLength={3}
                value={form.destination} onChange={set("destination")}
                style={{ textTransform: "uppercase" }} required />
            </Field>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Departure date" id="depFrom">
              <Input id="depFrom" type="date" value={form.departureDateFrom}
                onChange={set("departureDateFrom")} required />
            </Field>
            <Field label="Departure date (to)" id="depTo">
              <Input id="depTo" type="date" value={form.departureDateTo}
                onChange={set("departureDateTo")} />
            </Field>
          </div>

          {/* Trip type / Cabin */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Trip type" id="tripType">
              <Select id="tripType" value={form.tripType} onChange={set("tripType")}>
                <option value="one_way">One-way</option>
                <option value="round_trip">Round trip</option>
              </Select>
            </Field>
            <Field label="Cabin class" id="cabin">
              <Select id="cabin" value={form.cabinClass} onChange={set("cabinClass")}>
                <option value="economy">Economy</option>
                <option value="premium_economy">Premium Economy</option>
                <option value="business">Business</option>
                <option value="first">First</option>
              </Select>
            </Field>
          </div>

          {/* Return dates (round trip only) */}
          {form.tripType === "round_trip" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Return date (from)" id="retFrom">
                <Input id="retFrom" type="date" value={form.returnDateFrom}
                  onChange={set("returnDateFrom")} />
              </Field>
              <Field label="Return date (to)" id="retTo">
                <Input id="retTo" type="date" value={form.returnDateTo}
                  onChange={set("returnDateTo")} />
              </Field>
            </div>
          )}

          {/* Passengers / Target price */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Passengers" id="pax">
              <Input id="pax" type="number" min={1} max={9}
                value={form.passengers} onChange={set("passengers")} />
            </Field>
            <Field label="Target price (₹)" id="tp">
              <Input id="tp" type="number" min={0} placeholder="e.g. 18500"
                value={form.targetPrice} onChange={set("targetPrice")} />
            </Field>
          </div>

          {/* Alert threshold */}
          <Field label="Or alert on % drop below baseline" id="pct">
            <Input id="pct" type="number" min={1} max={99}
              placeholder="e.g. 20" value={form.alertThresholdPct}
              onChange={set("alertThresholdPct")} />
          </Field>

          <ErrorBanner message={error} />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <GhostBtn type="button" onClick={onClose}>Cancel</GhostBtn>
            <PrimaryBtn type="submit" loading={loading} className="w-auto px-6">
              {editRoute ? "Update route" : "Save route"}
            </PrimaryBtn>
          </div>
        </form>
      </div>
    </div>
  );
}
