import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { ScrollReveal, EASE_PREMIUM } from '../lib/motion';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  ShieldCheck,
  Building2,
} from 'lucide-react';

interface ContactPageProps {
  navigate: (route: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ navigate }) => {
  const { showToast } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleType, setRoleType] = useState('candidate');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      showToast('success', 'Inquiry Received', 'A ABHI JOBS recruitment advisor will contact you within 24 hours.');
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <ScrollReveal direction="up" distance={16}>
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF2B1A]">Support &amp; Enterprise Inquiries</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#101828]">Get in Touch with ABHI JOBS</h1>
            <p className="text-xs sm:text-sm text-[#667085] max-w-xl mx-auto">
              Have questions about candidate verification, corporate recruitment partnerships, or career mentorship? We are here to assist.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Form */}
          <div className="lg:col-span-7">
            <ScrollReveal direction="up" delay={0.06} distance={18}>
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E4E7EC] shadow-xs">
                <h2 className="text-lg font-bold text-[#101828] mb-4">Send Us a Direct Message</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[#101828]">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="w-full text-xs p-3 rounded-xl border border-[#D0D5DD] mt-1 focus:border-[#061226] focus:ring-1 focus:ring-[#061226]/10 focus:outline-hidden"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#101828]">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full text-xs p-3 rounded-xl border border-[#D0D5DD] mt-1 focus:border-[#061226] focus:ring-1 focus:ring-[#061226]/10 focus:outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[#101828]">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91..."
                        className="w-full text-xs p-3 rounded-xl border border-[#D0D5DD] mt-1 focus:border-[#061226] focus:ring-1 focus:ring-[#061226]/10 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#101828]">I am a...</label>
                      <select
                        value={roleType}
                        onChange={(e) => setRoleType(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-[#D0D5DD] mt-1 focus:border-[#061226] focus:ring-1 focus:ring-[#061226]/10 focus:outline-hidden bg-white"
                      >
                        <option value="candidate">Job Seeker / Candidate</option>
                        <option value="employer">Employer / Recruiter</option>
                        <option value="enterprise">Enterprise Organization</option>
                        <option value="partner">Academic / Training Partner</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#101828]">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="How can our team help?"
                      className="w-full text-xs p-3 rounded-xl border border-[#D0D5DD] mt-1 focus:border-[#061226] focus:ring-1 focus:ring-[#061226]/10 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#101828]">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      placeholder="Provide details about your query..."
                      className="w-full text-xs p-3 rounded-xl border border-[#D0D5DD] mt-1 focus:border-[#061226] focus:ring-1 focus:ring-[#061226]/10 focus:outline-hidden"
                      required
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Transmitting...' : 'Send Inquiry'}</span>
                  </motion.button>
                </form>
              </div>
            </ScrollReveal>
          </div>

          {/* Contact Details & Offices */}
          <div className="lg:col-span-5 space-y-6">
            <ScrollReveal direction="up" delay={0.12} distance={18}>
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-[#E4E7EC] shadow-xs space-y-4">
                  <h3 className="text-base font-bold text-[#101828]">Direct Inquiries</h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-[#FF2B1A] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-[#101828]">Email Us</div>
                        <div className="text-[#667085]">contact@abhijobs.com</div>
                        <div className="text-[#98A2B3] text-[11px]">careers@abhijobs.com</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-[#004D40] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-[#101828]">Helpdesk Phone</div>
                        <div className="text-[#667085]">+91 (80) 4123-8899</div>
                        <div className="text-[#98A2B3] text-[11px]">Mon-Fri: 9:00 AM - 7:00 PM IST</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-[#E4E7EC] shadow-xs space-y-4">
                  <h3 className="text-base font-bold text-[#101828]">Office Hubs</h3>
                  <div className="space-y-3 text-xs text-[#667085]">
                    <div className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E4E7EC]">
                      <div className="font-bold text-[#101828] flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#004D40]" />
                        <span>Bangalore HQ</span>
                      </div>
                      <div className="mt-1 text-[11px] leading-relaxed">
                        ABHI JOBS Tower, 100 Feet Road, Indiranagar, Bangalore, Karnataka 560038
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E4E7EC]">
                      <div className="font-bold text-[#101828] flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#004D40]" />
                        <span>Mumbai Hub</span>
                      </div>
                      <div className="mt-1 text-[11px] leading-relaxed">
                        Level 4, Platina Tower, Bandra Kurla Complex (BKC), Mumbai 400051
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
};
