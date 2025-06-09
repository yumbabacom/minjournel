'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activePricing, setActivePricing] = useState('monthly');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Sticky Navigation */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-white/80 backdrop-blur-2xl border-b border-white/20 shadow-2xl shadow-black/5'
          : 'bg-transparent'
      }`}>
        <nav className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-2xl group-hover:shadow-blue-500/25 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                  T
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full animate-bounce"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                TradingJournal
              </span>
            </Link>

            <div className="flex items-center space-x-8">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-24 px-4 relative overflow-hidden">
          {/* Interactive Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="w-full h-full" style={{
              backgroundImage: `radial-gradient(circle at ${mousePosition.x * 0.1}px ${mousePosition.y * 0.1}px, rgba(59, 130, 246, 0.4) 1px, transparent 0)`,
              backgroundSize: "60px 60px"
            }}></div>
          </div>
          
          <div className="container mx-auto text-center relative z-10">
            <div className="max-w-5xl mx-auto">
              {/* Trust Badge */}
              <div className="inline-flex items-center bg-gradient-to-r from-white/90 to-blue-50/90 backdrop-blur-xl border border-white/30 rounded-full px-8 py-3 mb-12 shadow-2xl shadow-blue-500/10">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-white text-lg">✨</span>
                  </div>
                  <span className="text-gray-700 font-semibold">Trusted by 15,000+ Professional Traders Worldwide</span>
                </div>
              </div>
              
              {/* Main Heading */}
              <h1 className="text-6xl md:text-7xl font-black text-gray-900 mb-8 leading-tight">
                Master Your Trading with 
                <span className="relative inline-block mt-4">
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    AI-Powered Insights
                  </span>
                  <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-full transform scale-x-0 animate-pulse"></div>
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-16 max-w-4xl mx-auto leading-relaxed font-light">
                Transform your trading performance with our revolutionary journaling platform. Track, analyze, and optimize every trade with advanced AI to unlock consistent profitability and financial freedom.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20">
                <Link 
                  href="/signup" 
                  className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white px-12 py-4 rounded-2xl font-bold text-xl hover:shadow-2xl hover:shadow-blue-500/25 hover:-translate-y-1 transition-all duration-500 w-full sm:w-auto"
                >
                  <span className="relative z-10 flex items-center justify-center space-x-3">
                  <span>Start Free Trial</span>
                    <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </Link>
                
                <Link 
                  href="/demo" 
                  className="group bg-white text-gray-900 px-12 py-4 rounded-2xl font-bold text-xl hover:shadow-2xl hover:shadow-gray-500/25 hover:-translate-y-1 transition-all duration-500 border border-gray-200 w-full sm:w-auto"
                >
                  <span className="flex items-center justify-center space-x-3">
                  <span>Watch Demo</span>
                    <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
                  </span>
                </Link>
              </div>
              
              {/* Stats Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 border border-white/20">
                  <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">98%</div>
                  <div className="text-gray-600 font-semibold text-lg">Success Rate</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{width: '98%'}}></div>
                  </div>
                </div>
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 border border-white/20">
                  <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">$5.2M+</div>
                  <div className="text-gray-600 font-semibold text-lg">Trades Analyzed</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{width: '87%'}}></div>
                  </div>
                </div>
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 border border-white/20">
                  <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-3">24/7</div>
                  <div className="text-gray-600 font-semibold text-lg">AI Support</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full" style={{width: '100%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trading Tools Section */}
        <section className="py-24 px-4 bg-gradient-to-br from-white to-blue-50 relative overflow-hidden">
          <div className="container mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
                Advanced Trading 
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Tools</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">Powerful tools designed to enhance your trading performance</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
              {/* Trading Tools Card 1 */}
              <div className="group bg-white/70 backdrop-blur-xl p-10 rounded-3xl border border-white/30 hover:shadow-2xl hover:-translate-y-4 transition-all duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl">
                    📊
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Real-time Analytics</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">Get instant insights into your trading performance with advanced analytics and real-time data visualization.</p>
                  <div className="flex flex-wrap gap-3">
                    <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">Live Data</span>
                    <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">Charts</span>
                    <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">Metrics</span>
                  </div>
                </div>
              </div>
              
              {/* Trading Tools Card 2 */}
              <div className="group bg-white/70 backdrop-blur-xl p-10 rounded-3xl border border-white/30 hover:shadow-2xl hover:-translate-y-4 transition-all duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-3xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl">
                    🤖
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">AI Trading Assistant</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">Your personal AI trading assistant that helps you make better decisions and optimize your trading strategy.</p>
                  <div className="flex flex-wrap gap-3">
                    <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold">AI Insights</span>
                    <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold">Strategy</span>
                    <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold">Analysis</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-4 relative overflow-hidden">
          <div className="container mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
                Everything You Need to 
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Dominate</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">Comprehensive AI-powered tools designed specifically for ambitious traders who demand excellence</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {/* Feature 1 */}
              <div className="group bg-white/70 backdrop-blur-xl p-10 rounded-3xl border border-white/30 hover:shadow-2xl hover:-translate-y-4 transition-all duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl">
                    📊
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Smart Trade Logging</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">Revolutionary AI-powered logging system that captures every detail automatically. Screenshot integration, real-time P&L tracking, and advanced emotional state analysis.</p>
                  <div className="flex flex-wrap gap-3">
                    <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">Auto-sync</span>
                    <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">AI Screenshots</span>
                    <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">Real-time</span>
                </div>
                </div>
              </div>
              
              {/* Feature 2 */}
              <div className="group bg-white/70 backdrop-blur-xl p-10 rounded-3xl border border-white/30 hover:shadow-2xl hover:-translate-y-4 transition-all duration-500 relative overflow-hidden">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  🔥 Most Popular
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 mt-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-3xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl">
                    🤖
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">AI-Powered Analytics</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">Advanced machine learning algorithms analyze your trading patterns, predict optimal entry/exit points, and provide personalized recommendations for maximum profitability.</p>
                  <div className="flex flex-wrap gap-3">
                    <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold">Machine Learning</span>
                    <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold">Predictive</span>
                    <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold">Real-time AI</span>
                </div>
                </div>
              </div>
              
              {/* Feature 3 */}
              <div className="group bg-white/70 backdrop-blur-xl p-10 rounded-3xl border border-white/30 hover:shadow-2xl hover:-translate-y-4 transition-all duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl">
                    📈
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Performance Tracking</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">Comprehensive performance metrics and analytics to track your progress, identify patterns, and optimize your trading strategy for consistent results.</p>
                  <div className="flex flex-wrap gap-3">
                    <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">Analytics</span>
                    <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">Reports</span>
                    <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">Insights</span>
                </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 px-4 bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
          <div className="container mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
                What Our Traders 
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Say</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">Join thousands of successful traders who have transformed their trading journey</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {/* Testimonial 1 */}
              <div className="group bg-white/70 backdrop-blur-xl p-10 rounded-3xl border border-white/30 hover:shadow-2xl hover:-translate-y-4 transition-all duration-500 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <div className="flex text-amber-400 text-lg">★★★★★</div>
                    <span className="ml-2 text-gray-600 font-semibold">5.0</span>
                  </div>
                  <p className="text-gray-700 text-lg italic mb-8 leading-relaxed font-light">
                    "This platform completely revolutionized my trading approach. The AI insights helped me identify my blind spots and I've improved my win rate by 60%."
                </p>
                <div className="flex items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-2xl mr-4 shadow-lg">
                    👨‍💼
                  </div>
                  <div>
                      <div className="font-bold text-gray-900 text-lg">Marcus Chen</div>
                      <div className="text-gray-600">Senior Day Trader • $2M+ Portfolio</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Testimonial 2 */}
              <div className="group bg-white/70 backdrop-blur-xl p-10 rounded-3xl border border-white/30 hover:shadow-2xl hover:-translate-y-4 transition-all duration-500 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <div className="flex text-amber-400 text-lg">★★★★★</div>
                    <span className="ml-2 text-gray-600 font-semibold">5.0</span>
                  </div>
                  <p className="text-gray-700 text-lg italic mb-8 leading-relaxed font-light">
                    "The analytics dashboard is mind-blowing. I can see exactly which strategies work in different market conditions. This tool paid for itself in the first week!"
                </p>
                <div className="flex items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center text-2xl mr-4 shadow-lg">
                    👩‍💼
                  </div>
                  <div>
                      <div className="font-bold text-gray-900 text-lg">Sarah Johnson</div>
                      <div className="text-gray-600">Professional Swing Trader • 8 Years</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Testimonial 3 */}
              <div className="group bg-white/70 backdrop-blur-xl p-10 rounded-3xl border border-white/30 hover:shadow-2xl hover:-translate-y-4 transition-all duration-500 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <div className="flex text-amber-400 text-lg">★★★★★</div>
                    <span className="ml-2 text-gray-600 font-semibold">5.0</span>
                  </div>
                  <p className="text-gray-700 text-lg italic mb-8 leading-relaxed font-light">
                    "Finally, a journal that truly understands trader psychology. The emotional tracking and AI coaching helped me eliminate FOMO and revenge trading completely."
                </p>
                <div className="flex items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center text-2xl mr-4 shadow-lg">
                    👨‍💻
                  </div>
                  <div>
                      <div className="font-bold text-gray-900 text-lg">Alex Rodriguez</div>
                      <div className="text-gray-600">Options Specialist • Prop Trader</div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
          </div>
          
          <div className="container mx-auto relative z-10">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-5xl md:text-7xl font-black mb-8">
                Ready to 
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent"> Transform</span> 
                <br />Your Trading?
              </h2>
              <p className="text-xl md:text-2xl text-gray-300 mb-16 leading-relaxed font-light max-w-3xl mx-auto">
                Join thousands of elite traders who have already revolutionized their performance with our AI-powered platform. Start your journey to consistent profitability today.
              </p>
              
              <div className="flex flex-col items-center space-y-8">
                <Link href="/signup" className="group relative bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white px-16 py-6 rounded-2xl font-bold text-2xl hover:from-amber-600 hover:via-orange-600 hover:to-red-600 transition-all duration-500 shadow-2xl hover:shadow-amber-500/25 hover:-translate-y-2 hover:scale-105">
                  <span className="relative z-10 flex items-center space-x-4">
                    <span>Start Your Free Trial</span>
                    <span className="group-hover:translate-x-2 transition-transform duration-300 text-3xl">🚀</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </Link>
                
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl px-8 py-4 border border-white/20">
                  <p className="text-gray-300 font-semibold">✨ No credit card required • 14-day free trial • Cancel anytime</p>
                </div>
                
                {/* Money back guarantee */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">✓</div>
                  <span className="text-green-300 font-semibold">30-Day Money-Back Guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-blue-900/50 to-purple-900/50"></div>
        
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-3 text-2xl font-bold mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl">
                  T
                </div>
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">TradingJournal</span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">The world's most advanced AI-powered trading journal for professional traders and ambitious individuals.</p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                <a href="#" className="w-12 h-12 bg-gray-800 hover:bg-blue-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                  <span className="text-lg">𝕏</span>
                </a>
                <a href="#" className="w-12 h-12 bg-gray-800 hover:bg-blue-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                  <span className="text-lg">💼</span>
                </a>
                <a href="#" className="w-12 h-12 bg-gray-800 hover:bg-purple-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                  <span className="text-lg">💬</span>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-6">Product</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Demo</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Updates</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-6">Company</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-6">Resources</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm mb-4 md:mb-0">© 2024 TradingJournal. All rights reserved.</p>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 