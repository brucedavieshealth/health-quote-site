import React, { useRef, useState } from "react";
import { PhoneCall, ShieldCheck, User, Users } from "lucide-react";
import { motion } from "framer-motion";

const TOTAL_STEPS = 7;
const LOADING_STEP = 7;
const FINAL_STEP = 8;

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xqejgzyv";

const coverageOptions = [
  { label: "Individual", icon: User },
  { label: "Family", icon: Users },
  { label: "Other", icon: User },
];

const genderOptions = ["Male", "Female"];

const providerBadges = [
  { name: "UnitedHealthcare", logo: "/united-healthcare.png" },
  { name: "Blue Cross Blue Shield", logo: "/blue-cross-blue-shield.png" },
  { name: "Cigna", logo: "/cigna.png" },
  { name: "Oscar", logo: "/oscar.png" },
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

export default function App() {
  const [step, setStep] = useState(1);
  const [coverage, setCoverage] = useState("");
  const [zip, setZip] = useState(["", "", "", "", ""]);
  const [dob, setDob] = useState({ month: "", day: "", year: "" });
  const [gender, setGender] = useState("");
  const [contact, setContact] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  const [loadingProgress, setLoadingProgress] = useState(0);

  const zipRefs = useRef([]);
  const monthRef = useRef(null);
  const dayRef = useRef(null);
  const yearRef = useRef(null);

  const goNext = () => setStep((s) => s + 1);

  const sendLead = async () => {
    await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coverage,
        zip: zip.join(""),
        dob: `${dob.month}/${dob.day}/${dob.year}`,
        gender,
        ...contact,
      }),
    });
  };

  const startLoading = () => {
    setStep(LOADING_STEP);

    let progress = 0;

    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 12) + 6;

      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        setTimeout(() => {
          setStep(FINAL_STEP);
        }, 570);
      }

      setLoadingProgress(progress);
    }, 260);
  };

  const submitLead = async () => {
    await sendLead();
    startLoading();
  };

  const updateZip = (value, index) => {
    const next = [...zip];
    next[index] = onlyDigits(value).slice(0, 1);
    setZip(next);

    if (next[index] && index < 4) {
      zipRefs.current[index + 1]?.focus();
    }

    if (isFullZip(next)) {
      setTimeout(goNext, 200);
    }
  };

  const updateDob = (field, value) => {
    const next = {
      ...dob,
      [field]: onlyDigits(value).slice(0, field === "year" ? 4 : 2),
    };

    setDob(next);

    if (field === "month" && next.month.length === 2) {
      dayRef.current?.focus();
    }

    if (field === "day" && next.day.length === 2) {
      yearRef.current?.focus();
    }

    if (isFullDob(next)) {
      setTimeout(goNext, 200);
    }
  };

  const contactReady =
    contact.firstName.length > 1 &&
    contact.lastName.length > 1 &&
    onlyDigits(contact.phone).length === 10;

  if (step === FINAL_STEP) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-[2rem] shadow-2xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 text-green-600 rounded-full p-5">
              <ShieldCheck size={42} />
            </div>
          </div>

          <h1 className="text-5xl font-black text-slate-900">
            You're all set.
          </h1>

          <p className="mt-5 text-lg text-slate-600 leading-8">
            A licensed agent will contact you shortly with your available options.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mt-8">
            <a href="tel:5616794929">
              <button className="h-14 w-full rounded-2xl bg-blue-600 text-white font-bold">
                Call Now
              </button>
            </a>

            <a href="sms:5616794929">
              <button className="h-14 w-full rounded-2xl border-2 border-blue-600 text-blue-700 font-bold">
                Text Now
              </button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="max-w-5xl mx-auto min-h-screen flex items-center justify-center px-4 py-6">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          {step === 1 && (
            <div className="space-y-5">
              <section className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 px-5 py-10 text-center shadow-xl">
                <h1 className="text-5xl sm:text-6xl font-black leading-tight">
                  Get your quote in {" "}
                  <span className="text-blue-700">30 seconds!</span>
                </h1>

                <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
                  Answer a few quick questions to see available plans and pricing.
                </p>

                <button
                  onClick={goNext}
                  className="mt-8 h-16 px-10 rounded-3xl bg-blue-600 text-white text-xl font-black"
                >
                  Start My Quote
                </button>

                <p className="mt-5 text-sm text-slate-500 font-semibold">
                  🔒 Secure & Confidential
                </p>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white px-4 py-5 text-center shadow-lg">
                <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  Major providers may include
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {providerBadges.map((provider) => (
                    <div
                      key={provider.name}
                      className="flex items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 p-3 min-h-20"
                    >
                      <img
                        src={provider.logo}
                        alt={provider.name}
                        className="max-h-12 max-w-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {step === 2 && (
            <div className="text-center space-y-8">
              <h1 className="text-5xl font-black">
                What type of coverage are you looking for?
              </h1>

              <div className="grid md:grid-cols-3 gap-4">
                {coverageOptions.map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => {
                      setCoverage(label);
                      setTimeout(goNext, 150);
                    }}
                    className="rounded-3xl border border-blue-200 bg-white p-6 text-left hover:bg-blue-50"
                  >
                    <div className="bg-blue-100 text-blue-700 rounded-2xl w-12 h-12 flex items-center justify-center">
                      <Icon />
                    </div>

                    <p className="mt-4 text-xl font-bold">{label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-8">
              <h1 className="text-5xl font-black">
                Enter your ZIP code
              </h1>

              <div className="flex justify-center gap-3">
                {zip.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (zipRefs.current[index] = el)}
                    maxLength={1}
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => updateZip(e.target.value, index)}
                    className="h-20 w-16 rounded-3xl border border-slate-200 text-center text-3xl font-black"
                  />
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center space-y-8">
              <h1 className="text-5xl font-black">Date of Birth</h1>

              <div className="flex justify-center items-center gap-3">
                <input
                  ref={monthRef}
                  placeholder="MM"
                  maxLength={2}
                  value={dob.month}
                  onChange={(e) => updateDob("month", e.target.value)}
                  className="h-20 w-20 rounded-3xl border border-slate-200 text-center text-2xl font-black"
                />

                <input
                  ref={dayRef}
                  placeholder="DD"
                  maxLength={2}
                  value={dob.day}
                  onChange={(e) => updateDob("day", e.target.value)}
                  className="h-20 w-20 rounded-3xl border border-slate-200 text-center text-2xl font-black"
                />

                <input
                  ref={yearRef}
                  placeholder="YYYY"
                  maxLength={4}
                  value={dob.year}
                  onChange={(e) => updateDob("year", e.target.value)}
                  className="h-20 w-28 rounded-3xl border border-slate-200 text-center text-2xl font-black"
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="text-center space-y-8">
              <h1 className="text-5xl font-black">
                What is your gender?
              </h1>

              <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {genderOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setGender(option);
                      setTimeout(goNext, 150);
                    }}
                    className="rounded-3xl border border-blue-200 bg-white p-6 text-xl font-bold hover:bg-blue-50"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="text-center space-y-6 max-w-2xl mx-auto">
              <h1 className="text-5xl font-black">
                Almost done
              </h1>

              <input
                placeholder="First Name"
                value={contact.firstName}
                onChange={(e) =>
                  setContact({ ...contact, firstName: e.target.value })
                }
                className="h-16 w-full rounded-3xl border border-slate-200 px-6 text-xl font-semibold"
              />

              <input
                placeholder="Last Name"
                value={contact.lastName}
                onChange={(e) =>
                  setContact({ ...contact, lastName: e.target.value })
                }
                className="h-16 w-full rounded-3xl border border-slate-200 px-6 text-xl font-semibold"
              />

              <input
                placeholder="Phone Number"
                value={contact.phone}
                onChange={(e) =>
                  setContact({
                    ...contact,
                    phone: formatPhone(e.target.value),
                  })
                }
                className="h-16 w-full rounded-3xl border border-slate-200 px-6 text-xl font-semibold"
              />

              <button
                disabled={!contactReady}
                onClick={submitLead}
                className="h-16 w-full rounded-3xl bg-blue-600 text-white text-xl font-black disabled:bg-slate-300"
              >
                View My Options
              </button>
            </div>
          )}

          {step === LOADING_STEP && (
            <div className="text-center max-w-2xl mx-auto space-y-8">
              <h1 className="text-5xl font-black">
                Gathering your quotes...
              </h1>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex justify-between mb-5 text-sm font-bold uppercase text-slate-500">
                  <span>Checking providers</span>
                  <span>{loadingProgress}%</span>
                </div>

                <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: `${loadingProgress}%` }}
                    className="h-full bg-blue-600 rounded-full"
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
