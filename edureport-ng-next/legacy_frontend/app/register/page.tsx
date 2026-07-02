"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ChevronRight, ChevronLeft, Shield, Lock, Mail, Phone, Globe, Briefcase, Award, Star } from 'lucide-react';
import { School } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Label } from '@/src/components/ui/Label';

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function PasswordStrengthBar({ password }: { password: string }) {
  let score = 0;
  if (password.length > 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const getStrengthColor = () => {
    if (score < 2) return 'bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.5)]';
    if (score < 4) return 'bg-gold shadow-[0_0_10px_rgba(250,204,21,0.5)]';
    return 'bg-primary shadow-[0_0_10px_rgba(22,163,74,0.5)]';
  };

  return (
    <div className="mt-3">
      <div className="flex gap-1.5 h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-full flex-1 transition-all duration-500 ease-out ${
              score >= level ? getStrengthColor() : 'bg-secondary'
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/80">Security</span>
        <span className={`text-[0.65rem] font-bold uppercase tracking-wider ${score < 2 ? 'text-destructive' : score < 4 ? 'text-gold' : 'text-primary'}`}>
          {score < 2 ? 'Weak' : score < 4 ? 'Medium' : 'Strong'}
        </span>
      </div>
    </div>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Wizard state
  const [step, setStep] = useState(1);

  // Form State
  const [schoolName, setSchoolName] = useState('');
  const [schoolUsername, setSchoolUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [plan, setPlan] = useState('lifetime');
  const [gateway, setGateway] = useState('PAYVESSEL');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [virtualAccount, setVirtualAccount] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);

  // Domain checking state
  const [domainStatus, setDomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const debouncedUsername = useDebounce(schoolUsername, 500);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/config');
        if (!res.ok) return;
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setConfig(data);
        }
      } catch (err) {}
    }
    loadConfig();
  }, []);

  useEffect(() => {
    const urlPlan = searchParams.get('plan');
    if (urlPlan) {
      setPlan(urlPlan);
    }
  }, [searchParams]);

  useEffect(() => {
    async function checkDomain() {
      if (!debouncedUsername) {
        setDomainStatus('idle');
        return;
      }
      const usernameRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!usernameRegex.test(debouncedUsername)) {
        setDomainStatus('invalid');
        return;
      }

      setDomainStatus('checking');
      try {
        const res = await fetch(`/api/auth/check-domain?domain=${encodeURIComponent(debouncedUsername)}`);
        if (!res.ok) throw new Error('API Error');
        
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json() as { available: boolean };
          setDomainStatus(data.available ? 'available' : 'taken');
        } else {
          throw new Error('Non-JSON response');
        }
      } catch (e) {
        setDomainStatus('available'); 
      }
    }
    checkDomain();
  }, [debouncedUsername]);

  const plans = [
    { id: 'starter', price: `₦${Number(config?.pricing?.starter || 15000).toLocaleString()}`, name: 'Starter / Year', desc: '100 students · PDF Report Cards · Basic Exams', highlight: false },
    { id: 'lifetime', price: `₦${Number(config?.pricing?.lifetime || 30000).toLocaleString()}`, name: 'Lifetime Access', desc: 'Unlimited students · Full Broadsheets · AI Exams', highlight: true },
    { id: 'pro', price: `₦${Number(config?.pricing?.pro || 35000).toLocaleString()}`, name: 'Pro + AI (Lifetime)', desc: '2,000 AI credits · Advanced AI Exam Suite', highlight: false },
    { id: 'trial', price: 'Free', name: '7-Day Trial', desc: '50 students · Report Card Preview', highlight: false }
  ];

  const handleNextStep = () => {
    setError('');
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!schoolName) return setError('Please enter your school name.');
      if (domainStatus === 'checking') return setError('Please wait while we verify your school username...');
      if (domainStatus === 'taken') return setError('This school username is already taken. Please try another one.');
      if (domainStatus === 'invalid') return setError('School username must contain only lowercase letters, numbers, and hyphens.');
      if (domainStatus !== 'available') return setError('Please enter a valid school username.');
      setStep(3);
    } else if (step === 3) {
      if (!email) return setError('Please enter your email address.');
      if (password.length < 12) return setError('Password must be at least 12 characters.');
      if (password !== confirmPassword) return setError('Passwords do not match.');
      if (plan === 'trial') {
        submitRegistration();
      } else {
        setStep(4);
      }
    }
  };

  const handlePrevStep = () => {
    setError('');
    setStep(s => Math.max(1, s - 1));
  };

  const submitRegistration = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolName, email, password, plan, subdomain: schoolUsername, phone }),
      });
      
      let data: any;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        throw new Error(`Server error (${res.status}). Please verify the API is running or try again later.`);
      }
      
      if (!res.ok) throw new Error(data.error?.message || 'Registration failed');
      
      localStorage.setItem('edu_session', JSON.stringify({ token: data.token, user: data.user }));
      
      if (plan === 'trial') {
        setSuccess(`✅ Account created! Welcome to EduReport NG, ${schoolName}!`);
        setTimeout(() => router.push('/app'), 1200);
        return;
      }

      if (gateway === 'PAYSTACK') {
        setSuccess(`✅ Account created! Initiating Paystack checkout...`);
        const priceMap: Record<string, number> = {
          starter: Number(config?.pricing?.starter || 15000) * 100,
          lifetime: Number(config?.pricing?.lifetime || 30000) * 100,
          pro: Number(config?.pricing?.pro || 35000) * 100
        };
        const amount = priceMap[plan] || 2500000;
        
        const paystackKey = (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY : undefined) || 'pk_test_dummykey12345';
        
        const handler = (window as any).PaystackPop.setup({
          key: paystackKey, 
          email: email,
          amount: amount,
          currency: 'NGN',
          ref: '' + Math.floor((Math.random() * 1000000000) + 1),
          callback_url: window.location.href,
          callback: function(response: any) {
            setSuccess(`✅ Payment successful! Reference: ${response.reference}`);
            setTimeout(() => router.push('/app'), 1200);
          },
          onClose: function() {
            setSuccess('Payment window closed. You can pay later from your dashboard.');
            setTimeout(() => router.push('/app'), 2000);
          }
        });
        handler.openIframe();
        return;
      }

      setSuccess(`✅ Account created! Initiating ${gateway} checkout...`);
      setTimeout(() => router.push('/app'), 1200);

    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 30 : -30, opacity: 0, filter: 'blur(8px)' }),
    center: { zIndex: 1, x: 0, opacity: 1, filter: 'blur(0px)' },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 30 : -30, opacity: 0, filter: 'blur(8px)' })
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-blue-500/5 blur-[120px] animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-secondary/10 blur-[120px] animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>
      
      <div className="w-full max-w-[560px] relative z-10 my-8">
        <Card className="border border-white/20 shadow-2xl bg-card/60 backdrop-blur-2xl overflow-hidden">
          {/* Progress Header */}
          <CardHeader className="bg-secondary/40 border-b border-border/40 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {step > 1 && !success && !virtualAccount && (
                  <Button variant="outline" size="icon" onClick={handlePrevStep} className="h-8 w-8 rounded-full">
                    <ChevronLeft size={18} />
                  </Button>
                )}
                <div className="flex items-center gap-2 font-black text-primary text-xl tracking-tight">
                  <School className="w-6 h-6" /> EduReport <span className="text-foreground">NG</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-muted-foreground mb-1">Registration</span>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].filter(s => plan !== 'trial' || s <= 3).map((s) => (
                    <div key={s} className={`h-1.5 w-6 rounded-full transition-all duration-500 shadow-sm ${step >= s ? 'bg-primary shadow-primary/30' : 'bg-secondary'}`} />
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8">
            {error && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 mb-6 bg-destructive/10 border border-destructive/20 text-destructive font-bold text-sm rounded-xl flex items-center gap-3 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center shrink-0 shadow-sm"><X size={14} /></div>
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 mb-6 bg-primary/10 border border-primary/20 text-primary font-bold text-sm rounded-xl flex items-center gap-3 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-sm"><Check size={14} /></div>
                {success}
              </motion.div>
            )}

            {!virtualAccount ? (
              <AnimatePresence mode="wait" custom={step}>
                {/* STEP 1: PLAN */}
                {step === 1 && (
                  <motion.div key="step1" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 260, damping: 20 }} className="flex flex-col">
                    <div className="mb-6">
                      <h3 className="text-2xl font-black text-foreground leading-tight mb-2">Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green2">Journey</span></h3>
                      <p className="text-muted-foreground font-medium">The ultimate Nigerian Report Card & Exam system.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {plans.map(p => (
                        <div 
                          key={p.id}
                          className={`group relative flex flex-col border-2 rounded-[20px] p-5 cursor-pointer transition-all duration-300 ${plan === p.id ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-border/60 bg-card hover:border-primary/40 hover:shadow-xl hover:-translate-y-1'}`}
                          onClick={() => setPlan(p.id)}
                        >
                          {p.highlight && (
                            <div className="absolute top-0 right-6 bg-gradient-to-r from-gold to-yellow-500 text-white text-[0.65rem] font-black uppercase tracking-widest px-3 py-1 rounded-b-lg shadow-md z-10 flex items-center gap-1">
                              <Star size={10} /> Popular
                            </div>
                          )}
                          <div className="flex justify-between items-center mb-2">
                            <div className={`text-xs font-black uppercase tracking-widest ${plan === p.id ? 'text-primary' : 'text-muted-foreground'}`}>{p.name}</div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${plan === p.id ? 'border-primary bg-primary text-white scale-110 shadow-md shadow-primary/30' : 'border-border/80 group-hover:border-primary/40'}`}>
                              {plan === p.id && <Check size={12} />}
                            </div>
                          </div>
                          <div className="text-2xl font-black text-foreground mb-1 tracking-tight">{p.price}</div>
                          <div className="text-sm text-muted-foreground font-medium">{p.desc}</div>
                        </div>
                      ))}
                    </div>

                    <Button onClick={handleNextStep} className="w-full mt-8 h-14 text-lg font-bold rounded-2xl group">
                      Continue to Details <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </motion.div>
                )}

                {/* STEP 2: SCHOOL DETAILS */}
                {step === 2 && (
                  <motion.div key="step2" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 260, damping: 20 }} className="flex flex-col">
                    <div className="mb-6">
                      <h3 className="text-2xl font-black text-foreground leading-tight mb-2">Institution <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green2">Identity</span></h3>
                      <p className="text-muted-foreground font-medium">Define your school's digital presence.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2 group">
                        <Label className="flex items-center gap-2 uppercase tracking-widest text-xs font-black text-muted-foreground">
                          <Briefcase className="text-primary" /> School Name
                        </Label>
                        <Input 
                          type="text" 
                          value={schoolName} 
                          onChange={e => setSchoolName(e.target.value)} 
                          placeholder="e.g. Hephzibah College" 
                          className="h-12 text-base font-bold bg-secondary/30"
                        />
                      </div>

                      <div className="space-y-2 group">
                        <Label className="flex items-center gap-2 uppercase tracking-widest text-xs font-black text-muted-foreground">
                          <Globe className="text-primary" /> School Username
                        </Label>
                        <div className="relative">
                          <Input 
                            type="text" 
                            value={schoolUsername} 
                            onChange={e => {
                              const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                              setSchoolUsername(val);
                            }} 
                            placeholder="e.g. hephzibah" 
                            className={`h-12 text-base font-bold pr-12 bg-secondary/30 ${domainStatus === 'available' ? 'border-primary ring-2 ring-primary/20' : domainStatus === 'taken' || domainStatus === 'invalid' ? 'border-destructive ring-2 ring-destructive/20' : ''}`}
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            {domainStatus === 'checking' && <div className="w-5 h-5 border-2 border-muted-foreground/20 border-t-primary rounded-full animate-spin"></div>}
                            {domainStatus === 'available' && <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20"><Check size={14} /></div>}
                            {domainStatus === 'taken' && <div className="w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center shadow-lg shadow-destructive/20"><X size={14} /></div>}
                          </div>
                        </div>
                        <div className="flex justify-between items-center px-1">
                          <small className="text-xs font-medium text-muted-foreground">Lower-case letters & numbers only.</small>
                          <AnimatePresence>
                            {domainStatus !== 'idle' && (
                              <motion.small initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-xs font-black uppercase tracking-widest ${domainStatus === 'available' ? 'text-primary' : 'text-destructive'}`}>
                                {domainStatus === 'available' && 'Unique Address!'}
                                {domainStatus === 'taken' && 'Already Taken'}
                                {domainStatus === 'invalid' && 'Invalid Format'}
                              </motion.small>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleNextStep} className="w-full mt-8 h-14 text-lg font-bold rounded-2xl group">
                      Next Step <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </motion.div>
                )}

                {/* STEP 3: ACCOUNT DETAILS */}
                {step === 3 && (
                  <motion.div key="step3" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 260, damping: 20 }} className="flex flex-col">
                    <div className="mb-6">
                      <h3 className="text-2xl font-black text-foreground leading-tight mb-2">Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green2">Account</span></h3>
                      <p className="text-muted-foreground font-medium">Protect your school's data assets.</p>
                    </div>

                    <div className="space-y-5">
                      <div className="space-y-2 group">
                        <Label className="flex items-center gap-2 uppercase tracking-widest text-xs font-black text-muted-foreground">
                          <Mail className="text-primary" /> Email Address
                        </Label>
                        <Input 
                          type="email" 
                          value={email} 
                          onChange={e => setEmail(e.target.value)} 
                          placeholder="admin@yourschool.com" 
                          className="h-12 bg-secondary/30"
                        />
                      </div>

                      <div className="space-y-2 group">
                        <Label className="flex items-center gap-2 uppercase tracking-widest text-xs font-black text-muted-foreground">
                          <Phone className="text-primary" /> Mobile Contact
                        </Label>
                        <Input 
                          type="tel" 
                          value={phone} 
                          onChange={e => setPhone(e.target.value)} 
                          placeholder="080 0000 0000" 
                          className="h-12 bg-secondary/30"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="space-y-2 group">
                          <Label className="flex items-center gap-2 uppercase tracking-widest text-xs font-black text-muted-foreground">
                            <Lock className="text-primary" /> Password
                          </Label>
                          <Input 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            placeholder="Min 12 chars" 
                            className="h-12 bg-secondary/30"
                          />
                          <PasswordStrengthBar password={password} />
                        </div>
                        <div className="space-y-2 group">
                          <Label className="flex items-center gap-2 uppercase tracking-widest text-xs font-black text-muted-foreground">
                            <Shield className="text-primary" /> Confirm Password
                          </Label>
                          <Input 
                            type="password" 
                            value={confirmPassword} 
                            onChange={e => setConfirmPassword(e.target.value)} 
                            placeholder="Verify password" 
                            className="h-12 bg-secondary/30"
                          />
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleNextStep} isLoading={loading} className="w-full mt-8 h-14 text-lg font-bold rounded-2xl group">
                      {plan === 'trial' ? <>Complete Setup <Award className="ml-2" /></> : <>Secure Payment <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" /></>}
                    </Button>
                  </motion.div>
                )}

                {/* STEP 4: PAYMENT */}
                {step === 4 && plan !== 'trial' && (
                  <motion.div key="step4" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 260, damping: 20 }} className="flex flex-col">
                    <div className="mb-6">
                      <h3 className="text-2xl font-black text-foreground leading-tight mb-2">Instant <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green2">Activation</span></h3>
                      <p className="text-muted-foreground font-medium">Activate your {plans.find(p => p.id === plan)?.name} instantly.</p>
                    </div>

                    <div className="bg-secondary/50 rounded-[20px] p-6 mb-6 border border-white/10 relative overflow-hidden shadow-inner">
                      <div className="absolute top-0 right-0 p-4 opacity-5"><Award size={80} /></div>
                      <div className="flex justify-between items-center mb-4 relative z-10">
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Subscription Model</span>
                        <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-primary/20">{plans.find(p => p.id === plan)?.name}</div>
                      </div>
                      <div className="flex justify-between items-end relative z-10">
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Total Activation Fee</span>
                        <span className="text-3xl font-black text-foreground leading-none">{plans.find(p => p.id === plan)?.price}</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6 group">
                      <Label className="uppercase tracking-widest text-xs font-black text-muted-foreground">Payment Gateway</Label>
                      <select 
                        value={gateway} 
                        onChange={e => setGateway(e.target.value)} 
                        className="flex h-12 w-full rounded-[16px] border border-border bg-secondary/30 px-4 py-2 text-sm font-bold ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all cursor-pointer shadow-sm"
                      >
                        <option value="PAYVESSEL">Payvessel (Instant)</option>
                        <option value="PAYMENTPOINT">PaymentPoint</option>
                        <option value="PAYSTACK">Paystack Secure</option>
                        <option value="FLUTTERWAVE">Flutterwave</option>
                        <option value="MONNIFY">Monnify</option>
                      </select>
                    </div>

                    <Button onClick={submitRegistration} isLoading={loading} className="w-full h-14 text-lg font-bold rounded-2xl group shadow-lg shadow-primary/20">
                      Authorize Activation <Shield className="ml-2 group-hover:scale-110 transition-transform" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-primary/5 border border-primary/20 rounded-[24px] p-8 text-center flex-1 flex flex-col justify-center shadow-inner">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-green2 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30">
                  <Briefcase size={36} />
                </div>
                <h4 className="font-black text-foreground text-2xl leading-tight mb-3">Transfer Generated</h4>
                <p className="text-sm text-muted-foreground font-medium mb-2">Proceed with the transfer instructions on your dashboard to activate the portal.</p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
