// ==========================================================================
// ShalomIndustrial — Asistente de Voz Inteligente (Soporte ElevenLabs + WebSpeech)
// ==========================================================================

(function () {
    // Configuración y Estado
    const STATE = {
        isOpen: false,
        isListening: false,
        isSpeaking: false,
        soundEnabled: true,
        elevenLabsKey: localStorage.getItem('shalom_elevenlabs_key') || '',
        elevenLabsVoiceId: localStorage.getItem('shalom_elevenlabs_voice') || '21m00Tcm4TlvDq8ikWAM', // Rachel / Español
        currentAudio: null
    };

    // Base de Conocimiento de ShalomIndustrial
    const KNOWLEDGE_BASE = [
        {
            keywords: ['precio', 'costo', 'cuanto cuesta', 'vale', 'cotizacion', 'lista'],
            answer: 'Nuestros precios vigentes son: Cera con Carnauba $9,000 pesos; Cera Normal $5,000 pesos; Saniclean de 20 litros $1,350 pesos; Sin Gras de 20 litros $1,350 pesos; y Sin Gras industrial de 200 litros en $9,500 pesos. Es importante recordar que ninguno de estos precios incluye IVA.'
        },
        {
            keywords: ['carnauba', 'cera carnauba', 'brillo premium', 'espejo'],
            answer: 'La Cera con Carnauba tiene un precio de $9,000 pesos. Es nuestra formulación premium con carnauba pura de grado alimenticio, ideal para dar un brillo espejo y máxima protección contra la pérdida de peso en cítricos de exportación.'
        },
        {
            keywords: ['cera normal', 'estandar', 'normal'],
            answer: 'La Cera Normal tiene un costo de $5,000 pesos. Es perfecta para líneas comerciales continuas, ofreciendo un acabado natural uniforme y protección efectiva contra la deshidratación de la fruta.'
        },
        {
            keywords: ['saniclean', 'desinfectante', 'sanitizante', 'hongo', 'lavado'],
            answer: 'Saniclean de 20 litros tiene un costo de $1,350 pesos. Es un sanitizante especializado de amplio espectro para tinas de lavado y desinfección de cítricos que no deja residuos nocivos.'
        },
        {
            keywords: ['sin gras', 'singras', 'desengrasante', 'fumagina', 'grasa'],
            answer: 'Sin Gras viene en dos presentaciones: porrón de 20 litros en $1,350 pesos, y tambor industrial de 200 litros en $9,500 pesos. Remueve fumagina, polvo y grasa natural de la cáscara para que la cera se adhiera perfectamente.'
        },
        {
            keywords: ['iva', 'impuesto', 'factura'],
            answer: 'Ninguno de los precios mostrados en el catálogo incluye IVA. Al emitir tu factura se desglosará el impuesto correspondiente.'
        },
        {
            keywords: ['exportacion', 'paises', 'eeuu', 'estados unidos', 'europa', 'fda'],
            answer: 'En ShalomIndustrial contamos con amplia experiencia en exportación. Nuestros productos cumplen con estándares de grado alimenticio aprobados para mercados internacionales como Estados Unidos y la Unión Europea.'
        },
        {
            keywords: ['contacto', 'telefono', 'whatsapp', 'donde estan', 'ubicacion', 'hablar'],
            answer: 'Puedes contactar directamente a nuestros ingenieros al WhatsApp y teléfono 229 978 3526, o bien escribir tus datos en nuestro formulario web y te llamaremos en menos de 24 horas.'
        },
        {
            keywords: ['limon', 'persa', 'verde'],
            answer: 'Para limón persa recomendamos aplicar Sin Gras en el lavado y Cera con Carnauba para mantener el color verde intenso, sellar la humedad y asegurar un brillo duradero en trayectos largos.'
        },
        {
            keywords: ['naranja', 'valencia'],
            answer: 'Para naranja, nuestra Cera Normal y Carnauba reducen la transpiración en cámaras de frío y evitan que la cáscara se arrugue durante el traslado comercial.'
        },
        {
            keywords: ['pina', 'piña', 'md2'],
            answer: 'Para piña contamos con formulaciones protectoras que conservan la turgencia y lozanía de la cáscara hasta llegar a los anaqueles del comprador.'
        }
    ];

    // Inyectar HTML del Widget en el DOM
    function injectWidget() {
        const widgetContainer = document.createElement('div');
        widgetContainer.id = 'shalom-voice-widget';
        widgetContainer.innerHTML = `
            <!-- Botón Flotante del Asistente -->
            <button id="shalom-voice-btn" class="voice-floating-btn" aria-label="Abrir Asistente de Voz de ShalomIndustrial">
                <div class="voice-btn-pulse"></div>
                <div class="voice-avatar-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                </div>
                <span class="voice-btn-text">Asistente de Voz AI</span>
            </button>

            <!-- Ventana del Asistente de Voz -->
            <div id="shalom-voice-modal" class="voice-modal" style="display: none;">
                <div class="voice-modal-header">
                    <div class="voice-header-info">
                        <div class="voice-status-indicator"></div>
                        <div>
                            <h4>Asistente Shalom</h4>
                            <span id="voice-engine-label" class="voice-engine-badge">Voz Nativa / ElevenLabs Ready</span>
                        </div>
                    </div>
                    <div class="voice-header-actions">
                        <button id="voice-settings-btn" title="Configurar ElevenLabs API" class="voice-icon-btn">⚙️</button>
                        <button id="voice-mute-btn" title="Activar/Silenciar Audio" class="voice-icon-btn">🔊</button>
                        <button id="voice-close-btn" title="Cerrar Asistente" class="voice-icon-btn">✕</button>
                    </div>
                </div>

                <!-- Orbe de Audio Interactivo -->
                <div class="voice-orb-container">
                    <div id="voice-sound-orb" class="voice-sound-orb">
                        <div class="orb-ring ring-1"></div>
                        <div class="orb-ring ring-2"></div>
                        <div class="orb-core">
                            <span id="voice-orb-icon">🎙️</span>
                        </div>
                    </div>
                    <p id="voice-status-text" class="voice-status-text">Presiona el micrófono para hablar o escribe tu duda</p>
                </div>

                <!-- Historial de Conversación -->
                <div id="voice-chat-history" class="voice-chat-history">
                    <div class="voice-msg msg-assistant">
                        ¡Hola! Soy tu asistente de ShalomIndustrial. ¿Tienes dudas sobre nuestras ceras para limón, naranja, desengrasantes o precios? Pregúntame con voz o texto.
                    </div>
                </div>

                <!-- Botones de Acceso Rápido -->
                <div class="voice-quick-tags">
                    <button class="voice-tag-btn" data-query="¿Cuáles son los precios de los productos?">💰 Precios</button>
                    <button class="voice-tag-btn" data-query="¿Qué cera me recomiendan para limón de exportación?">🍋 Cera para Limón</button>
                    <button class="voice-tag-btn" data-query="¿Los precios incluyen IVA?">📋 ¿Incluyen IVA?</button>
                    <button class="voice-tag-btn" data-query="Quiero cotizar para mi empaque">📦 Cotizar ahora</button>
                </div>

                <!-- Barra de Entrada -->
                <div class="voice-modal-footer">
                    <button id="voice-mic-btn" class="voice-mic-action" title="Hablar por micrófono">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                            <line x1="12" y1="19" x2="12" y2="23"></line>
                        </svg>
                    </button>
                    <input type="text" id="voice-text-input" placeholder="Escribe tu pregunta aquí..." autocomplete="off">
                    <button id="voice-send-btn" class="voice-send-action" title="Enviar">➤</button>
                </div>

                <!-- Panel de Configuración de ElevenLabs -->
                <div id="voice-settings-panel" class="voice-settings-panel" style="display: none;">
                    <h5>⚙️ Configuración de Voz ElevenLabs</h5>
                    <p class="settings-desc">Integra tu API Key de ElevenLabs para reproducir respuestas con voz hiperrealista.</p>
                    <label>ElevenLabs API Key:</label>
                    <input type="password" id="input-elevenlabs-key" placeholder="xi-api-key..." value="${STATE.elevenLabsKey}">
                    <label>Voz (Voice ID):</label>
                    <input type="text" id="input-elevenlabs-voice" placeholder="Ej: 21m00Tcm4TlvDq8ikWAM" value="${STATE.elevenLabsVoiceId}">
                    <div class="settings-help">
                        <small>💡 Pasos para obtenerla:<br>
                        1. Regístrate gratis en <strong>elevenlabs.io</strong>.<br>
                        2. Ve a tu Perfil ➔ <em>API Keys</em> ➔ Crear nueva llave.<br>
                        3. Pégala aquí y guarda los cambios.</small>
                    </div>
                    <div class="settings-actions">
                        <button id="btn-save-settings" class="btn btn-main btn-sm">Guardar y Activar</button>
                        <button id="btn-close-settings" class="btn btn-ghost btn-sm">Cancelar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(widgetContainer);
        bindEvents();
        updateEngineBadge();
    }

    // Vinculación de Eventos
    function bindEvents() {
        const floatBtn = document.getElementById('shalom-voice-btn');
        const modal = document.getElementById('shalom-voice-modal');
        const closeBtn = document.getElementById('voice-close-btn');
        const micBtn = document.getElementById('voice-mic-btn');
        const sendBtn = document.getElementById('voice-send-btn');
        const input = document.getElementById('voice-text-input');
        const muteBtn = document.getElementById('voice-mute-btn');
        const settingsBtn = document.getElementById('voice-settings-btn');
        const settingsPanel = document.getElementById('voice-settings-panel');
        const saveSettingsBtn = document.getElementById('btn-save-settings');
        const closeSettingsBtn = document.getElementById('btn-close-settings');
        const quickTags = document.querySelectorAll('.voice-tag-btn');

        // Abrir / Cerrar Modal
        floatBtn.addEventListener('click', () => {
            STATE.isOpen = !STATE.isOpen;
            modal.style.display = STATE.isOpen ? 'flex' : 'none';
            if (STATE.isOpen) input.focus();
        });

        closeBtn.addEventListener('click', () => {
            STATE.isOpen = false;
            modal.style.display = 'none';
            stopSpeaking();
        });

        // Enviar Texto
        sendBtn.addEventListener('click', () => handleUserQuery(input.value));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleUserQuery(input.value);
        });

        // Botones de acceso rápido
        quickTags.forEach(btn => {
            btn.addEventListener('click', () => {
                handleUserQuery(btn.getAttribute('data-query'));
            });
        });

        // Micrófono
        micBtn.addEventListener('click', toggleListening);

        // Mute / Unmute
        muteBtn.addEventListener('click', () => {
            STATE.soundEnabled = !STATE.soundEnabled;
            muteBtn.textContent = STATE.soundEnabled ? '🔊' : '🔇';
            if (!STATE.soundEnabled) stopSpeaking();
        });

        // Configuración ElevenLabs
        settingsBtn.addEventListener('click', () => {
            settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
        });

        closeSettingsBtn.addEventListener('click', () => {
            settingsPanel.style.display = 'none';
        });

        saveSettingsBtn.addEventListener('click', () => {
            const key = document.getElementById('input-elevenlabs-key').value.trim();
            const voice = document.getElementById('input-elevenlabs-voice').value.trim() || '21m00Tcm4TlvDq8ikWAM';
            STATE.elevenLabsKey = key;
            STATE.elevenLabsVoiceId = voice;
            localStorage.setItem('shalom_elevenlabs_key', key);
            localStorage.setItem('shalom_elevenlabs_voice', voice);
            settingsPanel.style.display = 'none';
            updateEngineBadge();
            addAssistantMessage('✓ Configuración de voz actualizada. Ahora hablaré utilizando el motor configurado.');
            speakText('Configuración de voz guardada correctamente.');
        });
    }

    function updateEngineBadge() {
        const badge = document.getElementById('voice-engine-label');
        if (!badge) return;
        if (STATE.elevenLabsKey) {
            badge.textContent = '⚡ ElevenLabs AI Activo';
            badge.style.color = 'var(--limon)';
            badge.style.borderColor = 'rgba(232, 212, 77, 0.4)';
        } else {
            badge.textContent = '🎙️ Voz WebSpeech Nativa';
            badge.style.color = '#8dafa1';
            badge.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        }
    }

    // Procesar Consulta del Usuario
    function handleUserQuery(query) {
        if (!query || !query.trim()) return;
        const text = query.trim();
        const input = document.getElementById('voice-text-input');
        if (input) input.value = '';

        addUserMessage(text);
        setStatus('Procesando respuesta...');

        setTimeout(() => {
            const answer = generateAnswer(text);
            addAssistantMessage(answer);
            speakText(answer);
        }, 300);
    }

    // Generador de Respuestas con Base de Conocimiento
    function generateAnswer(query) {
        const q = query.toLowerCase();

        // 1. Detección de intención de cotización directa
        if (q.includes('cotizar') || q.includes('comprar') || q.includes('pedido') || q.includes('cotizacion')) {
            return '¡Con gusto te ayudamos a cotizar! Puedes llenar el formulario que está en esta misma página o bien escribirnos al WhatsApp directo al 229 978 3526 con tu volumen requerido.';
        }

        // 2. Búsqueda en la Base de Conocimiento por coincidencia de palabras clave
        for (const item of KNOWLEDGE_BASE) {
            for (const kw of item.keywords) {
                if (q.includes(kw)) {
                    return item.answer;
                }
            }
        }

        // 3. Respuesta por defecto si no coincide
        return 'En ShalomIndustrial ofrecemos cera con carnauba ($9,000), cera normal ($5,000), sanitizante Saniclean 20L ($1,350) y desengrasante Sin Gras (20L en $1,350 y 200L en $9,500). ¿Te gustaría conocer detalles de aplicación o precios para algún cultivo específico?';
    }

    // Renderizar Mensajes en el Chat
    function addUserMessage(text) {
        const chat = document.getElementById('voice-chat-history');
        const div = document.createElement('div');
        div.className = 'voice-msg msg-user';
        div.textContent = text;
        chat.appendChild(div);
        chat.scrollTop = chat.scrollHeight;
    }

    function addAssistantMessage(text) {
        const chat = document.getElementById('voice-chat-history');
        const div = document.createElement('div');
        div.className = 'voice-msg msg-assistant';
        div.textContent = text;
        chat.appendChild(div);
        chat.scrollTop = chat.scrollHeight;
    }

    function setStatus(text) {
        const statusEl = document.getElementById('voice-status-text');
        if (statusEl) statusEl.textContent = text;
    }

    // ----------------------------------------------------
    // Síntesis de Voz: ElevenLabs con Fallback Nativo
    // ----------------------------------------------------
    async function speakText(text) {
        if (!STATE.soundEnabled) {
            setStatus('Audio silenciado (presiona 🔊 para activar)');
            return;
        }

        stopSpeaking();
        setSpeakingVisuals(true);
        setStatus('Hablando...');

        // Intento con ElevenLabs si hay API Key disponible
        if (STATE.elevenLabsKey) {
            try {
                const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${STATE.elevenLabsVoiceId}`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'Content-Type': 'application/json',
                        'xi-api-key': STATE.elevenLabsKey
                    },
                    body: JSON.stringify({
                        text: text,
                        model_id: 'eleven_multilingual_v2',
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.75
                        }
                    })
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const audioUrl = URL.createObjectURL(blob);
                    STATE.currentAudio = new Audio(audioUrl);
                    STATE.currentAudio.onended = () => {
                        setSpeakingVisuals(false);
                        setStatus('Listo. Puedes seguir preguntando.');
                        URL.revokeObjectURL(audioUrl);
                    };
                    STATE.currentAudio.play();
                    return;
                } else {
                    console.warn('ElevenLabs API respondió con error, activando voz nativa de respaldo...');
                }
            } catch (err) {
                console.error('Error al invocar ElevenLabs:', err);
            }
        }

        // Fallback: Síntesis nativa del navegador Web Speech API
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-MX';
            utterance.rate = 1.02;
            utterance.pitch = 1.0;

            const voices = window.speechSynthesis.getVoices();
            const esVoice = voices.find(v => v.lang.startsWith('es') || v.lang.includes('ES') || v.lang.includes('MX'));
            if (esVoice) utterance.voice = esVoice;

            utterance.onend = () => {
                setSpeakingVisuals(false);
                setStatus('Listo. ¿En qué más puedo apoyarte?');
            };

            utterance.onerror = () => {
                setSpeakingVisuals(false);
                setStatus('Listo.');
            };

            window.speechSynthesis.speak(utterance);
        } else {
            setSpeakingVisuals(false);
            setStatus('Tu navegador no soporta síntesis de voz.');
        }
    }

    function stopSpeaking() {
        if (STATE.currentAudio) {
            STATE.currentAudio.pause();
            STATE.currentAudio = null;
        }
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setSpeakingVisuals(false);
    }

    function setSpeakingVisuals(speaking) {
        STATE.isSpeaking = speaking;
        const orb = document.getElementById('voice-sound-orb');
        if (orb) {
            if (speaking) {
                orb.classList.add('is-speaking');
            } else {
                orb.classList.remove('is-speaking');
            }
        }
    }

    // ----------------------------------------------------
    // Reconocimiento de Voz (Micrófono)
    // ----------------------------------------------------
    function toggleListening() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('El reconocimiento de voz por micrófono no está soportado en este navegador. Puedes escribir tu duda en el campo de texto.');
            return;
        }

        const micBtn = document.getElementById('voice-mic-btn');

        if (STATE.isListening) {
            STATE.isListening = false;
            micBtn.classList.remove('is-recording');
            setStatus('Micrófono detenido.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-MX';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            STATE.isListening = true;
            micBtn.classList.add('is-recording');
            setStatus('🎙️ Escuchando... Di tu pregunta con claridad.');
            stopSpeaking();
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            STATE.isListening = false;
            micBtn.classList.remove('is-recording');
            handleUserQuery(transcript);
        };

        recognition.onerror = (event) => {
            STATE.isListening = false;
            micBtn.classList.remove('is-recording');
            setStatus('No se detectó audio o se canceló el permiso.');
        };

        recognition.onend = () => {
            STATE.isListening = false;
            micBtn.classList.remove('is-recording');
        };

        recognition.start();
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectWidget);
    } else {
        injectWidget();
    }
})();
