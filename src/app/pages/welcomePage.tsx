import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, PieChart, Zap } from 'lucide-react';
import TopographyBackground from '@/components/ui/TopographyBackground';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#0b000b] text-white">
      {/* Тот самый топографический фон */}
      <TopographyBackground />

      {/* Центральный блок с эффектом стекла */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 w-full max-w-4xl px-6 text-center"
      >
        {/* Логотип */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 relative">
             {/* Здесь можно вставить твой лого-ромб из Figma */}
             <div className="absolute inset-0 bg-[#8b5cf6] blur-2xl opacity-20 animate-pulse"></div>
             <img src="/logo.png" alt="S&F Logo" className="relative z-10 w-full h-full object-contain" />
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
          S&F System & Finance
        </h1>
        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Управляйте своими доходами и расходами с помощью AI-аналитики в минималистичном интерфейсе.
        </p>

        {/* Кнопки действий */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate('/auth')}
            className="h-14 px-8 bg-[#8b5cf6] hover:bg-[#7c3aed] text-lg rounded-2xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)]"
          >
            Начать работу <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/auth')}
            className="h-14 px-8 bg-white/5 backdrop-blur-xl border-white/10 text-lg rounded-2xl hover:bg-white/10"
          >
            Уже есть аккаунт
          </Button>
        </div>

        {/* Фичи (карточки Liquid Glass) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left">
          {[
            { icon: <ShieldCheck className="text-emerald-400" />, title: "Безопасность", desc: "2FA верификация и зашифрованные данные." },
            { icon: <PieChart className="text-purple-400" />, title: "Аналитика", desc: "Умные чарты и графики ваших трат." },
            { icon: <Zap className="text-amber-400" />, title: "AI Советы", desc: "Рекомендации по экономии от GPT-3.5." }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 * (i + 1) }}
              className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-2xl"
            >
              <div className="mb-4 p-3 w-fit rounded-xl bg-white/5">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Футер */}
      <footer className="absolute bottom-8 text-gray-600 text-sm">
        © 2026 S&F System. Все права защищены.
      </footer>
    </div>
  );
};

export default WelcomePage;