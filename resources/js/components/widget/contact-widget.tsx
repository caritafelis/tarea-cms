import { Braces, ChevronDown, ChevronLeft, Code, Command, CornerDownLeft, Bold, Italic, Database, MessageCircle, Maximize2, Minimize2, Paperclip, X } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';

/**
 * Widget de contacto global de Stuvvion (burbuja flotante, tema oscuro).
 *
 *   Home  → hero con degradado verde, logo, saludo, enlaces de documentación y 3 acciones:
 *           "Ask a question", "Send feedback", "Report an issue".
 *   Las 3 acciones abren la vista "Send us a message".
 *
 * Backend (en orden de prioridad):
 *   1. `chat`     → ChatAdapter: el agente responde dentro del widget.
 *   2. `onSubmit` → recibe { topic, text, files } (ideal para el módulo de Tasks & Support).
 *   3. nada       → abre el cliente de correo con `mailto:` a itsupport@stuvvion.com.
 *
 * Uso:
 *   <ContactWidgetProvider>   // el nombre sale de usePage().props.auth.user.name
 *     ...
 *   </ContactWidgetProvider>
 *
 * Los iconos de los enlaces de docs son opcionales; puedes pasar tus propios ApiIcon / DatabaseIcon:
 *   config={{ docsLinks: [{ title: 'REST Docs', href: '...', icon: ApiIcon }, ...] }}
 */

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

export interface ChatMessage {
    id: string;
    role: 'user' | 'agent';
    text: string;
    createdAt: number;
    /** Marca mensajes de error del sistema (se muestran con otro estilo). */
    error?: boolean;
}

/** Contrato mínimo con el backend del chat. Devuelve una o varias respuestas del agente. */
export interface ChatAdapter {
    send: (text: string, history: ChatMessage[]) => Promise<string | string[]>;
}

export type Topic = 'question' | 'feedback' | 'issue';

export interface SubmitPayload {
    topic: Topic;
    text: string;
    files: File[];
}

export interface DocsLink {
    title: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
}

export interface ContactConfig {
    /** Correo de soporte. Por defecto itsupport@stuvvion.com. */
    email?: string;
    /** Backend del chat integrado. Si existe, el agente responde dentro del widget. */
    chat?: ChatAdapter;
    /** Se llama al enviar un mensaje cuando no hay `chat`. Debe lanzar error si falla. */
    onSubmit?: (payload: SubmitPayload) => Promise<void>;
    /** Enlaces de documentación del hero. Por defecto REST Docs y GraphQL Docs de stuvvion.com (es/en). */
    docsLinks?: DocsLink[];
    /** Opcional: fuerza otro nombre en el saludo. Por defecto se usa `auth.user.name` de Inertia ("there" si no hay sesión). */
    userName?: string;
    /** Segunda línea del saludo. */
    greeting?: string;
    /** Nombre que se muestra como remitente del agente. */
    agentName?: string;
    /** Color de marca (hex). El degradado del hero y del launcher se deriva de él. */
    brandColor?: string;
    /** Logo del hero (56px). Por defecto el logo de Stuvvion. */
    logo?: React.ReactNode;
    /** Texto del estado vacío en "Send us a message". */
    emptyMessage?: string;
    /** Respuesta mostrada tras enviar cuando no hay `chat`. */
    sentMessage?: string;
    /** Pie "Powered by". Pasa `null` para ocultarlo. */
    poweredBy?: { name: string; href: string } | null;
    /** Clave de localStorage para el historial. Pasa `null` para no guardar nada. */
    storageKey?: string | null;
}

interface ContactContextValue {
    config: ContactConfig;
    email: string;
    open: boolean;
    setOpen: (v: boolean) => void;
    /** Abre el widget directamente en "Send us a message" (útil desde un botón "Hablar con ventas"). */
    openChat: (topic?: Topic) => void;
    messages: ChatMessage[];
    typing: boolean;
    sendMessage: (text: string, opts?: { topic?: Topic; files?: File[] }) => Promise<void>;
    clearChat: () => void;
}

type View = 'home' | 'message';

const DEFAULT_STORAGE_KEY = 'contact-widget:chat';
const DEFAULT_EMAIL = 'itsupport@stuvvion.com';
const DEFAULT_BRAND = '#005F31';
const DEFAULT_POWERED_BY = { name: 'stuvvion', href: 'https://stuvvion.com' };
const DEFAULT_EMPTY = 'We’re happy to help – message us whenever you need and we’ll get back to you as soon as possible.';
const DEFAULT_SENT = 'Thanks! We got your message and we’ll get back to you as soon as possible.';
const MAX_STORED_MESSAGES = 50;

const TOPIC_LABEL: Record<Topic, string> = { question: 'Question', feedback: 'Feedback', issue: 'Issue' };

const ContactContext = createContext<ContactContextValue | null>(null);

/** Devuelve null si no hay provider, así los componentes pueden degradar sin romperse. */
export function useContactWidget() {
    return useContext(ContactContext);
}

/* ------------------------------------------------------------------ */
/* Lógica del chat                                                     */
/* ------------------------------------------------------------------ */

const makeMessage = (role: ChatMessage['role'], text: string, error = false): ChatMessage => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    createdAt: Date.now(),
    ...(error ? { error: true } : {}),
});

function loadMessages(key: string | null): ChatMessage[] {
    if (!key || typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveMessages(key: string | null, messages: ChatMessage[]) {
    if (!key || typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)));
    } catch {
        /* almacenamiento lleno o bloqueado: el chat sigue funcionando en memoria */
    }
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export function ContactWidgetProvider({ config, children }: { config?: ContactConfig; children: React.ReactNode }) {
    // Usuario autenticado: viene de HandleInertiaRequests (props.auth.user).
    const { auth } = usePage<{ auth?: { user?: { id?: number | string; name?: string } | null } }>().props;
    const authUser = auth?.user ?? null;

    // `config.userName` solo sirve para forzar otro nombre; por defecto se usa el del usuario logueado.
    const cfg: ContactConfig = { ...config, userName: config?.userName ?? authUser?.name?.trim() ?? undefined };
    const email = cfg.email ?? DEFAULT_EMAIL;
    const [open, setOpen] = useState(false);
    const [view, setView] = useState<View>('home');
    const [topic, setTopic] = useState<Topic>('question');

    // Historial separado por usuario para que no se mezcle si se comparte el navegador.
    const storageKey = cfg.storageKey === undefined ? `${DEFAULT_STORAGE_KEY}:${authUser?.id ?? 'guest'}` : cfg.storageKey;

    const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages(storageKey));

    // Si cambia el usuario (logout/login sin recargar), se carga su propio historial.
    const [loadedKey, setLoadedKey] = useState(storageKey);
    if (loadedKey !== storageKey) {
        setLoadedKey(storageKey);
        setMessages(loadMessages(storageKey));
    }
    const [typing, setTyping] = useState(false);
    const messagesRef = useRef(messages);
    messagesRef.current = messages;

    useEffect(() => {
        saveMessages(storageKey, messages);
    }, [storageKey, messages]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    // Al cerrar, la próxima apertura vuelve al inicio (salvo que se use openChat()).
    const handleSetOpen = useCallback((v: boolean) => {
        setOpen(v);
        if (!v) setView('home');
    }, []);

    const openChat = useCallback((t: Topic = 'question') => {
        setTopic(t);
        setView('message');
        setOpen(true);
    }, []);

    const sendMessage = useCallback(
        async (text: string, opts: { topic?: Topic; files?: File[] } = {}) => {
            const clean = text.trim();
            if (!clean || typing) return;
            const msgTopic = opts.topic ?? topic;
            const files = opts.files ?? [];

            const history = [...messagesRef.current, makeMessage('user', clean)];
            setMessages(history);
            setTyping(true);

            try {
                if (cfg.chat) {
                    const reply = await cfg.chat.send(clean, history);
                    const replies = (Array.isArray(reply) ? reply : [reply]).filter(Boolean).map((t) => makeMessage('agent', t));
                    setMessages((m) => [...m, ...replies]);
                } else {
                    if (cfg.onSubmit) {
                        await cfg.onSubmit({ topic: msgTopic, text: clean, files });
                    } else {
                        const subject = encodeURIComponent(`[${TOPIC_LABEL[msgTopic]}] Support`);
                        window.location.href = `mailto:${email}?subject=${subject}&body=${encodeURIComponent(clean)}`;
                    }
                    setMessages((m) => [...m, makeMessage('agent', cfg.sentMessage ?? DEFAULT_SENT)]);
                }
            } catch {
                setMessages((m) => [...m, makeMessage('agent', `We couldn’t send your message. Try again, or email us at ${email}.`, true)]);
            } finally {
                setTyping(false);
            }
        },
        [cfg.chat, cfg.onSubmit, cfg.sentMessage, email, topic, typing],
    );

    const clearChat = useCallback(() => setMessages([]), []);

    return (
        <ContactContext.Provider value={{ config: cfg, email, open, setOpen: handleSetOpen, openChat, messages, typing, sendMessage, clearChat }}>
            {children}
            <ContactWidget view={view} setView={setView} topic={topic} setTopic={setTopic} />
        </ContactContext.Provider>
    );
}

/* ------------------------------------------------------------------ */
/* Iconos y logo                                                       */
/* ------------------------------------------------------------------ */

const FOCUS_RING =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cw-bg)]';

function CloseIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" aria-hidden>
            <path
                fill="currentColor"
                d="m12 13.4-4.9 4.9a.948.948 0 0 1-.7.275.948.948 0 0 1-.7-.275.948.948 0 0 1-.275-.7c0-.283.092-.517.275-.7l4.9-4.9-4.9-4.9a.948.948 0 0 1-.275-.7c0-.283.092-.517.275-.7a.948.948 0 0 1 .7-.275c.283 0 .517.092.7.275l4.9 4.9 4.9-4.9a.948.948 0 0 1 .7-.275c.283 0 .517.092.7.275a.948.948 0 0 1 .275.7.948.948 0 0 1-.275.7L13.4 12l4.9 4.9a.949.949 0 0 1 .275.7.948.948 0 0 1-.275.7.948.948 0 0 1-.7.275.948.948 0 0 1-.7-.275L12 13.4Z"
            />
        </svg>
    );
}

function ChatIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" aria-hidden>
            <path
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
                d="m5.523 16.36-.382 2.293 3.294-.824.417.072c.371.065.755.099 1.148.099h4a6.667 6.667 0 0 0 0-13.334h-4a6.667 6.667 0 0 0-5.08 10.985l.603.708Zm-2.856 4.973.73-4.385A8.667 8.667 0 0 1 10 2.667h4A8.667 8.667 0 1 1 14 20h-4a8.728 8.728 0 0 1-1.489-.128l-5.843 1.461Z"
            />
        </svg>
    );
}

function BulbIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" aria-hidden>
            <path
                fill="currentColor"
                d="M12 22a2.272 2.272 0 0 1-2-1.15c-.55 0-1.02-.196-1.412-.588A1.926 1.926 0 0 1 8 18.85V15.3a7.244 7.244 0 0 1-2.362-2.575A7.047 7.047 0 0 1 4.75 9.25c0-2.017.704-3.73 2.112-5.138C8.271 2.704 9.983 2 12 2s3.73.704 5.137 2.112c1.409 1.409 2.113 3.121 2.113 5.138 0 1.283-.296 2.45-.887 3.5A7.309 7.309 0 0 1 16 15.3v3.55c0 .55-.196 1.02-.588 1.412A1.926 1.926 0 0 1 14 20.85 2.272 2.272 0 0 1 12 22Zm-2-3.15h4v-.9h-4v.9Zm0-1.9h4V16h-4v.95ZM9.8 14h1.45v-2.7l-1.7-1.7a.678.678 0 0 1-.2-.5c0-.2.075-.375.225-.525a.72.72 0 0 1 .525-.225c.2 0 .375.075.525.225L12 9.95l1.4-1.4c.133-.133.3-.2.5-.2s.375.075.525.225a.72.72 0 0 1 .225.525.72.72 0 0 1-.225.525L12.75 11.3V14h1.45a5.475 5.475 0 0 0 2.2-1.912c.567-.842.85-1.788.85-2.838 0-1.467-.508-2.708-1.525-3.725S13.467 4 12 4s-2.708.508-3.725 1.525S6.75 7.783 6.75 9.25c0 1.05.283 1.996.85 2.838.567.841 1.3 1.479 2.2 1.912Z"
            />
        </svg>
    );
}

function AlertIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" aria-hidden>
            <path
                fill="currentColor"
                d="M12 7a.968.968 0 0 0-.713.287A.967.967 0 0 0 11 8v4.025c0 .283.096.517.287.7.192.183.43.275.713.275s.52-.096.713-.287A.968.968 0 0 0 13 12V7.975a.927.927 0 0 0-.287-.7A.99.99 0 0 0 12 7Zm0 8a.968.968 0 0 0-.713.287A.968.968 0 0 0 11 16c0 .283.096.52.287.712.192.192.43.288.713.288s.52-.096.713-.288A.968.968 0 0 0 13 16a.968.968 0 0 0-.287-.713A.968.968 0 0 0 12 15Zm0-13c1.383 0 2.683.263 3.9.788a10.098 10.098 0 0 1 3.175 2.137c.9.9 1.613 1.958 2.137 3.175A9.738 9.738 0 0 1 22 12a9.738 9.738 0 0 1-.788 3.9 10.098 10.098 0 0 1-2.137 3.175c-.9.9-1.958 1.613-3.175 2.137A9.738 9.738 0 0 1 12 22a9.738 9.738 0 0 1-3.9-.788 10.099 10.099 0 0 1-3.175-2.137c-.9-.9-1.612-1.958-2.137-3.175A9.738 9.738 0 0 1 2 12c0-1.383.263-2.683.788-3.9a10.099 10.099 0 0 1 2.137-3.175c.9-.9 1.958-1.612 3.175-2.137A9.738 9.738 0 0 1 12 2Zm0 2c-2.217 0-4.104.78-5.662 2.338C4.779 7.896 4 9.783 4 12s.78 4.104 2.338 5.663C7.896 19.22 9.783 20 12 20s4.104-.78 5.663-2.337C19.22 16.104 20 14.217 20 12s-.78-4.104-2.337-5.662C16.104 4.779 14.217 4 12 4Z"
            />
        </svg>
    );
}

/** Logo de Stuvvion (SVG original, con id de gradiente único por instancia). */
function StuvvionLogo({ className = 'h-full w-full', bare = false }: { className?: string; bare?: boolean }) {
    const id = `sv-${useId().replace(/:/g, '')}`;
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox={bare ? '440 360 2060 2160' : '0 0 2880 2880'} className={className} role="img" aria-label="Stuvvion">
            {!bare && (
                <>
                    <defs>
                        <linearGradient id={id} x1="503.74" y1="813.86" x2="2756.41" y2="2320.37" gradientUnits="userSpaceOnUse">
                            <stop offset="0" stopColor="#0e1116" />
                            <stop offset="0.62" stopColor="#071428" />
                            <stop offset="1" stopColor="#021735" />
                        </linearGradient>
                    </defs>
                    <rect fill={`url(#${id})`} x="85" y="85" width="2710" height="2710" rx="392.71" />
                </>
            )}
            <path
                fill="#fff"
                d="M1930.92,2068.46a812.33,812.33,0,0,1-149,65.9h-.69c-324.7,78.95-739.33,174-1297.08,345.64,18.88-7.55,1244.22-501.47,1358.18-681.32,76.19-120.13,55.26-219,32.6-271.84,90.27,78.6,177.11,153.08,233.06,214.52C2218.55,1862.86,2063.41,1993,1930.92,2068.46Z"
            />
            <path
                fill="#dbdbdb"
                d="M1780.93,2134.71h1a813.11,813.11,0,0,0,149-65.9c132.15-75.52,287.63-206,177.11-327.45-55.6-61.44-142.79-135.92-233.06-214.52-196-171.28-375.15-349.07-338.08-480.53,33.29-117.39,217.27-223.79,221-225.5-5.15,3.43-206.28,135.57-106.06,208,159.26,115,663.82,402.61,734.52,531C2468.08,1706.69,2393.6,1990.89,1780.93,2134.71Z"
            />
            <path
                fill="#dbdbdb"
                d="M1399.94,1949c-198,151.71-920.9,524.8-933.6,531,186-115.33,719.42-486.71,929.14-659.35a.34.34,0,0,0,.34-.35c10.64-7.55,197.36-146.21,153.08-264.63C1587,1646.28,1627.85,1774.31,1399.94,1949Z"
            />
            <path
                fill="#fff"
                d="M1549.24,1555.67c44.28,118.42-142.44,257.08-153.08,264.63l-.34.35c22-53.2-26.43-79.63-66.25-110.52s-270.12-163.73-424.92-265.67-181.57-203.54-168.18-309.94,73.1-174.7,230-265.66C1131.87,773.44,2302.64,400,2302.64,400s-966.89,466.8-1077.75,648.37,176.76,345,294.15,462.34c1.72,1.71,3.43,3.43,5.15,5.49a98.84,98.84,0,0,1,9.27,11.67l.34.34A116.11,116.11,0,0,1,1549.24,1555.67Z"
            />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/* Piezas pequeñas de UI                                               */
/* ------------------------------------------------------------------ */

function IconButton({ label, onClick, className = '', children }: { label: string; onClick: () => void; className?: string; children: React.ReactNode }) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white ${FOCUS_RING} ${className}`}
        >
            {children}
        </button>
    );
}

function Avatar({ name }: { name: string }) {
    return (
        <span
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,var(--cw-brand-light),var(--cw-brand))] text-[10px] font-bold text-white"
            aria-hidden
        >
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function PoweredBy() {
    const { config } = useContactWidget()!;
    const brand = config.poweredBy === undefined ? DEFAULT_POWERED_BY : config.poweredBy;
    if (!brand) return null;
    return (
        <a
            href={brand.href}
            target="_blank"
            rel="noreferrer"
            className={`mx-auto flex w-fit items-center gap-1.5 rounded-md text-xs text-[var(--cw-muted)] transition-colors hover:text-white ${FOCUS_RING}`}
        >
            <span>Powered by</span>
            <StuvvionLogo className="h-4 w-4 rounded-[3px]" />
            <span className="text-[0.8rem] font-semibold tracking-tight text-white">{brand.name}</span>
        </a>
    );
}

function ChatButton({ icon, children, onClick, primary }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void; primary?: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex h-12 w-full items-center gap-3 rounded-2xl bg-[var(--cw-surface)] px-4 text-left text-[0.95rem] font-medium text-white transition-colors hover:bg-[var(--cw-surface-hover)] ${FOCUS_RING} ${primary ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--cw-bg)]' : ''
                }`}
        >
            <span className="text-white">{icon}</span>
            {children}
        </button>
    );
}

/* ------------------------------------------------------------------ */
/* Vista: inicio                                                       */
/* ------------------------------------------------------------------ */

function HomeView({ onSelect, onClose }: { onSelect: (t: Topic) => void; onClose: () => void }) {
    const { config } = useContactWidget()!;

    const lang = typeof window !== 'undefined' && navigator.language.startsWith('es') ? 'en' : 'es';
    const docsLinks: DocsLink[] = config.docsLinks ?? [
        { title: 'REST Docs', href: `https://stuvvion.com/${lang}/docs/rest`, icon: Braces },
        { title: 'GraphQL Docs', href: `https://stuvvion.com/${lang}/docs/graphql`, icon: Database },
    ];

    return (
        <>
            {/* Hero: degradado oscuro → verde de marca */}
            <div className="relative flex min-h-0 flex-1 flex-col bg-[linear-gradient(180deg,var(--cw-hero-top)_0%,var(--cw-hero-bottom)_100%)] px-6 pb-12 pt-6">
                <div className="absolute right-3 top-3">
                    <IconButton label="Close" onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </div>

                <span className="mt-9 block h-14 w-14 overflow-hidden rounded-xl shadow-lg">{config.logo ?? <StuvvionLogo />}</span>

                <h1 className="mt-auto text-[1.9rem] font-bold leading-[1.15] tracking-tight text-white">
                    <span>Hey {config.userName ?? 'there'}</span>
                    <br />
                    {config.greeting ?? 'How can we help?'}
                </h1>

                {docsLinks.length > 0 && (
                    <ul aria-label="Links" className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
                        {docsLinks.map(({ title, href, icon: Icon }) => (
                            <li key={href}>
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`flex items-center gap-2 rounded-md text-sm font-medium text-white/90 transition-colors hover:text-white ${FOCUS_RING}`}
                                >
                                    {Icon && <Icon className="h-[18px] w-[18px]" />}
                                    {title}
                                </a>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Hoja inferior con las 3 acciones */}
            <div className="-mt-6 space-y-3 rounded-t-3xl bg-[var(--cw-bg)] px-4 pb-3 pt-4 z-1">
                <div className="space-y-2.5">
                    <ChatButton primary icon={<ChatIcon />} onClick={() => onSelect('question')}>
                        Ask a question
                    </ChatButton>
                    <ChatButton icon={<BulbIcon />} onClick={() => onSelect('feedback')}>
                        Send feedback
                    </ChatButton>
                    <ChatButton icon={<AlertIcon />} onClick={() => onSelect('issue')}>
                        Report an issue
                    </ChatButton>
                </div>
                <PoweredBy />
            </div>
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Vista: Send us a message                                            */
/* ------------------------------------------------------------------ */

function TypingIndicator() {
    return (
        <div className="flex w-fit items-center gap-1 rounded-2xl rounded-tl-md bg-[var(--cw-surface)] px-4 py-3.5" role="status" aria-label="Agent is typing">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50 motion-reduce:animate-none"
                    style={{ animationDelay: `${i * 150}ms` }}
                />
            ))}
        </div>
    );
}

function Bubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === 'user';
    const tone = message.error
        ? 'rounded-tl-md border border-red-500/40 bg-red-500/10 text-red-300'
        : isUser
            ? 'ml-auto rounded-tr-md bg-white text-black'
            : 'rounded-tl-md bg-[var(--cw-surface)] text-[var(--cw-text)]';
    return <div className={`w-fit max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${tone}`}>{message.text}</div>;
}

function SenderLabel({ role, agentName }: { role: ChatMessage['role']; agentName: string }) {
    if (role === 'user') return <p className="mb-1.5 mt-3 text-right text-xs text-[var(--cw-muted)]">You</p>;
    return (
        <p className="mb-1.5 mt-3 flex items-center gap-2 text-xs text-[var(--cw-muted)]">
            <Avatar name={agentName} />
            {agentName}
        </p>
    );
}

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

function MessageView({
    topic,
    expanded,
    onToggleExpand,
    onBack,
    onClose,
}: {
    topic: Topic;
    expanded: boolean;
    onToggleExpand: () => void;
    onBack: () => void;
    onClose: () => void;
}) {
    const { config, messages, typing, sendMessage } = useContactWidget()!;
    const agentName = config.agentName ?? 'Support';
    const [draft, setDraft] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const listRef = useRef<HTMLDivElement>(null);
    const areaRef = useRef<HTMLTextAreaElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, typing]);

    useEffect(() => {
        areaRef.current?.focus();
    }, []);

    // Auto-crecimiento del textarea (hasta ~8rem).
    useEffect(() => {
        const el = areaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
    }, [draft]);

    const canSend = !!draft.trim() && !typing;

    const submit = () => {
        if (!canSend) return;
        const text = draft;
        const attached = files;
        setDraft('');
        setFiles([]);
        void sendMessage(text, { topic, files: attached });
    };

    /** Envuelve la selección con marcas de formato (**negrita**, _cursiva_, `código`). */
    const wrap = (before: string, after = before) => {
        const el = areaRef.current;
        if (!el) return;
        const { selectionStart: s, selectionEnd: e, value } = el;
        setDraft(value.slice(0, s) + before + value.slice(s, e) + after + value.slice(e));
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(s + before.length, e + before.length);
        });
    };

    const toolBtn = `flex h-8 w-8 items-center justify-center rounded-lg text-[var(--cw-muted)] transition-colors hover:bg-white/10 hover:text-white ${FOCUS_RING}`;

    return (
        <>
            <div className="flex items-center gap-1.5 px-3 pb-2 pt-3.5">
                <IconButton label="Back" onClick={onBack}>
                    <ChevronLeft className="h-5 w-5" />
                </IconButton>
                <p className="flex-1 text-[0.95rem] font-semibold text-white">Send us a message</p>
                <IconButton label={expanded ? 'Collapse' : 'Expand'} onClick={onToggleExpand}>
                    {expanded ? <Maximize2 className="h-[18px] w-[18px]" /> : <Minimize2 className="h-[18px] w-[18px]" />}
                </IconButton>
                <IconButton label="Close" onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </div>

            <div ref={listRef} className="flex flex-1 flex-col overflow-y-auto px-5 pb-3" role="log" aria-live="polite" aria-label="Conversation">
                {messages.length === 0 && !typing ? (
                    <p className="my-auto text-center text-sm leading-relaxed text-[var(--cw-muted)]">{config.emptyMessage ?? DEFAULT_EMPTY}</p>
                ) : (
                    <>
                        {messages.map((m, i) => (
                            <div key={m.id} className="space-y-1.5">
                                {messages[i - 1]?.role !== m.role && <SenderLabel role={m.role} agentName={agentName} />}
                                <Bubble message={m} />
                            </div>
                        ))}
                        {typing && (
                            <div className="pt-2">
                                <TypingIndicator />
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="px-3 pb-2 pt-1">
                <div className="rounded-2xl border-2 border-[var(--cw-border-strong)] bg-transparent px-3 pb-2 pt-3 transition-colors focus-within:border-[var(--cw-focus)]">
                    <textarea
                        ref={areaRef}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                e.preventDefault();
                                submit();
                            }
                        }}
                        rows={1}
                        maxLength={4000}
                        placeholder="Start typing"
                        aria-label="Type your message"
                        className="block max-h-32 min-h-[1.75rem] w-full resize-none bg-transparent text-[0.95rem] leading-snug text-white outline-none placeholder:text-white/40"
                    />

                    {files.length > 0 && (
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                            {files.map((f, i) => (
                                <li key={`${f.name}-${i}`} className="flex max-w-full items-center gap-1 rounded-md bg-white/10 py-1 pl-2 pr-1 text-xs text-white">
                                    <span className="truncate">{f.name}</span>
                                    <button
                                        type="button"
                                        aria-label={`Remove ${f.name}`}
                                        onClick={() => setFiles((all) => all.filter((_, j) => j !== i))}
                                        className="rounded p-0.5 text-white/70 hover:bg-white/10 hover:text-white"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="mt-2 flex items-center gap-0.5">
                        <input
                            ref={fileRef}
                            type="file"
                            multiple
                            hidden
                            onChange={(e) => {
                                const picked = Array.from(e.target.files ?? []);
                                if (picked.length) setFiles((all) => [...all, ...picked].slice(0, 5));
                                e.target.value = '';
                            }}
                        />
                        <button type="button" aria-label="Attach files" onClick={() => fileRef.current?.click()} className={toolBtn}>
                            <Paperclip className="h-[18px] w-[18px]" />
                        </button>
                        <button type="button" aria-label="Bold" onClick={() => wrap('**')} className={toolBtn}>
                            <Bold className="h-[18px] w-[18px]" />
                        </button>
                        <button type="button" aria-label="Italic" onClick={() => wrap('_')} className={toolBtn}>
                            <Italic className="h-[18px] w-[18px]" />
                        </button>
                        <button type="button" aria-label="Code" onClick={() => wrap('`')} className={toolBtn}>
                            <Code className="h-[18px] w-[18px]" />
                        </button>

                        <button
                            type="button"
                            onClick={submit}
                            disabled={!canSend}
                            aria-label="Send message"
                            className={`ml-auto flex h-10 items-center gap-2 rounded-xl bg-white pl-4 pr-2 text-sm font-semibold text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed ${FOCUS_RING}`}
                        >
                            Send
                            <span className="flex items-center gap-1" aria-hidden>
                                <span className="flex h-6 min-w-6 items-center justify-center rounded-md border border-black/20 px-1 text-[10px] font-semibold">
                                    {isMac() ? <Command className="h-3 w-3" /> : 'Ctrl'}
                                </span>
                                <span className="flex h-6 w-6 items-center justify-center rounded-md border border-black/20">
                                    <CornerDownLeft className="h-3 w-3" />
                                </span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="pb-3 pt-1">
                <PoweredBy />
            </div>
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Contenedor flotante                                                 */
/* ------------------------------------------------------------------ */

function ContactWidget({ view, setView, topic, setTopic }: { view: View; setView: (v: View) => void; topic: Topic; setTopic: (t: Topic) => void }) {
    const { config, open, setOpen } = useContactWidget()!;
    const [expanded, setExpanded] = useState(false);
    const brand = config.brandColor ?? DEFAULT_BRAND;

    // Tema oscuro fijo. Los degradados del hero y del launcher se derivan del color de marca.
    const theme = {
        '--cw-brand': brand,
        '--cw-brand-light': `color-mix(in srgb, ${brand} 70%, #2fe08a)`,
        '--cw-bg': '#0a0a0b',
        '--cw-surface': '#1b1b1e',
        '--cw-surface-hover': '#252528',
        '--cw-text': '#f4f4f5',
        '--cw-muted': '#a1a1aa',
        '--cw-border-strong': 'rgba(255,255,255,0.14)',
        '--cw-focus': '#6366f1',
        '--cw-hero-top': '#040707',
        '--cw-hero-bottom': `color-mix(in srgb, ${brand} 65%, #050a08)`,
    } as React.CSSProperties;

    const size =
        view === 'home'
            ? 'h-[34rem] max-w-[24rem]'
            : expanded
                ? 'h-[42rem] max-w-[32rem]'
                : 'h-[28rem] max-w-[24rem]';

    return (
        <div style={theme} className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3">
            {open && (
                <div
                    role="dialog"
                    aria-label="Contact us"
                    className={`flex max-h-[calc(100dvh-6.5rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[var(--cw-bg)] text-[var(--cw-text)] shadow-2xl duration-200 animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none ${size}`}
                >
                    {view === 'message' ? (
                        <MessageView
                            topic={topic}
                            expanded={expanded}
                            onToggleExpand={() => setExpanded((v) => !v)}
                            onBack={() => setView('home')}
                            onClose={() => setOpen(false)}
                        />
                    ) : (
                        <HomeView
                            onSelect={(t) => {
                                setTopic(t);
                                setView('message');
                            }}
                            onClose={() => setOpen(false)}
                        />
                    )}
                </div>
            )}

            {/* Launcher: mismo degradado verde que el hero, con sombra verde y brillo superior */}
            <button
                type="button"
                aria-label={open ? 'Close contact options' : 'Contact us'}
                aria-expanded={open}
                onClick={() => setOpen(!open)}
                className={`relative flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-[linear-gradient(145deg,var(--cw-brand-light)_0%,var(--cw-brand)_55%,var(--cw-hero-bottom)_100%)] text-white shadow-[0_10px_28px_-4px_color-mix(in_srgb,var(--cw-brand)_75%,transparent),0_4px_10px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-transform hover:scale-105 active:scale-95 motion-reduce:transition-none ${FOCUS_RING}`}
            >
                <span
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-200 motion-reduce:transition-none ${open ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
                    aria-hidden
                >
                    <StuvvionLogo bare className="h-8 w-8 drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]" />
                </span>
                <span
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-200 motion-reduce:transition-none ${open ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'}`}
                    aria-hidden
                >
                    <ChevronDown className="h-6 w-6" />
                </span>
            </button>
        </div>
    );
}