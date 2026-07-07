import { useState } from 'react';
import { BookOpen, Users, Target, Award, Mail, Phone, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pt-20">
      <div className="bg-gradient-to-r from-primary-700 to-accent-700 py-16 text-white text-center">
        <h1 className="text-4xl font-bold font-heading mb-3">About Knowlix</h1>
        <p className="text-primary-200 max-w-xl mx-auto">India's premier educational document sharing platform</p>
      </div>
      <div className="page-container py-16 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {[
            { icon: Target, title: 'Our Mission', text: 'To democratize education by providing free and premium access to quality study materials for students across India.' },
            { icon: BookOpen, title: 'Our Vision', text: 'A world where every student has access to the best educational resources regardless of their location or economic background.' },
            { icon: Users, title: 'Our Community', text: 'A growing community of 1000+ students, educators, and professionals sharing knowledge and growing together.' },
            { icon: Award, title: 'Our Quality', text: 'Every document is reviewed by our team before publication to ensure accuracy, relevance, and educational value.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-6">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold font-heading text-neutral-900 dark:text-white mb-2">{title}</h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
        <div className="card p-8 text-center">
          <h2 className="text-2xl font-bold font-heading text-neutral-900 dark:text-white mb-4">Founded with Purpose</h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto">
            Knowlix was founded with a simple goal: to make quality educational content accessible to every student in India.
            We started with nursing and medical notes and have grown to cover a wide range of subjects, serving thousands of
            students in their academic journey.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const { error: dbError } = await supabase.from('contact_messages').insert({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
    });
    setSubmitting(false);
    if (dbError) { setError('Failed to send message. Please try again.'); return; }
    setSubmitted(true);
    setName(''); setEmail(''); setSubject(''); setMessage('');
  };
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pt-20">
      <div className="bg-gradient-to-r from-primary-700 to-accent-700 py-16 text-white text-center">
        <h1 className="text-4xl font-bold font-heading mb-3">Contact Us</h1>
        <p className="text-primary-200">We'd love to hear from you</p>
      </div>
      <div className="page-container py-16 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold font-heading text-neutral-900 dark:text-white mb-6">Get in Touch</h2>
            <div className="space-y-4 mb-8">
              {[
                { icon: Mail, label: 'Email', value: 'support@knowlix.in', href: 'mailto:support@knowlix.in' },
                { icon: Phone, label: 'Phone', value: '+91 9406970754', href: 'tel:+919406970754' },
                { icon: MapPin, label: 'Location', value: 'India', href: '#' },
              ].map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-center gap-4 p-4 card">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500">{label}</div>
                    <a href={href} className="font-medium text-neutral-900 dark:text-white hover:text-primary-600">{value}</a>
                  </div>
                </div>
              ))}
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">Business Hours</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Monday - Saturday: 9 AM - 6 PM IST</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Sunday: Closed</p>
            </div>
          </div>
          <div className="card p-6">
            <h2 className="text-xl font-bold font-heading text-neutral-900 dark:text-white mb-5">Send a Message</h2>
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle className="w-14 h-14 text-success-500 mb-4" />
                <h3 className="font-semibold text-neutral-900 dark:text-white text-lg mb-2">Message Sent!</h3>
                <p className="text-neutral-500 text-sm">We'll get back to you within 24 hours.</p>
                <button onClick={() => setSubmitted(false)} className="btn-secondary btn-sm mt-4">Send Another</button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <input type="text" placeholder="Your Name" className="input" required value={name} onChange={e => setName(e.target.value)} />
                <input type="email" placeholder="Email Address" className="input" required value={email} onChange={e => setEmail(e.target.value)} />
                <input type="text" placeholder="Subject" className="input" required value={subject} onChange={e => setSubject(e.target.value)} />
                <textarea placeholder="Your message..." rows={4} className="input resize-none" required value={message} onChange={e => setMessage(e.target.value)} />
                {error && <p className="text-sm text-error-600">{error}</p>}
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pt-20">
      <div className="bg-gradient-to-r from-neutral-800 to-neutral-900 py-12 text-white text-center">
        <h1 className="text-3xl font-bold font-heading mb-2">{title}</h1>
        <p className="text-neutral-400 text-sm">Last updated: June 2025</p>
      </div>
      <div className="page-container py-12 max-w-3xl">
        <div className="card p-8 prose prose-neutral dark:prose-invert max-w-none">
          {children}
        </div>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <div className="space-y-6 text-neutral-700 dark:text-neutral-300">
        <p className="text-lg">This Privacy Policy describes how Knowlix collects, uses, and protects your personal information.</p>
        {[
          { title: '1. Information We Collect', content: 'We collect information you provide directly, such as your name, email address, and profile information when you register. We also collect usage data including documents you view, download, and interact with.' },
          { title: '2. How We Use Your Information', content: 'We use your information to provide and improve our services, process subscriptions, send notifications about your account activity, and communicate important updates.' },
          { title: '3. Information Sharing', content: 'We do not sell your personal information to third parties. We may share information with service providers who assist us in operating the platform, subject to confidentiality obligations.' },
          { title: '4. Data Security', content: 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.' },
          { title: '5. Cookies', content: 'We use cookies and similar technologies to enhance your experience, remember your preferences, and analyze platform usage.' },
          { title: '6. Your Rights', content: 'You have the right to access, correct, or delete your personal information. You may also request a copy of your data or opt out of certain communications.' },
          { title: '7. Contact', content: 'For privacy concerns, contact us at privacy@knowlix.in or +91 9406970754.' },
        ].map(({ title, content }) => (
          <div key={title}>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">{title}</h2>
            <p className="leading-relaxed">{content}</p>
          </div>
        ))}
      </div>
    </LegalPage>
  );
}

export function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions">
      <div className="space-y-6 text-neutral-700 dark:text-neutral-300">
        <p className="text-lg">By using Knowlix, you agree to these Terms and Conditions. Please read them carefully.</p>
        {[
          { title: '1. Acceptance of Terms', content: 'By accessing or using Knowlix, you agree to be bound by these Terms and our Privacy Policy. If you do not agree, please do not use our services.' },
          { title: '2. User Accounts', content: 'You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials.' },
          { title: '3. Content Guidelines', content: 'Users may upload educational content that they own or have rights to. Content must be educational, accurate, and not infringe any third-party rights. Inappropriate or illegal content will be removed.' },
          { title: '4. Intellectual Property', content: 'Content uploaded by users remains their property. By uploading, you grant Knowlix a license to display and distribute the content on our platform.' },
          { title: '5. Subscription Terms', content: 'Paid subscriptions are activated after manual payment verification. Subscription fees are non-refundable except as outlined in our Refund Policy.' },
          { title: '6. Prohibited Activities', content: 'You may not use the platform for illegal activities, distribute malware, spam other users, or attempt to gain unauthorized access to our systems.' },
          { title: '7. Termination', content: 'We reserve the right to terminate accounts that violate these terms or engage in prohibited activities without prior notice.' },
          { title: '8. Governing Law', content: 'These terms are governed by the laws of India. Any disputes shall be resolved in the courts of jurisdiction applicable to the company.' },
        ].map(({ title, content }) => (
          <div key={title}>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">{title}</h2>
            <p className="leading-relaxed">{content}</p>
          </div>
        ))}
      </div>
    </LegalPage>
  );
}

export function DMCAPage() {
  return (
    <LegalPage title="DMCA Policy">
      <div className="space-y-6 text-neutral-700 dark:text-neutral-300">
        <p className="text-lg">Knowlix respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA).</p>
        {[
          { title: 'Reporting Copyright Infringement', content: 'If you believe content on our platform infringes your copyright, please submit a DMCA notice to dmca@knowlix.in with: your contact information, identification of the copyrighted work, identification of the infringing material, and a statement that you have good faith belief the use is unauthorized.' },
          { title: 'Counter-Notification', content: 'If you believe your content was removed in error, you may submit a counter-notification with your contact information, identification of removed content, and a statement under penalty of perjury that removal was made in error.' },
          { title: 'Repeat Infringers', content: 'We will terminate accounts of users who repeatedly infringe copyrights.' },
          { title: 'Contact for DMCA', content: 'DMCA notices should be sent to: dmca@knowlix.in or via our contact form.' },
        ].map(({ title, content }) => (
          <div key={title}>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">{title}</h2>
            <p className="leading-relaxed">{content}</p>
          </div>
        ))}
      </div>
    </LegalPage>
  );
}

export function RefundPage() {
  return (
    <LegalPage title="Refund Policy">
      <div className="space-y-6 text-neutral-700 dark:text-neutral-300">
        <p className="text-lg">We strive to ensure complete satisfaction with our services. Please read our refund policy carefully.</p>
        {[
          { title: 'Eligibility for Refunds', content: 'Refund requests are accepted within 7 days of payment approval, provided you have not extensively used the premium features. If you have downloaded more than 10 documents using your premium subscription, refunds are not applicable.' },
          { title: 'How to Request a Refund', content: 'Contact us at refunds@knowlix.in with your order details, payment screenshot, and reason for refund. We will review and respond within 3 business days.' },
          { title: 'Processing Refunds', content: 'Approved refunds are processed via the same UPI ID used for payment, typically within 5-7 business days.' },
          { title: 'Non-Refundable Cases', content: 'Refunds are not provided if: subscription has been used for more than 7 days, extensive platform use has occurred, or terms of service have been violated.' },
          { title: 'Technical Issues', content: 'If you experience technical issues preventing access to premium features, contact support immediately. We will resolve or provide a refund accordingly.' },
          { title: 'Contact', content: 'For refund inquiries: refunds@knowlix.in or +91 9406970754' },
        ].map(({ title, content }) => (
          <div key={title}>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">{title}</h2>
            <p className="leading-relaxed">{content}</p>
          </div>
        ))}
      </div>
    </LegalPage>
  );
}
