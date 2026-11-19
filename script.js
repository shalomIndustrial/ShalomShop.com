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
    // 3.1 Cotizador Interactivo Multi-Producto y Cantidades
    // ----------------------------------------------------
    const quoteContainer = document.getElementById('quote-items-container');
    const summaryCount = document.getElementById('summary-items-count');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryIva = document.getElementById('summary-iva');
    const summaryTotal = document.getElementById('summary-total');
    const summaryAlert = document.getElementById('summary-alert');
    const formulario = document.getElementById('form-contacto');
    const feedbackBox = document.getElementById('contacto-feedback');

    function formatMoney(amount) {
        return '$' + amount.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' MXN';
    }

    function updateQuoteCalculation() {
        if (!quoteContainer) return { items: [], subtotal: 0, iva: 0, total: 0, totalUnits: 0 };

        const rows = quoteContainer.querySelectorAll('.quote-product-row');
        let subtotal = 0;
        let totalUnits = 0;
        const selectedItems = [];

        rows.forEach(row => {
            const checkbox = row.querySelector('.quote-prod-checkbox');
            const qtyControl = row.querySelector('.quote-qty-control');
            const qtyInput = row.querySelector('.qty-input');
            const btnMinus = row.querySelector('.btn-qty-minus');
            const btnPlus = row.querySelector('.btn-qty-plus');
            const subtotalEl = row.querySelector('.item-subtotal-val');
            const price = parseFloat(row.getAttribute('data-price')) || 0;
            const name = row.getAttribute('data-name') || 'Producto';
            const unit = row.getAttribute('data-unit') || 'unidad';

            if (checkbox && checkbox.checked) {
                row.classList.add('is-selected');
                if (qtyControl) qtyControl.classList.remove('is-disabled');
                if (qtyInput) qtyInput.disabled = false;
                if (btnMinus) btnMinus.disabled = false;
                if (btnPlus) btnPlus.disabled = false;

                let qty = parseInt(qtyInput ? qtyInput.value : 1, 10);
                if (isNaN(qty) || qty < 1) qty = 1;
                if (qtyInput) qtyInput.value = qty;

                const itemSubtotal = price * qty;
                subtotal += itemSubtotal;
                totalUnits += qty;

                if (subtotalEl) subtotalEl.textContent = formatMoney(itemSubtotal);

                selectedItems.push({
                    id: row.getAttribute('data-id'),
                    name: name,
                    unit: unit,
                    price: price,
                    qty: qty,
                    subtotal: itemSubtotal
                });
            } else {
                row.classList.remove('is-selected');
                if (qtyControl) qtyControl.classList.add('is-disabled');
                if (qtyInput) qtyInput.disabled = true;
                if (btnMinus) btnMinus.disabled = true;
                if (btnPlus) btnPlus.disabled = true;
                if (subtotalEl) subtotalEl.textContent = '$0 MXN';
            }
        });

        const iva = subtotal * 0.16;
        const total = subtotal + iva;

        // Actualizar UI del Resumen
        if (summaryCount) {
            if (selectedItems.length === 0) {
                summaryCount.textContent = '0 productos seleccionados (0 unidades)';
            } else {
                summaryCount.textContent = `${selectedItems.length} producto${selectedItems.length > 1 ? 's' : ''} seleccionado${selectedItems.length > 1 ? 's' : ''} (${totalUnits} unidad${totalUnits > 1 ? 'es' : ''} en total)`;
            }
        }

        if (summarySubtotal) summarySubtotal.textContent = formatMoney(subtotal);
        if (summaryIva) summaryIva.textContent = formatMoney(iva);
        if (summaryTotal) summaryTotal.textContent = formatMoney(total);

        if (summaryAlert) {
            if (selectedItems.length === 0) {
                summaryAlert.style.display = 'block';
                summaryAlert.innerHTML = '💡 Marca uno o más productos arriba para calcular tu cotización.';
                summaryAlert.style.background = 'rgba(240, 138, 36, 0.14)';
                summaryAlert.style.borderColor = 'rgba(240, 138, 36, 0.35)';
                summaryAlert.style.color = '#f7b46d';
            } else {
                summaryAlert.style.display = 'block';
                summaryAlert.innerHTML = `✓ <strong>${selectedItems.length} producto(s) listo(s)</strong> para cotización. Precios antes de IVA (16%).`;
                summaryAlert.style.background = 'rgba(37, 211, 102, 0.12)';
                summaryAlert.style.borderColor = 'rgba(37, 211, 102, 0.35)';
                summaryAlert.style.color = '#7eedaa';
            }
        }

        return { items: selectedItems, subtotal, iva, total, totalUnits };
    }

    if (quoteContainer) {
        // Delegación de eventos para los steppers y checkboxes de productos
        quoteContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('quote-prod-checkbox')) {
                updateQuoteCalculation();
            } else if (e.target.classList.contains('qty-input')) {
                let val = parseInt(e.target.value, 10);
                if (isNaN(val) || val < 1) val = 1;
                if (val > 999) val = 999;
                e.target.value = val;
                updateQuoteCalculation();
            }
        });

        quoteContainer.addEventListener('click', (e) => {
            const btnMinus = e.target.closest('.btn-qty-minus');
            const btnPlus = e.target.closest('.btn-qty-plus');

            if (btnMinus) {
                const row = btnMinus.closest('.quote-product-row');
                const qtyInput = row?.querySelector('.qty-input');
                if (qtyInput && !qtyInput.disabled) {
                    let val = parseInt(qtyInput.value, 10) || 1;
                    if (val > 1) {
                        qtyInput.value = val - 1;
                        updateQuoteCalculation();
                    }
                }
            } else if (btnPlus) {
                const row = btnPlus.closest('.quote-product-row');
                const qtyInput = row?.querySelector('.qty-input');
                if (qtyInput && !qtyInput.disabled) {
                    let val = parseInt(qtyInput.value, 10) || 1;
                    if (val < 999) {
                        qtyInput.value = val + 1;
                        updateQuoteCalculation();
                    }
                }
            }
        });

        // Inicializar cálculo en carga (por defecto vacío)
        updateQuoteCalculation();
    }

    // Botones "Cotizar producto →" del catálogo superior
    const catalogQuoteBtns = document.querySelectorAll('[data-quote-select]');
    catalogQuoteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetProdId = btn.getAttribute('data-quote-select');
            if (!targetProdId) return;

            const targetRow = document.querySelector(`.quote-product-row[data-id="${targetProdId}"]`);
            if (targetRow) {
                const checkbox = targetRow.querySelector('.quote-prod-checkbox');
                const qtyInput = targetRow.querySelector('.qty-input');

                if (checkbox) {
                    checkbox.checked = true;
                    if (qtyInput && (!qtyInput.value || parseInt(qtyInput.value, 10) < 1)) {
                        qtyInput.value = 1;
                    }
                    updateQuoteCalculation();

                    // Resaltar fila con pulso
                    targetRow.classList.remove('has-pulse');
                    void targetRow.offsetWidth; // Force reflow
                    targetRow.classList.add('has-pulse');
                }
            }
        });
    });

    // Envío del Formulario de Cotización Multi-Producto
    if (formulario) {
        formulario.addEventListener('submit', function (evento) {
            evento.preventDefault();

            const quoteData = updateQuoteCalculation();
            const nombre = document.getElementById('contacto-nombre')?.value.trim();
            const email = document.getElementById('contacto-email')?.value.trim();
            const telefono = document.getElementById('contacto-telefono')?.value.trim();
            const mensaje = document.getElementById('contacto-mensaje')?.value.trim();
            const boton = document.getElementById('btn-enviar-cotizacion');

            // Validar que haya al menos 1 producto seleccionado
            if (quoteData.items.length === 0) {
                alert('Por favor selecciona al menos un producto a cotizar en el Paso 1 marcando la casilla correspondiente.');
                const firstRow = document.querySelector('.quote-product-row');
                if (firstRow) {
                    firstRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstRow.classList.add('has-pulse');
                }
                return;
            }

            if (!nombre || !email || !telefono) {
                alert('Por favor completa tus datos de contacto requeridos en el Paso 2.');
                return;
            }

            // Crear resumen de productos para interes
            const itemsSummary = quoteData.items
                .map(it => `${it.qty}x ${it.name}`)
                .join(', ');

            // Detalle para mensaje guardado en la base de datos
            const financialDetails = `Subtotal: ${formatMoney(quoteData.subtotal)} | IVA (+16%): ${formatMoney(quoteData.iva)} | Total Estimado: ${formatMoney(quoteData.total)}`;
            const fullMessage = (mensaje ? `Notas del cliente: ${mensaje}\n\n` : '') + `[Cotización Solicitada]:\n` + 
                quoteData.items.map(it => `• ${it.qty}x ${it.name} (${it.unit}) = ${formatMoney(it.subtotal)}`).join('\n') + 
                `\n${financialDetails}`;

            // Guardar en ShalomDB
            window.ShalomDB.saveLead({
                nombre: nombre,
                email: email,
                telefono: telefono,
                interes: itemsSummary,
                mensaje: fullMessage,
                origen: 'Formulario Web (Cotizador Múltiple)'
            });

            // Preparar mensaje para WhatsApp directo con desglose completo
            let waText = `Hola ShalomIndustrial, soy *${nombre}*.\nSolicito cotización formal para el siguiente pedido:\n\n`;
            quoteData.items.forEach(it => {
                waText += `📦 *${it.qty}x ${it.name}* (${it.unit}) = ${formatMoney(it.subtotal)}\n`;
            });
            waText += `\n💵 *Subtotal:* ${formatMoney(quoteData.subtotal)}\n`;
            waText += `📋 *IVA (+16%):* ${formatMoney(quoteData.iva)}\n`;
            waText += `💰 *Total Estimado:* ${formatMoney(quoteData.total)}\n\n`;
            waText += `👤 *Contacto:* ${nombre}\n`;
            waText += `📞 *Tel:* ${telefono}\n`;
            waText += `✉️ *Email:* ${email}\n`;
            if (mensaje) {
                waText += `📍 *Destino / Notas:* ${mensaje}\n`;
            }

            const waUrl = `https://wa.me/522299783526?text=${encodeURIComponent(waText)}`;

            // Retroalimentación visual
            if (boton) {
                boton.innerHTML = '<span>✓ ¡Cotización Registrada con Éxito!</span>';
                boton.disabled = true;
                boton.style.background = '#25d366';
                boton.style.borderColor = '#25d366';
                boton.style.color = '#ffffff';
            }

            if (feedbackBox) {
                feedbackBox.innerHTML = `
                    <div class="feedback-card">
                        <h4>¡Excelente, ${nombre}! Tu cotización ha sido calculada y registrada.</h4>
                        <p>Hemos guardado tu solicitud en nuestra base de datos. Un asesor técnico comercial revisará tu pedido para coordinar logística y tiempos de entrega.</p>
                        
                        <div class="quote-feedback-items">
                            <strong>Resumen de tu cotización:</strong>
                            <ul>
                                ${quoteData.items.map(it => `<li><strong>${it.qty}x ${it.name}</strong> (${it.unit}): ${formatMoney(it.subtotal)}</li>`).join('')}
                            </ul>
                            <div style="margin-top:8px; padding-top:6px; border-top:1px dashed rgba(255,255,255,0.2); font-weight:700;">
                                Total Estimado con IVA: <span style="color:#25d366; font-size:1.1rem;">${formatMoney(quoteData.total)}</span>
                            </div>
                        </div>

                        <div class="feedback-actions">
                            <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-sm" style="display:inline-flex; align-items:center; gap:8px;">
                                <span>📲 Enviar desglose por WhatsApp directo ahora →</span>
                            </a>
                        </div>
                    </div>
                `;
                feedbackBox.style.display = 'block';
                feedbackBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            // Restaurar botón tras 6 segundos
            setTimeout(() => {
                if (boton) {
                    boton.innerHTML = `
                        <span>Solicitar otra cotización</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    `;
                    boton.disabled = false;
                    boton.style.background = '';
                    boton.style.borderColor = '';
                    boton.style.color = '';
                }
            }, 6000);
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