import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Search, Loader2, ChevronUp, ChevronDown, ChevronsUpDown,
  Users, CheckCircle2, Clock3, ShieldCheck, Hash, Phone,
  Mail, FileDown,
} from "lucide-react";
import { adminGetAllRegistries, adminGetRegistryById } from "../../redux/slices/guestSlice";
import type { AppDispatch, RootState } from "../../redux/store";
import type { IAdminRegistryRow, IGuest, RegistrationStatus } from "../../interfaces/guests.interface";
import api from "../../api/api";

// ── Types ────────────────────────────────────────────────────────────────────
type SortKey = keyof Pick<IAdminRegistryRow, "judge_name" | "status" | "guest_count" | "updated_at">;
type SortDir = "asc" | "desc";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-KE", {
    day: "2-digit", month: "short", year: "numeric",
  });

const statusMeta: Record<RegistrationStatus, { label: string }> = {
  SUBMITTED: { label: "Finalized" },
  DRAFT:     { label: "Draft Mode" },
};

// ── Download Helper ──────────────────────────────────────────────────────────
const downloadJudgePDF = async (userId: string, judgeName: string) => {
  const response = await api.get(`/guests/report/${userId}`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `GuestList_${judgeName.replace(/\s+/g, "_")}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ── Sort Icon ────────────────────────────────────────────────────────────────
const SortIcon = ({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) => {
  if (col !== sortKey) return <ChevronsUpDown size={13} className="inline opacity-30 ml-1" />;
  return sortDir === "asc"
    ? <ChevronUp   size={13} className="inline ml-1 text-[#355E3B]" />
    : <ChevronDown size={13} className="inline ml-1 text-[#355E3B]" />;
};

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color = "text-[#355E3B]" }: StatCardProps) => (
  <div className="bg-white border border-slate-200 px-6 py-4 rounded-2xl flex items-center gap-5 shadow-sm min-w-[160px]">
    <div className={`${color} bg-slate-50 p-3 rounded-2xl`}>{icon}</div>
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
      <p className={`text-xl font-bold leading-none ${color} tracking-tight`}>{value}</p>
    </div>
  </div>
);

// ── Detail Item ──────────────────────────────────────────────────────────────
const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    <p className="text-xs font-bold text-slate-700">{value}</p>
  </div>
);

// ── Guest Card ───────────────────────────────────────────────────────────────
const GuestCard = ({ guest, idx }: { guest: IGuest; idx: number }) => (
  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#355E3B]/10 flex items-center justify-center text-[#355E3B] font-bold text-xs">
          {idx + 1}
        </div>
        <h4 className="text-sm font-bold text-slate-800">{guest.name || "Unnamed Guest"}</h4>
      </div>
      <span className="text-[9px] font-black uppercase tracking-tighter bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500">
        {guest.type}
      </span>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <DetailItem label="Gender" value={guest.gender || "Not Specified"} />
      <DetailItem
        label="ID Status"
        value={guest.id_number || guest.birth_cert_number ? "Verified" : "Missing Info"}
      />
    </div>

    <div className="space-y-2 pt-2 border-t border-slate-200">
      <div className="flex items-center gap-2 text-xs text-slate-600">
        <Hash size={14} className="text-slate-400" />
        <span className="font-medium">{guest.id_number || guest.birth_cert_number || "No ID/Cert"}</span>
      </div>
      {guest.type === "ADULT" && (
        <>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Phone size={14} className="text-slate-400" />
            <span className="font-medium">{guest.phone || "No Phone"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Mail size={14} className="text-slate-400" />
            <span className="truncate font-medium">{guest.email || "No Email"}</span>
          </div>
        </>
      )}
    </div>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const SuperAdminGuests = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { allLists, loading, expandedRegistry, expandLoading } = useSelector(
    (state: RootState) => state.guests.admin
  );

  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState<RegistrationStatus | "ALL">("ALL");
  const [sortKey,     setSortKey]     = useState<SortKey>("updated_at");
  const [sortDir,     setSortDir]     = useState<SortDir>("desc");
  const [expandedId,  setExpandedId]  = useState<number | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null); // ← added

  useEffect(() => {
    dispatch(adminGetAllRegistries());
  }, [dispatch]);

  const rows = allLists
    .filter((r) => {
      const matchesSearch =
        r.judge_name.toLowerCase().includes(search.toLowerCase()) ||
        r.user_id.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "ALL" || r.status === filter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });

  const totalGuests    = allLists.reduce((s, r) => s + Number(r.guest_count), 0);
  const submittedCount = allLists.filter((r) => r.status === "SUBMITTED").length;
  const draftCount     = allLists.filter((r) => r.status === "DRAFT").length;

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleToggleRow = (registrationId: number) => {
    if (expandedId === registrationId) {
      setExpandedId(null);
    } else {
      setExpandedId(registrationId);
      dispatch(adminGetRegistryById(registrationId));
    }
  };

  // ── Download Handler ───────────────────────────────────────────────────────
  const handleDownload = async (userId: string, judgeName: string) => {
    try {
      setDownloading(userId);
      await downloadJudgePDF(userId, judgeName);
    } catch (error) {
      console.error("Failed to download PDF", error);
    } finally {
      setDownloading(null);
    }
  };

  if (loading && allLists.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-[#355E3B]" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          Synchronizing Registry...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in duration-700">

      {/* Header & Stats */}
      <div className="flex flex-col gap-6 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-[#355E3B] font-serif text-3xl font-bold mb-2 tracking-tight">
            Guest Registration
          </h1>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest">
            High Court Registry Management
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <StatCard icon={<ShieldCheck size={18} />}  label="Total Entries" value={allLists.length} />
          <StatCard icon={<CheckCircle2 size={18} />} label="Finalized"     value={submittedCount} color="text-green-600" />
          <StatCard icon={<Clock3 size={18} />}        label="Drafts"        value={draftCount}     color="text-amber-600" />
          <StatCard icon={<Users size={18} />}          label="Guest Total"  value={totalGuests} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by judge name or user ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#355E3B]/20 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(["ALL", "SUBMITTED", "DRAFT"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                filter === f
                  ? "bg-[#1a3a32] text-white border-transparent shadow-lg shadow-[#1a3a32]/20"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f === "ALL" ? "All" : statusMeta[f as RegistrationStatus].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer select-none hover:text-[#355E3B] transition-colors" onClick={() => handleSort("judge_name")}>
                  Registrant Details <SortIcon col="judge_name" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  User ID
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer select-none hover:text-[#355E3B] transition-colors" onClick={() => handleSort("guest_count")}>
                  Guests <SortIcon col="guest_count" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer select-none hover:text-[#355E3B] transition-colors" onClick={() => handleSort("status")}>
                  Status <SortIcon col="status" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer select-none hover:text-[#355E3B] transition-colors" onClick={() => handleSort("updated_at")}>
                  Created On <SortIcon col="updated_at" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center text-sm text-slate-400 font-semibold">
                    No registries found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const isExpanded = expandedId === row.id;
                  const isDownloading = downloading === row.user_id; // ← added
                  return (
                    <React.Fragment key={row.id}>
                      {/* Summary Row */}
                      <tr className={`hover:bg-slate-50/80 transition-all ${isExpanded ? "bg-slate-50/50" : ""}`}>
                        <td className="px-8 py-6">
                          <span className="text-sm font-bold text-[#355E3B]">{row.judge_name}</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[11px] font-mono text-slate-400">{row.user_id}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-bold text-slate-700">{Number(row.guest_count)}</span>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Guests List</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {row.status === "SUBMITTED" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest border border-green-100">
                              <CheckCircle2 size={12} /> Finalized
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-100">
                              <Clock3 size={12} /> Draft Mode
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-6 text-xs text-slate-500 font-semibold">
                          {formatDate(row.updated_at)}
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-end gap-2"> {/* ← changed to div with gap */}
                            {/* Download Button ← added */}
                            <button
                              onClick={() => handleDownload(row.user_id, row.judge_name)}
                              disabled={isDownloading}
                              title="Download PDF Report"
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-white border border-slate-200 text-slate-500 hover:text-[#355E3B] hover:border-[#355E3B]/30 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isDownloading
                                ? <Loader2 size={13} className="animate-spin" />
                                : <FileDown size={13} />
                              }
                              {isDownloading ? "Downloading..." : "PDF"}
                            </button>

                            {/* View / Close Button */}
                            <button
                              onClick={() => handleToggleRow(row.id)}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                isExpanded
                                  ? "bg-[#355E3B] text-white shadow-lg shadow-[#355E3B]/20"
                                  : "bg-white border border-slate-200 text-[#355E3B] hover:bg-slate-50"
                              }`}
                            >
                              {isExpanded ? "Close" : "View"}
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Guest Detail Row */}
                      {isExpanded && (
                        <tr className="bg-white">
                          <td colSpan={6} className="px-8 py-8 animate-in slide-in-from-top-2 duration-300">
                            {expandLoading ? (
                              <div className="flex items-center justify-center gap-3 py-8 text-slate-400">
                                <Loader2 size={18} className="animate-spin text-[#355E3B]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                  Loading guest details…
                                </span>
                              </div>
                            ) : expandedRegistry && expandedRegistry.id === row.id ? (
                              <div className="flex flex-col gap-8">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    Authorized Guest Details
                                  </h3>
                                  {/* Download PDF inside expanded panel ← updated from placeholder */}
                                  <button
                                    onClick={() => handleDownload(row.user_id, row.judge_name)}
                                    disabled={isDownloading}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#355E3B] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isDownloading
                                      ? <Loader2 size={12} className="animate-spin" />
                                      : <FileDown size={12} />
                                    }
                                    {isDownloading ? "Downloading..." : "Download PDF Report"}
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {expandedRegistry.guests.map((guest: IGuest, idx: number) => (
                                    <GuestCard key={guest.id ?? idx} guest={guest} idx={idx} />
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-center text-sm text-slate-400 py-8">
                                Could not load guest details.
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer count */}
      {!loading && rows.length > 0 && (
        <p className="text-xs text-slate-400 text-right">
          showing {rows.length} of {allLists.length}
        </p>
      )}
    </div>
  );
};

export default SuperAdminGuests;