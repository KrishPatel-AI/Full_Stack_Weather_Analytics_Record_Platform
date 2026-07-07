"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, X, Download, Eye } from "lucide-react";
import { displayTemp } from "@/lib/format";

const EXPORT_FORMATS = ["json", "csv", "xml", "markdown", "pdf"];

export default function RecordsSection({ onView, unit }) {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({ location: "", startDate: "", endDate: "" });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [locationError, setLocationError] = useState(false);

  async function refresh() {
    try {
      const res = await fetch("/api/records");
      const data = await res.json();
      setRecords(data);
    } catch {
      toast.error("Could not load saved locations.");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLocationError(false);

    if (!form.location || !form.startDate || !form.endDate) {
      toast.error("Location, start date, and end date are all required.");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingId ? `/api/records/${editingId}` : "/api/records";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Saved as "${data.resolvedName}."`);
      setForm({ location: "", startDate: "", endDate: "" });
      setEditingId(null);
      refresh();
    } catch (err) {
      setLocationError(true);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(record) {
    setEditingId(record.id);
    setLocationError(false);
    setForm({ location: record.locationQuery, startDate: record.startDate, endDate: record.endDate });
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/records/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Removed.");
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  }

  function handleView(record) {
    const { current, forecast, airQuality } = record.weatherData;
    onView({
      location: { name: record.resolvedName, lat: record.latitude, lon: record.longitude },
      current,
      daily: forecast?.daily ?? [],
      hourly: forecast?.hourly ?? [],
      airQuality,
    });
    toast.message(`Showing the weather saved for ${record.resolvedName}.`);
  }

  function rangeSummary(record) {
    const range = record.weatherData?.rangeForecast ?? [];
    if (range.length === 0) return "—";
    const mins = range.map((d) => d.tempMinC);
    const maxs = range.map((d) => d.tempMaxC);
    const lo = displayTemp(Math.min(...mins), unit);
    const hi = displayTemp(Math.max(...maxs), unit);
    return `${lo}°–${hi}°`;
  }

  return (
    <div className="rounded border border-border bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-ink">Saved locations</h2>
          <p className="mt-0.5 max-w-md text-xs text-muted">
            Save a place and a date range to store the forecast for exactly those dates — click{" "}
            <Eye size={11} strokeWidth={2} className="inline align-text-top" /> View to instantly recall it
            later, without searching again.
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {EXPORT_FORMATS.map((fmt) => (
            <a
              key={fmt}
              href={`/api/export/${fmt}`}
              className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted transition-colors hover:text-ink hover:border-ink/30"
              title={`Export as ${fmt.toUpperCase()}`}
            >
              <Download size={12} strokeWidth={1.5} />
              {fmt.toUpperCase()}
            </a>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-end gap-2">
        <div className="flex flex-1 flex-col gap-1 min-w-[160px]">
          <label className="text-xs text-muted">Location</label>
          <input
            value={form.location}
            onChange={(e) => {
              setForm({ ...form, location: e.target.value });
              setLocationError(false);
            }}
            className={`rounded border bg-canvas px-3 py-2 text-sm text-ink focus:outline-none ${
              locationError ? "border-danger focus:border-danger" : "border-border focus:border-accent"
            }`}
            placeholder="e.g. Austin, TX"
          />
          {locationError && <span className="text-xs text-danger">We couldn't match that location — check the spelling.</span>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Start date</label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="rounded border border-border bg-canvas px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">End date</label>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            className="rounded border border-border bg-canvas px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {editingId ? "Update" : "Save"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setLocationError(false);
              setForm({ location: "", startDate: "", endDate: "" });
            }}
            className="flex items-center gap-1 rounded border border-border px-3 py-2 text-sm text-muted hover:text-ink"
          >
            <X size={14} strokeWidth={1.5} /> Cancel
          </button>
        )}
      </form>
      <p className="mt-1.5 text-[11px] text-muted">
        The free forecast only covers the next 5 days, so pick dates within that window.
      </p>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="pb-2 font-medium">Location</th>
              <th className="pb-2 font-medium">Start</th>
              <th className="pb-2 font-medium">End</th>
              <th className="pb-2 font-medium">Temp range</th>
              <th className="pb-2 font-medium">Saved</th>
              <th className="pb-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 text-ink">{r.resolvedName}</td>
                <td className="py-2.5 text-muted">{r.startDate}</td>
                <td className="py-2.5 text-muted">{r.endDate}</td>
                <td className="py-2.5 text-ink">{rangeSummary(r)}</td>
                <td className="py-2.5 text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="py-2.5">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleView(r)} className="text-muted hover:text-accent" aria-label="View">
                      <Eye size={15} strokeWidth={1.5} />
                    </button>
                    <button onClick={() => startEdit(r)} className="text-muted hover:text-accent" aria-label="Edit">
                      <Pencil size={15} strokeWidth={1.5} />
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="text-muted hover:text-danger" aria-label="Delete">
                      <Trash2 size={15} strokeWidth={1.5} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-muted">
                  No saved locations yet — save one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
