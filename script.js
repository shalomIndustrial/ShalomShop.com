// ==========================================
// ShalomIndustrial - Scripts Principales
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 1. Menú Móvil (Responsive Toggle)
    // ----------------------------------------------------
    const navToggle = document.getElementById('nav-toggle');
    const primaryNav = document.getElementById('primary-nav');
    const header = document.getElementById('site-header');

    if (navToggle && primaryNav) {
        const closeNav = () => {
            navToggle.classList.remove('is-active');
            primaryNav.classList.remove('is-active');
            navToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        };

        const openNav = () => {
            navToggle.classList.add('is-active');
            primaryNav.classList.add('is-active');
            navToggle.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        };

        navToggle.addEventListener('click', () => {
            if (primaryNav.classList.contains('is-active')) {
                closeNav();
            } else {
                openNav();
            }
        });

        // Cerrar menú al hacer clic en cualquier enlace
        const navLinks = primaryNav.querySelectorAll('.nav-link, .btn-nav');
        navLinks.forEach(link => {
            link.addEventListener('click', closeNav);
        });

        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', (event) => {
            if (!header.contains(event.target) && primaryNav.classList.contains('is-active')) {
                closeNav();
            }
        });

        // Cerrar menú con la tecla ESC
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && primaryNav.classList.contains('is-active')) {
                closeNav();
            }
        });

        // Restaurar estado si se redimensiona a pantalla grande
        window.addEventListener('resize', () => {
            if (window.innerWidth > 860 && primaryNav.classList.contains('is-active')) {
                closeNav();
            }
        });
    }

    // ----------------------------------------------------
    // 2. Efecto de elevación en el Header al hacer scroll
    // ----------------------------------------------------
    if (header) {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
    }

    // ----------------------------------------------------
    // 3. Gestor de Base de Datos Local (ShalomDB)
    // ----------------------------------------------------
    window.ShalomDB = {
        STORAGE_KEY: 'shalom_leads_db',

        getLeads: function () {
            try {
                const data = localStorage.getItem(this.STORAGE_KEY);
                return data ? JSON.parse(data) : [];
            } catch (e) {
                console.error('Error al leer ShalomDB:', e);
                return [];
            }
        },

        saveLead: function (lead) {
            const leads = this.getLeads();
            const newLead = {
                id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                fecha: new Date().toLocaleString('es-MX', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                }),
                timestamp: Date.now(),
                nombre: lead.nombre || 'Sin nombre',
                email: lead.email || '',
                telefono: lead.telefono || '',
                interes: lead.interes || 'Información general',
                mensaje: lead.mensaje || 'Sin notas adicionales',
                estado: lead.estado || 'Nuevo', // Nuevo | Contactado | Cotizado | Cerrado
                origen: lead.origen || 'Formulario Web'
            };
            leads.unshift(newLead);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(leads));
            window.dispatchEvent(new CustomEvent('shalom_lead_added', { detail: newLead }));
            return newLead;
        },

        updateLeadStatus: function (id, nuevoEstado) {
            const leads = this.getLeads();
            const index = leads.findIndex(l => l.id === id);
            if (index !== -1) {
                leads[index].estado = nuevoEstado;
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(leads));
                return true;
            }
            return false;
        },

        deleteLead: function (id) {
            let leads = this.getLeads();
            leads = leads.filter(l => l.id !== id);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(leads));
            return true;
        },

        exportCSV: function () {
            const leads = this.getLeads();
            if (leads.length === 0) {
                alert('No hay prospectos en la base de datos para exportar.');
                return;
            }

            const headers = ['ID', 'Fecha', 'Nombre / Empresa', 'Teléfono / WhatsApp', 'Correo Electrónico', 'Producto de Interés', 'Volumen y Destino', 'Estado', 'Origen'];
            const rows = leads.map(l => [
                `"${l.id}"`,
                `"${l.fecha}"`,
                `"${(l.nombre || '').replace(/"/g, '""')}"`,
                `"${(l.telefono || '').replace(/"/g, '""')}"`,
                `"${(l.email || '').replace(/"/g, '""')}"`,
                `"${(l.interes || '').replace(/"/g, '""')}"`,
                `"${(l.mensaje || '').replace(/"/g, '""')}"`,
                `"${l.estado}"`,
                `"${l.origen}"`
            ]);

            const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Prospectos_ShalomIndustrial_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        exportJSON: function () {
            const leads = this.getLeads();
            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(leads, null, 2));
            const a = document.createElement('a');
            a.href = dataStr;
            a.download = `Respaldo_ShalomDB_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        },

        seedSamples: function () {
            const samples = [
                {
                    nombre: 'Empacadora San Rafael S.A. de C.V.',
                    email: 'contacto@sanrafaelcitricos.com',
                    telefono: '232 324 5500',
                    interes: 'Cera con Carnauba ($9,000)',
                    mensaje: 'Requerimos 25 tambores para línea de empaque de limón persa de exportación a McAllen, Texas.',
                    estado: 'Nuevo',
                    origen: 'Formulario Web'
                },
                {
                    nombre: 'Ing. Roberto Fuentes (Citrícola del Golfo)',
                    email: 'rfuentes@citricolagolfo.mx',
                    telefono: '229 987 1122',
                    interes: 'Sin Gras 200 lt ($9,500)',
                    mensaje: 'Interesados en probar desengrasante para tinas de lavado de naranja valencia en Martínez de la Torre.',
                    estado: 'Contactado',
                    origen: 'Asistente de Voz'
                },
                {
                    nombre: 'Agrícola Los Piñales',
                    email: 'compras@lospinales.com',
                    telefono: '283 874 9901',
                    interes: 'Saniclean 20 lt ($1,350)',
                    mensaje: 'Cotización por 15 porrones para desinfección preventiva contra hongos.',
                    estado: 'Cotizado',
                    origen: 'Formulario Web'
                }
            ];
            samples.forEach(s => this.saveLead(s));
        }
    };

    // ----------------------------------------------------
    // 3.1 Manejo de Envío del Formulario de Contacto
    // ----------------------------------------------------
    const formulario = document.getElementById('form-contacto');
    const feedbackBox = document.getElementById('contacto-feedback');

    if (formulario) {
        formulario.addEventListener('submit', function (evento) {
            evento.preventDefault();
            
            const nombre = document.getElementById('contacto-nombre')?.value.trim();
            const email = document.getElementById('contacto-email')?.value.trim();
            const telefono = document.getElementById('contacto-telefono')?.value.trim();
            const interes = document.getElementById('contacto-interes')?.value;
            const mensaje = document.getElementById('contacto-mensaje')?.value.trim();
            const boton = document.getElementById('btn-enviar-cotizacion');

            if (!nombre || !email || !telefono || !interes) {
                alert('Por favor completa todos los campos requeridos.');
                return;
            }

            // Guardar en la base de datos local ShalomDB
            const savedLead = window.ShalomDB.saveLead({
                nombre: nombre,
                email: email,
                telefono: telefono,
                interes: interes,
                mensaje: mensaje || 'Sin notas adicionales',
                origen: 'Formulario Web'
            });

            // Retroalimentación visual interactiva
            if (boton) {
                boton.textContent = '✓ ¡Solicitud Registrada!';
                boton.disabled = true;
                boton.style.background = '#25d366';
                boton.style.borderColor = '#25d366';
                boton.style.color = '#ffffff';
            }

            if (feedbackBox) {
                feedbackBox.innerHTML = `
                    <div class="feedback-card">
                        <h4>¡Gracias por tu interés, ${nombre}!</h4>
                        <p>Hemos guardado tu solicitud en nuestra base de datos. Un asesor técnico comercial revisará tu requerimiento de <strong>${interes}</strong> y te contactará al teléfono <strong>${telefono}</strong>.</p>
                        <div class="feedback-actions">
                            <a href="https://wa.me/522299783526?text=Hola%2C%20acabo%20de%20enviar%20mi%20solicitud%20en%20la%20web%20para%20${encodeURIComponent(interes)}.%20Mi%20nombre%20es%20${encodeURIComponent(nombre)}." target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-sm">
                                Agilizar atención por WhatsApp ahora →
                            </a>
                        </div>
                    </div>
                `;
                feedbackBox.style.display = 'block';
            }

            // Limpiar formulario y restaurar botón tras 5 segundos
            setTimeout(() => {
                formulario.reset();
                if (boton) {
                    boton.textContent = 'Enviar otra solicitud';
                    boton.disabled = false;
                    boton.style.background = '';
                    boton.style.borderColor = '';
                    boton.style.color = '';
                }
            }, 5000);
        });
    }

    // ----------------------------------------------------
    // 4. Lógica de Redirección (Página de Documentación)
    // ----------------------------------------------------
    const countdownEl = document.getElementById('redirect-countdown');
    const redirectBtn = document.getElementById('redirect-btn');
    const cancelBtn = document.getElementById('cancel-redirect-btn');
    const progressBar = document.getElementById('redirect-progress');
    const destinationUrlEl = document.getElementById('destination-url-text');

    if (countdownEl && redirectBtn) {
        // >>> CONFIGURACIÓN: Coloca aquí el link al sitio que deseas redirigir <<<
        const TARGET_URL = redirectBtn.getAttribute('href') || 'https://google.com';
        
        let secondsLeft = 5;
        let isCancelled = false;

        if (destinationUrlEl) {
            destinationUrlEl.textContent = TARGET_URL;
        }

        const interval = setInterval(() => {
            if (isCancelled) {
                clearInterval(interval);
                return;
            }

            secondsLeft--;
            if (countdownEl) {
                countdownEl.textContent = secondsLeft;
            }

            if (secondsLeft <= 0) {
                clearInterval(interval);
                window.location.href = TARGET_URL;
            }
        }, 1000);

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                isCancelled = true;
                clearInterval(interval);
                if (progressBar) {
                    progressBar.style.animationPlayState = 'paused';
                }
                countdownEl.parentElement.innerHTML = '<em>Redirección automática pausada.</em> Puedes acceder manualmente con el botón.';
                cancelBtn.style.display = 'none';
            });
        }
    }
});