"use client";

import React from 'react';
import Link from "next/link";
import ThemeToggle from "./components/ThemeToggle";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-base-100">
      {/* Navbar */}
      <div className="navbar bg-base-100/80 backdrop-blur-lg fixed top-0 z-50 border-b border-base-300 px-4 lg:px-8">
        <div className="navbar-start">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gradient">SafeVote</span>
          </div>
        </div>
        
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-2">
            <li><a href="#features" className="hover:text-emerald-500">Features</a></li>
            <li><a href="#how-it-works" className="hover:text-emerald-500">How it Works</a></li>
            <li><Link href="/team" className="hover:text-emerald-500">Our Team</Link></li>
            <li><a href="#faq" className="hover:text-emerald-500">FAQ</a></li>
          </ul>
        </div>
        
        <div className="navbar-end gap-2">
          <Link href="/vote/login" className="btn btn-ghost btn-sm">Voter Login</Link>
          <Link href="/register" className="btn btn-primary btn-sm">Get Started</Link>
          <ThemeToggle />
        </div>
      </div>

      {/* Hero Section with Video Background */}
      <section className="hero min-h-screen relative overflow-hidden pt-16">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/videos/behind.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-br from-base-100/90 via-base-100/70 to-base-100/90"></div>
        </div>

        <div className="hero-content relative z-10 flex-col lg:flex-row-reverse py-20 gap-12 max-w-7xl mx-auto px-4">
          {/* Stats Card */}
          <div className="card shadow-2xl w-full max-w-sm glass-card">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-lg font-semibold">Global Platform Stats</span>
              </div>
              
              <div className="stats stats-vertical shadow-lg">
                <div className="stat">
                  <div className="stat-title">Votes Cast</div>
                  <div className="stat-value text-emerald-500">2.5M+</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Organizations</div>
                  <div className="stat-value text-blue-500">850+</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Countries</div>
                  <div className="stat-value text-purple-500">45+</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-4 text-sm text-emerald-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Platform operational worldwide
              </div>
            </div>
          </div>
          
          {/* Hero Text */}
          <div className="max-w-2xl text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
              Secure, Modern & <span className="text-gradient">Transparent</span> Voting for Organizations
            </h1>
            <p className="text-lg opacity-80 mb-8">
              SafeVote provides organisations with a cutting-edge voting platform that ensures complete anonymity, full auditability, and instant certified results. Built for schools, NGOs, corporations, and community groups.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-8">
              <Link href="/register" className="btn btn-primary btn-lg gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Register Organization
              </Link>
              <Link href="/organisation/login" className="btn btn-outline btn-lg gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Organisation Login
              </Link>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <div className="badge badge-lg badge-outline gap-2 py-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                End-to-End Encrypted
              </div>
              <div className="badge badge-lg badge-outline gap-2 py-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Audit-Ready
              </div>
              <div className="badge badge-lg badge-outline gap-2 py-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Mobile-First
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-base-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="stats stats-vertical lg:stats-horizontal shadow-xl w-full">
            <div className="stat">
              <div className="stat-title">Uptime Guarantee</div>
              <div className="stat-value text-emerald-500">99.9%</div>
            </div>
            <div className="stat">
              <div className="stat-title">Encryption</div>
              <div className="stat-value text-blue-500">256-bit</div>
            </div>
            <div className="stat">
              <div className="stat-title">Results Delivery</div>
              <div className="stat-value text-purple-500">&lt;3s</div>
            </div>
            <div className="stat">
              <div className="stat-title">Audit Trail</div>
              <div className="stat-value text-amber-500">100%</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-base-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Why Choose SafeVote?</h2>
            <p className="opacity-70 max-w-2xl mx-auto">
              A platform engineered to be secure, transparent, and effortless for administrators and voters alike.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card shadow-xl card-hover">
              <div className="card-body">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="card-title">Secret Ballot & Privacy</h3>
                <p className="opacity-70">
                  Voter choices are cryptographically encrypted and anonymized. Administrators cannot link ballots to identities.
                </p>
              </div>
            </div>

            <div className="card shadow-xl card-hover">
              <div className="card-body">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="card-title">Instant, Verifiable Results</h3>
                <p className="opacity-70">
                  Results are computed and certified the moment polls close, complete with tamper-evident audit trails.
                </p>
              </div>
            </div>

            <div className="card shadow-xl card-hover">
              <div className="card-body">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="card-title">Mobile-Friendly Voting</h3>
                <p className="opacity-70">
                  Voters can participate seamlessly from any smartphone, tablet, or desktop browser.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 bg-base-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">How It Works</h2>
          </div>
          
          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">1</div>
              <div className="card shadow-lg flex-1">
                <div className="card-body">
                  <h4 className="font-bold text-lg">Register Your Organization</h4>
                  <p className="opacity-70">Complete a brief registration form. We verify and approve eligible organisations within 24 hours.</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">2</div>
              <div className="card shadow-lg flex-1">
                <div className="card-body">
                  <h4 className="font-bold text-lg">Configure Your Election</h4>
                  <p className="opacity-70">Create positions, add candidates with photos and bios, and upload your voter list.</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">3</div>
              <div className="card shadow-lg flex-1">
                <div className="card-body">
                  <h4 className="font-bold text-lg">Launch & Certify Results</h4>
                  <p className="opacity-70">Open polls with one click. Certified, tamper-evident results are generated instantly.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to Modernize Your Elections?</h2>
          <p className="text-white/80 mb-8 text-lg">
            Join hundreds of organizations already using SafeVote for secure, transparent elections.
          </p>
          <Link href="/register" className="btn btn-lg bg-white text-emerald-600 hover:bg-gray-100 gap-2">
            Start Free Trial
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-base-100">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-4">
            <div className="collapse collapse-plus shadow-lg">
              <input type="radio" name="faq-accordion" defaultChecked />
              <div className="collapse-title text-lg font-medium">Is voting truly anonymous?</div>
              <div className="collapse-content">
                <p className="opacity-70">Yes — all votes are encrypted using industry-standard cryptography and stored in a way that makes it mathematically impossible to link votes back to voter identities.</p>
              </div>
            </div>
            
            <div className="collapse collapse-plus shadow-lg">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg font-medium">Can I audit the election results?</div>
              <div className="collapse-content">
                <p className="opacity-70">Absolutely. Every election produces tamper-evident logs, cryptographic checksums, and detailed audit trails so authorized auditors can independently verify all results.</p>
              </div>
            </div>
            
            <div className="collapse collapse-plus shadow-lg">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg font-medium">What types of organizations can use SafeVote?</div>
              <div className="collapse-content">
                <p className="opacity-70">SafeVote is designed for schools, universities, NGOs, corporations, unions, associations, and any community group that needs secure, professional elections.</p>
              </div>
            </div>
            
            <div className="collapse collapse-plus shadow-lg">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg font-medium">How quickly can we set up an election?</div>
              <div className="collapse-content">
                <p className="opacity-70">Most organizations can set up their first election within minutes of account approval. Our intuitive dashboard guides you through every step.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-base-200">
        <aside>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold">SafeVote</span>
          </div>
          <p className="opacity-70">© {new Date().getFullYear()} SafeVote — Secure Voting for Organisations</p>
        </aside>
        <nav>
          <div className="grid grid-flow-col gap-6">
            <Link href="/register" className="link link-hover">Register Organization</Link>
            <Link href="/vote/login" className="link link-hover">Voter Login</Link>
            <Link href="/organisation/login" className="link link-hover">Organisation Login</Link>
            <Link href="/team" className="link link-hover">Our Team</Link>
          </div>
        </nav>
      </footer>
    </div>
  );
}
