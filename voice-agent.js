// ==========================================================================
// ShalomIndustrial — Asistente de Voz Inteligente de Alta Precisión
// Soporte Completo: ElevenLabs AI (Sarah / Multilingual v2) + WebSpeech API
// Base de Conocimiento Postcosecha Avanzada + Inteligencia Conversacional
// ==========================================================================

(function () {
    'use strict';

    // ----------------------------------------------------
    // Configuración Global y Persistencia de ElevenLabs
    // ----------------------------------------------------
    const DEFAULT_ELEVENLABS_KEY = 'sk_a2de0f35816356f014df5ff165184e96a65e05f147dd091d';
    const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah - Voz ejecutiva, clara y natural

    if (!localStorage.getItem('shalom_elevenlabs_key')) {
        localStorage.setItem('shalom_elevenlabs_key', DEFAULT_ELEVENLABS_KEY);
    }
    if (!localStorage.getItem('shalom_elevenlabs_voice')) {
        localStorage.setItem('shalom_elevenlabs_voice', DEFAULT_VOICE_ID);
    }

    const STATE = {
        isOpen: false,
        isListening: false,
        isSpeaking: false,
        soundEnabled: true,
        elevenLabsKey: localStorage.getItem('shalom_elevenlabs_key') || DEFAULT_ELEVENLABS_KEY,
        elevenLabsVoiceId: localStorage.getItem('shalom_elevenlabs_voice') || DEFAULT_VOICE_ID,
        currentAudio: null
    };

    // ----------------------------------------------------
    // Utilidades Lingüísticas y Normalización de Texto
    // ----------------------------------------------------
    function normalizeText(str) {
        if (!str) return '';
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Quita acentos y tildes
            .replace(/[¿?¡!.,;:()\-_\/"']/g, ' ') // Quita signos de puntuación
            .replace(/\s+/g, ' ')
            .trim();
    }

    function getLiveTimeInfo() {
        const now = new Date();
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const timeStr = now.toLocaleTimeString('es-MX', timeOptions);
        const dateStr = now.toLocaleDateString('es-MX', dateOptions);
        return { timeStr, dateStr };
    }

    // ----------------------------------------------------
    // Base de Conocimiento Especializada y Multitemática
    // ----------------------------------------------------
    const ADVANCED_KNOWLEDGE_BASE = [
        // ================= PRODUCTOS Y PRECIOS =================
        {
            id: 'precios_generales',
            patterns: [
                'precio', 'costo', 'cuanto cuesta', 'cuanto vale', 'lista de precios', 
                'catalogo de precios', 'cotizacion', 'tarifas', 'cuanto sale', 'valores'
            ],
            answer: 'Nuestra lista de precios oficial vigente es: Cera con Carnauba a $9,000 pesos; Cera Normal a $5,000 pesos; Saniclean de 20 litros a $1,350 pesos; Sin Gras de 20 litros a $1,350 pesos; y Sin Gras tambor industrial de 200 litros a $9,500 pesos. Es fundamental destacar que ninguno de estos precios incluye IVA (16%). Ofrecemos facturación formal CFDI y tarifas especiales por volumen para líneas de empaque.'
        },
        {
            id: 'iva_facturacion',
            patterns: ['iva', 'impuesto', 'factura', 'facturacion', 'cfdi', 'incluye iva', 'es con iva', 'sin iva', 'fiscal'],
            answer: 'Ninguno de los precios de nuestro catálogo incluye IVA. Al procesar su compra se adiciona el 16% de IVA correspondiente y emitimos su factura fiscal electrónica CFDI de forma inmediata. Aceptamos transferencias bancarias interbancarias SPEI y pagos empresariales.'
        },
        {
            id: 'cera_carnauba',
            patterns: [
                'carnauba', 'cera carnauba', 'brillo espejo', 'cera premium', 'cera de carnauba', 
                'cera para exportacion', 'cera 9000', 'cera nueve mil', 'copernicia'
            ],
            answer: 'Nuestra Cera con Carnauba premium tiene un precio de $9,000 pesos más IVA. Está formulada con extracto botánico puro de palma Copernicia prunifera grado alimenticio. Genera una película microdispersa semipermeable que reduce la transpiración y pérdida de peso de la fruta hasta en un 40%. Otorga un brillo espejo de alta refracción que no produce blanqueamiento o blushing ante la condensación en cámaras frigoríficas. Se aplica a razón de un litro por cada tonelada de fruta sobre rodillos de felpa, con secado en túnel a 48 o 50 grados Celsius.'
        },
        {
            id: 'cera_normal',
            patterns: [
                'cera normal', 'cera estandar', 'cera tradicional', 'cera de cinco mil', 
                'cera 5000', 'cera economica', 'cera nacional'
            ],
            answer: 'La Cera Normal tiene un costo de $5,000 pesos más IVA. Es una formulación balanceada con resinas y polietilenos de grado alimenticio, diseñada para mercado nacional y fletes de media distancia. Otorga un acabado brillante natural, sella microheridas epidérmicas y previene el arrugamiento prematuro por deshidratación. Es altamente fluida y compatible con sistemas de goteo continuo o aspersión sobre cepillos de crin natural sin taponar boquillas.'
        },
        {
            id: 'diferencia_ceras',
            patterns: [
                'diferencia entre ceras', 'cual cera es mejor', 'comparar ceras', 'carnauba o normal', 
                'que cera me conviene', 'cual me recomiendas de las dos'
            ],
            answer: 'La diferencia principal radica en la formulación y el tiempo de tránsito de su fruta: la Cera con Carnauba ($9,000 MXN) utiliza ceras botánicas de alto punto de fusión, ideal para exportación marítima a Estados Unidos o Europa porque mantiene el brillo espejo y retiene el peso semanas en refrigeración. La Cera Normal ($5,000 MXN) es la opción ideal y más costo-eficiente para empaques orientados a centrales de abasto y consumo nacional.'
        },
        {
            id: 'saniclean',
            patterns: [
                'saniclean', 'desinfectante', 'sanitizante', 'antiseptico', 'penicillium', 
                'hongo', 'hongos', 'moho', 'pudricion', 'saniclean 20', 'saniclean precio'
            ],
            answer: 'Saniclean en porrón de 20 litros tiene un costo de $1,350 pesos más IVA. Es un microbicida oxidante postcosecha de amplio espectro para tinas de inmersión y drenchers. Inactiva con rapidez esporas de Penicillium digitatum (moho verde), Penicillium italicum (moho azul) y Geotrichum candidum. Es 100% biodegradable, no deja residuos tóxicos, no altera las cualidades organolépticas de la fruta y optimiza la superficie del cítrico para una adherencia superior de la cera.'
        },
        {
            id: 'sin_gras',
            patterns: [
                'sin gras', 'singras', 'desengrasante', 'fumagina', 'grasa', 'cochinilla', 
                'limpiador de fruta', 'desincrustante', 'tambor 200', 'porron 20'
            ],
            answer: 'Sin Gras es nuestro desengrasante bioalcalino postcosecha: el porrón de 20 litros cuesta $1,350 pesos y el tambor de 200 litros cuesta $9,500 pesos, ambos más IVA. Saponifica grasas cuticulares, desintegra la mielesilla y desprende la costra de fumagina sin quemar las glándulas de aceite esencial, evitando la oleocelosis. Prepara la cáscara para que el sanitizante Saniclean y la cera entren en contacto directo y homogéneo con el flavedo.'
        },
        {
            id: 'rendimiento_dosificacion',
            patterns: [
                'rendimiento', 'dosis', 'dosificacion', 'cuanto rinde', 'como se aplica', 
                'cuantos litros por tonelada', 'dilucion', 'temperatura de secado'
            ],
            answer: 'En ceras, el rendimiento promedio es de 1 litro por cada 1,000 a 1,200 kilogramos de fruta limpia, aplicando sobre cepillos de cerda natural o felpa y pasando por túnel de secado a temperatura controlada entre 45 y 52 grados Celsius durante 45 a 60 segundos. Para Sin Gras y Saniclean en tinas y drenchers, se recomienda una dilución del 0.5% al 2% según la carga microbiológica y suciedad del lote.'
        },

        // ================= CULTIVOS Y POSTCOSECHA =================
        {
            id: 'limon_persa',
            patterns: ['limon persa', 'limon verde', 'limon de exportacion', 'latifolia', 'limon mexicano', 'limones'],
            answer: 'En limón persa de exportación, la meta crítica es conservar el color verde esmeralda, evitar el amarillamiento prematuro y controlar la pérdida de peso. Recomendamos el protocolo integral: desengrasar con Sin Gras para retirar polvo y fumagina, desinfectar con Saniclean para abatir mohos, y sellar con Cera con Carnauba. En frío, transporte a temperatura de 8 a 10 grados Celsius con humedad relativa del 90 al 95 por ciento para prevenir daño por frío.'
        },
        {
            id: 'naranja_valencia',
            patterns: ['naranja', 'naranjas', 'valencia', 'navel', 'citricos dulces'],
            answer: 'Para naranja dulce, el objetivo prioritario es evitar la deshidratación y retrasar la senescencia de la corteza. Nuestra Cera Normal o Cera Carnauba aporta un acabado reluciente que realza el color naranja y sella los poros contra la entrada de Penicillium. En cámaras de conservación, la temperatura óptima recomendada es de 4 a 6 grados Celsius con 90% de humedad relativa.'
        },
        {
            id: 'toronja_mandarina_tropicales',
            patterns: ['toronja', 'mandarina', 'pina', 'piña', 'mango', 'pomelo', 'tangerina'],
            answer: 'En toronja y mandarina, nuestras ceras previenen el colapso celular por manchas de frío y el desprendimiento de cáscara suelta. Para piña MD2 y mango, nuestras formulaciones protegen el pedúnculo contra pudriciones por Thielaviopsis y antracnosis, reteniendo la turgencia y lozanía de la fruta hasta su llegada a los anaqueles internacionales.'
        },
        {
            id: 'oleocelosis',
            patterns: ['oleocelosis', 'manchas en la cascara', 'ruptura de glandulas', 'quemadura de aceite', 'aceite esencial'],
            answer: 'La oleocelosis ocurre por la ruptura traumática de las glándulas de aceites esenciales del flavedo. Al liberarse, el aceite es tóxico para las células epidérmicas circundantes, provocando manchas pardas hundidas e irreversibles. Para prevenirla, nunca corte la fruta con lluvia o rocío matutino cuando la turgencia es alta, manéjela con suavidad en cajones y use Sin Gras a dosis recomendada para una limpieza libre de fricción agresiva.'
        },
        {
            id: 'fumagina_control',
            patterns: ['fumagina', 'negrilla', 'capnodium', 'hongo negro', 'fruta sucia', 'polvillo negro'],
            answer: 'La fumagina es un hongo saprofito negro (Capnodium spp.) que se alimenta de la mielecilla secretada por plagas como pulgones y mosca blanca. Aunque no penetra la pulpa, demerita el valor comercial del cítrico a segunda o desecho. Nuestro desengrasante Sin Gras disuelve y saponifica esta capa cerosa de forma inmediata en los rodillos de lavado, dejando la fruta completamente limpia sin dañar la cáscara.'
        },
        {
            id: 'cadena_frio_exportacion',
            patterns: [
                'cadena de frio', 'reefer', 'contenedor', 'temperatura de viaje', 
                'humedad relativa', 'ventilacion', 'transporte maritimo'
            ],
            answer: 'Mantener la cadena de frío es la regla de oro para exportar. Para limón persa se aconseja regular el contenedor Reefer a 9 grados Celsius con 90% de humedad y una renovación de aire fresco constante para desalojar etileno y dióxido de carbono. Para naranja, la temperatura idónea es de 5 grados Celsius. Nuestra Cera Carnauba está diseñada específicamente para soportar estas travesías sin perder firmeza ni brillo.'
        },
        {
            id: 'linea_empaque_proceso',
            patterns: [
                'linea de empaque', 'proceso de empaque', 'maquinaria', 'tina de vaciado', 
                'como funciona el empaque', 'etapas de empaque', 'drencher'
            ],
            answer: 'Una línea de empaque citrícola de alto rendimiento sigue esta secuencia: 1) Vaciado de campo en agua o drencher; 2) Lavado y desengrase con Sin Gras en rodillos de cerda; 3) Desinfección en ducha o tina con Saniclean; 4) Secado preliminar sobre esponjas; 5) Aplicación dosificada de Cera con Carnauba sobre cepillos de crin; 6) Túnel de secado por aire caliente a 50°C; 7) Selección manual de calidades; 8) Calibración electrónica por peso y diámetro; y 9) Envasado, paletizado y preenfriamiento hacia la cámara fría.'
        },
        {
            id: 'normativas_fda_senasica',
            patterns: ['fda', 'senasica', 'certificacion', 'inocuidad', 'globalgap', 'primus', 'europa', 'exportar a estados unidos'],
            answer: 'Todos los productos de ShalomIndustrial están formulados con materias primas de grado alimenticio autorizadas bajo estándares de la FDA en Estados Unidos y normativas fitosanitarias de Senasica y la Unión Europea. No dejan residuos por encima de los Límites Máximos Permitidos (LMR) y son plenamente compatibles con auditorías de inocuidad GlobalGAP, PrimusGFS y HACCP.'
        },

        // ================= EMPRESA, CONTACTO Y LOGÍSTICA =================
        {
            id: 'empresa_shalom',
            patterns: ['quienes son', 'que es shalom', 'empresa shalom', 'shalom industrial', 'historia', 'acerca de'],
            answer: 'ShalomIndustrial es una empresa mexicana líder en formulaciones biotecnológicas y químicas para el tratamiento postcosecha de frutas y cítricos de exportación. Desarrollamos soluciones integrales de desengrase, sanitización y ceras protectoras para maximizar la vida de anaquel, reducir la merma de peso y asegurar la máxima rentabilidad en los empaques agrícolas del país.'
        },
        {
            id: 'contacto_directo',
            patterns: [
                'contacto', 'telefono', 'whatsapp', 'donde estan', 'ubicacion', 
                'hablar con alguien', 'asesor', 'ingeniero', 'llamar'
            ],
            answer: 'Puedes contactar directamente a nuestros ingenieros postcosecha y área de ventas al WhatsApp y teléfono +52 229 978 3526. También puedes ingresar tus datos en el formulario de este sitio web y un especialista técnico te llamará en menos de 24 horas hábiles.'
        },
        {
            id: 'envios_cobertura',
            patterns: [
                'envios', 'hacen envios', 'a donde envian', 'cobertura', 'martinez de la torre', 
                'veracruz', 'michoacan', 'colima', 'tamaulipas', 'flete'
            ],
            answer: 'Contamos con cobertura logística a toda la República Mexicana. Realizamos envíos diarios a las principales regiones citrícolas: Martínez de la Torre, Cuitláhuac y Álamo en Veracruz; Apatzingán en Michoacán; Tecomán en Colima; Montemorelos en Nuevo León; así como zonas productoras en Tamaulipas, Oaxaca y Yucatán, con entregas consolidadas en porrones y tambores de 200 litros.'
        },

        // ================= CONVERSACIÓN COTIDIANA Y GENERAL ("ALGO DE LO USUAL") =================
        {
            id: 'saludo_general',
            patterns: ['hola', 'buen dia', 'buenos dias', 'buenas tardes', 'buenas noches', 'que tal', 'saludos', 'que onda', 'hey'],
            answer: '¡Hola! Muy buen día. Soy el asistente de inteligencia artificial de ShalomIndustrial. Estoy aquí para resolver cualquier duda sobre nuestros productos químicos postcosecha, procesos de empaque de cítricos, precios o cotizaciones de exportación. ¿En qué puedo orientarte hoy?'
        },
        {
            id: 'quien_eres_identidad',
            patterns: ['quien eres', 'como te llamas', 'que haces', 'cual es tu funcion', 'eres una ia', 'eres un robot', 'eres real'],
            answer: 'Soy el asistente virtual de inteligencia artificial de ShalomIndustrial. Fui desarrollado para brindar asesoría técnica especializada a ingenieros de empaque, productores y exportadores citrícolas sobre tratamientos químicos postcosecha, dosis de aplicación, normativas y cotizaciones en tiempo real.'
        },
        {
            id: 'como_estas',
            patterns: ['como estas', 'como te va', 'que tal tu dia', 'como andas', 'todo bien'],
            answer: '¡Me encuentro excelente y con toda la energía para apoyarte! Totalmente sincronizado con la base de conocimientos técnicos de ShalomIndustrial para resolver tus consultas sobre empaques, ceras y exportación agrícola. ¿En qué proyecto o cultivo estás trabajando?'
        },
        {
            id: 'agradecimiento',
            patterns: ['gracias', 'muchas gracias', 'te lo agradezco', 'muy amable', 'excelente respuesta', 'perfecto gracias', 'vale gracias'],
            answer: '¡Ha sido un placer ayudarte! En ShalomIndustrial estamos dedicados a proteger el valor comercial y la frescura de tu fruta. Si deseas una cotización formal o asesoría en línea de empaque, puedes llamarnos o escribirnos por WhatsApp al 229 978 3526. ¡Mucho éxito en tu producción!'
        },
        {
            id: 'despedida',
            patterns: ['adios', 'hasta luego', 'nos vemos', 'chao', 'bye', 'hasta pronto', 'buenas noches que descanses'],
            answer: '¡Hasta luego! Que tengas una jornada muy productiva en el campo y en el empaque. Estaré disponible aquí cuando necesites cualquier consulta técnica o cotización para tus cítricos.'
        },
        {
            id: 'chiste_humor',
            patterns: ['chiste', 'cuentame un chiste', 'dime un chiste', 'broma', 'hazme reir'],
            answer: '¿Sabes qué le dijo un limón persa a una naranja en la línea de empaque? ¡Tranquila colega, que con la Cera con Carnauba de ShalomIndustrial vamos a llegar brillando con calidad de exportación hasta Europa! ¿Qué te pareció? También tengo preparados todos los datos técnicos que requieras para tu fruta.'
        },
        {
            id: 'clima_cosecha',
            patterns: ['clima', 'va a llover', 'esta lloviendo', 'tiempo climatico', 'lluvia', 'humedad ambiental'],
            answer: 'El clima y la humedad son factores críticos en la cosecha de cítricos: nunca se recomienda cortar fruta bajo lluvia o con rocío matutino denso, ya que la turgencia de las células provoca oleocelosis al menor contacto mecánico. Si en tu región hay alta humedad, asegurar un lavado desengrasante y desinfección con Saniclean es indispensable para frenar esporas de hongos.'
        },
        {
            id: 'origen_carnauba',
            patterns: ['origen de la carnauba', 'de donde sale la carnauba', 'que es la carnauba', 'palma carnauba', 'arbol carnauba'],
            answer: 'La carnauba es una cera botánica de origen 100% natural que se cosecha de las hojas de la palma Copernicia prunifera, endémica del noreste de Brasil. En la naturaleza, la planta genera esta cera para sellar sus hojas contra la evaporación en temporadas de sequía extrema. Es la cera vegetal más dura conocida, tiene un punto de fusión superior a los 82°C y es completamente segura para consumo humano bajo normas internacionales de alimentos.'
        },
        {
            id: 'importancia_limon_mexico',
            patterns: ['importancia del limon', 'mexico y el limon', 'exportacion de limon en mexico', 'produccion citricos mexico'],
            answer: 'México es el segundo productor mundial de cítricos y líder absoluto en la exportación de limón persa hacia Estados Unidos, Europa y Asia, con epicentros productivos en Veracruz, Colima y Michoacán. El limón es una de las divisas agropecuarias más importantes del país, y por ello el uso de ceras y desinfectantes certificados es indispensable para cumplir con la estricta tolerancia cero a mohos en aduanas extranjeras.'
        },
        {
            id: 'que_es_la_quimica',
            patterns: ['que es la quimica', 'para que sirve la quimica', 'quimica agricola', 'ciencia agroindustrial'],
            answer: 'La química es la ciencia que investiga la composición, propiedades y transformaciones de la materia. En la agroindustria moderna, la química nos permite sintetizar emulsiones protectoras grado alimenticio, desinfectantes biodegradables y agentes limpiadores que protegen los alimentos del deterioro microbiológico sin alterar su sabor, nutrición ni salud humana.'
        }
    ];

    // ----------------------------------------------------
    // Motor de Decisión Inteligente e Inferencia Dinámica
    // ----------------------------------------------------
    function generateAnswer(rawQuery) {
        if (!rawQuery || !rawQuery.trim()) {
            return '¿En qué puedo ayudarte hoy? Puedes preguntarme sobre precios de ceras, Saniclean, Sin Gras o procesos de exportación.';
        }

        const normalized = normalizeText(rawQuery);
        const qOriginal = rawQuery.toLowerCase();

        // 1. Detección de Hora y Fecha en tiempo real (Dinámico)
        if (
            normalized.includes('que hora es') || 
            normalized.includes('dime la hora') || 
            normalized.includes('que tiempo es') || 
            normalized.includes('que dia es hoy') || 
            normalized.includes('que fecha es hoy') ||
            (normalized.includes('hora') && normalized.includes('actual'))
        ) {
            const { timeStr, dateStr } = getLiveTimeInfo();
            return `En este momento son las ${timeStr} en horario del centro de México, correspondiente a hoy ${dateStr}. ¿En qué más puedo orientarte hoy respecto a tus procesos de empaque o productos?`;
        }

        // 2. Detección de intención explícita de cotización o compra
        if (
            normalized.includes('cotizar') || 
            normalized.includes('comprar') || 
            normalized.includes('pedido') || 
            normalized.includes('orden de compra') || 
            normalized.includes('adquirir') ||
            normalized.includes('solicitar cotizacion')
        ) {
            return '¡Con gusto te apoyamos a cotizar! Puedes ingresar tus datos en el formulario de este sitio web o bien comunicarte directo por WhatsApp al +52 229 978 3526 indicando el volumen que requiere tu empaque. Uno de nuestros ingenieros te enviará una propuesta formal desglosada.';
        }

        // 3. Búsqueda y Puntuación en Base de Conocimiento Avanzada
        let bestMatch = null;
        let highestScore = 0;

        for (const item of ADVANCED_KNOWLEDGE_BASE) {
            let currentScore = 0;
            for (const pattern of item.patterns) {
                const normPattern = normalizeText(pattern);
                if (!normPattern) continue;

                if (normalized === normPattern) {
                    currentScore += 120; // Coincidencia exacta
                } else if (normPattern.includes(' ')) {
                    // Frase multi-palabra: coincidencia de frase o todas las palabras
                    if (normalized.includes(normPattern)) {
                        currentScore += (normPattern.length * 5);
                    } else {
                        const words = normPattern.split(' ');
                        const allPresent = words.every(w => {
                            const regex = new RegExp('\\b' + w + '\\b');
                            return regex.test(normalized);
                        });
                        if (allPresent) {
                            currentScore += (words.length * 15);
                        }
                    }
                } else {
                    // Palabra única: delimitador de palabra completa (\b) para evitar falsos positivos
                    const wordRegex = new RegExp('\\b' + normPattern + '\\b');
                    if (wordRegex.test(normalized)) {
                        currentScore += Math.max(10, normPattern.length * 4);
                    }
                }
            }

            if (currentScore > highestScore) {
                highestScore = currentScore;
                bestMatch = item;
            }
        }

        // Si encontramos una coincidencia relevante con puntaje suficiente
        if (bestMatch && highestScore >= 10) {
            return bestMatch.answer;
        }

        // 4. Razonamiento Lingüístico para Preguntas Abiertas Cotidianas (Smart Fallback)
        if (normalized.startsWith('por que') || normalized.includes('por que')) {
            return `Esa es una pregunta muy interesante. Desde la perspectiva científica y operativa que aplicamos en ShalomIndustrial, los fenómenos biológicos y químicos responden a equilibrios muy precisos de temperatura, humedad y concentración celular. Si tu duda está vinculada al comportamiento de la fruta en empaque o al efecto de algún insumo, dime y profundizamos con todo rigor técnico.`;
        }

        if (normalized.startsWith('como') || normalized.includes('como se')) {
            return `Para implementar ese procedimiento con éxito, se requiere seguir un protocolo estructurado de buenas prácticas agrícolas y controles de calidad en planta. En ShalomIndustrial asesoramos a empaques para estandarizar cada etapa, desde la recepción de la fruta hasta la paletización final. ¿Deseas que te explique la fase de lavado, desinfección o encerado?`;
        }

        if (normalized.startsWith('que') || normalized.startsWith('cual')) {
            return `Comprendo tu pregunta. En la agroindustria y en el día a día existen múltiples factores a considerar para tomar la mejor decisión técnica. En ShalomIndustrial nos especializamos en ceras con carnauba ($9,000 MXN), cera normal ($5,000 MXN), desinfectante Saniclean ($1,350 MXN) y desengrasante Sin Gras ($1,350 en 20L y $9,500 en 200L). ¿Te gustaría conocer especificaciones para alguna aplicación en particular?`;
        }

        // 5. Respuesta de Respaldo Sofisticada y Consultiva
        return `En ShalomIndustrial contamos con amplia experiencia técnica en química postcosecha, procesos de empaque y normativas de exportación. Ofrecemos Cera con Carnauba ($9,000), Cera Normal ($5,000), Saniclean 20L ($1,350) y Sin Gras (20L en $1,350 y 200L en $9,500). Puedes consultarme sobre dosis, cultivos específicos, cadena de frío o pedirnos una cotización al WhatsApp 229 978 3526.`;
    }

    // ----------------------------------------------------
    // Inyección de la Interfaz Visual del Widget
    // ----------------------------------------------------
    function injectWidget() {
        if (document.getElementById('shalom-voice-widget')) return;

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
                            <h4>Asistente Shalom AI</h4>
                            <span id="voice-engine-label" class="voice-engine-badge">⚡ ElevenLabs AI Activo</span>
                        </div>
                    </div>
                    <div class="voice-header-actions">
                        <button id="voice-settings-btn" title="Cambiar Voz del Asistente" class="voice-icon-btn">⚙️</button>
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
                    <p id="voice-status-text" class="voice-status-text">Habla por micrófono o escribe cualquier duda técnica o general</p>
                </div>

                <!-- Historial de Conversación -->
                <div id="voice-chat-history" class="voice-chat-history">
                    <div class="voice-msg msg-assistant">
                        ¡Hola! Soy tu asistente de ShalomIndustrial. Puedo resolver preguntas técnicas complejas sobre ceras, sanitizantes, desengrasantes, prevención de hongos, cadena de frío, cotizaciones, o responder dudas cotidianas. ¿En qué puedo apoyarte?
                    </div>
                </div>

                <!-- Botones de Acceso Rápido -->
                <div class="voice-quick-tags">
                    <button class="voice-tag-btn" data-query="¿Cuáles son los precios de los productos?">💰 Lista de Precios</button>
                    <button class="voice-tag-btn" data-query="Háblame de la cera con carnauba, sus ventajas y secado">✨ Cera Carnauba</button>
                    <button class="voice-tag-btn" data-query="¿Cómo funciona el desengrasante Sin Gras y el Saniclean?">🧪 Limpieza y Hongos</button>
                    <button class="voice-tag-btn" data-query="¿Cómo evitar la oleocelosis y pérdidas en limón persa?">🍋 Limón de Exportación</button>
                    <button class="voice-tag-btn" data-query="¿Qué normativas FDA y cadena de frío se requieren para exportar?">🚚 Exportación y Frío</button>
                    <button class="voice-tag-btn" data-query="¿Quién eres y qué puedes responder?">🤖 Sobre el Asistente</button>
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
                    <input type="text" id="voice-text-input" placeholder="Pregunta sobre productos, técnica o cualquier duda..." autocomplete="off">
                    <button id="voice-send-btn" class="voice-send-action" title="Enviar consulta">➤</button>
                </div>

                <!-- Panel de Selección de Voz para el Usuario/Cliente -->
                <div id="voice-settings-panel" class="voice-settings-panel" style="display: none;">
                    <h5>🎙️ Selecciona la Voz del Asistente</h5>
                    <p class="settings-desc">Elige la voz en español que prefieras escuchar:</p>
                    <div style="margin-bottom: 12px;">
                        <select id="select-elevenlabs-voice" style="width:100%; padding:10px 14px; background:#05140e; border:1px solid #1a4a39; border-radius:10px; color:#fff; font-size:0.88rem; outline:none; cursor:pointer;">
                            <option value="EXAVITQu4vr4xnSDxMaL" ${STATE.elevenLabsVoiceId === 'EXAVITQu4vr4xnSDxMaL' ? 'selected' : ''}>👩 Sarah (Femenina — Profesional y Confiable)</option>
                            <option value="cgSgspJ2msm6clMCkdW9" ${STATE.elevenLabsVoiceId === 'cgSgspJ2msm6clMCkdW9' ? 'selected' : ''}>👩 Jessica (Femenina — Cálida y Amable)</option>
                            <option value="FGY2WhTYpPnrIDTdsKH5" ${STATE.elevenLabsVoiceId === 'FGY2WhTYpPnrIDTdsKH5' ? 'selected' : ''}>👩 Laura (Femenina — Entusiasta y Dinámica)</option>
                            <option value="nPczCjzI2devNBz1zQrb" ${STATE.elevenLabsVoiceId === 'nPczCjzI2devNBz1zQrb' ? 'selected' : ''}>👨 Brian (Masculina — Profunda y Confortante)</option>
                            <option value="pNInz6obpgDQGcFmaJgB" ${STATE.elevenLabsVoiceId === 'pNInz6obpgDQGcFmaJgB' ? 'selected' : ''}>👨 Adam (Masculina — Firme y Ejecutiva)</option>
                        </select>
                    </div>
                    <div class="settings-help">
                        <small>✨ <strong>Voz AI de Alta Fidelidad:</strong> Puedes cambiar de voz cuando desees para escuchar diferentes tonos y estilos.</small>
                    </div>
                    <div class="settings-actions">
                        <button id="btn-save-settings" class="btn btn-main btn-sm">Guardar Voz</button>
                        <button id="btn-close-settings" class="btn btn-ghost btn-sm">Cerrar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(widgetContainer);
        bindEvents();
        updateEngineBadge();
    }

    // ----------------------------------------------------
    // Vinculación de Eventos e Interacción de Usuario
    // ----------------------------------------------------
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

        // Alternar Modal
        floatBtn.addEventListener('click', () => {
            STATE.isOpen = !STATE.isOpen;
            modal.style.display = STATE.isOpen ? 'flex' : 'none';
            if (STATE.isOpen) {
                input.focus();
            }
        });

        closeBtn.addEventListener('click', () => {
            STATE.isOpen = false;
            modal.style.display = 'none';
            stopSpeaking();
        });

        // Enviar Texto por Botón o Enter
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

        // Panel de Configuración
        settingsBtn.addEventListener('click', () => {
            settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
        });

        closeSettingsBtn.addEventListener('click', () => {
            settingsPanel.style.display = 'none';
        });

        saveSettingsBtn.addEventListener('click', () => {
            const voiceSelect = document.getElementById('select-elevenlabs-voice');
            const voice = voiceSelect?.value || DEFAULT_VOICE_ID;
            const selectedText = voiceSelect?.options[voiceSelect.selectedIndex]?.text || 'Sarah';
            const voiceName = selectedText.split('(')[0].replace(/[^a-zA-ZáéíóúÁÉÍÓÚ]/g, '').trim() || 'nueva';

            // Asegurar que la API key oficial de ElevenLabs permanezca siempre activa
            if (!STATE.elevenLabsKey) {
                STATE.elevenLabsKey = DEFAULT_ELEVENLABS_KEY;
                localStorage.setItem('shalom_elevenlabs_key', DEFAULT_ELEVENLABS_KEY);
            }

            STATE.elevenLabsVoiceId = voice;
            localStorage.setItem('shalom_elevenlabs_voice', voice);

            settingsPanel.style.display = 'none';
            updateEngineBadge();
            addAssistantMessage(`✓ Voz actualizada. A partir de ahora te responderé con la voz de ${voiceName}.`);
            speakText(`Has elegido la voz de ${voiceName}. ¿En qué puedo apoyarte hoy?`);
        });
    }

    function updateEngineBadge() {
        const badge = document.getElementById('voice-engine-label');
        if (!badge) return;
        const voiceNames = {
            'EXAVITQu4vr4xnSDxMaL': 'Sarah',
            'cgSgspJ2msm6clMCkdW9': 'Jessica',
            'FGY2WhTYpPnrIDTdsKH5': 'Laura',
            'nPczCjzI2devNBz1zQrb': 'Brian',
            'pNInz6obpgDQGcFmaJgB': 'Adam'
        };
        const activeName = voiceNames[STATE.elevenLabsVoiceId] || 'Sarah';
        if (STATE.elevenLabsKey) {
            badge.textContent = `⚡ Voz AI: ${activeName}`;
            badge.style.color = 'var(--limon)';
            badge.style.borderColor = 'rgba(232, 212, 77, 0.4)';
        } else {
            badge.textContent = '🎙️ Voz WebSpeech Nativa';
            badge.style.color = '#8dafa1';
            badge.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        }
    }

    // ----------------------------------------------------
    // Flujo de Procesamiento de Consulta del Usuario
    // ----------------------------------------------------
    function handleUserQuery(query) {
        if (!query || !query.trim()) return;
        const text = query.trim();
        const input = document.getElementById('voice-text-input');
        if (input) input.value = '';

        addUserMessage(text);
        setStatus('Analizando consulta técnica...');

        setTimeout(() => {
            const answer = generateAnswer(text);
            addAssistantMessage(answer);
            speakText(answer);
        }, 250);
    }

    function addUserMessage(text) {
        const chat = document.getElementById('voice-chat-history');
        if (!chat) return;
        const div = document.createElement('div');
        div.className = 'voice-msg msg-user';
        div.textContent = text;
        chat.appendChild(div);
        chat.scrollTop = chat.scrollHeight;
    }

    function addAssistantMessage(text) {
        const chat = document.getElementById('voice-chat-history');
        if (!chat) return;
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
    // Síntesis de Voz: ElevenLabs con Fallback WebSpeech
    // ----------------------------------------------------
    async function speakText(text) {
        if (!STATE.soundEnabled) {
            setStatus('Audio silenciado (presiona 🔊 para activar)');
            return;
        }

        stopSpeaking();
        setSpeakingVisuals(true);
        setStatus('Respondiendo con voz...');

        // 1. Intento con ElevenLabs si hay API Key disponible
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
                            stability: 0.55,
                            similarity_boost: 0.78,
                            style: 0.15,
                            use_speaker_boost: true
                        }
                    })
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const audioUrl = URL.createObjectURL(blob);
                    STATE.currentAudio = new Audio(audioUrl);
                    STATE.currentAudio.onended = () => {
                        setSpeakingVisuals(false);
                        setStatus('Listo. ¿En qué más puedo apoyarte?');
                        URL.revokeObjectURL(audioUrl);
                    };
                    STATE.currentAudio.play();
                    return;
                } else {
                    console.warn('ElevenLabs API respondió con código no exitoso, activando voz nativa de respaldo...');
                }
            } catch (err) {
                console.error('Error al invocar ElevenLabs:', err);
            }
        }

        // 2. Fallback: Síntesis nativa del navegador Web Speech API
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
                setStatus('Listo. ¿Tienes alguna otra duda?');
            };

            utterance.onerror = () => {
                setSpeakingVisuals(false);
                setStatus('Listo.');
            };

            window.speechSynthesis.speak(utterance);
        } else {
            setSpeakingVisuals(false);
            setStatus('Tu navegador no soporta síntesis de voz nativa.');
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
    // Reconocimiento de Voz por Micrófono (Web Speech API)
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
            if (micBtn) micBtn.classList.remove('is-recording');
            setStatus('Micrófono detenido.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-MX';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            STATE.isListening = true;
            if (micBtn) micBtn.classList.add('is-recording');
            setStatus('🎙️ Escuchando... Haz tu pregunta con naturalidad.');
            stopSpeaking();
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            STATE.isListening = false;
            if (micBtn) micBtn.classList.remove('is-recording');
            handleUserQuery(transcript);
        };

        recognition.onerror = (event) => {
            STATE.isListening = false;
            if (micBtn) micBtn.classList.remove('is-recording');
            setStatus('No se detectó audio o el micrófono fue cancelado.');
        };

        recognition.onend = () => {
            STATE.isListening = false;
            if (micBtn) micBtn.classList.remove('is-recording');
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
