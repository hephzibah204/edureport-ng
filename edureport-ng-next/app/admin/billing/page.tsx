"use client";

import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { CreditCard, ShieldCheck, Zap, Star, ArrowUpRight, HelpCircle, Loader2, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Script from "next/script";
import { Checkout } from "payvessel-checkout";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function SchoolBillingPage() {
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [school, setSchool] = useState<any>(null);
  const [paymentProvider, setPaymentProvider] = useState<"PAYSTACK" | "PAYVESSEL">("PAYSTACK");

  useEffect(() => {
    async function fetchSchool() {
      try {
        const res = await fetch("/api/school");
        const data = await res.json() as any;
        if (data.school) {
          setSchool(data.school);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching school details:", error);
        toast.error("Failed to load billing details.");
        setLoading(false);
      }
    }
    fetchSchool();
  }, []);

  const handleUpgrade = async (planId: string) => {
    setProcessingPlan(planId);
    try {
      // 1. Initialize checkout on backend
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, provider: paymentProvider })
      });
      
      const checkoutData = await res.json() as any;
      if (!res.ok) {
        throw new Error(checkoutData.error?.message || "Failed to initialize payment.");
      }

      if (paymentProvider === "PAYSTACK") {
        const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_mockpublickey123456789"; 

        if (!window.PaystackPop) {
          throw new Error("Paystack SDK not loaded. Please try again in a few seconds.");
        }

        // 2. Open Paystack Inline Checkout
        const handler = window.PaystackPop.setup({
          key: paystackKey,
          email: checkoutData.email,
          amount: checkoutData.amountKobo,
          ref: checkoutData.reference,
          callback: function (response: any) {
            toast.info("Verifying payment...");
            
            // 3. Verify on server (fire async inside sync callback)
            fetch("/api/billing/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reference: response.reference })
            })
              .then(res => res.json() as Promise<any>)
              .then(verifyData => {
                if (verifyData.success) {
                  toast.success(`Success! Plan upgraded.`);
                  setSchool((prev: any) => ({ ...prev, plan: planId, trialEndsAt: null }));
                } else {
                  toast.error(verifyData.error?.message || "Verification failed. Contact support.");
                }
              })
              .catch(() => toast.error("Verification request failed. Please contact support."));
          },
          onClose: function () {
            toast.warning("Payment window closed.");
          }
        });
        handler.openIframe();
      } else {
        // Payvessel Flow
        const pvKey = process.env.NEXT_PUBLIC_PAYVESSEL_PUBLIC_KEY || "pk_test_mockkey123456789";
        const pvInit = Checkout({
          api_key: pvKey,
        });

        await pvInit.initializeCheckout({
          customer_email: checkoutData.email,
          customer_phone_number: checkoutData.phone || school?.contact || "08000000000",
          customer_name: checkoutData.schoolName || school?.name || "School",
          amount: (checkoutData.amountKobo / 100).toString(),
          currency: "NGN",
          reference: checkoutData.reference,
          redirect_url: window.location.href,
          metadata: {
            schoolName: checkoutData.schoolName
          },
          onError: (error: any) => toast.error(error?.message || "Payvessel checkout failed"),
          onSuccessfulOrder: (response: any) => {
            toast.info("Verifying payment...");
            fetch("/api/billing/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reference: checkoutData.reference })
            })
              .then(res => res.json() as Promise<any>)
              .then(verifyData => {
                if (verifyData.success) {
                  toast.success(`Success! Plan upgraded.`);
                  setSchool((prev: any) => ({ ...prev, plan: planId, trialEndsAt: null }));
                } else {
                  toast.error(verifyData.error?.message || "Verification failed.");
                }
              })
              .catch(() => toast.error("Verification request failed."));
          },
          onClose: () => toast.warning("Payment window closed.")
        });
      }

    } catch (error: any) {
      toast.error(error.message || "Failed to process transaction.");
    } finally {
      setProcessingPlan(null);
    }
  };

  const getRemainingTrialDays = () => {
    if (!school?.trialEndsAt) return 0;
    const diff = new Date(school.trialEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  if (loading) {
    return (
      <DashboardLayout role="SCHOOL" title="Billing & Plans">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const plans = [
    {
      id: "PER_TERM",
      name: "Per Term",
      price: "₦5,000",
      period: "per term",
      color: "border-indigo-100 bg-white",
      icon: Zap,
      iconColor: "text-indigo-600 bg-indigo-50",
      description: "Perfect for exploring the platform and testing out features for a single academic term.",
      features: [
        "Full access to report generation",
        "Unlimited students",
        "Basic analytics & insights",
        "Email support",
      ]
    },
    {
      id: "PER_YEAR",
      name: "Per Year",
      price: "₦15,000",
      period: "per year",
      popular: true,
      color: "border-indigo-600 bg-gradient-to-b from-indigo-50/20 to-white ring-4 ring-indigo-600/5",
      icon: Star,
      iconColor: "text-white bg-indigo-600 shadow-lg shadow-indigo-600/30",
      description: "Our most popular plan. Save significantly while managing your school's data year-round.",
      features: [
        "Everything in Per Term",
        "Advanced performance analytics",
        "Custom report card templates",
        "Priority 24/7 support",
        "Free onboarding session"
      ]
    },
    {
      id: "LIFETIME",
      name: "Lifetime",
      price: "₦30,000",
      period: "one-time",
      color: "border-[#0b1c30]/10 bg-white",
      icon: Sparkles,
      iconColor: "text-amber-600 bg-amber-50",
      description: "One ultimate payment for lifetime access. Never worry about subscriptions again.",
      features: [
        "Everything in Per Year",
        "Lifetime platform updates",
        "Dedicated account manager",
        "Custom branding & white-labeling",
        "Early access to new features"
      ]
    }
  ];

  const trialDays = getRemainingTrialDays();

  return (
    <DashboardLayout role="SCHOOL" title="Billing & Subscription">
      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />

      <div className="space-y-10 max-w-7xl mx-auto text-[#0b1c30]">
        
        {/* Title Header */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-4xl font-[800] tracking-tight">Subscription Plans</h2>
            <p className="text-lg font-medium text-[#464555]/70">Upgrade your portal to unlock full administrative features.</p>
          </div>
        </section>

        {/* Current Plan Overview Banner */}
        <section className="glass p-8 rounded-[2.5rem] shadow-elite flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-[#0b1c30]/5">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-extrabold">Current Plan: <span className="text-indigo-600 uppercase">{school?.plan}</span></h3>
                {school?.plan === "TRIAL" && trialDays > 0 && (
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    {trialDays} days left
                  </span>
                )}
                {school?.plan === "TRIAL" && trialDays === 0 && (
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                    Expired
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-[#464555]/60 mt-1">
                {school?.plan === "TRIAL" 
                  ? "You are currently exploring ReportSheet with standard permissions. Upgrade to keep full database records."
                  : "Thank you for subscribing to ReportSheet! Your next term invoice will be sent automatically."
                }
              </p>
            </div>
          </div>
          {school?.plan === "TRIAL" && (
            <div className="text-sm font-medium text-amber-700 bg-amber-50/50 border border-amber-100 p-4 rounded-2xl max-w-sm flex gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-xs">
                To prevent automatic lockout when your trial ends, select and verify a termly subscription below.
              </p>
            </div>
          )}
        </section>

        {/* Payment Method Selection */}
        <section className="flex flex-col gap-4 max-w-sm">
          <label className="text-sm font-bold text-[#0b1c30]">Select Payment Gateway</label>
          <div className="flex bg-[#f8f9ff] p-1.5 rounded-xl border border-[#0b1c30]/5 shadow-inner">
            <button
              onClick={() => setPaymentProvider("PAYSTACK")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                paymentProvider === "PAYSTACK"
                  ? "bg-white shadow-sm border border-[#0b1c30]/5 text-indigo-600"
                  : "text-[#464555]/60 hover:text-[#0b1c30]"
              }`}
            >
              Paystack
            </button>
            <button
              onClick={() => setPaymentProvider("PAYVESSEL")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                paymentProvider === "PAYVESSEL"
                  ? "bg-white shadow-sm border border-[#0b1c30]/5 text-indigo-600"
                  : "text-[#464555]/60 hover:text-[#0b1c30]"
              }`}
            >
              Payvessel
            </button>
          </div>
        </section>

        {/* Pricing Cards Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map((plan, idx) => {
            const Icon = plan.icon;
            const isCurrent = school?.plan === plan.id;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className={`border rounded-[2.5rem] p-10 flex flex-col justify-between relative overflow-hidden shadow-elite transition-all ${plan.color}`}
              >
                {plan.popular && (
                  <div className="absolute top-6 right-6 bg-indigo-600 text-white text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full uppercase flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Popular choice
                  </div>
                )}
                <div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${plan.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="text-2xl font-black mt-6 text-[#0b1c30]">{plan.name} Plan</h3>
                  <p className="text-xs font-semibold text-[#464555]/60 mt-2 min-h-[40px] leading-relaxed">{plan.description}</p>
                  
                  <div className="flex items-baseline gap-2 mt-6">
                    <span className="text-4xl font-[900] text-[#0b1c30] tracking-tight">{plan.price}</span>
                    <span className="text-sm font-medium text-[#464555]/50">{plan.period}</span>
                  </div>

                  <hr className="my-8 border-[#0b1c30]/5" />

                  <ul className="space-y-4">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm text-[#464555] font-semibold leading-relaxed">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-10">
                  <button
                    disabled={isCurrent || processingPlan !== null}
                    onClick={() => handleUpgrade(plan.id)}
                    className={`w-full py-4 px-6 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      isCurrent 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                        : plan.popular
                          ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-100"
                          : "bg-white border border-[#0b1c30]/5 hover:bg-[#f8f9ff]"
                    }`}
                  >
                    {processingPlan === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCurrent ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                    {isCurrent ? "Active Plan" : processingPlan === plan.id ? "Initializing..." : "Upgrade and Activate"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </section>

        {/* FAQs */}
        <section className="glass p-10 rounded-[2.5rem] shadow-elite bg-white border border-[#0b1c30]/5 space-y-6">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-indigo-600" />
            <h3 className="text-xl font-extrabold">Frequently Asked Questions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="space-y-2">
              <h4 className="font-bold text-sm">Can I change plans mid-term?</h4>
              <p className="text-xs font-semibold text-[#464555]/70 leading-relaxed">Yes! If you upgrade mid-term, the payment system handles the differences and updates your active student enrollment limits instantly.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-sm">Is my payment transaction secure?</h4>
              <p className="text-xs font-semibold text-[#464555]/70 leading-relaxed">We use Paystack (PCI-DSS compliant payment gateway) to process all online transactions. We do not store your bank credentials or card details on our server.</p>
            </div>
          </div>
        </section>

      </div>
    </DashboardLayout>
  );
}
