# TUSCA — Tosse User Sound Cough Analyzer 🎙️🤖

![Status do Projeto](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow)
![IA](https://img.shields.io/badge/Tecnologia-Intelig%C3%AAncia%20Artificial-blue)
![Local](https://img.shields.io/badge/Privacidade-Dados%20Locais-green)

O **TUSCA** é uma solução de saúde digital (e-Health) que utiliza Inteligência Artificial avançada para analisar padrões sonoros de tosse e auxiliar no diagnóstico preliminar de doenças respiratórias diretamente pelo smartphone.

---

## 📋 Índice
- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura e IA](#-arquitetura-e-ia)
- [Fluxo do Usuário](#-fluxo-do-usuário)
- [Privacidade e Ética](#-privacidade-e-ética)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)

---

## 🚀 Sobre o Projeto

O TUSCA foi desenvolvido para atuar como uma ferramenta de triagem ágil. Ao capturar o som da tosse do utilizador, a IA compara as frequências e padrões acústicos com uma base de dados clínica para sugerir diagnósticos prováveis, reduzindo o tempo entre os primeiros sintomas e a busca por ajuda médica especializada.

### Objetivos do Teste:
* ✅ **Diagnosticar Bronquite** (Nível 1 e Aguda)
* ✅ **Diagnosticar Pneumonia**
* ✅ **Diagnosticar Asma**
* ✅ **Validar Estado Saudável** (Tosse Normal)

---

## ✨ Funcionalidades

- **Cadastro do Utente:** Coleta de dados demográficos para precisão estatística.
- **Captura de Áudio em Tempo Real:** Interface intuitiva para gravação de 2 a 3 tosses.
- **Diagnóstico por Probabilidade:** Exibição percentual de confiança para cada patologia.
- **Histórico de Testes:** Registro completo com ID único e busca inteligente.
- **Exportação de Relatórios:** Geração de documentos em PDF para compartilhamento médico.

---

## 🧠 Arquitetura e IA

O motor de análise processa o áudio em três etapas:
1.  **Pré-processamento:** Limpeza de ruído ambiente e normalização da onda sonora.
2.  **Extração de Características:** Identificação de espectrogramas e coeficientes cepstrais (MFCCs).
3.  **Classificação:** Uma Rede Neural Convolucional (CNN) atribui probabilidades às patologias.

---

## 📲 Fluxo do Usuário

1.  **Tela Inicial:** Apresentação e objetivos.
2.  **Identificação:** Cadastro de dados básicos.
3.  **Consentimento:** Aceite dos termos de privacidade e aviso legal.
4.  **Gravação:** Captura do sinal sonoro.
5.  **Resultado IA:** Visualização detalhada das probabilidades.
6.  **Histórico:** Gestão de testes realizados.

---

## 🔒 Privacidade e Ética

O TUSCA segue princípios rigorosos de proteção de dados:
- **Armazenamento Local:** Os dados sensíveis e áudios são armazenados apenas no dispositivo do usuário.
- **Aviso Legal:** O sistema é uma ferramenta de **triagem inicial** e não substitui diagnósticos clínicos, exames laboratoriais ou consultas presenciais.

---

## 🛠️ Tecnologias Utilizadas (Sugestão)

- **Frontend:** [React Native / Flutter]
- **IA/ML:** [TensorFlow Lite / PyTorch]
- **Processamento de Áudio:** [Librosa / AudioKit]
- **Exportação:** [PDFLib / Expo-Print]

---
==========================================================================================================================================================================================================
### 📄 Notas da Apresentação: TUSCA AI

#### Slide 1: Capa

> **Texto para as Notas:**
> "Bom dia/boa tarde a todos. É um prazer apresentar o TUSCA — Tosse User Sound Cough Analyzer. Este projeto representa a convergência entre a inteligência artificial avançada e a saúde digital. Nossa missão é transformar o smartphone em uma ferramenta de triagem respiratória acessível, rápida e precisa para qualquer cidadão."

---

#### Slide 2: O que é o TUSCA?

> **Texto para as Notas:**
> "O TUSCA não é apenas um gravador de áudio; ele é um analisador biométrico. A IA processa a frequência e a cadência da tosse para identificar padrões de doenças específicas. Focamos nos quatro pilares do diagnóstico respiratório primário: Bronquite, Pneumonia, Asma e a validação do estado saudável. É uma ferramenta de apoio à decisão que traz clareza ao primeiro sinal de desconforto respiratório."

---

#### Slide 3: Jornada do Usuário – Onboarding

> **Texto para as Notas:**
> "A experiência começa com a segurança. No cadastro, o utente fornece dados demográficos básicos. Em seguida, passamos pela tela de Consentimento Informado. Aqui, o TUSCA reforça seu compromisso ético: os dados são processados localmente, garantindo a privacidade total do paciente (Privacy by Design), e o usuário é lembrado de que esta é uma triagem inicial, reforçando a importância do acompanhamento médico profissional."

---

#### Slide 4: A Tecnologia de Captura

> **Texto para as Notas:**
> "A simplicidade é a nossa sofisticação. A interface de gravação elimina barreiras técnicas. Com apenas um toque, o sistema prepara o microfone e orienta o usuário. O status muda visualmente de 'Pronto' para 'Gravando', garantindo que a captura do som da tosse seja feita na distância e qualidade ideais para a análise da nossa rede neural."

---
