import React, { useMemo, useState, useEffect } from "react";
import HTMLFlipBook from "react-pageflip";
import {
  Landmark,
  Briefcase,
  ShieldCheck,
  Phone,
  FileText,
  CreditCard,
  Users,
  Home,
  Plane,
  Ticket,
  Stethoscope,
  CalendarDays,
  RefreshCcw,
  Banknote,
  ArrowRightLeft,
  Truck,
  type LucideIcon,
} from "lucide-react";
import CoverP from "../../assets/CoverP.png";
import Back from "../../assets/Back.png";

/* =====================================================
    SUB-COMPONENTS
===================================================== */

const Page = React.forwardRef<
  HTMLDivElement,
  { number: number; children: React.ReactNode; isCover?: boolean }
>((props, ref) => (
  <div
    className={`w-full h-full flex flex-col relative overflow-hidden ${
      props.isCover ? "bg-white" : "bg-[#fdfbf7]"
    }`}
    ref={ref}
  >
    <div
      className={`flex-1 flex flex-col relative z-0 ${
        !props.isCover
          ? "m-3 sm:m-5 border border-[#355E3B]/10 p-4 sm:p-6 rounded-sm overflow-hidden bg-white shadow-inner"
          : "h-full w-full"
      }`}
    >
      {props.children}
      {!props.isCover && (
        <div className="absolute bottom-2 right-5 text-[7px] font-black text-slate-300 tracking-widest uppercase px-1">
          REPUBLIC OF KENYA • P. {props.number}
        </div>
      )}
    </div>
  </div>
));
Page.displayName = "Page";

const SectionHeader = ({
  title,
  subtitle,
  icon: Icon,
  number,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  number?: number;
}) => (
  <header className="border-b-2 border-[#355E3B]/20 pb-3 mb-5 shrink-0">
    <div className="flex justify-between items-start gap-2">
      <div className="flex items-start gap-3">
        {number !== undefined && (
          <span className="mt-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-[#C5A059] text-white text-[10px] font-black shrink-0">
            {number}
          </span>
        )}
        <div>
          <h2 className="text-[#355E3B] font-serif text-base font-bold uppercase tracking-tight leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[#C5A059] text-[8px] font-black uppercase tracking-[0.2em] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <Icon size={18} className="text-[#355E3B]/20 shrink-0 mt-0.5" />
    </div>
  </header>
);

const MultiItem = ({
  items,
}: {
  items: { label: string; icon: LucideIcon; content: string; number: number }[];
}) => (
  <div className="flex flex-col gap-5">
    {items.map(({ label, icon: Icon, content, number }) => (
      <div key={number}>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#C5A059] text-white text-[9px] font-black shrink-0">
            {number}
          </span>
          <Icon size={12} className="text-[#355E3B]" />
          <h4 className="text-[10px] font-black text-[#355E3B] uppercase tracking-wider">
            {label}
          </h4>
        </div>
        <p className="text-[11px] font-serif leading-relaxed text-slate-700 pl-3 border-l-2 border-[#C5A059]/30">
          {content}
        </p>
      </div>
    ))}
  </div>
);

/* =====================================================
    MAIN FLIPBOOK
===================================================== */
const ProgramFlipbook = () => {
  const [bookSize, setBookSize] = useState({ width: 450, height: 630 });

  useEffect(() => {
    const updateSize = () => {
      const w = window.innerWidth < 640 ? window.innerWidth - 32 : 480;
      setBookSize({ width: w, height: w * 1.45 });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const flipbookPages = useMemo(() => {
    const pages: React.ReactNode[] = [];

    // ── PAGE 1: FRONT COVER ──────────────────────────────────────────────────
    pages.push(
      <Page key="cover" number={0} isCover>
        <img src={CoverP} alt="Judiciary Cover" className="w-full h-full object-cover" />
      </Page>
    );

    // ── PAGE 2: WELCOME ABOARD (standalone, full page) ───────────────────────
    pages.push(
      <Page key="welcome" number={2}>
        <SectionHeader title="Welcome Aboard" subtitle="Judicial Mandate" icon={Landmark} />
        <div className="flex flex-col gap-4">
          <p className="text-[11.5px] font-serif leading-relaxed text-slate-700">
            The Office of the Registrar, High Court, is honoured to warmly welcome Your
            Lordship/Ladyship to the High Court. We extend our sincere congratulations on your
            appointment and assure you of our full administrative and logistical support as you
            undertake your judicial mandate.
          </p>
          <p className="text-[11.5px] font-serif leading-relaxed text-slate-700">
            Our office remains committed to facilitating the efficient discharge of your functions
            in accordance with established Judiciary policies and operational guidelines.
          </p>
          <p className="text-[11.5px] font-serif leading-relaxed text-slate-700">
            For Your Lordship's/Ladyship's information and ease of reference, outlined below are
            the key procedures relating to administrative support.
          </p>
        </div>
        {/* decorative seal watermark */}
        <div className="absolute bottom-8 right-6 opacity-5 pointer-events-none">
          <div className="w-28 h-28 rounded-full border-4 border-[#355E3B] flex items-center justify-center">
            <Landmark size={48} className="text-[#355E3B]" />
          </div>
        </div>
      </Page>
    );

    // ── PAGE 3: Items 1 & 2 – Per Diem ──────────────────────────────────────
    pages.push(
      <Page key="p3" number={3}>
        <SectionHeader title="Financial Procedures" subtitle="Travel & Imprest" icon={Plane} />
        <MultiItem
          items={[
            {
              number: 1,
              label: "Per Diem / Imprest",
              icon: CreditCard,
              content:
                "Requests for per diem or imprest should be submitted to the Registrar, High Court, by way of a memo attaching the relevant approval for the activity. Such requests should be made at least twenty (20) working days prior to the date of travel to allow for processing. Upon return, the imprest must be surrendered through Your Lordship's/Ladyship's personal Jumuika account, together with supporting documents including the work ticket or boarding pass and, where applicable, a copy of the passport showing exit and entry stamps.",
            },
            {
              number: 2,
              label: "Per Diem (Foreign Travel)",
              icon: Plane,
              content:
                "Per diem for foreign travel may be payable for activities approved by the Hon. Chief Justice. Requests for payment should be addressed to the Chief Registrar through the Registrar, High Court, and must be accompanied by the approval letter from the Hon. Chief Justice and the invitation letter from the event organizers.",
            },
          ]}
        />
      </Page>
    );

    // ── PAGE 4: Items 3 & 4 – Mortgage & Club ───────────────────────────────
    pages.push(
      <Page key="p4" number={4}>
        <SectionHeader title="Financial Benefits" subtitle="Loans & Memberships" icon={Briefcase} />
        <MultiItem
          items={[
            {
              number: 3,
              label: "Mortgage Facility and Car Loan",
              icon: Banknote,
              content:
                "Applications for the mortgage facility and car loan should be submitted using duly completed forms to the Chief Registrar through the Registrar, High Court. Approval is subject to consideration by the Judiciary Loans Management Committee and availability of funds.",
            },
            {
              number: 4,
              label: "Club Membership Payment",
              icon: Users,
              content:
                "Applications for club membership shall be submitted through the High Court Support Office for onward transmission to Directorate of HR. Upon identification of a preferred club, Your Ladyship/Lordship shall submit a pro forma invoice from the selected club for processing of direct payment. The invoice amount shall not exceed Ksh 350,000. Where Your Ladyship/Lordship is already a member of a club, a claim for reimbursement may be made. Such reimbursement claims shall be supported by valid and official payment receipts issued by the club.",
            },
          ]}
        />
      </Page>
    );

    // ── PAGE 5: Items 5 & 6 – Utility Bills & Police ────────────────────────
    pages.push(
      <Page key="p5" number={5}>
        <SectionHeader title="Utilities & Security" subtitle="Reimbursement & Protection" icon={ShieldCheck} />
        <MultiItem
          items={[
            {
              number: 5,
              label: "Reimbursement of Utility Bills",
              icon: Home,
              content:
                "Judges are entitled to reimbursement of residential utility expenses, including electricity, and water upon submission of the bills and original payment receipts. Where payments are made via Mpesa, supporting documentation such as Mpesa statements and relevant utility statements reflecting payment should be attached. Claims should be forwarded with a cover letter to the Registrar, High Court.",
            },
            {
              number: 6,
              label: "Police Drivers and Bodyguards",
              icon: ShieldCheck,
              content:
                "Upon request, Judges may be assigned a police driver and bodyguard. Where a Judge identifies an officer of choice, the officer's name, rank, force number, and current station should be submitted to the High Court Judges Support Office. Selected drivers must be drawn from the Kenya Police Service, while bodyguards must be from the Administration Police Service and should not be attached to special units. Officers assigned are entitled to a monthly allowance and airtime commensurate with their rank.",
            },
          ]}
        />
      </Page>
    );

    // ── PAGE 6: Items 7 & 8 – Sentry & Passport ─────────────────────────────
    pages.push(
      <Page key="p6" number={6}>
        <SectionHeader title="Security & Documentation" subtitle="Sentry & Passport Services" icon={FileText} />
        <MultiItem
          items={[
            {
              number: 7,
              label: "Residence Sentry Services",
              icon: Home,
              content:
                "Administration Police Officers may be assigned to provide residential sentry services upon request, subject to availability and priority is given to the residence within the county of your workstation.",
            },
            {
              number: 8,
              label: "Passport Applications",
              icon: FileText,
              content:
                "Applications for passports, including Diplomatic Passports, should be submitted through the individual Judge's e-citizen account and applicable fees paid accordingly. The High Court Judges Support Office facilitates access to VIP services at the Immigration Office for submission.",
            },
          ]}
        />
      </Page>
    );

    // ── PAGE 7: Items 9 & 10 – Visa & Air Ticketing ──────────────────────────
    pages.push(
      <Page key="p7" number={7}>
        <SectionHeader title="Official Travel" subtitle="Visa & Air Ticketing" icon={Ticket} />
        <MultiItem
          items={[
            {
              number: 9,
              label: "Visa Applications (Official Travel)",
              icon: Plane,
              content:
                "For official travel, the Support Office facilitates visa applications upon receipt of approval to travel from the Hon. Chief Justice and the invitation letter from the organizer. Kindly note most embassies require at least fifteen (15) working days for visa processing.",
            },
            {
              number: 10,
              label: "Air Ticketing (Official Travel)",
              icon: Ticket,
              content:
                "Requests for official travel air ticketing should be made by memo indicating the preferred travel date and time, the name as it appears on the identification document or passport, and the approval for the activity. Requests should be submitted to the Registrar High Court at least twenty (20) working days prior to travel to allow for compliance with procurement rules.",
            },
          ]}
        />
      </Page>
    );

    // ── PAGE 8: Items 11, 12 & 13 – Medical, Leave, Commutation ─────────────
    pages.push(
      <Page key="p8" number={8}>
        <SectionHeader title="Medical & Leave" subtitle="Claims, Applications & Commutation" icon={Stethoscope} />
        <MultiItem
          items={[
            {
              number: 11,
              label: "Medical Expense Claims (Cash Payments)",
              icon: Stethoscope,
              content:
                "Where a Judge is attended to by a medical practitioner not on the approved insurance panel and payment is made in cash, a duly completed medical claim form together with original receipts should be submitted through the High Court Judges Support Office within forty-five (45) days of service. Refunds are processed by cheque from the insurance provider.",
            },
            {
              number: 12,
              label: "Leave Applications",
              icon: CalendarDays,
              content:
                "Leave applications should be submitted through Your Lordship's/Ladyship's Jumuika account and scheduled in consultation with the Presiding Judge to ensure alignment with station or division schedules.",
            },
            {
              number: 13,
              label: "Commutation of Leave",
              icon: RefreshCcw,
              content:
                "Requests for commutation of leave days should be addressed to the Hon. Chief Justice through the Principal Judge, with a copy to the Registrar, High Court.",
            },
          ]}
        />
      </Page>
    );

    // ── PAGE 9: Items 14, 15, 16 & 17 – Payroll, Transfer & Movers ──────────
    pages.push(
      <Page key="p9" number={9}>
        <SectionHeader title="Transfers & Payroll" subtitle="Allowances, Movers & Payroll" icon={ArrowRightLeft} />
        <MultiItem
          items={[
            {
              number: 14,
              label: "Payroll Matters",
              icon: Banknote,
              content:
                "For payroll-related matters, including changes to bank account details or check-offs, notification should be made to the Registrar, High Court, by letter or email for onward transmission to the Human Resource Directorate and the National Treasury.",
            },
            {
              number: 15,
              label: "Transfer Allowance (Judges)",
              icon: ArrowRightLeft,
              content:
                "Upon transfer, transfer allowance for Judges is processed upon receipt of a reporting letter from the Presiding Judge or Deputy Registrar addressed to the Principal Judge and copied to the Registrar, High Court.",
            },
            {
              number: 16,
              label: "Transfer Allowance (Drivers and Bodyguards)",
              icon: Users,
              content:
                "Drivers and bodyguards are entitled to transfer allowance upon submission of a reporting letter addressed to the Registrar, High Court, together with a copy of the officer's payslip.",
            },
            {
              number: 17,
              label: "Movers' Services",
              icon: Truck,
              content:
                "Judges on transfer are facilitated with movers' services upon submission of the prescribed Home Mover's Details Form to the High Court Judges Support Office at least fifteen (15) working days prior to the intended moving date to allow for compliance with procurement rules.",
            },
          ]}
        />
      </Page>
    );

    // ── PAGE 10: CLOSING & CONTACT ───────────────────────────────────────────
    pages.push(
      <Page key="contact" number={10}>
        <SectionHeader title="High Court Judges Support Office" subtitle="ORHC – Contact Information" icon={Phone} />

        {/* Closing note */}
        <div className="mb-6 p-4 bg-[#355E3B]/5 rounded border-l-4 border-[#355E3B]">
          <p className="text-[11.5px] font-serif italic leading-relaxed text-slate-700">
            The Office once again welcomes Your Lordship/Ladyship and remains committed to
            providing the necessary support in the execution of your judicial mandate.
          </p>
          <p className="mt-3 text-[10px] font-black text-[#355E3B] uppercase tracking-wider">
            With compliments
          </p>
          <p className="mt-1 text-[11px] font-serif italic text-slate-600">
            Registrar, High Court.
          </p>
        </div>

        {/* Contact details */}
        <div className="flex flex-col gap-3">
          {[
            { icon: Home, label: "Address", value: "Milimani Law Courts, 4th Floor, Room 401" },
            { icon: Phone, label: "Mobile", value: "0706 074 093" },
            { icon: Phone, label: "Cisco IP Phone", value: "0730 181 000 | Ext: 1077 / 1079 / 1097" },
            { icon: FileText, label: "Email", value: "highcourthelpdesk@gmail.com" },
            { icon: Landmark, label: "Website", value: "highcourt.judiciary.go.ke" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="mt-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-[#355E3B]/10 shrink-0">
                <Icon size={11} className="text-[#355E3B]" />
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-[#C5A059]">{label}</p>
                <p className="text-[11px] font-serif text-slate-700">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </Page>
    );

    // ── PAGE 11: BACK COVER ──────────────────────────────────────────────────
    pages.push(
      <Page key="back" number={11} isCover>
        <img src={Back} alt="Judiciary Back" className="w-full h-full object-cover" />
      </Page>
    );

    return pages;
  }, []);

  return (
    <div className="flex justify-center items-center py-12 bg-slate-100/50 min-h-screen">
      <div className="relative shadow-2xl">
        {/* @ts-expect-error - legacy Ref types in react-pageflip */}
        <HTMLFlipBook
          width={bookSize.width}
          height={bookSize.height}
          size="fixed"
          drawShadow={true}
          usePortrait={true}
          mobileScrollSupport={true}
          startPage={0}
          className="book-container"
        >
          {flipbookPages}
        </HTMLFlipBook>
      </div>
    </div>
  );
};

export default ProgramFlipbook;