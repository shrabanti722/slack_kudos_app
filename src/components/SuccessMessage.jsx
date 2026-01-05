export default function SuccessMessage({ onReset }) {
  return (
    <div className="gradient-primary text-white p-16 rounded-2xl mt-10 text-center shadow-2xl animate-slide-in relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent animate-spin-slow"></div>
      <div className="relative z-10 max-w-lg mx-auto">
        <div className="text-7xl mb-6 animate-bounce">🎉</div>
        <h3 className="text-4xl font-bold mb-4">Kudos Sent Successfully!</h3>
        <p className="text-lg mb-2 opacity-95 leading-relaxed">
          Your appreciation has been delivered. Thank you for recognizing your teammate!
        </p>
        <p className="text-xl mt-6 mb-8 font-medium">
          Keep spreading positivity! 🌟
        </p>
        <button
          onClick={onReset}
          className="px-8 py-3 bg-white text-primary rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          Send Another Kudos
        </button>
      </div>
    </div>
  );
}

