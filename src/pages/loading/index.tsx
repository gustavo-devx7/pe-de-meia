import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import gov1 from "../../images/gov1.png";
import gov2 from "../../images/gov2.png";


function LoadingPage() {
  const navigate = useNavigate();

  const textos = [
    "Analisando seus dados...",
    "Quase lá...",
    "Verificando as informações...",
    "Somando saldos...",
    "Preparando tudo para você...",
    "Finalizando o processo..."
  ];

  const totalSteps = textos.length;

  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(prev => {
        if (prev === totalSteps - 1) {
          clearInterval(interval);
          navigate("/checkMate");
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate, totalSteps]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="flex-grow flex items-center justify-center">
        <div className="p-6 bg-white rounded-lg shadow-lg flex flex-col items-center w-[90%] mx-auto">
          <h1 className="text-2xl font-bold mb-4">Carregando...</h1>

          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mt-5"></div>

          <p className="mt-6 text-gray-600 transition-opacity duration-300">
            {textos[step]}
          </p>

          {/* Barra de progresso */}
          <div className="w-full bg-gray-200 h-1 mt-6 rounded">
            <div
              className="h-1 bg-blue-500 rounded transition-all duration-500"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <footer className="mt-auto flex justify-center gap-4 py-6">
        <img src={gov1} alt="Government Logo 1" className="h-12 mx-4 inline-block bg-[var(--azul-escuro)] p-3 rounded-sm" />
        <img src={gov2} alt="Government Logo 2" className="h-12 mx-4 inline-block bg-[var(--azul-escuro)] p-3 rounded-sm" />
      </footer>
    </div>
  );
}

export default LoadingPage;
