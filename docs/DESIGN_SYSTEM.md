# Design System — Central de Dashboards Viva

Documento de referência com **cores, fontes, espaçamentos e padrões visuais** da Central de Dashboards. Use como base para replicar o visual em outros projetos.

> **Fontes oficiais deste DS no código-fonte:**
> - [tailwind.config.js](../tailwind.config.js) — tokens (cores, fontes, sombras)
> - [src/styles/globals.css](../src/styles/globals.css) — variáveis CSS, classes utilitárias, componentes
> - [src/modules/central/components/Header.tsx](../src/modules/central/components/Header.tsx) — header
> - [src/modules/central/components/Sidebar.tsx](../src/modules/central/components/Sidebar.tsx) — sidebar
> - [src/modules/central/components/Shell.tsx](../src/modules/central/components/Shell.tsx) — shell/layout

---

## 1. Paleta de Cores

### 1.1 Cor primária (marca Viva)

| Token | Hex | Uso |
|---|---|---|
| `viva.primary` | `#FF6600` | Cor principal — botões primários, bordas ativas, destaques |
| `viva.primary-dark` | `#E55A00` | Hover de botões primários |
| `viva.primary-light` | `#FF8533` | Acentos claros, gradientes |

### 1.2 Dark theme (fundo e superfícies)

| Token | Hex | Uso |
|---|---|---|
| `dark.bg` | `#212529` | Fundo principal da aplicação |
| `dark.bg-secondary` | `#343A40` | Cards, sidebar, header interno |
| `dark.bg-tertiary` | `#495057` | Elementos elevados, hover |
| `dark.border` | `#3c434a` | Bordas sutis |
| `dark.text` | `#F8F9FA` | Texto principal |
| `dark.text-muted` | `#ADB5BD` | Texto secundário, labels |

Header da Central usa fundo `#1a1d21` (ligeiramente mais escuro que `dark.bg`).

### 1.3 Escala primária (laranja)

```
primary.50  #fff7ed
primary.100 #ffedd5
primary.200 #fed7aa
primary.300 #fdba74
primary.400 #fb923c
primary.500 #FF6600   ← principal
primary.600 #E55A00
primary.700 #CC5000
primary.800 #9a3412
primary.900 #7c2d12
```

### 1.4 Status

| Token | Hex |
|---|---|
| `success` | `#28a745` |
| `warning` | `#ffc107` |
| `danger` | `#dc3545` |
| `info` | `#17a2b8` |

### 1.5 Variáveis CSS (para uso sem Tailwind)

```css
:root {
  --bg-primary: #212529;
  --bg-secondary: #343A40;
  --bg-tertiary: #495057;
  --color-primary: #ff6600;
  --color-primary-light: rgba(255, 102, 0, 0.2);
  --text-primary: #F8F9FA;
  --text-secondary: #ADB5BD;
  --border-color: rgba(255, 255, 255, 0.08);
  --current-accent-color: var(--color-primary);
  --sidebar-width: 300px;
  --sidebar-width-collapsed: 80px;
}
```

---

## 2. Tipografia

### 2.1 Famílias

| Fonte | Uso |
|---|---|
| **Poppins** | Fonte padrão do sistema (corpo, botões, cards) |
| **Orbitron** | Títulos de destaque (header principal, welcome title) |
| Inter / system-ui | Fallback |

```js
fontFamily: {
  sans: ['Poppins', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
  display: ['Orbitron', 'sans-serif'],
}
```

Importar no `_document.tsx` / `<head>`:
```html
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Orbitron:wght@400;600;700;900&display=swap" rel="stylesheet" />
```

### 2.2 Tamanhos e pesos padrão

| Elemento | Tamanho | Peso | Família |
|---|---|---|---|
| Título do header | `1.75rem` | 700 | Orbitron |
| Subtítulo do header | `0.75em` | 500 | Poppins |
| Section title / card title | `1.2rem` | 600 uppercase, letter-spacing `0.06em` | Poppins |
| Welcome title | `2rem` | 700 | Orbitron |
| Texto padrão | `0.95em` | 400–600 | Poppins |
| Labels / text-muted | `0.75–0.85em` | 400–500 | Poppins |
| KPI value | `1.7–1.9rem` | 700 | Poppins |
| KPI label | `0.9rem` | 600 uppercase | Poppins |

---

## 3. Espaçamento, bordas, sombras

### 3.1 Border radius

- Botões / inputs: `8px` (`rounded-lg`)
- Cards: `12px` (`rounded-xl`)
- Badges / pílulas: `full`
- Containers grandes: `0.75rem`

### 3.2 Sombras

```js
boxShadow: {
  'viva':    '0 4px 10px rgba(255, 102, 0, 0.12)',  // destaque laranja sutil
  'viva-lg': '0 8px 18px rgba(0, 0, 0, 0.4)',       // elevação forte
  'card':    '0 4px 8px rgba(0, 0, 0, 0.3)',        // card padrão
}
```

Header: `0 4px 20px rgba(0, 0, 0, 0.3)`

### 3.3 Transições

Padrão: `transition: all 0.2s` (botões, hovers)
Animações: `0.3s ease-out` (fade/slide-in)
Micro: `0.15s ease` (navegação da sidebar)

---

## 4. Componentes

### 4.1 Header

- **Altura fixa:** `70px`
- **Fundo:** `#1a1d21`
- **Borda inferior:** `3px solid #FF6600` (assinatura visual forte)
- **Padding:** `0 24px`
- **Sombra:** `0 4px 20px rgba(0, 0, 0, 0.3)`
- Layout: `flex` com logo+título à esquerda e user+logout à direita
- Divisor vertical entre logo e título: `width: 2px; background: linear-gradient(to bottom, transparent, #FF6600, transparent); height: 40px;`
- **Título:** Orbitron 700, uppercase, com gradiente `linear-gradient(to bottom, #F8F9FA 0%, #ADB5BD 100%)` + `-webkit-background-clip: text`
- **Subtítulo:** `#FF6600`, 0.75em, letter-spacing `1px`

### 4.2 Sidebar

- **Largura:** `300px` (colapsada: `80px`)
- **Fundo:** `var(--bg-secondary)` (`#343A40`)
- **Borda direita:** `1px solid var(--border-color)`
- **Fixa** à esquerda, altura 100%
- **Item ativo:** fundo `rgba(255, 102, 0, 0.12)` + `border-left: 3px solid #FF6600`
- **Hover:** fundo `rgba(255, 102, 0, 0.08)`
- Grupos colapsáveis com `ChevronDown` (lucide-react)
- Ícones: biblioteca **lucide-react** (size 16–20px)
- Busca no topo com `input` estilo "input" (ver 4.4)
- **Mobile:** overlay, abre/fecha com botão no header

### 4.3 Botões

Base (`.btn`):
```css
padding: 8px 16px;
border-radius: 8px;
font-weight: 500;
display: inline-flex;
align-items: center;
gap: 8px;
transition: all 0.2s;
font-family: 'Poppins', sans-serif;
```

| Variante | Fundo | Texto | Borda | Hover |
|---|---|---|---|---|
| **Primary** | `#FF6600` | branco | — | `#E55A00` |
| **Secondary** | `#343A40` | `#F8F9FA` | `#3c434a` | `#495057` |
| **Ghost** | transparent | `#ADB5BD` | — | fundo `#343A40`, texto `#F8F9FA` |
| **Outline laranja** (logout) | `rgba(255,102,0,0.1)` | `#FF6600` | `1px solid rgba(255,102,0,0.3)` | fundo `rgba(255,102,0,0.2)`, borda `#FF6600` |

### 4.4 Inputs / filtros

**Input padrão:**
```css
width: 100%;
padding: 10px 16px;
background: #212529;
border: 1px solid #3c434a;
border-radius: 8px;
color: #F8F9FA;
transition: all 0.2s;
/* focus */
outline: none;
ring: 2px solid #FF6600;
border-color: transparent;
```

**Select de filtro (tipo Vendas):**
```css
background: linear-gradient(145deg, #3a4148, #343a40);
border: 1px solid rgba(255,255,255,0.08);
padding: 12px 16px;
border-radius: 8px;
/* hover */
transform: translateY(-2px);
box-shadow: 0 6px 12px rgba(0,0,0,0.4);
```

**Seção de filtros (card):**
```css
display: flex;
flex-wrap: wrap;
gap: 16px;
padding: 24px;
border-radius: 12px;
background: linear-gradient(135deg, #343A40 0%, #495057 100%);
border: 1px solid rgba(255,255,255,0.1);
```

**Filter label:** uppercase, 0.875rem, 600, letter-spacing `0.05em`, com ícone à esquerda.

### 4.5 Cards

**Card base (`.card`):**
```css
background: #343A40;
border: 1px solid #3c434a;
border-radius: 12px;
padding: 16–24px;
```

**KPI Card:**
```css
background: linear-gradient(145deg, #343a40 0%, #2d3338 100%);
border: 1px solid rgba(255,255,255,0.05);
box-shadow: 0 4px 15px rgba(0,0,0,0.2);
border-radius: 12px;
padding: 20px;
position: relative;
overflow: hidden;
/* barra lateral laranja */
&::before {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 4px; height: 100%;
  background: linear-gradient(180deg, #ff6600 0%, #ff8533 100%);
}
/* hover */
transform: translateY(-4px);
box-shadow: 0 8px 25px rgba(0,0,0,0.3);
border-color: rgba(255,102,0,0.3);
```

### 4.6 Section title (padrão do sistema)

```css
margin: 0 0 12px 0;
color: #adb5bd;
font-size: 1.2rem;
letter-spacing: 0.06em;
font-family: 'Poppins', sans-serif;
font-weight: 600;
text-transform: uppercase;
border-bottom: 1px solid #ff6600;
padding-bottom: 2px;
```

Variante com gradiente na linha inferior:
```css
&::after {
  background: linear-gradient(to right,
    #ff6600 0%, #ff6600cc 20%, #ff660080 50%, #ff660030 80%, transparent 100%);
  height: 2px;
}
```

### 4.7 Tabelas

```css
thead {
  background: #2c3035;
  border-bottom: 2px solid #ff6600;
}
thead th {
  text-transform: uppercase;
  font-size: 0.875rem;
  letter-spacing: 0.05em;
  color: #ADB5BD;
}
tbody tr {
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
tbody tr:hover {
  background: rgba(255, 102, 0, 0.1);
}
```

### 4.8 Badges

```css
display: inline-flex;
padding: 2px 10px;
border-radius: full;
font-size: 0.75rem;
font-weight: 500;
/* variantes: cor-base 20% alpha para fundo + cor-base para texto */
```

| Tipo | Fundo | Texto |
|---|---|---|
| Primary | `rgba(255,102,0,0.2)` | `#FF6600` |
| Success | `rgba(34,197,94,0.2)` | `#4ade80` |
| Warning | `rgba(234,179,8,0.2)` | `#facc15` |
| Danger | `rgba(239,68,68,0.2)` | `#f87171` |
| **BETA** | `linear-gradient(135deg, #8b5cf6, #6d28d9)` | branco |

### 4.9 Scrollbar customizada

```css
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: #343A40; }
::-webkit-scrollbar-thumb { background: #3c434a; border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: #ADB5BD; }
```

### 4.10 Footer de dashboard

```css
font-size: 0.875rem;
font-weight: 500;
color: #8b949e;
```

---

## 5. Animações padrão

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
```

**Spinner de loading** (padrão da app):
```jsx
<div className="w-12 h-12 border-4 border-viva-primary border-t-transparent
                rounded-full animate-spin" />
```

---

## 6. Layout padrão (Shell)

```
┌─────────────────────────────────────────────┐
│  HEADER (70px, borda inferior laranja 3px)  │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ SIDEBAR  │     MAIN CONTENT                 │
│  300px   │     (scroll próprio)             │
│          │                                  │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

- Root: `h-screen flex flex-col overflow-hidden; background: #212529`
- Home: background image `cover`, `center`, `fixed`
- Container interno: `flex-1 flex min-h-0`
- Main: `flex-1 flex flex-col min-h-0 min-w-0` (scroll isolado)

---

## 7. Stack técnica de referência

- **Framework:** Next.js (Pages Router) + React 18 + TypeScript
- **Estilização:** Tailwind CSS 3 + CSS Modules/globals
- **Ícones:** `lucide-react`
- **Imagens:** `next/image`
- **Gráficos:** Recharts / Chart.js
- **Fontes:** Google Fonts (Poppins + Orbitron)

---

## 8. Checklist rápido para replicar o visual

- [ ] Configurar `tailwind.config.js` com os tokens da seção 1
- [ ] Importar Poppins + Orbitron no `<head>`
- [ ] Copiar variáveis CSS `:root` em `globals.css` (seção 1.5)
- [ ] Implementar Shell com header 70px + borda laranja e sidebar 300px
- [ ] Usar `#FF6600` como cor de destaque em bordas ativas, ícones, títulos
- [ ] Seguir padrão de section-title (uppercase + borda laranja inferior)
- [ ] Adotar dark theme base (`#212529` fundo, `#343A40` cards)
- [ ] Usar `lucide-react` para ícones (tamanhos 16–20px)
