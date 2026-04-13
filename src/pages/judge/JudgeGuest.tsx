import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast, { Toaster } from "react-hot-toast";
import {
  UserPlus,
  Trash2,
  Save,
  ArrowRight,
  Loader2,
  ShieldAlert,
  AlertCircle,
  X,
} from "lucide-react";

import {
  getMyGuestRegistry,
  saveGuestDraft,
  submitGuestRegistry,
} from "../../redux/slices/guestSlice"; // ← adjust path to your store
import type { AppDispatch, RootState } from "../../redux/store"; // ← adjust path to your store
import type { IGuest, GuestType, Gender } from "../../interfaces/guests.interface";

/* =====================================================
    UI-ONLY HELPER TYPE
    Adds a stable React key; never sent to the API.
===================================================== */
interface IGuestWithUiId extends IGuest {
  uiId: string;
}

const toUiGuest = (g: IGuest): IGuestWithUiId => ({
  ...g,
  uiId: crypto.randomUUID(),
});

const createEmptyGuest = (): IGuestWithUiId => ({
  uiId: crypto.randomUUID(),
  name: "",
  type: "ADULT",
  gender: "MALE",
  id_number: "",
  birth_cert_number: "",
  phone: "",
  email: "",
});

/** Strip the UI-only key before sending to the API */
const toApiGuest = (g: IGuestWithUiId): IGuest => {
  const { uiId, ...rest } = g; // eslint-disable-line @typescript-eslint/no-unused-vars
  return rest;
};

/* =====================================================
    COMPONENT
===================================================== */
const JudgeGuest = () => {
  const dispatch = useDispatch<AppDispatch>();

  // ── Slice state ──────────────────────────────────────
  const {
    myRegistry,
    loading,
    isSaving,
  } = useSelector((state: RootState) => state.guests);

  // ── Local UI state ───────────────────────────────────
  // Lazy initialiser: if the store already has guests (e.g. hot-reload / StrictMode
  // second pass), use them immediately — no effect needed.
  const [guests, setGuests] = useState<IGuestWithUiId[]>(() =>
    myRegistry.guests.length > 0
      ? myRegistry.guests.map(toUiGuest)
      : [createEmptyGuest()]
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Track which registry is currently loaded so we only re-initialise when a
  // *different* registry arrives (genuine external change), not on every render.
  const [loadedRegistryId, setLoadedRegistryId] = useState<number | null>(
    myRegistry.guests[0]?.registration_id ?? null
  );

  /* =====================================================
      BOOTSTRAP — load existing registry on mount
  ===================================================== */
  useEffect(() => {
    dispatch(getMyGuestRegistry())
      .unwrap()
      .then((data) => {
        // Only hydrate local form state when we receive a registry we haven't
        // loaded yet. This is a response to an *external* system (the API), so
        // calling setState here is the correct pattern.
        const incomingId: number | undefined = data?.id;
        if (incomingId !== undefined && incomingId !== loadedRegistryId) {
          setGuests(
            data.guests.length > 0
              ? data.guests.map(toUiGuest)
              : [createEmptyGuest()]
          );
          setLoadedRegistryId(incomingId);
        }
      })
      .catch(() => {
        // 404 — no registry yet, keep the single empty row already in state
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]); // intentionally omit loadedRegistryId — we only want this on mount

  /* =====================================================
      VALIDATION
  ===================================================== */
  const validateGuests = (): boolean => {
    for (let i = 0; i < guests.length; i++) {
      const g = guests[i];
      const label = `Guest #${i + 1}`;

      if (!g.name.trim()) {
        toast.error(`${label}: Full Name is required`);
        return false;
      }
      if (!g.gender) {
        toast.error(`${label}: Gender is required`);
        return false;
      }

      if (g.type === "ADULT") {
        if (!g.id_number?.trim()) {
          toast.error(`${label}: National ID / Passport is required`);
          return false;
        }
        if (!g.phone?.trim()) {
          toast.error(`${label}: Phone Number is required`);
          return false;
        }
        if (!g.email?.trim()) {
          toast.error(`${label}: Email Address is required`);
          return false;
        }
        if (!/^\S+@\S+\.\S+$/.test(g.email)) {
          toast.error(`${label}: Provide a valid email`);
          return false;
        }
      } else {
        if (!g.birth_cert_number?.trim()) {
          toast.error(`${label}: Birth Certificate Number is required`);
          return false;
        }
      }
    }
    return true;
  };

  /* =====================================================
      HANDLERS
  ===================================================== */
  const addGuestHandler = () => {
    if (guests.length < 5) {
      setGuests((prev) => [...prev, createEmptyGuest()]);
      toast.success("New guest row added.");
    } else {
      toast.error("Maximum allocation (5) reached.");
    }
  };

  const removeGuest = (uiId: string) => {
    if (guests.length > 1) {
      setGuests((prev) => prev.filter((g) => g.uiId !== uiId));
      toast.success("Guest row removed.");
    }
  };

  const updateField = <K extends keyof IGuest>(
    uiId: string,
    field: K,
    value: IGuest[K]
  ) => {
    setGuests((prev) =>
      prev.map((g) => (g.uiId === uiId ? { ...g, [field]: value } : g))
    );
  };

  const handleSaveDraft = async () => {
    dispatch(saveGuestDraft(guests.map(toApiGuest)))
      .unwrap()
      .then(() => toast.success("Changes saved to local registry."))
      .catch((err: string) => toast.error(err));
  };

  const handleFinalSubmit = async () => {
    setShowConfirmModal(false);

    // Persist the current form state first, then submit
    dispatch(saveGuestDraft(guests.map(toApiGuest)))
      .unwrap()
      .then(() => dispatch(submitGuestRegistry()).unwrap())
      .then(() => toast.success("Registry updated successfully.", { icon: "⚖️" }))
      .catch((err: string) => toast.error(err));
  };

  /* =====================================================
      DERIVED VALUES
  ===================================================== */
  const status = myRegistry.status;
  const busy = loading || isSaving;

  /* =====================================================
      RENDER
  ===================================================== */
  return (
    <div className="max-w-5xl mx-auto space-y-8 p-8">
      <Toaster position="top-right" />

      {/* ── LOADING SKELETON ── */}
      {loading && guests.length === 0 && (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="animate-spin" size={20} />
          <span className="text-sm font-bold uppercase tracking-widest">
            Loading registry…
          </span>
        </div>
      )}

      {/* ── CONFIRMATION MODAL ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#b48222]" />
            <button
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-6 right-6 text-slate-300 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center space-y-6">
              <div className="bg-amber-50 p-4 rounded-full text-amber-600">
                <AlertCircle size={48} />
              </div>
              <div className="space-y-3">
                <h3 className="text-[#1a3a32] font-serif text-2xl font-bold uppercase tracking-tighter">
                  Confirm Registration
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium px-2">
                  Kindly confirm whether these will be the only guests accompanying you to the swearing-in ceremony.{" "}
                  <span className="text-[#355E3B] font-bold underline decoration-[#C5A059]">
                    {guests.length} guest(s)
                  </span>
                  ? You can still modify this later if required.
                </p>
              </div>
              <div className="flex flex-col w-full gap-3 pt-4">
                <button
                  onClick={handleFinalSubmit}
                  disabled={busy}
                  className="w-full py-4 bg-[#1a3a32] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {busy && <Loader2 className="animate-spin" size={14} />}
                  Yes, Confirm & Update
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full py-4 bg-white text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECURITY NOTICE ── */}
      <div className="bg-[#1a3a32]/5 border border-[#1a3a32]/10 rounded-[2rem] p-8 flex flex-col md:flex-row gap-6 items-center">
        <div className="bg-[#1a3a32] p-4 rounded-2xl text-white shadow-xl shrink-0">
          <ShieldAlert size={28} />
        </div>
        <div className="space-y-2">
          <h2 className="text-[#1a3a32] text-[11px] font-black uppercase tracking-[0.25em]">
            Security Reminder
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            You may register up to{" "}
            <span className="font-bold text-slate-900">5 guests</span>. Ensure
            names match their official Identification Documents.
          </p>
        </div>
      </div>

      {/* ── HEADER ── */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-black text-[#1a3a32] uppercase tracking-tighter">
            Guest Registration
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                status === "SUBMITTED"
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {status}
            </span>
            {myRegistry.updatedAt && (
              <span className="text-[10px] text-slate-400 font-medium">
                Last saved{" "}
                {new Date(myRegistry.updatedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <p className="text-sm font-black text-[#1a3a32] tracking-widest">
          {guests.length} / 5 GUESTS
        </p>
      </div>

      {/* ── GUEST FORMS ── */}
      <div className="space-y-6">
        {guests.map((guest, index) => (
          <div
            key={guest.uiId}
            className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-center mb-8">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1a3a32] text-white text-xs font-black">
                {index + 1}
              </span>
              <button
                onClick={() => removeGuest(guest.uiId)}
                className="text-slate-300 hover:text-red-500 transition-colors"
                aria-label={`Remove guest ${index + 1}`}
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Input
                label="Full Name"
                required
                value={guest.name}
                onChange={(v) => updateField(guest.uiId, "name", v)}
              />

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Classification <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {(["ADULT", "MINOR"] as GuestType[]).map((t) => (
                    <Toggle
                      key={t}
                      active={guest.type === t}
                      label={t}
                      onClick={() => updateField(guest.uiId, "type", t)}
                    />
                  ))}
                </div>
              </div>

              <Select
                label="Gender"
                required
                value={guest.gender}
                options={["MALE", "FEMALE", "OTHER"]}
                onChange={(v) => updateField(guest.uiId, "gender", v as Gender)}
              />

              {guest.type === "ADULT" ? (
                <>
                  <Input
                    label="ID / Passport"
                    required
                    value={guest.id_number ?? ""}
                    onChange={(v) => updateField(guest.uiId, "id_number", v)}
                  />
                  <Input
                    label="Phone Number"
                    required
                    value={guest.phone ?? ""}
                    onChange={(v) => updateField(guest.uiId, "phone", v)}
                  />
                  <Input
                    label="Email Address"
                    required
                    value={guest.email ?? ""}
                    onChange={(v) => updateField(guest.uiId, "email", v)}
                  />
                </>
              ) : (
                <>
                  <Input
                    label="Birth Cert Number"
                    required
                    value={guest.birth_cert_number ?? ""}
                    onChange={(v) =>
                      updateField(guest.uiId, "birth_cert_number", v)
                    }
                  />
                  <Input
                    label="Guardian Phone (Optional)"
                    value={guest.phone ?? ""}
                    onChange={(v) => updateField(guest.uiId, "phone", v)}
                  />
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── FOOTER ACTIONS ── */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-slate-100">
        <button
          onClick={addGuestHandler}
          disabled={guests.length >= 5 || busy}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#1a3a32] disabled:opacity-30 hover:underline underline-offset-8 transition-all"
        >
          <UserPlus size={16} /> Add Another Guest
        </button>

        <div className="flex gap-4">
          <button
            onClick={handleSaveDraft}
            disabled={busy}
            className="px-8 py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Save size={14} />
            )}
            Save Draft
          </button>
          <button
            onClick={() => validateGuests() && setShowConfirmModal(true)}
            disabled={busy}
            className="px-10 py-4 bg-[#1a3a32] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#142d27] shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {status === "SUBMITTED" ? "Update Registration" : "Finalize Registry"}{" "}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* =====================================================
    REUSABLE SUB-COMPONENTS
===================================================== */

interface InputProps {
  label: string;
  value?: string;
  required?: boolean;
  onChange: (v: string) => void;
}

const Input = ({ label, value, required, onChange }: InputProps) => (
  <div className="space-y-1">
    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 ring-[#b48222]/20 outline-none transition-all"
      placeholder={required ? "Required..." : "Optional..."}
    />
  </div>
);

interface SelectProps {
  label: string;
  value?: string;
  required?: boolean;
  options: string[];
  onChange: (v: string) => void;
}

const Select = ({ label, value, required, options, onChange }: SelectProps) => (
  <div className="space-y-1">
    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none ring-[#b48222]/20 focus:ring-2 appearance-none"
    >
      <option value="" disabled>
        Select...
      </option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

interface ToggleProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

const Toggle = ({ active, label, onClick }: ToggleProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 px-4 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl border transition-all ${
      active
        ? "bg-[#1a3a32] border-[#1a3a32] text-white shadow-lg shadow-emerald-900/10"
        : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
    }`}
  >
    {label}
  </button>
);

export default JudgeGuest;