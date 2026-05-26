import React, { useRef, useState } from "react";
import { BriefcaseBusiness, PhoneCall, ShieldCheck, User, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Analytics } from "@vercel/analytics/react";

const TOTAL_STEPS = 9;

// 1) Create a free form at https://formspree.io
// 2) Replace this with your Formspree endpoint URL, like: https://formspree.io/f/abcdwxyz
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xqejgzyv";

// Optional: Use this if you want the lead texted to your phone through Zapier, Make, or Twilio.
// Paste your SMS webhook URL here after you create it.
const SMS_WEBHOOK_ENDPOINT = "PASTE_YOUR_SMS_WEBHOOK_URL_HERE";

const coverageOptions = [
  { label: "Individual", icon: User },
  { label: "Family", icon: Users },
  { label: "Other", icon: BriefcaseBusiness },
];

const householdOptions = ["1", "2", "3", "4", "5", "6", "7", "8+"];

const incomeOptions = [
  "$85,001 - 100,000+",
  "$75,001 - 85,000",
  "$50,001 - 75,000",
  "$40,001 - 50,000",
  "$32,001 - 40,000",
  "$15,001 - 32,000",
  "$0 - 15,000",
];

const genderOptions = ["Male", "Female"];

const employmentOptions = [
  "Employed",
  "Self-Employed",
  "Retired",
  "Student",
  "Stay-at-Home Parent",
  "Not Currently Working",
];

function onlyDigits(value) {
  return value.replace(/[^0-9]/g, "");
}

function isFullZip(zipArray) {
  return zipArray.length === 5 && zipArray.every(Boolean);
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

export default function App() {
  const [step, setStep] = useState(1);
  const [coverage, setCoverage] = useState("");
  const [zip, setZip] = useState(["", "", "", "", ""]);
  const [dob, setDob] = useState({ month: "", day: "", year: "" });
  const [household, setHousehold] = useState("");
  const [income, setIncome] = useState("");
  const [gender, setGender] = useState("");
  const [employment, setEmployment] = useState("");
  const [contact, setContact] = useState({ firstName: "", lastName: "", phone: "" });
  const [loadingProgress, setLoadingProgress] = useState(0);

  const zipRefs = useRef([]);
  const monthRef = useRef(null);
  const dayRef = useRef(null);
  const yearRef = useRef(null);

  const visibleStep = Math.min(step, TOTAL_STEPS);
  const progress = Math.round((visibleStep / TOTAL_STEPS) * 100);
  const progressLabel = progress >= 60 ? "Almost done" : step <= 2 ? "Getting started" : "Halfway there";

  const goNext = () => setStep((currentStep) => Math.min(currentStep + 1, TOTAL_STEPS + 1));
  const goBack = () => setStep((currentStep) => Math.max(currentStep - 1, 1));

  const chooseAndContinue = (setter, value) => {
    setter(value);
    window.setTimeout(goNext, 175);
  };

  const submitLeadAndStartLoading = async () => {
    const leadData = {
      coverage,
      zipCode: zip.join(""),
      dateOfBirth: `${dob.month}/${dob.day}/${dob.year}`,
      householdSize: household,
      annualHouseholdIncome: income,
      gender,
      employmentStatus: employment,
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone,
      submittedAt: new Date().toISOString(),
    };

    if (FORMSPREE_ENDPOINT !== "PASTE_YOUR_FORMSPREE_URL_HERE") {
      try {
        await fetch(FORMSPREE_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(leadData),
        });
      } catch (error) {
        console.error("Formspree lead submission failed:", error);
      }
    }

    if (SMS_WEBHOOK_ENDPOINT !== "PASTE_YOUR_SMS_WEBHOOK_URL_HERE") {
      try {
        await fetch(SMS_WEBHOOK_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: "5616794929",
            message: `New health quote lead:

Name: ${leadData.firstName} ${leadData.lastName}
Phone: ${leadData.phone}
ZIP: ${leadData.zipCode}
DOB: ${leadData.dateOfBirth}
Coverage: ${leadData.coverage}
Household: ${leadData.householdSize}
Income: ${leadData.annualHouseholdIncome}
Gender: ${leadData.gender}
Employment: ${leadData.employmentStatus}`,
            lead: leadData,
          }),
        });
      } catch (error) {
        console.error("SMS webhook failed:", error);
      }
    }

    if (
      FORMSPREE_ENDPOINT === "PASTE_YOUR_FORMSPREE_URL_HERE" &&
      SMS_WEBHOOK_ENDPOINT === "PASTE_YOUR_SMS_WEBHOOK_URL_HERE"
    ) {
      console.log("Lead data preview:", leadData);
    }

    startLoadingSequence();
  };

  const startLoadingSequence = () => {
    setStep(9);
    setLoadingProgress(0);

    let progressValue = 0;
    const interval = window.setInterval(() => {
      progressValue += Math.floor(Math.random() * 10) + 4;

      if (progressValue >= 100) {
        progressValue = 100;
        setLoadingProgress(100);
        window.clearInterval(interval);

        window.setTimeout(() => {
          goNext();
        }, 840);

        return;
      }

      setLoadingProgress(progressValue);
    }, 390);
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

  if (step === TOTAL_STEPS + 1) {
    return <QuoteSubmittedPage />;
  }

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <Analytics />
      <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-5 py-8">
        <motion.section
          key={step}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full"
        >
          <div className="border-0 bg-white shadow-none">
            <div className="space-y-10 p-0">
              <ProgressBar step={step} totalSteps={TOTAL_STEPS} progress={progress} label={progressLabel} />

              {step === 1 && (
                <QuestionBlock title="What type of coverage are you looking for?" subtitle="Select one option to continue.">
                  <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-3">
                    {coverageOptions.map(({ label, icon: Icon }) => (
                      <OptionButton
                        key={label}
                        selected={coverage === label}
                        onClick={() => chooseAndContinue(setCoverage, label)}
                        className="flex items-center gap-4 text-left"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                          <Icon size={24} />
                        </div>
                        <span>{label}</span>
                      </OptionButton>
                    ))}
                  </div>
                </QuestionBlock>
              )}

              {step === 2 && (
                <QuestionBlock title="Compare Rates In Your Area Instantly" subtitle="Enter your ZIP code to continue.">
                  <div className="space-y-5">
                    <div className="flex justify-center gap-3">
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
                          className="h-20 w-16 rounded-3xl border border-slate-200 bg-slate-50 text-center text-3xl font-extrabold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                      ))}
                    </div>
                    <p className="text-center text-lg text-slate-500">We use this to check plan options in your area.</p>
                  </div>
                </QuestionBlock>
              )}

              {step === 3 && (
                <QuestionBlock title="Date of Birth" subtitle="Enter your birthdate to continue.">
                  <div className="space-y-6">
                    <div className="mx-auto max-w-3xl rounded-2xl bg-blue-50 px-5 py-4 text-center">
                      <p className="text-sm font-semibold text-slate-700 md:text-base">
                        Depending on your age, insurance providers may offer discounted rates
                      </p>
                    </div>

                    <div className="mx-auto flex max-w-md items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 px-6 py-5 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
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

              {step === 4 && (
                <QuestionBlock title="How many people are in your household?" subtitle="Select one option to continue.">
                  <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
                    {householdOptions.map((option) => (
                      <OptionButton
                        key={option}
                        selected={household === option}
                        onClick={() => chooseAndContinue(setHousehold, option)}
                        className="justify-center text-2xl"
                      >
                        {option}
                      </OptionButton>
                    ))}
                  </div>
                </QuestionBlock>
              )}

              {step === 5 && (
                <QuestionBlock title="Annual Household Income" subtitle="Select one option to continue.">
                  <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
                    {incomeOptions.map((option) => (
                      <OptionButton key={option} selected={income === option} onClick={() => chooseAndContinue(setIncome, option)}>
                        {option}
                      </OptionButton>
                    ))}
                  </div>
                </QuestionBlock>
              )}

              {step === 6 && (
                <QuestionBlock title="What is your gender?" subtitle="Select one option to continue.">
                  <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
                    {genderOptions.map((option) => (
                      <OptionButton key={option} selected={gender === option} onClick={() => chooseAndContinue(setGender, option)}>
                        {option}
                      </OptionButton>
                    ))}
                  </div>
                </QuestionBlock>
              )}

              {step === 7 && (
                <QuestionBlock title="What is your employment status?" subtitle="Select one option to continue.">
                  <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
                    {employmentOptions.map((option) => (
                      <OptionButton key={option} selected={employment === option} onClick={() => chooseAndContinue(setEmployment, option)}>
                        {option}
                      </OptionButton>
                    ))}
                  </div>
                </QuestionBlock>
              )}

              {step === 8 && (
                <QuestionBlock title="Almost done" subtitle="Enter your information to view your options.">
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
                      className="h-16 rounded-3xl bg-blue-600 text-xl font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                    >
                      View My Options
                    </button>
                  </div>
                </QuestionBlock>
              )}

              {step === 9 && (
                <QuestionBlock title="Gathering your quotes..." subtitle="Comparing plans and checking available rates in your area.">
                  <div className="mx-auto max-w-2xl space-y-8">
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                      <div className="mb-6 flex items-center justify-between text-sm font-bold uppercase tracking-widest text-slate-500">
                        <span>Checking providers</span>
                        <span>{loadingProgress}%</span>
                      </div>

                      <div className="h-5 overflow-hidden rounded-full bg-slate-100">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${loadingProgress}%` }}
                          transition={{ ease: "easeOut" }}
                          className="h-full rounded-full bg-blue-600"
                        />
                      </div>

                      <div className="mt-8 space-y-6 text-left">
<div className="space-y-4 text-left">
                          <LoadingRow text="Checking available PPO plans" active={loadingProgress > 15} />
                          <LoadingRow text="Comparing rates in your ZIP code" active={loadingProgress > 35} />
                          <LoadingRow text="Reviewing provider availability" active={loadingProgress > 55} />
                          <LoadingRow text="Finalizing personalized quotes" active={loadingProgress > 80} />
                        </div>
                      </div>
                    </div>
                  </div>
                </QuestionBlock>
              )}

              {step > 1 && step !== 9 && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={goBack}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm transition hover:border-blue-200 hover:text-blue-600 hover:shadow-md"
                  >
                    ← Previous Question
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.section>
      </main>
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

function QuestionBlock({ title, subtitle, children }) {
  return (
    <div className="space-y-8 text-center">
      <div className="space-y-4">
        <h1 className="mx-auto max-w-4xl text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">{title}</h1>
        {subtitle && <p className="text-xl text-slate-500">{subtitle}</p>}
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
      className={`rounded-2xl border px-6 py-5 text-xl font-extrabold transition-all hover:border-blue-600 hover:bg-blue-50 ${
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
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="w-full max-w-2xl rounded-[2rem] border-0 bg-white p-8 text-center shadow-2xl ring-1 ring-slate-200 md:p-12">
        <div className="space-y-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
            <ShieldCheck size={42} />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">Thanks, you're all set.</h1>
            <p className="mx-auto max-w-xl text-lg leading-8 text-slate-600">
              Your information has been received successfully. A licensed agent will contact you shortly to review available health coverage options and deliver your quotes.
            </p>
          </div>

          <div className="rounded-3xl bg-slate-50 p-6 text-left ring-1 ring-slate-200">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <PhoneCall size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Want an instant quote?</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Tap below to speak with an agent now.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <a href="tel:5616794929" className="block">
              <button
                type="button"
                onClick={() => {
                  window.location.href = "tel:5616794929";
                }}
                className="h-14 w-full rounded-2xl bg-blue-600 text-base font-bold text-white shadow-xl hover:bg-blue-700"
              >
                Call Now • 561-679-4929
              </button>
            </a>

            <a href="sms:5616794929" className="block">
              <button
                type="button"
                onClick={() => {
                  window.location.href = "sms:5616794929";
                }}
                className="h-14 w-full rounded-2xl border-2 border-blue-600 bg-white text-base font-bold text-blue-700 hover:bg-blue-50"
              >
                Text Now • 561-679-4929
              </button>
            </a>
          </div>

          <p className="text-xs leading-6 text-slate-500">Quotes, availability, and plan details vary by state and eligibility.</p>
        </div>
      </div>
    </div>
  );
}
