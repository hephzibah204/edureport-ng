"use client";

import { Check, Sparkles } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.ok ? res.json() : null);

export function Pricing() {
  const { data: schoolData } = useSWR('/api/school', fetcher);
  const currentPlan = (schoolData as any)?.school?.plan;

  const plans = [
    {
      id: "PER_TERM",
      name: "Per Term",
      price: "₦5,000",
      duration: "per term",
      description: "Perfect for exploring the platform and testing out features for a single academic term.",
      features: [
        "Full access to report generation",
        "Unlimited students",
        "Basic analytics & insights",
        "Email support",
      ],
      popular: false,
      buttonText: "Start Per Term",
    },
    {
      id: "PER_YEAR",
      name: "Per Year",
      price: "₦15,000",
      duration: "per year",
      description: "Our most popular plan. Save significantly while managing your school's data year-round.",
      features: [
        "Everything in Per Term",
        "Advanced performance analytics",
        "Custom report card templates",
        "Priority 24/7 support",
        "Free onboarding session",
      ],
      popular: true,
      buttonText: "Start Yearly Plan",
    },
    {
      id: "LIFETIME",
      name: "Lifetime",
      price: "₦30,000",
      duration: "one-time",
      description: "One ultimate payment for lifetime access. Never worry about subscriptions again.",
      features: [
        "Everything in Per Year",
        "Lifetime platform updates",
        "Dedicated account manager",
        "Custom branding & white-labeling",
        "Early access to new features",
      ],
      popular: false,
      buttonText: "Get Lifetime Access",
    }
  ];

  return (
    <section id="pricing" className="py-32 px-6 bg-[#f8f9ff] relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-200/40 blur-[150px] -z-10" />
      <div className="absolute bottom-0 left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-100/40 blur-[150px] -z-10" />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-extrabold tracking-wide mb-6">
            <Sparkles className="w-4 h-4" />
            <span>SIMPLE PRICING</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[#0b1c30] tracking-tight mb-6">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">Growth Plan</span>
          </h2>
          <p className="text-lg text-[#464555] max-w-2xl mx-auto font-medium">
            Transparent pricing for schools of all sizes. No hidden fees. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
          {plans.map((plan, idx) => (
            <div 
              key={idx} 
              className={`relative bg-white rounded-[2.5rem] p-10 transition-all duration-300 hover:-translate-y-2 ${
                plan.popular 
                  ? 'border-2 border-indigo-600 shadow-2xl shadow-indigo-600/20 scale-105 z-10' 
                  : 'border border-indigo-50 shadow-xl shadow-indigo-100/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-2 rounded-full text-xs font-black tracking-widest uppercase shadow-lg shadow-indigo-600/30">
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-xl font-extrabold text-[#0b1c30] mb-2">{plan.name}</h3>
                <p className="text-[#464555]/80 text-sm font-medium h-10">{plan.description}</p>
              </div>

              <div className="mb-8 flex items-baseline gap-2">
                <span className="text-5xl font-black text-[#0b1c30] tracking-tighter">{plan.price}</span>
                <span className="text-[#464555] font-bold">/{plan.duration}</span>
              </div>

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-3">
                    <div className={`p-1 rounded-full shrink-0 ${plan.popular ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      <Check className="w-3 h-3 font-bold" />
                    </div>
                    <span className="text-sm font-bold text-[#464555]">{feature}</span>
                  </li>
                ))}
              </ul>

              {currentPlan === plan.id ? (
                <div className="block w-full text-center py-4 rounded-2xl font-extrabold text-sm bg-emerald-50 text-emerald-700 cursor-default border border-emerald-200 shadow-sm">
                  Current Plan
                </div>
              ) : (
                <Link 
                  href="/register" 
                  className={`block w-full text-center py-4 rounded-2xl font-extrabold text-sm transition-all ${
                    plan.popular 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/30' 
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  {plan.buttonText}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
