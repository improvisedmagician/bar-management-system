# Bar Management System - Design System (V3)

Este documento serve como um guia rápido para designers e desenvolvedores manterem a consistência visual do projeto Bar Management System. O sistema utiliza a estética **Glassmorphism** combinada com **Design Responsivo (Mobile-First)**.

## 🎨 Paleta de Cores (Tailwind V4)

O projeto baseia-se em uma paleta moderna e vibrante, focada em contraste e leveza:

- **Primária (Ações e Destaques):** `blue-600` (#2563EB) a `blue-700`
- **Secundária (Avisos/KDS):** Tons pastéis como `blue-50`, `green-50` e `orange-50`
- **Sucesso (Pronto/Fechado):** `green-500` (#22C55E)
- **Alerta/Atraso (KDS):** `red-500` (#EF4444) a `orange-500`
- **Fundos (Backgrounds):**
  - Fundo Geral: Gradiente moderno (`bg-gradient-modern` no index.css)
  - Cards/Painéis: Branco translúcido (`bg-white/40`, `bg-white/50`, `bg-white/80`)

## 🔤 Tipografia

- **Fonte Principal:** `Outfit` (Google Fonts)
- **Pesos Utilizados:**
  - `font-medium` (500): Textos secundários, subtítulos.
  - `font-bold` (700): Botões, destaques, rótulos.
  - `font-black` (900): Títulos principais (H1, H2), numerações de mesas, valores monetários.
- **Dica:** Utilizamos muito o estilo `uppercase tracking-widest text-xs` para pequenos subtítulos e rótulos ("labels") para dar uma cara premium de UI de aplicativo móvel.

## 🪟 Efeito Glassmorphism (Vidro)

O estilo "Glass" é a identidade do sistema. Ele é gerado pelas seguintes classes utilitárias no Tailwind:
- `backdrop-blur-md` ou `backdrop-blur-xl`: Cria o desfoque do que está por trás.
- `bg-white/40` ou `bg-slate-900/50`: Cria a translucidez (para temas claros ou escuros).
- `border border-white/50`: Cria a bordinha fina brilhante imitando o corte do vidro.
- `shadow-xl`: Adiciona profundidade flutuante.

*Exemplo de uso:* Temos a classe global `.glass-card` no `index.css` que já aplica esse pacote inteiro, bastando adicionar `rounded-3xl` ou `rounded-[2rem]` para o formato arredondado agressivo.

## 📱 Componentes e Layout (Mobile-First)

1. **Botões:** Devem ser grandes e "pressionáveis", idealmente com `py-4 rounded-2xl` e o efeito `active:scale-95` para dar feedback tátil ao usuário.
2. **Mesas (Dashboard do Garçom):** Os cards das mesas devem ser clicáveis como blocos grandes. O status (Livre/Ocupada) dita as cores e a presença de pulsações (`animate-pulse`).
3. **Bottom Sheet:** Os carrinhos e modais em telas de celular devem abrir de baixo para cima (deslizando), mantendo o polegar do garçom no controle inferior da tela.

## ✨ Animações Padrão

Sempre aplique animações suaves na entrada dos elementos:
- **Slide Up:** `.animate-slide-up` (Definido no `index.css`)
- **Hover:** Nos botões, use `hover:-translate-y-1 hover:shadow-lg transition-all`
- **Click:** Nos botões de ação, use `active:scale-95` (Dá a sensação do botão afundar na tela).

## 🗂️ Estrutura para Exportação do Figma
Se você for criar novos protótipos no Figma para este sistema, configure seu arquivo com:
- **Grid de Celular:** 375px (iPhone).
- **Grid Desktop:** 1440px (12 colunas).
- **Border Radius:** Utilize `16px` (xl), `24px` (2xl) e `32px` (3xl) na maioria dos containers.
