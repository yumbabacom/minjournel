import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 z-50">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2 text-2xl font-bold text-slate-800">
              <span className="text-3xl">📊</span>
              <span>Journel</span>
            </Link>
            <ul className="hidden md:flex items-center space-x-8">
              <li><Link href="/" className="text-slate-600 hover:text-amber-600 transition-colors font-medium">Home</Link></li>
              <li><Link href="#features" className="text-slate-600 hover:text-amber-600 transition-colors font-medium">Features</Link></li>
              <li><Link href="#about" className="text-slate-600 hover:text-amber-600 transition-colors font-medium">About</Link></li>
              <li><Link href="/login" className="text-slate-600 hover:text-amber-600 transition-colors font-medium">Login</Link></li>
              <li>
                <Link href="/signup" className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-3 rounded-lg font-semibold hover:from-slate-900 hover:to-black transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                  Start Free Trial
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-24 pb-20 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full" style={{backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)", backgroundSize: "40px 40px"}}></div>
          </div>
          
          <div className="container mx-auto text-center relative z-10">
            <div className="max-w-4xl mx-auto">
              {/* Trust Badge */}
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-8">
                <span className="text-amber-400 mr-2">✨</span>
                <span className="text-sm font-medium">Trusted by 10,000+ Professional Traders</span>
              </div>
              
              {/* Main Heading */}
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                Master Your Trading Journey with 
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent"> Data-Driven Insights</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Transform your trading performance with our comprehensive journaling platform. Track, analyze, and optimize every trade to unlock consistent profitability.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                <Link href="/signup" className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-amber-600 hover:to-orange-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center space-x-2">
                  <span>Start Free Trial</span>
                  <span>→</span>
                </Link>
                <Link href="#demo" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all duration-300 flex items-center space-x-2">
                  <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm">▶</span>
                  <span>Watch Demo</span>
                </Link>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-amber-400 mb-2">95%</div>
                  <div className="text-slate-400">Accuracy Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-amber-400 mb-2">$2.4M+</div>
                  <div className="text-slate-400">Trades Tracked</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-amber-400 mb-2">24/7</div>
                  <div className="text-slate-400">Support</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 bg-white">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">Everything You Need to Excel</h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">Comprehensive tools designed specifically for serious traders</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Feature 1 */}
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  📝
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4">Smart Trade Logging</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">Automatically capture trade details with our intelligent logging system. Screenshot integration, P&L tracking, and emotional state recording.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Auto-sync</span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Screenshots</span>
                </div>
              </div>
              
              {/* Feature 2 - Featured */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-2xl border-2 border-amber-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  📊
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4">Advanced Analytics</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">Powerful insights dashboard with win/loss ratios, profitability by strategy, risk metrics, and performance trends over time.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">Real-time</span>
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">AI-powered</span>
                </div>
              </div>
              
              {/* Feature 3 */}
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  🎯
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4">Strategy Optimization</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">Identify your most profitable setups and refine your approach. Pattern recognition and performance backtesting included.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Backtesting</span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Patterns</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 px-4 bg-slate-50">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">Trusted by Professional Traders</h2>
              <p className="text-xl text-slate-600">See what our community is saying</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Testimonial 1 */}
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-amber-500">
                <p className="text-slate-700 text-lg italic mb-6 leading-relaxed">
                  "Journel completely transformed my trading. The insights helped me identify my weaknesses and I've improved my win rate by 40%."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-xl mr-4">
                    👨‍💼
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">Marcus Chen</div>
                    <div className="text-slate-600 text-sm">Day Trader</div>
                  </div>
                </div>
              </div>
              
              {/* Testimonial 2 */}
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-amber-500">
                <p className="text-slate-700 text-lg italic mb-6 leading-relaxed">
                  "The analytics dashboard is incredible. I can see exactly which strategies work and which don't. Worth every penny."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center text-xl mr-4">
                    👩‍💼
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">Sarah Johnson</div>
                    <div className="text-slate-600 text-sm">Swing Trader</div>
                  </div>
                </div>
              </div>
              
              {/* Testimonial 3 */}
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-amber-500">
                <p className="text-slate-700 text-lg italic mb-6 leading-relaxed">
                  "Finally, a journal that understands traders. The emotional tracking feature helped me control my FOMO and revenge trading."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-xl mr-4">
                    👨‍💻
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">Alex Rodriguez</div>
                    <div className="text-slate-600 text-sm">Options Trader</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 px-4 bg-white">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">Built by Traders, for Traders</h2>
                <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                  Our founding team consists of professional traders who understand the importance of meticulous record-keeping and honest self-assessment in achieving trading success.
                </p>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  We've combined years of trading experience with cutting-edge technology to create the most comprehensive trading journal available today.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-green-500 text-xl">✅</span>
                    <span className="text-slate-700 font-medium">Bank-level security and encryption</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-green-500 text-xl">✅</span>
                    <span className="text-slate-700 font-medium">24/7 customer support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-green-500 text-xl">✅</span>
                    <span className="text-slate-700 font-medium">Regular feature updates</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 rounded-2xl shadow-xl max-w-sm w-full">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-2">📈</span>
                    <span className="font-semibold text-slate-800">Your Progress</span>
                  </div>
                  <div className="bg-slate-200 rounded-full h-3 mb-4 overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 h-full rounded-full transition-all duration-1000 ease-out" style={{width: '75%'}}></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Win Rate: 75%</span>
                    <span className="text-green-600 font-semibold">+$12,450</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
          <div className="container mx-auto text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Transform Your Trading?</h2>
              <p className="text-xl text-slate-300 mb-10 leading-relaxed">
                Join thousands of traders who have already improved their performance with Journel
              </p>
              <div className="flex flex-col items-center space-y-4">
                <Link href="/signup" className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-12 py-5 rounded-xl font-semibold text-xl hover:from-amber-600 hover:to-orange-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1">
                  Start Your Free Trial
                </Link>
                <p className="text-sm text-slate-400">No credit card required • 14-day free trial</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-2 text-2xl font-bold mb-4">
                <span className="text-3xl">📊</span>
                <span>Journel</span>
              </div>
              <p className="text-slate-400 leading-relaxed">The professional trading journal for serious traders.</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-slate-400 hover:text-amber-400 transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="text-slate-400 hover:text-amber-400 transition-colors">Pricing</Link></li>
                <li><Link href="/demo" className="text-slate-400 hover:text-amber-400 transition-colors">Demo</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-slate-400 hover:text-amber-400 transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="text-slate-400 hover:text-amber-400 transition-colors">Contact Us</Link></li>
                <li><Link href="/api" className="text-slate-400 hover:text-amber-400 transition-colors">API Docs</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-slate-400 hover:text-amber-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-slate-400 hover:text-amber-400 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 mb-4 md:mb-0">© {new Date().getFullYear()} Journel. All rights reserved.</p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-amber-600 transition-colors">🐦</a>
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-amber-600 transition-colors">💼</a>
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-amber-600 transition-colors">💬</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 