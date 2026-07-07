import { useState, useEffect } from 'react';
import {
  CheckCircle, Shield, Zap, Award, Copy, QrCode, Upload,
  Loader2, ArrowLeft, ExternalLink, CheckCircle2, Clock,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PRICING_PLANS, PricingPlan, Payment } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { navigate } from '../lib/router';
import { formatPrice, generateUpiQrUrl } from '../lib/utils';

export default function PricingPage() {
  const { user, profile } = useAuth();
  const { t, lang } = useLang();
  const { toast } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'premium' | null>(null);
  const [upiId, setUpiId] = useState('9406970754@upi');
  const [proPrice, setProPrice] = useState(99);
  const [premiumPrice, setPremiumPrice] = useState(149);
  const [step, setStep] = useState<'plans' | 'payment' | 'success'>('plans');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [existingPayment, setExistingPayment] = useState<Payment | null>(null);

  useEffect(() => {
    supabase.from('settings').select('key, value').in('key', ['upi_id', 'pro_price', 'premium_price'])
      .then(({ data }) => {
        (data ?? []).forEach((s: any) => {
          if (s.key === 'upi_id') setUpiId(s.value);
          if (s.key === 'pro_price') setProPrice(Number(s.value));
          if (s.key === 'premium_price') setPremiumPrice(Number(s.value));
        });
      });

    if (user) {
      supabase.from('payments').select('*').eq('user_id', user.id).eq('status', 'pending').maybeSingle()
        .then(({ data }) => { if (data) setExistingPayment(data as Payment); });
    }
  }, [user]);

  const handleSelectPlan = (plan: 'pro' | 'premium') => {
    if (!user) { toast(t('loginRequired'), 'warning'); navigate('/auth'); return; }
    setSelectedPlan(plan);
    setStep('payment');
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId).then(() => {
      setCopied(true);
      toast(t('copied'), 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPlan) return;
    if (!screenshotFile) { toast('Please upload payment screenshot', 'error'); return; }

    setUploading(true);
    try {
      // Upload screenshot
      const path = `${user.id}/${Date.now()}_screenshot.${screenshotFile.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('payment-screenshots').upload(path, screenshotFile);
      if (uploadError) { toast(`Upload failed: ${uploadError.message}`, 'error'); return; }

      const { data: urlData } = supabase.storage.from('payment-screenshots').getPublicUrl(path);
      const screenshotUrl = urlData?.publicUrl || null;

      const amount = selectedPlan === 'pro' ? proPrice : premiumPrice * 12;
      const { error } = await supabase.from('payments').insert({
        user_id: user.id,
        plan: selectedPlan,
        amount,
        upi_transaction_id: transactionId.trim() || null,
        screenshot_url: screenshotUrl,
        status: 'pending',
      });

      if (error) { toast(error.message, 'error'); return; }

      // Create pending subscription
      await supabase.from('subscriptions').upsert({
        user_id: user.id,
        plan: selectedPlan,
        status: 'pending',
        starts_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      // Notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: t('paymentPending'),
        message: `Your payment for ${selectedPlan} plan is under review. We'll notify you once approved.`,
        type: 'subscription',
      });

      setStep('success');
    } finally {
      setUploading(false);
    }
  };

  const amount = selectedPlan === 'pro' ? proPrice : premiumPrice * 12;
  const qrUrl = generateUpiQrUrl(upiId, amount, 'Knowlix', `${selectedPlan ?? 'subscription'} plan`);

  const planIcons = { free: Shield, pro: Zap, premium: Award };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pt-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-700 to-accent-700 py-12 text-white text-center">
        <h1 className="text-3xl font-bold font-heading mb-2">{t('pricingPlans')}</h1>
        <p className="text-primary-200">Simple pricing, powerful features</p>
      </div>

      <div className="page-container py-12">
        {/* Existing pending payment notice */}
        {existingPayment && step === 'plans' && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-2xl p-5 flex items-start gap-3">
              <Clock className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-warning-800 dark:text-warning-300">{t('paymentPending')}</h3>
                <p className="text-sm text-warning-700 dark:text-warning-400 mt-1">
                  Your payment for <strong>{existingPayment.plan}</strong> plan is under admin review.
                  You'll receive a notification once it's approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'plans' && (
          <>
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold font-heading text-neutral-900 dark:text-white mb-2">
                {lang === 'hi' ? 'अपना प्लान चुनें' : t('choosePlan')}
              </h2>
              <p className="text-neutral-500">UPI payment • Instant activation after approval</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {PRICING_PLANS.map(plan => {
                const Icon = planIcons[plan.id];
                const price = plan.id === 'pro' ? proPrice : plan.id === 'premium' ? premiumPrice : 0;
                const features = lang === 'hi' ? plan.featuresHi : plan.features;
                const name = lang === 'hi' ? plan.nameHi : plan.name;

                return (
                  <div
                    key={plan.id}
                    className={`card p-7 relative flex flex-col transition-all ${
                      plan.highlighted
                        ? 'border-primary-400 dark:border-primary-600 shadow-primary ring-2 ring-primary-400/30 scale-105'
                        : 'hover:shadow-elevated hover:-translate-y-1'
                    }`}
                  >
                    {plan.highlighted && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="badge bg-primary-600 text-white text-xs px-3 py-1">Most Popular</span>
                      </div>
                    )}

                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 ${
                      plan.id === 'free' ? 'bg-neutral-100 dark:bg-neutral-800' :
                      plan.id === 'pro' ? 'bg-primary-100 dark:bg-primary-900/40' :
                      'bg-accent-100 dark:bg-accent-900/40'
                    }`}>
                      <Icon className={`w-7 h-7 ${
                        plan.id === 'free' ? 'text-neutral-600' :
                        plan.id === 'pro' ? 'text-primary-600' : 'text-accent-600'
                      }`} />
                    </div>

                    <h3 className="text-xl font-bold font-heading text-neutral-900 dark:text-white">{name}</h3>
                    <div className="flex items-end gap-1 mt-2 mb-5">
                      <span className="text-3xl font-bold text-neutral-900 dark:text-white">
                        {price === 0 ? 'Free' : formatPrice(price)}
                      </span>
                      {price > 0 && (
                        <span className="text-neutral-500 text-sm mb-1">
                          /{lang === 'hi' ? plan.periodHi : plan.period}
                        </span>
                      )}
                      {plan.id === 'premium' && (
                        <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-1">
                          {lang === 'hi' ? 'वार्षिक बिलिंग — ' : 'Billed yearly — '}{formatPrice(premiumPrice * 12)}/yr
                        </p>
                      )}
                    </div>

                    <ul className="space-y-2.5 mb-6 flex-1">
                      {features.map(f => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-neutral-700 dark:text-neutral-300">
                          <CheckCircle className="w-4 h-4 text-success-500 mt-0.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {plan.id === 'free' ? (
                      user ? (
                        <div className="btn-ghost btn-lg w-full cursor-default text-neutral-400">Current Plan</div>
                      ) : (
                        <a href="#/auth?mode=signup" className="btn-secondary btn-lg w-full">Get Started Free</a>
                      )
                    ) : (
                      <button
                        onClick={() => handleSelectPlan(plan.id as 'pro' | 'premium')}
                        className={`btn-lg w-full ${plan.highlighted ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        {lang === 'hi'
                          ? (plan.id === 'pro' ? t('getProPlan') : t('getPremiumPlan'))
                          : `Get ${name} — ${formatPrice(price)}/mo`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* How it works */}
            <div className="max-w-2xl mx-auto mt-16">
              <h3 className="text-xl font-bold font-heading text-neutral-900 dark:text-white text-center mb-8">
                How Payment Works
              </h3>
              <div className="flex flex-col sm:flex-row gap-6">
                {[
                  { step: '1', icon: <Zap className="w-6 h-6" />, title: 'Select Plan', desc: 'Choose Pro or Premium plan' },
                  { step: '2', icon: <QrCode className="w-6 h-6" />, title: 'Pay via UPI', desc: 'Scan QR or use UPI ID' },
                  { step: '3', icon: <Upload className="w-6 h-6" />, title: 'Upload Screenshot', desc: 'Submit payment proof' },
                  { step: '4', icon: <CheckCircle className="w-6 h-6" />, title: 'Get Activated', desc: 'Admin approves within hours' },
                ].map(({ step: s, icon, title, desc }) => (
                  <div key={s} className="flex-1 text-center">
                    <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white mx-auto mb-3">
                      {icon}
                    </div>
                    <h4 className="font-semibold text-neutral-900 dark:text-white text-sm">{title}</h4>
                    <p className="text-xs text-neutral-500 mt-1">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Payment step */}
        {step === 'payment' && selectedPlan && (
          <div className="max-w-xl mx-auto">
            <button onClick={() => setStep('plans')} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-primary-600 mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Plans
            </button>

            <div className="card p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl mb-3">
                  <Zap className="w-7 h-7 text-primary-600" />
                </div>
                <h2 className="text-xl font-bold font-heading text-neutral-900 dark:text-white capitalize">
                  {selectedPlan} Plan — {formatPrice(selectedPlan === 'pro' ? proPrice : premiumPrice)}/month
                </h2>
                {selectedPlan === 'premium' && (
                  <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mt-1">
                    Billed yearly: {formatPrice(amount)}
                  </p>
                )}
              </div>

              {/* Step 1: Pay */}
              <div className="mb-6">
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                  {t('step1')}
                </h3>

                {/* QR Code */}
                <div className="flex flex-col items-center mb-4">
                  <div className="bg-white p-3 rounded-2xl shadow-card mb-3">
                    <img
                      src={qrUrl}
                      alt="UPI QR Code"
                      className="w-44 h-44 rounded-lg"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <p className="text-xs text-neutral-500">Scan with any UPI app</p>
                </div>

                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-500">{t('upiId')}</span>
                    <button onClick={handleCopyUpi} className="btn-ghost btn-sm text-xs">
                      <Copy className="w-3 h-3" />
                      {copied ? t('copied') : t('copyUpiId')}
                    </button>
                  </div>
                  <div className="font-mono font-bold text-neutral-900 dark:text-white text-lg tracking-wide">{upiId}</div>
                </div>

                <div className="bg-primary-50 dark:bg-primary-950/30 rounded-xl p-4 border border-primary-100 dark:border-primary-900">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Amount to Pay</span>
                    <span className="font-bold text-primary-600 dark:text-primary-400">{formatPrice(amount)}</span>
                  </div>
                </div>
              </div>

              {/* Step 2: Upload screenshot */}
              <form onSubmit={handleSubmitPayment}>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                  {t('step2')}
                </h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      {t('transactionId')}
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={e => setTransactionId(e.target.value)}
                      className="input"
                      placeholder="UPI transaction ID (optional but recommended)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      {t('uploadScreenshot')} *
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                        screenshotFile
                          ? 'border-success-400 bg-success-50 dark:bg-success-950/20'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300'
                      }`}
                      onClick={() => document.getElementById('screenshot-input')?.click()}
                    >
                      <input
                        id="screenshot-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => { if (e.target.files?.[0]) setScreenshotFile(e.target.files[0]); }}
                      />
                      {screenshotFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-success-500" />
                          <span className="text-sm font-medium text-success-700">{screenshotFile.name}</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                          <p className="text-sm text-neutral-500">Click to upload payment screenshot</p>
                          <p className="text-xs text-neutral-400 mt-1">JPG, PNG, GIF (max 5MB)</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-5 border border-amber-100 dark:border-amber-900/40">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      After submitting, admin will verify your payment within a few hours and activate your subscription.
                    </p>
                  </div>
                </div>

                <button type="submit" disabled={uploading || !screenshotFile} className="btn-primary btn-lg w-full">
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Submit Payment Request</>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Success step */}
        {step === 'success' && (
          <div className="max-w-md mx-auto text-center">
            <div className="card p-10">
              <div className="w-20 h-20 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-10 h-10 text-success-600" />
              </div>
              <h2 className="text-2xl font-bold font-heading text-neutral-900 dark:text-white mb-3">
                Payment Submitted!
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
                Your payment request has been submitted. Our admin team will verify and activate your <strong className="capitalize">{selectedPlan}</strong> subscription within a few hours.
              </p>
              <div className="bg-primary-50 dark:bg-primary-950/30 rounded-xl p-4 mb-6 text-sm text-primary-700 dark:text-primary-400">
                You will receive a notification once your subscription is activated.
              </div>
              <div className="flex gap-3">
                <a href="#/dashboard?tab=subscription" className="btn-primary flex-1">View Subscription</a>
                <a href="#/" className="btn-secondary flex-1">Go Home</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
