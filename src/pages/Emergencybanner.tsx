import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Megaphone, ChevronDown, ChevronUp } from "lucide-react";
import { getEmergencyNote, adminGetAllRegistries } from "../redux/slices/guestSlice";
import type { AppDispatch, RootState } from "../redux/store";

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */
const SESSION_KEY      = "eb_dismissed";
const AUTO_COLLAPSE_MS = 10_000; // 10 s before banner collapses to slim strip

/* ─────────────────────────────────────────
   Component
───────────────────────────────────────── */
const EmergencyBanner = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { allLists } = useSelector((state: RootState) => state.guests.admin);

  const [message,   setMessage]   = useState<string | null>(null);
  const [visible,   setVisible]   = useState(false);
  const [expanded,  setExpanded]  = useState(true);
  const [countdown, setCountdown] = useState(AUTO_COLLAPSE_MS / 1000);
  const [dismissed, setDismissed] = useState(false); // always false on fresh login

  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const collapseRef = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const hasFetched  = useRef(false); // prevent note being fetched more than once

  /* ── 1. Clear stale dismissal flag on fresh mount (new login) ── */
  useEffect(() => {
    sessionStorage.removeItem(SESSION_KEY);
  }, []); // runs once only

  /* ── 2. Always fetch all registries on mount — don't rely on cache ── */
  useEffect(() => {
    dispatch(adminGetAllRegistries());
  }, [dispatch]); // runs once only

  /* ── 3. Once allLists populates, fetch the emergency note ── */
  useEffect(() => {
    const firstRegistry = allLists[0];

    // Need an id, not dismissed, and haven't already fetched
    if (!firstRegistry?.id || dismissed || hasFetched.current) return;

    hasFetched.current = true; // lock — stops re-fetching on subsequent allLists re-renders

    console.log("[EmergencyBanner] Fetching note for registry id:", firstRegistry.id);

    dispatch(getEmergencyNote(firstRegistry.id as number))
      .unwrap()
      .then((data) => {
        console.log("[EmergencyBanner] Response:", data);
        if (data?.emergency_note) {
          setMessage(data.emergency_note);
          setVisible(true);
        } else {
          console.log("[EmergencyBanner] No emergency_note set — banner stays hidden.");
        }
      })
      .catch((err) => {
        console.error("[EmergencyBanner] Failed to fetch note:", err);
      });
  }, [dispatch, allLists, dismissed]);

  /* ── 4. Countdown + auto-collapse (only while visible & expanded) ── */
  useEffect(() => {
    if (!visible || !expanded) return;

    const startedAt = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed   = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, AUTO_COLLAPSE_MS / 1000 - elapsed);
      setCountdown(remaining);
      if (remaining === 0) clearInterval(timerRef.current!);
    }, 1000);

    collapseRef.current = setTimeout(() => {
      setExpanded(false);
    }, AUTO_COLLAPSE_MS);

    return () => {
      clearInterval(timerRef.current!);
      clearTimeout(collapseRef.current!);
    };
  }, [visible, expanded]);

  /* ── Handlers ── */
  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem(SESSION_KEY, "1");
    clearInterval(timerRef.current!);
    clearTimeout(collapseRef.current!);
  };

  const handleToggleExpand = () => {
    if (!expanded) {
      setExpanded(true); // re-expand resets countdown effect
    } else {
      setExpanded(false);
      clearInterval(timerRef.current!);
      clearTimeout(collapseRef.current!);
    }
  };

  if (!visible || !message || dismissed) return null;

  /* ─────────────────────────────────────────
     Render
  ───────────────────────────────────────── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,400&family=DM+Sans:wght@400;500;700&display=swap');

        :root {
          --eb-forest:      #1a4731;
          --eb-forest-mid:  #22623f;
          --eb-gold:        #c9963b;
          --eb-gold-light:  #e0b96a;
          --eb-white:       #ffffff;
        }

        .eb-shell {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 9999;
          font-family: 'DM Sans', sans-serif;
          animation: eb-slide-down 0.45s cubic-bezier(.22,1,.36,1) both;
        }

        @keyframes eb-slide-down {
          from { transform: translateY(-110%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }

        .eb-bar {
          background: linear-gradient(
            100deg,
            var(--eb-forest) 0%,
            var(--eb-forest-mid) 40%,
            #1e5c3a 70%,
            #2a4a1e 100%
          );
          border-bottom: 2px solid var(--eb-gold);
          position: relative;
          overflow: hidden;
        }

        .eb-bar::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            transparent 30%,
            rgba(201,150,59,.12) 50%,
            transparent 70%
          );
          animation: eb-shimmer 3.5s ease infinite;
        }

        @keyframes eb-shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        .eb-progress {
          position: absolute;
          top: 0; left: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--eb-gold-light), var(--eb-gold));
          transition: width 1s linear;
          border-radius: 0 3px 3px 0;
        }

        .eb-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.55rem 1.5rem;
          cursor: pointer;
          position: relative;
        }

        .eb-strip-left {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .eb-strip-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--eb-gold);
          flex-shrink: 0;
          animation: eb-pulse 1.4s ease infinite;
        }

        @keyframes eb-pulse {
          0%, 100% { opacity: 1;   transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.6); }
        }

        .eb-strip-label {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--eb-gold-light);
        }

        .eb-strip-preview {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.55);
          font-style: italic;
          font-family: 'Cormorant Garamond', serif;
          max-width: 380px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .eb-strip-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .eb-chevron-btn {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(201,150,59,.3);
          border-radius: 6px;
          color: var(--eb-gold-light);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.2rem;
          cursor: pointer;
          transition: background 0.18s;
        }

        .eb-chevron-btn:hover { background: rgba(201,150,59,.2); }

        .eb-body {
          border-top: 1px solid rgba(201,150,59,.2);
          padding: 1.1rem 1.5rem 1.25rem;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 1rem;
          align-items: flex-start;
          animation: eb-body-in 0.3s ease both;
        }

        @keyframes eb-body-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .eb-icon-blob {
          background: rgba(201,150,59,.15);
          border: 1px solid rgba(201,150,59,.3);
          border-radius: 14px;
          padding: 0.65rem;
          color: var(--eb-gold-light);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .eb-message-wrap { min-width: 0; }

        .eb-eyebrow {
          font-size: 0.55rem;
          font-weight: 700;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--eb-gold);
          margin-bottom: 0.35rem;
        }

        .eb-message-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          font-weight: 600;
          color: var(--eb-white);
          line-height: 1.55;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .eb-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .eb-dismiss-btn {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 8px;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.4rem;
          transition: background 0.18s, color 0.18s;
        }

        .eb-dismiss-btn:hover {
          background: rgba(220,38,38,.25);
          border-color: rgba(220,38,38,.4);
          color: #fca5a5;
        }

        .eb-countdown {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.35);
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        @media (max-width: 560px) {
          .eb-strip-preview { display: none; }
          .eb-body { grid-template-columns: auto 1fr auto; gap: 0.75rem; }
          .eb-message-text { font-size: 0.85rem; }
        }
      `}</style>

      <div className="eb-shell" role="alert" aria-live="assertive">
        <div className="eb-bar">

          {/* Progress bar */}
          {expanded && (
            <div
              className="eb-progress"
              style={{ width: `${(countdown / (AUTO_COLLAPSE_MS / 1000)) * 100}%` }}
            />
          )}

          {/* Collapsed strip — always rendered */}
          <div className="eb-strip" onClick={handleToggleExpand}>
            <div className="eb-strip-left">
              <span className="eb-strip-dot" />
              <span className="eb-strip-label">Emergency Notice</span>
              {!expanded && (
                <span className="eb-strip-preview">— {message}</span>
              )}
            </div>
            <div className="eb-strip-right">
              <button
                className="eb-chevron-btn"
                onClick={(e) => { e.stopPropagation(); handleToggleExpand(); }}
                aria-label={expanded ? "Collapse banner" : "Expand banner"}
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>

          {/* Expanded body */}
          {expanded && (
            <div className="eb-body">
              <div className="eb-icon-blob">
                <Megaphone size={20} />
              </div>

              <div className="eb-message-wrap">
                <p className="eb-eyebrow">System-Wide Announcement</p>
                <p className="eb-message-text">{message}</p>
              </div>

              <div className="eb-actions">
                <button
                  className="eb-dismiss-btn"
                  onClick={handleDismiss}
                  aria-label="Dismiss banner"
                >
                  <X size={15} />
                </button>
                {countdown > 0 && (
                  <span className="eb-countdown">collapses in {countdown}s</span>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default EmergencyBanner;