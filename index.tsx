
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import {
  Mic,
  Trash2,
  FileText,
  Edit3,
  ArrowLeft,
  User,
  CheckCircle2,
  ShieldCheck,
  History as HistoryIcon,
  Activity,
  Search,
  PlusCircle,
  Pencil,
  Home,
  Download
} from 'lucide-react';

// --- Constants & Types ---
const PRIMARY_YELLOW = '#FFEB3B';
const ROYAL_BLUE = '#2196F3';
const DIAGNOSIS_CATEGORIES = ["Normal", "Bronquite Nível 1", "Asma", "Bronquite Aguda/Pneumonia"];

interface PatientData {
  name: string;
  age: number;
  location: string;
  gender: string;
  phoneContact: boolean;
  phoneNumber?: string;
}

interface RecordEntry extends PatientData {
  id: string;
  timestamp: number;
  diagnosis: string;
  confidence: number[]; // [Normal, B1, Asma, B2]
}

type Screen = 'SPLASH' | 'CONSENT' | 'REGISTRATION' | 'RECORDER' | 'RESULT' | 'HISTORY';

// --- Utils ---
const formatTimestamp = (ts: number) => new Date(ts).toLocaleString('pt-PT');

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- App Component ---
const TuscaApp = () => {
  const [screen, setScreen] = useState<Screen>('SPLASH');
  const [patient, setPatient] = useState<PatientData>({
    name: '',
    age: 0,
    location: '',
    gender: 'Masculino',
    phoneContact: false,
    phoneNumber: ''
  });
  const [history, setHistory] = useState<RecordEntry[]>([]);
  const [currentResult, setCurrentResult] = useState<RecordEntry | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Load History
  useEffect(() => {
    const saved = localStorage.getItem('tusca_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (entry: RecordEntry) => {
    // Check if entry exists to update it, otherwise add new
    const exists = history.some(h => h.id === entry.id);
    let newHistory;

    if (exists) {
      newHistory = history.map(h => h.id === entry.id ? entry : h);
    } else {
      newHistory = [entry, ...history];
    }

    setHistory(newHistory);
    localStorage.setItem('tusca_history', JSON.stringify(newHistory));
    setEditingId(null); // Clear editing state after saving
  };

  const deleteFromHistory = (id: string) => {
    if (window.confirm("Tem certeza que deseja eliminar este registo?")) {
      const newHistory = history.filter(h => h.id !== id);
      setHistory(newHistory);
      localStorage.setItem('tusca_history', JSON.stringify(newHistory));
    }
  };

  const updateInHistory = (id: string, updatedData: Partial<RecordEntry>) => {
    const newHistory = history.map(item => item.id === id ? { ...item, ...updatedData } : item);
    setHistory(newHistory);
    localStorage.setItem('tusca_history', JSON.stringify(newHistory));
    setEditingId(null);
  };

  const exportHistory = () => {
    if (history.length === 0) {
      alert("Nenhum dado para exportar.");
      return;
    }

    let report = `==================================================\n`;
    report += `       RELATÓRIO DE HISTÓRICO TUSCA\n`;
    report += `==================================================\n`;
    report += `Data de Exportação: ${new Date().toLocaleString('pt-PT')}\n`;
    report += `Total de Registos: ${history.length}\n`;
    report += `--------------------------------------------------\n\n`;

    history.forEach((entry, index) => {
      report += `REGISTO #${index + 1}\n`;
      report += `NOME DO UTENTE: ${entry.name.toUpperCase()}\n`;
      report += `ID DO TESTE  : #${entry.id.substring(0, 8)}\n`;
      report += `DATA/HORA    : ${new Date(entry.timestamp).toLocaleString('pt-PT')}\n`;
      report += `IDADE        : ${entry.age} anos\n`;
      report += `GÉNERO       : ${entry.gender}\n`;
      report += `LOCALIDADE   : ${entry.location}\n`;

      if (entry.phoneContact && entry.phoneNumber) {
        report += `TELEFONE     : ${entry.phoneNumber}\n`;
      }

      report += `\nRESULTADO DA ANÁLISE IA:\n`;
      report += `DIAGNÓSTICO  : ${entry.diagnosis.toUpperCase()}\n`;
      report += `CONFIANÇA    : ${Math.max(...entry.confidence)}%\n`;
      report += `--------------------------------------------------\n\n`;
    });

    report += `FIM DO RELATÓRIO - Tecnogia TUSCA AI\n`;

    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TUSCA_Historico_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportSingleRecord = (entry: RecordEntry) => {
    let report = `==================================================\n`;
    report += `       RELATÓRIO DE DIAGNÓSTICO TUSCA\n`;
    report += `==================================================\n`;
    report += `Data do Teste: ${new Date(entry.timestamp).toLocaleString('pt-PT')}\n`;
    report += `--------------------------------------------------\n\n`;

    report += `NOME DO UTENTE: ${entry.name.toUpperCase()}\n`;
    report += `ID DO TESTE  : #${entry.id.substring(0, 8)}\n`;
    report += `IDADE        : ${entry.age} anos\n`;
    report += `GÉNERO       : ${entry.gender}\n`;
    report += `LOCALIDADE   : ${entry.location}\n`;

    if (entry.phoneContact && entry.phoneNumber) {
      report += `TELEFONE     : ${entry.phoneNumber}\n`;
    }

    report += `\nRESULTADO DA ANÁLISE IA:\n`;
    report += `DIAGNÓSTICO  : ${entry.diagnosis.toUpperCase()}\n`;
    report += `CONFIANÇA    : ${Math.max(...entry.confidence)}%\n`;
    report += `--------------------------------------------------\n\n`;
    report += `FIM DO RELATÓRIO - Tecnogia TUSCA AI\n`;

    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TUSCA_Relatorio_${entry.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- Audio Recording Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(audioBlob));
        analyzeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Auto-stop after 4 seconds (per requirement "3 seconds of audio", giving buffer)
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') stopRecording();
      }, 4000);

    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      alert("Permissão de microfone negada.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // --- AI Analysis Logic ---
  const analyzeAudio = async (blob: Blob) => {
    setIsAnalyzing(true);
    try {
      const apiKey = process.env.API_KEY;

      if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
        // --- DEMO MODE: Simulated Result ---
        console.warn("API Key não encontrada. Usando modo de demonstração.");
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simula latência

        const mockResults = [
          { "Normal": 85, "Bronquite Nível 1": 10, "Asma": 3, "Bronquite Aguda/Pneumonia": 2 },
          { "Normal": 15, "Bronquite Nível 1": 70, "Asma": 10, "Bronquite Aguda/Pneumonia": 5 },
          { "Normal": 5, "Bronquite Nível 1": 15, "Asma": 75, "Bronquite Aguda/Pneumonia": 5 }
        ];
        const resultData = mockResults[Math.floor(Math.random() * mockResults.length)];

        const confidences = [
          resultData["Normal"],
          resultData["Bronquite Nível 1"],
          resultData["Asma"],
          resultData["Bronquite Aguda/Pneumonia"]
        ];

        const maxIdx = confidences.indexOf(Math.max(...confidences));
        const entry: RecordEntry = {
          ...patient,
          id: editingId || crypto.randomUUID(), // Reuse ID if editing, else new
          timestamp: Date.now(),
          diagnosis: DIAGNOSIS_CATEGORIES[maxIdx],
          confidence: confidences
        };

        setCurrentResult(entry);
        saveToHistory(entry);
        setScreen('RESULT');
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const base64Audio = await blobToBase64(blob);

      const prompt = `Analise este áudio de tosse para fins de triagem respiratória. 
      Classifique a probabilidade (0-100) para as seguintes categorias: Normal, Bronquite Nível 1, Asma, Bronquite Aguda/Pneumonia.
      Retorne APENAS um JSON válido no seguinte formato:
      {"Normal": number, "Bronquite Nível 1": number, "Asma": number, "Bronquite Aguda/Pneumonia": number}`;

      const response = await (ai as any).models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [
          {
            parts: [
              { inlineData: { mimeType: 'audio/webm', data: base64Audio } },
              { text: prompt }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const resultData = JSON.parse(response.text || '{}');

      const confidences = [
        resultData["Normal"] || 0,
        resultData["Bronquite Nível 1"] || 0,
        resultData["Asma"] || 0,
        resultData["Bronquite Aguda/Pneumonia"] || 0
      ];

      const maxIdx = confidences.indexOf(Math.max(...confidences));
      const entry: RecordEntry = {
        ...patient,
        id: editingId || crypto.randomUUID(), // Reuse ID if editing, else new
        timestamp: Date.now(),
        diagnosis: DIAGNOSIS_CATEGORIES[maxIdx],
        confidence: confidences
      };

      setCurrentResult(entry);
      saveToHistory(entry);
      setScreen('RESULT');
    } catch (err: any) {
      console.error("Erro na análise IA:", err);

      if (err.message === "API_KEY_MISSING") {
        alert("Configuração Incompleta: Por favor, insira uma chave de API válida no ficheiro .env.local (GEMINI_API_KEY).");
      } else {
        alert("Erro ao processar áudio: " + (err.message || "Tente novamente."));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- Rendering Helpers ---
  const renderHeader = (title: string, showBack = true) => (
    <div className="bg-royal-blue text-white p-6 flex items-center gap-4 no-print shadow-md">
      {showBack && (
        <button onClick={() => setScreen('SPLASH')} className="p-2 hover:bg-white/10 rounded-full transition">
          <ArrowLeft size={24} />
        </button>
      )}
      <h1 className="text-xl font-bold uppercase tracking-wide">{title}</h1>
    </div>
  );

  // --- Screens ---

  if (screen === 'SPLASH') {
    return (
      <div className="min-h-screen bg-[#FFEB3B] flex flex-col items-center p-6 overflow-y-auto animate-fadeIn relative pb-4">
        {/* Logo Section */}
        <div className="relative mt-4 mb-4">
          <div className="w-36 h-36 bg-white rounded-full flex items-center justify-center shadow-2xl relative overflow-visible">
            {/* The blue diamond behind the plus */}
            <div className="w-24 h-24 bg-royal-blue transform rotate-45 flex items-center justify-center rounded-2xl shadow-lg">
              <div className="transform -rotate-45 text-white">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="8" width="18" height="12" rx="2" />
                  <path d="M15 8h-4V4c0-1.1.9-2 2-2s2 .9 2 2v4z" />
                  <path d="M12 11v6" />
                  <path d="M9 14h6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white px-10 py-3 rounded-[24px] shadow-xl mb-4 border-b-4 border-gray-100">
          <h1 className="text-4xl font-black text-royal-blue tracking-[0.2em] ml-2">TUSCA</h1>
        </div>

        <button className="text-royal-blue font-black text-xl mb-4 uppercase tracking-wide hover:opacity-80 transition-opacity">
          O QUE É TUSCA?
        </button>

        {/* Info Card */}
        <div className="bg-white rounded-[40px] p-8 w-full max-w-md shadow-2xl mb-8 border-t-8 border-royal-blue/10">
          <h2 className="text-royal-blue text-2xl font-black leading-tight mb-2 pr-4">
            TUSCA – Tosse User Sound Cough Analyzer
          </h2>
          <p className="text-gray-400 italic text-sm font-semibold mb-6">
            Analisador de Sons de Tosse do Utilizador
          </p>
          <p className="text-gray-600 font-medium mb-10 leading-relaxed text-sm">
            TUSCA utiliza Inteligência Artificial avançada para analisar padrões de sons de tosse e auxiliar no diagnóstico de doenças respiratórias.
          </p>

          <div className="bg-blue-50/70 rounded-[32px] p-6 space-y-5">
            <h3 className="text-royal-blue font-extrabold text-sm mb-2">Objetivos do Teste:</h3>
            {[
              "Diagnosticar Bronquite",
              "Diagnosticar Pneumonia",
              "Diagnosticar Asma",
              "Diagnosticar Estado Saudável (Tosse Normal)"
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="bg-[#4CAF50] rounded-full p-0.5 shadow-md shrink-0">
                  <CheckCircle2 size={16} className="text-white fill-green-500" />
                </div>
                <span className="text-gray-700 font-bold text-sm tracking-tight">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-center gap-6 w-full max-w-sm mb-6">
          <button
            onClick={() => setScreen('CONSENT')}
            className="flex flex-col items-center gap-3 active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-royal-blue border-b-4 border-gray-100">
              <Activity size={28} />
            </div>
            <span className="text-royal-blue font-black text-[10px] uppercase tracking-wider">Iniciar Tusca</span>
          </button>

          <button
            onClick={() => setScreen('HISTORY')}
            className="flex flex-col items-center gap-3 active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-royal-blue border-b-4 border-gray-100">
              <HistoryIcon size={28} />
            </div>
            <span className="text-royal-blue font-black text-[10px] uppercase tracking-wider">Histórico</span>
          </button>

          <button
            onClick={exportHistory}
            className="flex flex-col items-center gap-3 active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-[#4CAF50] border-b-4 border-gray-100">
              <Download size={28} />
            </div>
            <span className="text-[#4CAF50] font-black text-[10px] uppercase tracking-wider">Download</span>
          </button>
        </div>

        {/* Project Info Footer */}
        <div className="text-center space-y-1 pb-2 mt-auto">
          <p className="text-royal-blue font-black text-[10px] uppercase tracking-widest opacity-80">
            Todos direitos reservados - 2026
          </p>
          <p className="text-royal-blue font-black text-[10px] uppercase tracking-widest opacity-80">
            FACULDADE ISPI CRISTO REI LUBANGO
          </p>
          <div className="flex flex-col">
            <p className="text-gray-400 font-black text-[8px] uppercase tracking-widest">
              Projecto: Software da Tosse
            </p>
            <p className="text-gray-500 font-bold text-[9px] uppercase tracking-widest">
              Emanuel Simão • Albino Bandua • Ronaldo Moisés
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'CONSENT') {
    return (
      <div className="min-h-screen bg-royal-blue p-6 flex flex-col">
        {renderHeader('Acordo de Uso', false)}
        <div className="flex-1 flex items-center justify-center">
          <div className="card-tusca p-8 w-full max-w-md">
            <h2 className="text-royal-blue text-2xl font-bold mb-4">Consentimento Informado</h2>
            <div className="text-gray-600 text-sm space-y-3 mb-8 overflow-y-auto max-h-64 pr-2">
              <p>O TUSCA utiliza inteligência artificial para analisar padrões sonoros de tosse.</p>
              <p>Os dados coletados são armazenados localmente no seu dispositivo para garantir privacidade total.</p>
              <p><strong>Aviso Legal:</strong> Este sistema fornece uma triagem inicial e não substitui o diagnóstico médico profissional, exames laboratoriais ou consulta clínica presencial.</p>
              <p>Ao continuar, você declara estar ciente e concordar com o processamento dos seus dados de áudio.</p>
            </div>

            <div className="flex items-center gap-3 mb-8 group cursor-pointer">
              <input type="checkbox" id="consent" className="w-5 h-5 accent-purple-600 rounded cursor-pointer" defaultChecked />
              <label htmlFor="consent" className="text-sm font-semibold text-gray-700 cursor-pointer">Aceito os termos e condições</label>
            </div>

            <button
              onClick={() => setScreen('REGISTRATION')}
              className="w-full bg-royal-blue text-white py-4 font-bold pill-button shadow-lg"
            >
              CONTINUAR
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'REGISTRATION') {
    return (
      <div className="min-h-screen bg-[#FFEB3B] flex flex-col items-center p-6 overflow-y-auto animate-fadeIn relative pb-24">
        {/* Logo Section */}
        <div className="relative mt-8 mb-6">
          <div className="w-36 h-36 bg-white rounded-full flex items-center justify-center shadow-2xl relative overflow-visible">
            <div className="w-24 h-24 bg-royal-blue transform rotate-45 flex items-center justify-center rounded-2xl shadow-lg">
              <div className="transform -rotate-45 text-white">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="8" width="18" height="12" rx="2" />
                  <path d="M15 8h-4V4c0-1.1.9-2 2-2s2 .9 2 2v4z" />
                  <path d="M12 11v6" />
                  <path d="M9 14h6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white px-12 py-3 rounded-[24px] shadow-xl mb-8 border-b-4 border-gray-100">
          <h1 className="text-4xl font-black text-royal-blue tracking-[0.2em] ml-2">TUSCA</h1>
        </div>

        <h2 className="text-royal-blue font-black text-xl mb-8 uppercase tracking-wide">
          CADASTRO DO UTENTE
        </h2>

        {/* Form Card */}
        <div className="bg-white rounded-[40px] p-8 w-full max-w-md shadow-2xl mb-12 border-t-8 border-royal-blue/10 space-y-8">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nome Completo</label>
            <div className="relative">
              <input
                type="text"
                className="w-full bg-gray-50 rounded-2xl px-5 py-4 outline-none border-2 border-transparent focus:border-royal-blue/30 transition-all font-bold text-gray-700"
                placeholder="Ex: João Silva"
                value={patient.name}
                onChange={e => setPatient({ ...patient, name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Idade</label>
              <input
                type="number"
                className="w-full bg-gray-50 rounded-2xl px-5 py-4 outline-none border-2 border-transparent focus:border-royal-blue/30 transition-all font-bold text-gray-700"
                placeholder="0"
                value={patient.age || ''}
                onChange={e => setPatient({ ...patient, age: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Localidade</label>
              <input
                type="text"
                className="w-full bg-gray-50 rounded-2xl px-5 py-4 outline-none border-2 border-transparent focus:border-royal-blue/30 transition-all font-bold text-gray-700"
                placeholder="Cidade"
                value={patient.location}
                onChange={e => setPatient({ ...patient, location: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Sexo</label>
            <div className="flex gap-4">
              {['Masculino', 'Feminino'].map(g => (
                <label key={g} className={`flex-1 flex items-center justify-center gap-2 cursor-pointer py-4 rounded-2xl border-2 transition-all font-bold ${patient.gender === g ? 'bg-royal-blue text-white border-royal-blue shadow-lg' : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'}`}>
                  <input
                    type="radio"
                    name="gender"
                    className="hidden"
                    checked={patient.gender === g}
                    onChange={() => setPatient({ ...patient, gender: g })}
                  />
                  <span className="text-sm">{g}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-[24px]">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Contacto Telefónico?</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={patient.phoneContact}
                onChange={e => setPatient({ ...patient, phoneContact: e.target.checked })}
              />
              <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-royal-blue"></div>
            </label>
          </div>

          {patient.phoneContact && (
            <div className="animate-fadeIn">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Número de Telemóvel</label>
              <input
                type="tel"
                className="w-full bg-gray-50 rounded-2xl px-5 py-4 outline-none border-2 border-transparent focus:border-royal-blue/30 transition-all font-bold text-gray-700"
                placeholder="+244 ..."
                value={patient.phoneNumber || ''}
                onChange={e => setPatient({ ...patient, phoneNumber: e.target.value })}
              />
            </div>
          )}

          {editingId ? (
            <div className="flex flex-col gap-4 w-full">
              <button
                onClick={() => {
                  if (!patient.name || !patient.age) {
                    alert("Preencha o nome e a idade.");
                    return;
                  }
                  if (patient.phoneContact && !patient.phoneNumber) {
                    alert("Por favor, insira o número de contacto.");
                    return;
                  }
                  updateInHistory(editingId, patient);
                  setScreen('HISTORY');
                }}
                className="w-full bg-[#4CAF50] text-white py-5 font-black text-lg rounded-[24px] shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                GUARDAR DADOS <CheckCircle2 size={24} />
              </button>

              <button
                onClick={() => {
                  if (!patient.name || !patient.age) {
                    alert("Preencha o nome e a idade.");
                    return;
                  }
                  if (patient.phoneContact && !patient.phoneNumber) {
                    alert("Por favor, insira o número de contacto.");
                    return;
                  }
                  setScreen('RECORDER');
                }}
                className="w-full bg-royal-blue text-white py-5 font-black text-lg rounded-[24px] shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                REFAZER TESTE <Mic size={24} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (!patient.name || !patient.age) {
                  alert("Preencha o nome e a idade.");
                  return;
                }
                if (patient.phoneContact && !patient.phoneNumber) {
                  alert("Por favor, insira o número de contacto.");
                  return;
                }
                setScreen('RECORDER');
              }}
              className="w-full bg-royal-blue text-white py-5 font-black text-lg rounded-[24px] shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              PRÓXIMO <ArrowLeft size={24} className="rotate-180" />
            </button>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-center gap-10 w-full max-w-sm">
          <button
            onClick={() => setScreen('SPLASH')}
            className="flex flex-col items-center gap-3 active:scale-95 transition-transform opacity-50 hover:opacity-100"
          >
            <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-royal-blue border-b-4 border-gray-100">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="text-royal-blue font-black text-[10px] uppercase tracking-wider">Início</span>
          </button>

          <button
            className="flex flex-col items-center gap-3 active:scale-95 transition-transform"
            disabled
          >
            <div className="w-16 h-16 bg-royal-blue rounded-full shadow-xl flex items-center justify-center text-white border-b-4 border-royal-blue/20">
              <FileText size={28} />
            </div>
            <span className="text-royal-blue font-black text-[10px] uppercase tracking-wider">Registo</span>
          </button>

          <button
            onClick={() => setScreen('HISTORY')}
            className="flex flex-col items-center gap-3 active:scale-95 transition-transform opacity-50 hover:opacity-100"
          >
            <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-royal-blue border-b-4 border-gray-100">
              <HistoryIcon size={28} />
            </div>
            <span className="text-royal-blue font-black text-[10px] uppercase tracking-wider">Histórico</span>
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'RECORDER') {
    return (
      <div className="min-h-screen flex flex-col bg-[#FFEB3B]">
        {renderHeader('Gravação')}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="card-tusca p-10 w-full max-w-md flex flex-col items-center">
            <h2 className="text-royal-blue text-2xl font-bold mb-2">Captura de Áudio</h2>
            <p className="text-gray-500 mb-12">Por favor, tussa 2 a 3 vezes próximo ao microfone.</p>

            <div className="relative mb-8">
              {isRecording && (
                <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-75"></div>
              )}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isAnalyzing}
                className={`w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-xl transition-all relative z-10 
                  ${isRecording ? 'bg-red-500 scale-110' : 'bg-green-500 hover:brightness-110'}
                  ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isAnalyzing ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <Mic size={48} className="text-white mb-1" />
                    <span className="text-white text-xs font-bold">{isRecording ? 'PARAR' : 'GRAVAR'}</span>
                  </>
                )}
              </button>
            </div>

            <div className={`text-lg font-bold transition-colors ${isRecording ? 'text-red-500' : 'text-gray-400'}`}>
              {isRecording ? 'Gravando...' : isAnalyzing ? 'Analisando...' : 'Pronto para gravar'}
            </div>

            {isAnalyzing && (
              <div className="mt-8 w-full">
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-royal-blue animate-[loading_2s_ease-in-out_infinite]"></div>
                </div>
                <style>{`
                  @keyframes loading {
                    0% { width: 0%; margin-left: 0; }
                    50% { width: 50%; margin-left: 25%; }
                    100% { width: 0%; margin-left: 100%; }
                  }
                `}</style>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'RESULT' && currentResult) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FFEB3B]">
        {renderHeader('Resultado IA')}
        <div className="p-6 flex-1 flex flex-col items-center">
          <div className="bg-orange-500 rounded-[24px] p-8 w-full max-w-md shadow-2xl text-white mb-6">
            <h2 className="text-center text-sm font-bold uppercase tracking-widest opacity-80 mb-2">Diagnóstico Sugerido</h2>
            <p className="text-center text-4xl font-black mb-8">{currentResult.diagnosis}</p>

            <div className="space-y-4">
              {DIAGNOSIS_CATEGORIES.map((cat, idx) => (
                <div key={cat}>
                  <div className="flex justify-between text-xs font-bold uppercase mb-1">
                    <span>{cat}</span>
                    <span>{currentResult.confidence[idx]}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-1000"
                      style={{ width: `${currentResult.confidence[idx]}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full max-w-md space-y-3 no-print">
            <button
              onClick={() => setScreen('HISTORY')}
              className="w-full bg-green-500 text-white py-4 font-bold pill-button shadow-lg flex items-center justify-center gap-2"
            >
              <FileText size={20} /> VER RELATÓRIO DETALHADO
            </button>
            <button
              onClick={() => setScreen('SPLASH')}
              className="w-full bg-royal-blue text-white py-4 font-bold pill-button shadow-lg"
            >
              VOLTAR AO INÍCIO
            </button>
          </div>

          {/* Hidden Print Report */}
          <div className="print-only p-12 bg-white text-black min-h-screen">
            <div className="border-b-4 border-royal-blue pb-4 mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-royal-blue">RELATÓRIO TUSCA</h1>
                <p className="text-gray-500">Diagnóstico Digital por Áudio</p>
              </div>
              <div className="w-16 h-16 bg-royal-blue rounded-full flex items-center justify-center text-white">
                <ShieldCheck size={32} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-12">
              <div>
                <h3 className="text-gray-400 font-bold uppercase text-xs">Utente</h3>
                <p className="text-xl font-bold">{currentResult.name}</p>
                <p className="text-gray-600">{currentResult.gender}, {currentResult.age} anos</p>
              </div>
              <div>
                <h3 className="text-gray-400 font-bold uppercase text-xs">Data/Hora</h3>
                <p className="text-lg font-medium">{formatTimestamp(currentResult.timestamp)}</p>
                <p className="text-gray-600">{currentResult.location}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl mb-12">
              <h3 className="text-royal-blue font-bold uppercase text-sm mb-4">Resultado da Análise IA</h3>
              <p className="text-4xl font-black mb-6">{currentResult.diagnosis}</p>
              <div className="space-y-3">
                {DIAGNOSIS_CATEGORIES.map((cat, idx) => (
                  <div key={cat} className="flex items-center gap-4">
                    <span className="w-40 text-sm font-bold">{cat}</span>
                    <div className="flex-1 h-3 bg-gray-200 rounded-full">
                      <div className="h-full bg-royal-blue rounded-full" style={{ width: `${currentResult.confidence[idx]}%` }}></div>
                    </div>
                    <span className="w-12 text-sm font-bold text-right">{currentResult.confidence[idx]}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-12 border-t text-center text-gray-400 text-xs italic">
              <p>Este sistema não substitui o diagnóstico médico profissional.</p>
              <p>Tecnologia Edge AI - TUSCA Diagnostic v1.0</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'HISTORY') {
    const filteredHistory = history.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="min-h-screen flex flex-col bg-slate-50 animate-fadeIn relative overflow-hidden">
        {/* Blue Header */}
        <div className="bg-[#2196F3] text-white pt-10 pb-16 px-6 relative rounded-b-[48px] shadow-xl no-print">
          <div className="flex items-center gap-4 mb-10">
            <button onClick={() => setScreen('SPLASH')} className="p-2 hover:bg-white/10 rounded-full transition">
              <ArrowLeft size={32} strokeWidth={3} />
            </button>
            <h1 className="text-3xl font-black tracking-tight">Histórico</h1>
          </div>

          {/* Stepper / Steps Bar */}
          <div className="flex items-center justify-between px-2 relative max-w-md mx-auto">
            <div className="absolute top-[22px] left-8 right-8 h-[2px] bg-white/20 z-0"></div>

            <button
              onClick={() => setScreen('REGISTRATION')}
              className="flex flex-col items-center gap-3 z-10 active:scale-95 transition-all"
            >
              <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md border border-white/30 hover:bg-white/30">
                <User size={18} strokeWidth={3} />
              </div>
              <span className="text-[10px] font-black opacity-60 uppercase tracking-tighter">Dados</span>
            </button>

            <div className="flex flex-col items-center gap-3 z-10">
              <div className="w-13 h-13 bg-white rounded-full flex items-center justify-center text-[#2196F3] shadow-2xl scale-110">
                <FileText size={22} strokeWidth={3} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter mt-1">Relatório</span>
            </div>

            <button
              onClick={exportHistory}
              className="flex flex-col items-center gap-3 z-10 active:scale-95 transition-all"
            >
              <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md border border-white/30 hover:bg-white/30">
                <Download size={18} strokeWidth={3} />
              </div>
              <span className="text-[10px] font-black opacity-60 uppercase tracking-tighter">Download</span>
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 px-6 -mt-10 pb-40 overflow-y-auto no-scrollbar">
          {/* Search Bar */}
          <div className="relative mb-10 max-w-lg mx-auto z-20">
            <input
              type="text"
              placeholder="Procurar testes..."
              className="w-full bg-white rounded-[28px] py-6 px-16 shadow-2xl outline-none text-gray-700 font-black placeholder:text-gray-300 border-none transition-all focus:ring-4 focus:ring-[#2196F3]/10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-300" size={26} strokeWidth={3} />
          </div>

          {filteredHistory.length === 0 ? (
            <div className="text-center py-20 opacity-20">
              <HistoryIcon size={100} strokeWidth={1} className="mx-auto mb-6" />
              <p className="text-lg font-black uppercase tracking-widest">Sem Registos</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-lg mx-auto">
              {filteredHistory.map(item => (
                <div key={item.id} className="bg-white rounded-[32px] p-4 shadow-2xl relative overflow-hidden border-b-8 border-gray-100/50 group transition-all hover:translate-y-[-4px]">
                  {/* Top Bar with Name and ID */}
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-3xl font-black text-gray-800 tracking-tight leading-tight">{item.name}</h3>
                    <div className="bg-[#E3F2FD] text-[#2196F3] px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em]">
                      ID: #{item.id.substring(0, 4)}
                    </div>
                  </div>

                  {/* Date */}
                  <p className="text-gray-400 font-bold text-sm mb-2">
                    {formatTimestamp(item.timestamp)}
                  </p>

                  {/* Diagnosis Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-[#F8F9FA] rounded-[24px] p-3 border-l-4 border-royal-blue/10">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 opacity-60">Diagnóstico</span>
                      <p className={`text-xl font-black ${item.diagnosis === 'Normal' ? 'text-[#4CAF50]' : 'text-[#FF5722]'}`}>
                        {item.diagnosis}
                      </p>
                    </div>
                    <div className="bg-[#F8F9FA] rounded-[24px] p-3 border-l-4 border-royal-blue/10">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 opacity-60">Confiança</span>
                      <p className="text-xl font-black text-[#2196F3]">
                        {Math.max(...item.confidence)}%
                      </p>
                    </div>
                  </div>

                  {/* Status Footer and Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-dashed border-gray-100 pt-3 mt-1">
                    <p className="text-gray-300 text-[11px] italic font-black max-w-[200px] leading-tight">
                      {item.diagnosis === 'Normal' ? 'Tosse padrão normal detetada' : 'Sons de tosse analisados com sucesso'}
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => {
                          setPatient({
                            name: item.name,
                            age: item.age,
                            location: item.location,
                            gender: item.gender,
                            phoneContact: item.phoneContact,
                            phoneNumber: item.phoneNumber
                          });
                          setEditingId(item.id);
                          setScreen('REGISTRATION');
                        }}
                        className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-royal-blue/10 hover:text-royal-blue active:scale-90 transition-all shadow-sm"
                        title="Editar"
                      >
                        <Pencil size={20} strokeWidth={3} />
                      </button>
                      <button
                        onClick={() => deleteFromHistory(item.id)}
                        className="p-3 bg-[#FFEBEE] text-[#F44336] rounded-2xl hover:bg-[#FFCDD2] active:scale-90 transition-all shadow-sm"
                        title="Eliminar"
                      >
                        <Trash2 size={20} strokeWidth={3} />
                      </button>
                      <button
                        onClick={() => exportSingleRecord(item)}
                        className="p-3 bg-orange-50 text-orange-500 rounded-2xl hover:bg-orange-100 active:scale-90 transition-all shadow-sm"
                        title="Descarregar TXT"
                      >
                        <Download size={20} strokeWidth={3} />
                      </button>
                      <button
                        onClick={() => {
                          setCurrentResult(item);
                          setScreen('RESULT');
                          // Delay print to allow screen transition
                          setTimeout(() => window.print(), 500);
                        }}
                        className="flex items-center gap-2 bg-[#00BFA5] text-white px-6 py-4 rounded-2xl shadow-[0_8px_15px_-3px_rgba(0,191,165,0.3)] active:scale-95 transition-all font-black text-xs uppercase min-w-fit"
                      >
                        <FileText size={18} strokeWidth={3} /> PDF / IMPRIMIR
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fixed Bottom Button - Glassmorphism effect bar */}
        <div className="fixed bottom-0 left-0 right-0 p-8 pt-12 pb-10 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent flex justify-center z-50 no-print">
          <button
            onClick={() => setScreen('SPLASH')}
            className="w-full max-w-sm bg-[#2196F3] text-white py-6 rounded-[30px] shadow-[0_20px_40px_-10px_rgba(33,150,243,0.5)] flex items-center justify-center gap-4 font-black text-xl active:scale-95 transition-all transform hover:translate-y-[-2px] tracking-tight"
          >
            <Home size={30} strokeWidth={3} /> Voltar a Página Inicial
          </button>
        </div>

        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    );
  }

  return null;
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<TuscaApp />);
