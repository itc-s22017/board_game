const ChristmasBackground: React.FC = () => {
    return (
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-red-700 to-green-800 opacity-20"></div>
        <div className="absolute inset-0 bg-[url('/img/ch-flake-2.png')] animate-fall"></div>
      </div>
    );
  };
  
  export default ChristmasBackground;
  