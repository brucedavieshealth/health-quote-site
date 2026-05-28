import React, { useRef, useState } from "react";
import {
  BriefcaseBusiness,
  Clock3,
  Lock,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

const TOTAL_STEPS = 7;
const LOADING_STEP = 7;
const FINAL_STEP = 8;

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xqejgzyv";
const SMS_WEBHOOK_ENDPOINT = "PASTE_YOUR_SMS_WEBHOOK_URL_HERE";

const coverageOptions = [
  { label: "Individual", icon: User, note: "Just me" },
  { label: "Family", icon: Users, note: "Me + others" },
  { label: "Other", icon: BriefcaseBusiness, note: "Not sure yet" },
];

const genderOptions = ["Male", "Female"];

const providerBadges = [
  {
    name: "UnitedHealthcare",
    logo: "https://raw.githubusercontent.com/brucedavieshealth/health-quote-site/main/united-healthcare.png",
  },
  {
    name: "Blue Cross Blue Shield",
    logo: "https://raw.githubusercontent.com/brucedavieshealth/health-quote-site/main/blue-cross-blue-shield.png",
  },
  {
    name: "Cigna",
    logo: "https://raw.githubusercontent.com/brucedavieshealth/health-quote-site/main/cigna.png",
  },
  {
    name: "Oscar",
    logo: "https://raw.githubusercontent.com/brucedavieshealth/health-quote-site/main/oscar.png",
  },
];

function onlyDigits(value) {
  return String(value || "").replace(/[^0-9]/g, "");
}

function isFullZip(zipArray) {
  return Array.isArray(zipArray) && zipArray.length === 5 && zipArray.every(Boolean);
}

function isFullDob(dob) {
  return dob.month.length === 2 && dob.day.length === 2 && dob.year.length === 4;
}

function formatPhone(value) {
  const digits = onlyDigits(value).slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function runSmokeTests() {
  console.assert(onlyDigits("(561) 679-4929") === "5616794929", "onlyDigits removes formatting");
  console.assert(isFullZip(["3", "3", "4", "2", "8"]), "full ZIP validates");
  console.assert(!isFullZip(["3", "3", "", "2", "8"]), "incomplete ZIP fails");
  console.assert(isFullDob({ month: "01", day: "25", year: "1999" }), "full DOB validates");
  console.assert(formatPhone("5616794929") === "(561) 679-4929", "phone formats correctly");
}

runSmokeTests();

export default function App() {
  const [step, setStep] = useState(1);
  const [coverage, setCoverage] = useState("");
  const [zip, setZip] = useState(["", "", "", "", ""]);
  const [dob, setDob] = useState({ month: "", day: "", year: "" });
  const [gender, setGender] = useState("");
  const [contact, setContact] = useState({ firstName: "", lastName: "", phone: "" });
  const [loadingProgress, setLoadingProgress] = useState(0);

  const zipRefs = useRef([]);
  const monthRef = useRef(null);
  const dayRef = useRef(null);
  const yearRef = useRef(null);

  const visibleStep = Math.min(step, TOTAL_STEPS);
  const progress = Math.round((visibleStep / TOTAL_STEPS) * 100);
  const progressLabel = progress >= 60 ? "Almost done" : step <= 2 ? "Getting started" : "Halfway there";

  const buildLeadData = (leadStatus = "Partial lead", extraData = {}) => ({
    leadStatus,
    currentStep: step,
    coverage,
    zipCode: zip.join(""),
    dateOfBirth: `${dob.month}/${dob.day}/${dob.year}`,
    gender,
    firstName: contact.firstName,
    lastName: contact.lastName,
    phone: contact.phone,
    submittedAt: new Date().toISOString(),
    ...extraData,
  });

  const sendToFormspree = async (data) => {
    try {
      await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Formspree submission failed:", error);
    }
  };

  const sendPartialLead = async (extraData = {}) => {
    await sendToFormspree(buildLeadData("Partial lead", extraData));
  };

  const goNext = () => setStep((currentStep) => Math.min(currentStep + 1, FINAL_STEP));
  const goBack = () => setStep((currentStep) => Math.max(currentStep - 1, 1));

  const chooseAndContinue = (setter, value, fieldName) => {
    setter(value);
    sendPartialLead({ [fieldName]: value });
    window.setTimeout(goNext, 175);
  };

  const submitLeadAndStartLoading = async () => {
    const leadData = buildLeadData("Completed lead", {
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone,
    });

    await sendToFormspree(leadData);

    if (SMS_WEBHOOK_ENDPOINT !== "PASTE_YOUR_SMS_WEBHOOK_URL_HERE") {
      try {
        await fetch(SMS_WEBHOOK_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: "5616794929",
            message: `New health quote lead:\n\nName: ${leadData.firstName} ${leadData.lastName}\nPhone: ${leadData.phone}\nZIP: ${leadData.zipCode}\nDOB: ${leadData.dateOfBirth}\nCoverage: ${leadData.coverage}\nGender: ${leadData.gender}`,
            lead: leadData,
          }),
        });
      } catch (error) {
        console.error("SMS webhook failed:", error);
      }
    }

    startLoadingSequence();
  };

  const startLoadingSequence = () => {
    setStep(LOADING_STEP);
    setLoadingProgress(0);

    let progressValue = 0;

    const progressInterval = window.setInterval(() => {
      progressValue += Math.floor(Math.random() * 10) + 6;

      if (progressValue >= 100) {
        progressValue = 100;
        setLoadingProgress(100);
        window.clearInterval(progressInterval);

        window.setTimeout(() => {
          setStep(FINAL_STEP);
        }, 700);
        return;
      }

      setLoadingProgress(progressValue);
    }, 320);
  };

  const updateZip = (rawValue, index) => {
    const value = onlyDigits(rawValue).slice(0, 1);
    const nextZip = [...zip];
    nextZip[index] = value;
    setZip(nextZip);

    if (value && index < 4) {
      window.setTimeout(() => zipRefs.current[index + 1]?.focus(), 0);
    }

    if (isFullZip(nextZip)) {
      sendPartialLead({ zipCode: nextZip.join("") });
      window.setTimeout(goNext, 225);
    }
  };

  const handleZipKeyDown = (event, index) => {
    if (event.key === "Backspace" && !zip[index] && index > 0) {
      zipRefs.current[index - 1]?.focus();
    }
  };

  const updateDob = (field, rawValue) => {
    const maxLength = field === "year" ? 4 : 2;
    const value = onlyDigits(rawValue).slice(0, maxLength);
    const nextDob = { ...dob, [field]: value };
    setDob(nextDob);

    if (field === "month" && value.length === 2) {
      window.setTimeout(() => dayRef.current?.focus(), 0);
    }

    if (field === "day" && value.length === 2) {
      window.setTimeout(() => yearRef.current?.focus(), 0);
    }

    if (isFullDob(nextDob)) {
      sendPartialLead({ dateOfBirth: `${nextDob.month}/${nextDob.day}/${nextDob.year}` });
      window.setTimeout(goNext, 225);
    }
  };

  const handleDobKeyDown = (event, field) => {
    if (event.key !== "Backspace") return;
    if (field === "day" && !dob.day) monthRef.current?.focus();
    if (field === "year" && !dob.year) dayRef.current?.focus();
  };

  const updateContact = (field, value) => {
    setContact((current) => ({
      ...current,
      [field]: field === "phone" ? formatPhone(value) : value,
    }));
  };

  const contactReady =
    contact.firstName.trim().length > 1 &&
    contact.lastName.trim().length > 1 &&
    onlyDigits(contact.phone).length === 10;

  if (step === FINAL_STEP) {
    return <QuoteSubmittedPage />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] text-slate-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl"
        />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-5 sm:px-5 sm:py-8">
        <motion.section
          key={step}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full"
        >
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="relative rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-2xl shadow-blue-100/50 backdrop-blur sm:p-7"
          >
            <div className="space-y-7 sm:space-y-9">
              <div className="mb-2 flex items-center justify-center">
                <div className="select-none text-2xl font-black tracking-tight text-slate-800">
                  COVER<span className="text-blue-600">A</span>
                </div>
              </div>

              <ProgressBar step={step} totalSteps={TOTAL_STEPS} progress={progress} label={progressLabel} />

              {step === 1 && <LandingHero onStart={goNext} />}

              {step === 2 && (
                <QuestionBlock eyebrow="Coverage type" title="What type of coverage are you looking for?" subtitle="Pick the option that best fits your situation.">
                  <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
                    {coverageOptions.map(({ label, icon: Icon, note }) => (
                      <OptionButton
                        key={label}
                        selected={coverage === label}
                        onClick={() => chooseAndContinue(setCoverage, label, "coverage")}
                        className="group flex items-center gap-4 text-left"
                      >
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                          <Icon size={25} />
                        </div>
                        <div>
                          <div>{label}</div>
                          <div className="mt-1 text-sm font-semibold text-slate-500">{note}</div>
                        </div>
                      </OptionButton>
                    ))}
                  </div>
                </QuestionBlock>
              )}

              {step === 3 && (
                <QuestionBlock eyebrow="Local rates" title="Compare rates in your area instantly" subtitle="Enter your ZIP code to check available options near you.">
                  <div className="space-y-5">
                    <div className="flex justify-center gap-2 sm:gap-3">
                      {zip.map((digit, index) => (
                        <input
                          key={index}
                          ref={(element) => {
                            zipRefs.current[index] = element;
                          }}
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(event) => updateZip(event.target.value, index)}
                          onKeyDown={(event) => handleZipKeyDown(event, index)}
                          className="h-16 w-12 rounded-2xl border border-slate-200 bg-slate-50 text-center text-2xl font-extrabold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:h-20 sm:w-16 sm:rounded-3xl sm:text-3xl"
                        />
                      ))}
                    </div>
                    <TrustNote />
                  </div>
                </QuestionBlock>
              )}

              {step === 4 && (
                <QuestionBlock eyebrow="Age-based options" title="Date of birth" subtitle="Some rates and options may vary based on age.">
                  <div className="space-y-6">
                    <div className="mx-auto max-w-3xl rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-center">
                      <p className="text-sm font-semibold text-slate-700 md:text-base">
                        Depending on your age, insurance providers may offer discounted rates.
                      </p>
                    </div>

                    <div className="mx-auto flex max-w-md items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 px-6 py-5 shadow-inner focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                      <input
                        ref={monthRef}
                        inputMode="numeric"
                        placeholder="mm"
                        maxLength={2}
                        value={dob.month}
                        onChange={(event) => updateDob("month", event.target.value)}
                        className="w-16 bg-transparent text-center text-2xl font-bold outline-none"
                      />
                      <span className="px-2 text-2xl font-bold text-slate-400">/</span>
                      <input
                        ref={dayRef}
                        inputMode="numeric"
                        placeholder="dd"
                        maxLength={2}
                        value={dob.day}
                        onChange={(event) => updateDob("day", event.target.value)}
                        onKeyDown={(event) => handleDobKeyDown(event, "day")}
                        className="w-16 bg-transparent text-center text-2xl font-bold outline-none"
                      />
                      <span className="px-2 text-2xl font-bold text-slate-400">/</span>
                      <input
                        ref={yearRef}
                        inputMode="numeric"
                        placeholder="yyyy"
                        maxLength={4}
                        value={dob.year}
                        onChange={(event) => updateDob("year", event.target.value)}
                        onKeyDown={(event) => handleDobKeyDown(event, "year")}
                        className="w-24 bg-transparent text-center text-2xl font-bold outline-none"
                      />
                    </div>
                  </div>
                </QuestionBlock>
              )}

              {step === 5 && (
                <QuestionBlock eyebrow="Basic details" title="What is your gender?" subtitle="Select one option to continue.">
                  <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
                    {genderOptions.map((option) => (
                      <OptionButton key={option} selected={gender === option} onClick={() => chooseAndContinue(setGender, option, "gender")}>
                        {option}
                      </OptionButton>
                    ))}
                  </div>
                </QuestionBlock>
              )}

              {step === 6 && (
                <QuestionBlock eyebrow="Final step" title="Almost done" subtitle="Where should an agent send your options?">
                  <div className="mx-auto flex max-w-2xl flex-col gap-5">
                    <TextInput
                      type="text"
                      placeholder="First Name"
                      value={contact.firstName}
                      onChange={(event) => updateContact("firstName", event.target.value)}
                    />
                    <TextInput
                      type="text"
                      placeholder="Last Name"
                      value={contact.lastName}
                      onChange={(event) => updateContact("lastName", event.target.value)}
                    />
                    <TextInput
                      type="tel"
                      placeholder="Phone Number"
                      value={contact.phone}
                      onChange={(event) => updateContact("phone", event.target.value)}
                    />

                    <button
                      type="button"
                      disabled={!contactReady}
                      onClick={submitLeadAndStartLoading}
                      className="h-16 rounded-3xl bg-blue-600 text-xl font-black text-white shadow-xl shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                    >
                      View My Options
                    </button>
                  </div>
                </QuestionBlock>
              )}

              {step === LOADING_STEP && (
                <QuestionBlock eyebrow="Live quote check" title="Gathering your quotes..." subtitle="Comparing available plan options in your area.">
                  <div className="mx-auto max-w-2xl space-y-8">
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100">
                      <div className="mb-6 flex items-center justify-between text-sm font-bold uppercase tracking-widest text-slate-500">
                        <span>Checking providers</span>
                        <span>{loadingProgress}%</span>
                      </div>

                      <div className="relative h-5 overflow-hidden rounded-full bg-slate-100">
                        <motion.div
                          animate={{ x: ["-100%", "300%"] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-y-0 w-24 bg-white/40 blur-md"
                        />
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${loadingProgress}%` }}
                          transition={{ ease: "easeOut" }}
                          className="h-full rounded-full bg-blue-600"
                        />
                      </div>

                      <div className="mt-8 space-y-4 text-left">
                        <LoadingRow text="Checking available PPO plans" active={loadingProgress > 15} />
                        <LoadingRow text="Comparing rates in your ZIP code" active={loadingProgress > 35} />
                        <LoadingRow text="Reviewing provider availability" active={loadingProgress > 55} />
                        <LoadingRow text="Finalizing personalized quotes" active={loadingProgress > 80} />
                      </div>
                    </div>
                  </div>
                </QuestionBlock>
              )}

              {step > 1 && step !== LOADING_STEP && (
                <div className="space-y-6">
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={goBack}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm transition hover:border-blue-200 hover:text-blue-600 hover:shadow-md"
                    >
                      ← Previous Question
                    </button>
                  </div>

                  <BottomProviderStrip />
                </div>
              )}
            </div>
          </motion.div>
        </motion.section>
      </main>
    </div>
  );
}

function LandingHero({ onStart }) {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 px-5 py-8 shadow-2xl shadow-blue-100/60 md:px-10 md:py-12">
        <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl" />

        <div className="relative flex flex-col items-center justify-center text-center">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-5 flex items-center justify-center">
              <div className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-slate-600 shadow-sm">
              <Sparkles size={18} className="text-blue-600" />
              <span className="text-sm font-black uppercase tracking-[0.16em]">Quick. Easy. Secure.</span>
            </div>
            </div>

            <h1 className="mx-auto max-w-4xl text-5xl font-black leading-tight tracking-tight text-slate-950 md:text-7xl">
              Get your quote in <span className="text-blue-700">30 seconds!</span>
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 md:text-lg">
              Compare available health coverage options near you in a few quick steps.
            </p>

            <div className="mx-auto mt-5 flex max-w-md flex-wrap items-center justify-center gap-2">
              <HeroProof icon={Clock3} text="30 sec" />
              <HeroProof icon={Lock} text="Secure" />
              <HeroProof icon={Zap} text="Fast" />
            </div>

            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="mt-5"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Live quote system active
              </div>
            </motion.div>

            <button
              type="button"
              onClick={onStart}
              className="mt-8 h-16 w-full max-w-md rounded-3xl bg-blue-600 px-8 text-xl font-black text-white shadow-xl shadow-blue-200 transition hover:-translate-y-1 hover:scale-[1.02] hover:bg-blue-700"
            >
              Start My Quote
            </button>

            <p className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500">
              <Lock size={15} /> Your information is encrypted and only used to review options.
            </p>
          </div>
        </div>
      </section>

      <ProviderStrip />
    </div>
  );
}

function HeroProof({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white/80 px-3 py-3 text-sm font-bold text-slate-700 shadow-sm">
      <Icon size={17} className="text-blue-600" />
      {text}
    </div>
  );
}

function TrustNote() {
  return (
    <p className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-500">
      <Lock size={14} /> Used only to check plan options near you.
    </p>
  );
}

function ProviderStrip() {
  return (
    <section className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white px-4 py-5 text-center shadow-lg shadow-slate-100">
      <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-slate-500">Major providers may include</p>
      <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-4">
        {providerBadges.map((provider) => (
          <div key={provider.name} className="flex min-h-20 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <img src={provider.logo} alt={provider.name} className="max-h-12 max-w-full object-contain" />
          </div>
        ))}
      </div>
    </section>
  );
}

function BottomProviderStrip() {
  return (
    <div className="mx-auto mt-8 max-w-5xl rounded-[2rem] border border-slate-200 bg-white px-4 py-5 shadow-lg shadow-slate-100">
      <p className="mb-4 text-center text-xs font-black uppercase tracking-[0.2em] text-slate-500">Major providers may include</p>
      <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-4">
        {providerBadges.map((provider) => (
          <div key={provider.name} className="flex h-24 items-center justify-center rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-100">
            <img src={provider.logo} alt={provider.name} className="max-h-16 max-w-full object-contain" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressBar({ step, totalSteps, progress, label }) {
  const isLastStep = step === totalSteps;

  return (
    <div className={`mx-auto max-w-4xl space-y-3 rounded-3xl transition-all ${isLastStep ? "bg-blue-50 p-5 ring-4 ring-blue-100" : ""}`}>
      <div className="flex items-center justify-between text-sm font-extrabold uppercase tracking-widest text-slate-500">
        <span className={isLastStep ? "text-blue-700" : ""}>{label}</span>
        <span className={isLastStep ? "text-blue-700" : ""}>{progress}% Complete</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      {isLastStep && <p className="text-center text-sm font-bold text-blue-700">Last step — your quotes are almost ready.</p>}
    </div>
  );
}

function QuestionBlock({ eyebrow, title, subtitle, children }) {
  return (
    <div className="space-y-8 text-center">
      <div className="space-y-4">
        {eyebrow && <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">{eyebrow}</p>}
        <h1 className="mx-auto max-w-4xl text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">{title}</h1>
        {subtitle && <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-500 md:text-xl">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function OptionButton({ selected, onClick, className = "", children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-6 py-5 text-xl font-extrabold shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-600 hover:bg-blue-50 hover:shadow-lg ${
        selected ? "border-blue-600 bg-blue-50 text-blue-700 ring-4 ring-blue-100" : "border-blue-500 bg-white text-blue-700"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function LoadingRow({ text, active }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${active ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-400"}`}>
      <div className={`h-3 w-3 rounded-full ${active ? "bg-blue-600 animate-pulse" : "bg-slate-300"}`} />
      <span className="font-semibold">{text}</span>
    </div>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="h-16 rounded-3xl border border-slate-200 bg-slate-50 px-6 text-xl font-semibold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
    />
  );
}

function QuoteSubmittedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6">
      <div className="w-full max-w-2xl rounded-[2rem] border border-white bg-white p-8 text-center shadow-2xl shadow-blue-100/50 ring-1 ring-slate-200 md:p-12">
        <div className="space-y-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
            <ShieldCheck size={42} />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">Thanks, you're all set.</h1>
            <p className="mx-auto max-w-xl text-lg leading-8 text-slate-600">
              Your information has been received successfully. A licensed agent will review available plan options and reach out shortly.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-6 text-left shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-blue-700">
              <Sparkles size={16} /> Gathering quotes from providers such as
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {providerBadges.map((provider) => (
                <div key={provider.name} className="flex h-20 items-center justify-center rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
                  <img src={provider.logo} alt={provider.name} className="max-h-12 max-w-full object-contain" />
                </div>
              ))}
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-500">
              Plans, availability, and eligibility vary by ZIP code and applicant information.
            </p>
          </div>

          <div className="rounded-[2rem] bg-blue-600 p-6 text-left text-white shadow-xl shadow-blue-200">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
                <PhoneCall size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black">Want your quote faster?</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-blue-50">
                  Call now and an agent can review your available options right away instead of waiting for a callback.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <a href="tel:+15616794929" className="block">
              <button
                type="button"
                onClick={() => {
                  window.location.href = "tel:+15616794929";
                }}
                className="h-16 w-full rounded-2xl bg-green-600 text-lg font-black text-white shadow-xl shadow-green-200 transition hover:-translate-y-0.5 hover:bg-green-700"
              >
                Call Now for Instant Quote
              </button>
            </a>

            <a href="sms:+15616794929" className="block">
              <button
                type="button"
                onClick={() => {
                  window.location.href = "sms:+15616794929";
                }}
                className="h-16 w-full rounded-2xl border-2 border-blue-600 bg-white text-lg font-black text-blue-700 transition hover:bg-blue-50"
              >
                Text Me Instead
              </button>
            </a>
          </div>

          <p className="text-xs leading-6 text-slate-500">Quotes, availability, and plan details vary by state and eligibility.</p>
        </div>
      </div>
    </div>
  );
}
