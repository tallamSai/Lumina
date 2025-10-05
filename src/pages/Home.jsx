import { Link } from 'react-router-dom';
import { Video, BarChart3, TrendingUp, Zap, ArrowRight, Star, Users, Award, Target, Brain, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import LiquidEther from './LiquidEther';
import BlurText from "./BlurText";
import ScrollVelocity from "./ScrollVelocity";
import ElectricBorder from "./ElectricBorder";
import ScrollReveal from "./ScrollReveal";
import LogoLoop from './LogoLoop';
import {
  SiReact,
  SiNodedotjs,
  SiFirebase,
  SiCloudinary,
  SiTensorflow,
  SiOpenai,
  SiMediapipe
} from 'react-icons/si';
import FallingText from './FallingText';

const techLogos = [
  { node: <SiReact />, title: "React", href: "https://reactjs.org" },
  { node: <SiNodedotjs />, title: "Node.js", href: "https://nodejs.org" },
  { node: <SiFirebase />, title: "Firebase", href: "https://firebase.google.com" },
  { node: <SiCloudinary />, title: "Cloudinary", href: "https://cloudinary.com" },
  { node: <SiTensorflow />, title: "TensorFlow", href: "https://www.tensorflow.org" },
  { node: <SiMediapipe />, title: "MediaPipe", href: "https://mediapipe.dev" },
  { node: <SiOpenai />, title: "OpenAI", href: "https://openai.com" },
];



export default function Home() {
  const handleAnimationComplete = () => {
    console.log('Animation completed!');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="absolute inset-0 bg-white"></div>

      <div className="relative z-20">
        <Navbar />
      </div>

      {/* Full screen LiquidEther background with bluish colors */}
      <div className="fixed inset-0 w-full h-screen z-0 pointer-events-auto">
        <LiquidEther
          colors={['#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']}
          mouseForce={20}
          cursorSize={100}
          isViscous={true}
          viscous={25}
          iterationsViscous={16}
          iterationsPoisson={16}
          resolution={0.5}
          isBounce={false}
          autoDemo={false}
          autoSpeed={0.2}
          autoIntensity={1.2}
          takeoverDuration={0.1}
          autoResumeDelay={1500}
          autoRampDuration={0.3}
        />
      </div>

      <main className="relative max-w-7xl mx-auto px-6 pt-40 pb-20 z-10 pointer-events-none">
        <div className="text-center mb-16 mt-25">
          <div className="flex justify-center">
            <BlurText
              text="Lumina"
              delay={150}
              animateBy="words"
              direction="top"
              onAnimationComplete={handleAnimationComplete}
              className="text-7xl font-extrabold mb-6 leading-tight drop-shadow-xl tracking-tight"
              spanClassName="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-transparent bg-clip-text"
            />
          </div>
          <div className="flex justify-center">
            <BlurText
              text="Transform your communication skills with AI-powered insights and real-time feedback"
              delay={80}
              stepDuration={0.45}
              animateBy="words"
              direction="top"
              className="text-2xl font-light max-w-3xl mx-auto mb-10 leading-relaxed drop-shadow-md tracking-wide"
              spanClassName="text-gray-700 bg-clip-text"
            />
          </div>
        </div>

        {/* Full-width scrolling marquee section */}
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen pointer-events-none mt-40 mb-1 overflow-hidden">
          <ScrollVelocity
            texts={["Confident Delivery", "Clear Communication", "Impactful Presence"]}
            velocity={50}
            numCopies={8}
            className="px-6 mt-5 text-blue-500 overflow-hidden"
            parallaxClassName="py-1"
            scrollerClassName="text-xl md:text-3xl lg:text-4xl"
          />
        </div>

        {/* Electric Border Cards */}
        <div className="grid md:grid-cols-3 gap-8 mt-50">
          <ElectricBorder
            color="#60a5fa"
            speed={1}
            chaos={0.6}
            thickness={2}
            style={{ borderRadius: 24 }}
          >
            <div className="group relative bg-gradient-to-br from-white/90 via-white/70 to-white/50 backdrop-blur-xl border border-white/20 rounded-3xl p-10 hover:from-white/95 hover:via-white/80 hover:to-white/60 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-md">
                  <Video className="text-blue-600" size={32} />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Video Analysis</h3>
                <p className="text-gray-600 text-lg leading-relaxed font-light">
                  Record or upload your presentation. Our AI analyzes every aspect of your delivery in real-time.
                </p>
              </div>
            </div>
          </ElectricBorder>

          <ElectricBorder
            color="#22d3ee"
            speed={1.2}
            chaos={0.7}
            thickness={2}
            style={{ borderRadius: 24 }}
          >
            <div className="group relative bg-gradient-to-br from-white/90 via-white/70 to-white/50 backdrop-blur-xl border border-white/20 rounded-3xl p-10 hover:from-white/95 hover:via-white/80 hover:to-white/60 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/30 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="bg-gradient-to-br from-cyan-100 to-cyan-200 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-md">
                  <BarChart3 className="text-cyan-600" size={32} />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Detailed Insights</h3>
                <p className="text-gray-600 text-lg leading-relaxed font-light">
                  Get comprehensive scores on voice clarity, body language, pacing, and confidence levels.
                </p>
              </div>
            </div>
          </ElectricBorder>

          <ElectricBorder
            color="#60a5fa"
            speed={0.9}
            chaos={0.5}
            thickness={2}
            style={{ borderRadius: 24 }}
          >
            <div className="group relative bg-gradient-to-br from-white/90 via-white/70 to-white/50 backdrop-blur-xl border border-white/20 rounded-3xl p-10 hover:from-white/95 hover:via-white/80 hover:to-white/60 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-md">
                  <TrendingUp className="text-blue-600" size={32} />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Track Progress</h3>
                <p className="text-gray-600 text-lg leading-relaxed font-light">
                  Monitor your improvement over time with detailed reports and actionable recommendations.
                </p>
              </div>
            </div>
          </ElectricBorder>
        </div>

        {/* Scroll Reveal Section - Why Choose Lumina */}
        <section className="mt-40 mb-32">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal
              baseOpacity={0.1}
              enableBlur={true}
              baseRotation={3}
              blurStrength={8}
              containerClassName="mb-20"
              textClassName="text-gray-800 text-center"
            >
              Master the art of communication through intelligent feedback that understands not just what you say, but how you say it.
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-12 mt-20">
              {/* Left Column - Benefits */}
              <div className="space-y-8">
                <div className="group bg-gradient-to-br from-white/80 via-white/60 to-white/40 backdrop-blur-2xl border border-white/30 rounded-3xl p-8 hover:border-blue-300/50 transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/20">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                      <Zap className="text-white" size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Easy to Use</h3>
                      <p className="text-gray-600 text-base leading-relaxed">Simple interface that anyone can master in minutes. No technical expertise needed.</p>
                    </div>
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-white/80 via-white/60 to-white/40 backdrop-blur-2xl border border-white/30 rounded-3xl p-8 hover:border-cyan-300/50 transition-all duration-500 hover:shadow-xl hover:shadow-cyan-500/20">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-cyan-500 to-blue-500 p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="text-white" size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Enhance Communication</h3>
                      <p className="text-gray-600 text-base leading-relaxed">Build stronger connections through clearer, more confident communication.</p>
                    </div>
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-white/80 via-white/60 to-white/40 backdrop-blur-2xl border border-white/30 rounded-3xl p-8 hover:border-blue-300/50 transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/20">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                      <Star className="text-white" size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Boost Confidence</h3>
                      <p className="text-gray-600 text-base leading-relaxed">Practice in a safe space and gain the confidence to speak anywhere.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Features */}
              <div className="space-y-6">
                <ScrollReveal
                  baseOpacity={0.2}
                  enableBlur={true}
                  baseRotation={2}
                  blurStrength={6}
                  textClassName="text-gray-700 leading-relaxed"
                >
                  Every great speaker started somewhere. Lumina helps you identify your unique strengths and areas for growth through advanced AI analysis.
                </ScrollReveal>

                <div className="space-y-4 mt-8">
                  <div className="flex items-start gap-3 group">
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-2 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <Brain className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">AI-Powered Analysis</h4>
                      <p className="text-gray-600">Real-time feedback on tone, pace, and body language</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 group">
                    <div className="bg-gradient-to-br from-cyan-100 to-cyan-200 p-2 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <Sparkles className="text-cyan-600" size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">Personalized Coaching</h4>
                      <p className="text-gray-600">Custom recommendations based on your goals</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 group">
                    <div className="bg-gradient-to-br from-blue-100 to-purple-200 p-2 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <Zap className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">Instant Results</h4>
                      <p className="text-gray-600">Get actionable insights within seconds</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section with Scroll Reveal */}
        <section className="mt-32 mb-20">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 rounded-[3rem] blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-white/70 via-white/50 to-white/30 backdrop-blur-2xl border border-white/40 rounded-[3rem] p-16 text-center">
              <ScrollReveal
                baseOpacity={0.1}
                enableBlur={true}
                baseRotation={2}
                blurStrength={6}
                textClassName="text-gray-800 mb-8"
              >
                Ready to transform your presentation skills? Start your journey with Lumina today.
              </ScrollReveal>

              <div className="flex justify-center gap-4 mt-12 pointer-events-auto">
                <Link
                  to="/analyze"
                  className="group relative px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 hover:scale-105 flex items-center gap-2"
                >
                  Start Analyzing
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/dashboard"
                  className="px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 text-gray-800 bg-white/60 backdrop-blur-xl border border-white/60 hover:bg-white/80 hover:border-blue-300 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  View Dashboard
                </Link>
              </div>

              <div className="flex justify-center gap-8 mt-12 text-sm text-gray-600">


              </div>
            </div>
          </div>
        </section>
      </main>
      <LogoLoop
        logos={techLogos}
        speed={100}
        direction="left"
        logoHeight={50}
        gap={30}
        pauseOnHover
        scaleOnHover
        fadeOut
        fadeOutColor="#ffffff"
        ariaLabel="Technology stack"
      />







      <footer className="relative mt-32 py-10 border-t border-gray-200 text-center text-gray-600 pointer-events-none">
        <p className="text-lg font-light tracking-wide">&copy; 2025 Lumina AI. Elevate your presentation skills.</p>
      </footer>
    </div>
  );
}