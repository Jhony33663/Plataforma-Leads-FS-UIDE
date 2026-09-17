/**
 * js/vocational-test.js
 * Módulo de Orientación Vocacional y Recomendador de Carreras UIDE (Powered by ASU)
 * 
 * Permite a los estudiantes descubrir su afinidad profesional en 4 pasos gamificados,
 * mapeando el resultado a la oferta académica oficial de la UIDE y sincronizando con Pardot y DataLayer.
 */

const VocationalTest = (function() {
    'use strict';

    const AREAS = {
        TEC: {
            code: 'TEC',
            name: 'Tecnología, Sistemas, IA & Ciberseguridad',
            icon: '💻',
            badge: 'Líder Tecnológico & Arquitecto Digital',
            description: 'Posees una mente lógica orientada a la innovación digital, el desarrollo de inteligencia artificial, la ciberseguridad y la ciencia de datos.',
            primaryCareer: { id: '537', name: 'Ingeniería en Inteligencia Artificial', sede: 'Distancia', tp_pgm: 'Pregrado Distancia' },
            alternatives: [
                { id: '481', name: 'Ingeniería en Ciberseguridad', sede: 'Distancia' },
                { id: '318', name: 'Ingeniería en Sistemas', sede: 'Quito' },
                { id: '479', name: 'Ingeniería en Software', sede: 'Distancia' },
                { id: '547', name: 'Ingeniería en Ciencia de Datos', sede: 'Distancia' }
            ]
        },
        NEG: {
            code: 'NEG',
            name: 'Negocios, Finanzas & Emprendimiento',
            icon: '💼',
            badge: 'Estratega Corporativo & Emprendedor Global',
            description: 'Destacas por tu visión estratégica, habilidad negociadora, liderazgo de proyectos y pasión por las finanzas y el comercio internacional.',
            primaryCareer: { id: '5', name: 'Negocios Internacionales', sede: 'Quito', tp_pgm: 'Pregrado Quito' },
            alternatives: [
                { id: '558', name: 'Administración de Empresas', sede: 'Quito' },
                { id: '412', name: 'Finanzas y Negocios Digitales', sede: 'Quito' },
                { id: '557', name: 'Marketing', sede: 'Quito' },
                { id: '525', name: 'Comercio exterior y aduanas', sede: 'Guayaquil' }
            ]
        },
        SAL: {
            code: 'SAL',
            name: 'Ciencias de la Salud & Bienestar',
            icon: '🩺',
            badge: 'Vocación Médica & Ciencias de la Salud',
            description: 'Te motiva una profunda vocación humana de servicio, rigor científico, cuidado de la salud integral y dedicación al bienestar comunitario o animal.',
            primaryCareer: { id: '52', name: 'Medicina', sede: 'Quito', tp_pgm: 'Pregrado Quito' },
            alternatives: [
                { id: '53', name: 'Odontología', sede: 'Quito' },
                { id: '528', name: 'Enfermería Internacional', sede: 'Quito' },
                { id: '520', name: 'Psicología Clínica', sede: 'Quito' },
                { id: '293', name: 'Medicina Veterinaria', sede: 'Quito' },
                { id: '325', name: 'Fisioterapia', sede: 'Quito' }
            ]
        },
        SOC: {
            code: 'SOC',
            name: 'Derecho, Política & Ciencias Sociales',
            icon: '⚖️',
            badge: 'Defensor de la Justicia & Líder Diplomático',
            description: 'Sobresales por tu pensamiento crítico, ética, oratoria, capacidad argumentativa y compromiso con el estado de derecho y la diplomacia.',
            primaryCareer: { id: '18', name: 'Derecho', sede: 'Quito', tp_pgm: 'Pregrado Quito' },
            alternatives: [
                { id: '507', name: 'Ciencias Políticas y Relaciones Internacionales', sede: 'Quito' },
                { id: '482', name: 'Trabajo Social', sede: 'Distancia' },
                { id: '480', name: 'Administración Pública', sede: 'Distancia' }
            ]
        },
        CRE: {
            code: 'CRE',
            name: 'Comunicación, Diseño & Creatividad',
            icon: '🎨',
            badge: 'Creador Visual & Comunicador Estratégico',
            description: 'Tu mayor fuerza es la innovación visual, la sensibilidad estética, la producción de contenidos multimedia y la comunicación persuasiva.',
            primaryCareer: { id: '500', name: 'Comunicación y Medios Digitales', sede: 'Quito', tp_pgm: 'Pregrado Quito' },
            alternatives: [
                { id: '324', name: 'Diseño Gráfico', sede: 'Quito' },
                { id: '463', name: 'Multimedia y Producción AudioVisual', sede: 'Quito' },
                { id: '16', name: 'Arquitectura', sede: 'Quito' },
                { id: '24', name: 'Gastronomía', sede: 'Quito' }
            ]
        },
        ING: {
            code: 'ING',
            name: 'Ingenierías, Mecatrónica & Sostenibilidad',
            icon: '⚙️',
            badge: 'Ingeniero Mecatrónico & Creador de Futuro',
            description: 'Tienes afinidad por la física práctica, la robótica, los sistemas automatizados, la movilidad inteligente y el desarrollo de infraestructura.',
            primaryCareer: { id: '64', name: 'Ingeniería Mecatrónica', sede: 'Quito', tp_pgm: 'Pregrado Quito' },
            alternatives: [
                { id: '257', name: 'Ingeniería Industrial', sede: 'Quito' },
                { id: '8', name: 'Ingeniería Automotriz', sede: 'Quito' },
                { id: '292', name: 'Ingeniería Civil', sede: 'Quito' },
                { id: '531', name: 'Telecomunicaciones', sede: 'Distancia' }
            ]
        }
    };

    const QUESTIONS = [
        {
            title: '¿Qué reto o proyecto te apasionaría liderar en el mundo actual?',
            subtitle: 'Paso 1 de 4: Selecciona lo que más conecta con tus metas',
            options: [
                { code: 'TEC', icon: '💻', text: 'Desarrollar soluciones con Inteligencia Artificial o proteger sistemas contra ciberataques.' },
                { code: 'NEG', icon: '📈', text: 'Fundar una startup de alto impacto o dirigir la expansión comercial de una empresa global.' },
                { code: 'SAL', icon: '🩺', text: 'Salvar vidas, investigar tratamientos médicos o promover el bienestar de personas o animales.' },
                { code: 'SOC', icon: '⚖️', text: 'Litigar en cortes de justicia, defender los derechos humanos o negociar tratados diplomáticos.' },
                { code: 'CRE', icon: '🎬', text: 'Crear campañas virales, producir contenidos audiovisuales o diseñar piezas visuales innovadoras.' },
                { code: 'ING', icon: '🤖', text: 'Diseñar vehículos inteligentes, robots autónomos o construir megaestructuras sostenibles.' }
            ]
        },
        {
            title: '¿En qué entorno te visualizas desarrollando tu máximo potencial?',
            subtitle: 'Paso 2 de 4: Imagina tu espacio de trabajo del futuro',
            options: [
                { code: 'TEC', icon: '🌐', text: 'En centros de innovación digital, hubs tecnológicos o trabajando en remoto para todo el mundo.' },
                { code: 'NEG', icon: '🏙️', text: 'En salas de juntas corporativas, centros bursátiles o gestionando inversiones internacionales.' },
                { code: 'SAL', icon: '🏥', text: 'En hospitales de alta complejidad, quirófanos modernos, laboratorios o centros clínicos.' },
                { code: 'SOC', icon: '🏛️', text: 'En tribunales de justicia, embajadas, organismos internacionales (ONU, OEA) o el estado.' },
                { code: 'CRE', icon: '🎨', text: 'En agencias de diseño, sets de producción de medios, streaming o estudios creativos.' },
                { code: 'ING', icon: '🏭', text: 'En plantas industriales automatizadas, laboratorios de mecatrónica u obras civiles.' }
            ]
        },
        {
            title: '¿Cuál de estas habilidades describe mejor tu talento natural?',
            subtitle: 'Paso 3 de 4: Identifica tu principal fortaleza mental',
            options: [
                { code: 'TEC', icon: '🧩', text: 'Pensamiento lógico-algorítmico, resolución metódica de problemas y curiosidad tecnológica.' },
                { code: 'NEG', icon: '🤝', text: 'Visión estratégica, liderazgo, facilidad para negociar y conectar con inversores.' },
                { code: 'SAL', icon: '❤️', text: 'Empatía profunda, vocación de servicio, meticulosidad y fascinación por la biología.' },
                { code: 'SOC', icon: '🗣️', text: 'Oratoria persuasiva, pensamiento ético, argumentación sólida y búsqueda de equidad.' },
                { code: 'CRE', icon: '💡', text: 'Imaginación visual, sensibilidad conceptual y capacidad de emocionar a través del arte.' },
                { code: 'ING', icon: '📐', text: 'Comprensión espacial, afinidad por la física aplicada, maquinaria y optimización de procesos.' }
            ]
        },
        {
            title: '¿Cuál es la huella o impacto que quieres dejar con tu carrera?',
            subtitle: 'Paso 4 de 4: Define tu propósito profesional',
            options: [
                { code: 'TEC', icon: '🚀', text: 'Democratizar la tecnología, crear algoritmos éticos y transformar el futuro digital.' },
                { code: 'NEG', icon: '💼', text: 'Crear empresas sostenibles que impulsen la economía y generen oportunidades de empleo.' },
                { code: 'SAL', icon: '🌱', text: 'Erradicar enfermedades, aliviar el sufrimiento y garantizar una vida digna para todos.' },
                { code: 'SOC', icon: '🕊️', text: 'Fortalecer la democracia, defender la verdad y asegurar una sociedad justa y en paz.' },
                { code: 'CRE', icon: '🌟', text: 'Inspirar a la sociedad a través de historias auténticas, diseño y cultura transformadora.' },
                { code: 'ING', icon: '⚡', text: 'Construir ciudades inteligentes, energías limpias y maquinaria de alta eficiencia.' }
            ]
        }
    ];

    let currentStep = 0;
    let userAnswers = [];
    let currentResult = null;

    function init() {
        bindEvents();
    }

    function bindEvents() {
        const btnStartVoc = document.getElementById('btn_start_vocational_test');
        if (btnStartVoc) {
            btnStartVoc.addEventListener('click', () => {
                startTest();
            });
        }

        const btnRetake = document.getElementById('btn_retake_vocational_test');
        if (btnRetake) {
            btnRetake.addEventListener('click', () => {
                startTest();
            });
        }

        const btnDownloadMd = document.getElementById('btn_download_voc_md');
        if (btnDownloadMd) {
            btnDownloadMd.addEventListener('click', () => {
                downloadCurrentReport();
            });
        }

        const btnGoForm = document.getElementById('btn_voc_to_form');
        if (btnGoForm) {
            btnGoForm.addEventListener('click', () => {
                if (typeof App !== 'undefined' && App.switchView) {
                    App.switchView('form-view');
                }
            });
        }
    }

    function startTest() {
        currentStep = 0;
        userAnswers = [];
        currentResult = null;
        if (typeof App !== 'undefined' && App.switchView) {
            App.switchView('vocational-view');
        }
        showQuizScreen();
        renderQuestion(currentStep);
    }

    function showQuizScreen() {
        const quizBox = document.getElementById('voc_quiz_container');
        const resultsBox = document.getElementById('voc_results_container');
        if (quizBox) quizBox.style.display = 'block';
        if (resultsBox) resultsBox.style.display = 'none';
    }

    function renderQuestion(index) {
        if (index >= QUESTIONS.length) {
            finishTest();
            return;
        }

        const q = QUESTIONS[index];
        const titleEl = document.getElementById('voc_question_title');
        const subEl = document.getElementById('voc_question_subtitle');
        const counterEl = document.getElementById('voc_step_counter');
        const progressBar = document.getElementById('voc_progress_bar');
        const optContainer = document.getElementById('voc_options_container');

        if (titleEl) titleEl.textContent = q.title;
        if (subEl) subEl.textContent = q.subtitle;
        if (counterEl) counterEl.textContent = `Pregunta ${index + 1} de ${QUESTIONS.length}`;
        if (progressBar) {
            const pct = Math.round(((index + 1) / QUESTIONS.length) * 100);
            progressBar.style.width = `${pct}%`;
        }

        if (optContainer) {
            optContainer.innerHTML = '';
            q.options.forEach((opt) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'voc-option-card';
                btn.innerHTML = `
                    <div class="voc-option-icon">${opt.icon}</div>
                    <div class="voc-option-text">${opt.text}</div>
                    <div class="voc-option-check">➔</div>
                `;
                btn.addEventListener('click', () => {
                    btn.classList.add('selected');
                    setTimeout(() => {
                        selectOption(index, opt.code);
                    }, 180);
                });
                optContainer.appendChild(btn);
            });
        }
    }

    function selectOption(qIndex, areaCode) {
        userAnswers[qIndex] = areaCode;
        currentStep++;
        if (currentStep < QUESTIONS.length) {
            renderQuestion(currentStep);
        } else {
            finishTest();
        }
    }

    function calculateResult(answers) {
        const scores = { TEC: 0, NEG: 0, SAL: 0, SOC: 0, CRE: 0, ING: 0 };
        answers.forEach(code => {
            if (scores[code] !== undefined) {
                scores[code] += 25; // 4 preguntas -> 100% total
            }
        });

        // Ordenar áreas de mayor a menor puntaje
        const sortedAreas = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
        const dominantCode = sortedAreas[0];
        const dominantArea = AREAS[dominantCode] || AREAS.TEC;

        return {
            dominantCode,
            dominantArea,
            scores,
            primaryCareer: dominantArea.primaryCareer,
            alternatives: dominantArea.alternatives,
            timestamp: new Date().toISOString()
        };
    }

    function finishTest() {
        currentResult = calculateResult(userAnswers);

        // Pre-seleccionar la carrera recomendada en el formulario Pardot
        applyRecommendationToForm(currentResult);

        // Notificar en DataLayer
        if (window.dataLayer) {
            window.dataLayer.push({
                event: 'vocational_test_completed',
                vocational_area: currentResult.dominantArea.name,
                recommended_career: currentResult.primaryCareer.name,
                recommended_career_id: currentResult.primaryCareer.id,
                scores: currentResult.scores
            });
        }

        renderResult(currentResult);
    }

    function renderResult(result) {
        const quizBox = document.getElementById('voc_quiz_container');
        const resultsBox = document.getElementById('voc_results_container');
        if (quizBox) quizBox.style.display = 'none';
        if (resultsBox) resultsBox.style.display = 'block';

        const badgeEl = document.getElementById('voc_res_badge');
        const titleEl = document.getElementById('voc_res_title');
        const descEl = document.getElementById('voc_res_desc');
        const careerNameEl = document.getElementById('voc_res_career_name');
        const careerMetaEl = document.getElementById('voc_res_career_meta');
        const altContainer = document.getElementById('voc_res_alternatives');

        if (badgeEl) badgeEl.textContent = result.dominantArea.badge;
        if (titleEl) titleEl.textContent = `${result.dominantArea.icon} ${result.dominantArea.name}`;
        if (descEl) descEl.textContent = result.dominantArea.description;
        if (careerNameEl) careerNameEl.textContent = result.primaryCareer.name;
        if (careerMetaEl) careerMetaEl.textContent = `UIDE Sede ${result.primaryCareer.sede} • Powered by Arizona State University`;

        if (altContainer) {
            altContainer.innerHTML = '';
            result.alternatives.forEach(alt => {
                const tag = document.createElement('span');
                tag.className = 'voc-alt-chip';
                tag.textContent = `${alt.name} (${alt.sede})`;
                altContainer.appendChild(tag);
            });
        }

        updateAdvisorWhatsAppBtn(result);
    }

    function updateAdvisorWhatsAppBtn(result) {
        const wsBtn = document.getElementById('btn_voc_whatsapp_advisor');
        if (!wsBtn) return;

        let advisorPhone = '593991234567';
        let advisorName = 'Asesor Educativo UIDE';
        if (typeof App !== 'undefined') {
            const activeAdv = App.getStoredAdvisor ? App.getStoredAdvisor() : null;
            if (activeAdv) {
                advisorPhone = (activeAdv.whatsapp || activeAdv.telefono || '').replace(/\D/g, '') || advisorPhone;
                advisorName = activeAdv.nombre || advisorName;
            }
        }

        const msg = encodeURIComponent(`¡Hola ${advisorName}! Realicé el Test Vocacional UIDE y mi carrera recomendada es ${result.primaryCareer.name} (${result.dominantArea.name}). Me gustaría recibir la malla curricular y conocer las opciones de becas 2026.`);
        wsBtn.href = `https://wa.me/${advisorPhone}?text=${msg}`;
    }

    function applyRecommendationToForm(result) {
        if (!result || !result.primaryCareer) return;
        const career = result.primaryCareer;

        const sedeSelect = document.getElementById('sede');
        const tpPgmSelect = document.getElementById('tp_pgm');
        const escPgmInput = document.getElementById('esc_pgm');
        const programaHidden = document.getElementById('programa_hidden');

        if (sedeSelect && career.sede) {
            sedeSelect.value = career.sede;
            sedeSelect.dispatchEvent(new Event('change'));
        }

        if (tpPgmSelect && career.tp_pgm) {
            tpPgmSelect.value = career.tp_pgm;
            tpPgmSelect.dispatchEvent(new Event('change'));
        }

        setTimeout(() => {
            const carreraSelect = document.getElementById('carrera_select');
            if (carreraSelect && career.id) {
                carreraSelect.value = career.id;
                carreraSelect.dispatchEvent(new Event('change'));
            }
            if (escPgmInput) escPgmInput.value = career.id;
            const carreraHidden = document.getElementById('carrera_hidden');
            if (carreraHidden) carreraHidden.value = career.id;
            if (programaHidden) programaHidden.value = career.name;
        }, 150);
    }

    function generateMarkdownReport(leadData = {}, result = currentResult) {
        if (!result) return '# Test Vocacional UIDE\n\nNo hay resultados disponibles.';
        
        const fecha = new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' });
        const estudiante = leadData.f_name ? `${leadData.f_name} ${leadData.l_name || ''}`.trim() : 'Estudiante Prospecto';
        const colegio = leadData.colegio_origen || 'No especificado';
        const celular = leadData.mobile || 'No especificado';
        const email = leadData.email || 'No especificado';

        const alternativesMd = result.alternatives.map(a => `- **${a.name}** (Sede ${a.sede})`).join('\n');

        return `# 🎓 Perfil Vocacional Oficial UIDE
*Universidad Internacional del Ecuador • Powered by Arizona State University*

---

## 👤 Datos del Estudiante
- **Nombre:** ${estudiante}
- **Colegio de Procedencia:** ${colegio}
- **Celular / WhatsApp:** ${celular}
- **Correo Electrónico:** ${email}
- **Fecha de Evaluación:** ${fecha}

---

## 🎯 Resultado Vocacional
- **Área de Afinidad Dominante:** ${result.dominantArea.icon} **${result.dominantArea.name}**
- **Insignia de Perfil:** \`${result.dominantArea.badge}\`
- **Descripción de Competencias:**
  > ${result.dominantArea.description}

### Ponderación de Áreas:
- 💻 **Tecnología, Sistemas & IA:** ${result.scores.TEC || 0}%
- 💼 **Negocios & Emprendimiento:** ${result.scores.NEG || 0}%
- 🩺 **Ciencias de la Salud:** ${result.scores.SAL || 0}%
- ⚖️ **Derecho & Ciencias Sociales:** ${result.scores.SOC || 0}%
- 🎨 **Comunicación & Creatividad:** ${result.scores.CRE || 0}%
- ⚙️ **Ingenierías & Mecatrónica:** ${result.scores.ING || 0}%

---

## 🌟 Carrera UIDE Recomendada
### **${result.primaryCareer.name}**
- **Sede Sugerida:** ${result.primaryCareer.sede}
- **Código Oficial CRM Pardot:** \`${result.primaryCareer.id}\`
- **Alianza Académica:** Programa potenciado por **Arizona State University**, clasificada como la #1 en innovación de Estados Unidos.

### Otras Carreras UIDE de Alta Compatibilidad:
${alternativesMd}

---

## 📲 Próximos Pasos para Admisiones 2026
1. Conecta con tu Asesor Educativo asignado para agendar una visita a campus o entrevista vocacional.
2. Solicita el simulador de Becas Académicas y Deportivas UIDE.
3. Más información oficial en [www.uide.edu.ec](https://www.uide.edu.ec).
`;
    }

    function downloadCurrentReport() {
        if (!currentResult) {
            alert('Por favor completa el test vocacional primero.');
            return;
        }

        const leadData = {
            f_name: document.getElementById('f_name') ? document.getElementById('f_name').value.trim() : '',
            l_name: document.getElementById('l_name') ? document.getElementById('l_name').value.trim() : '',
            email: document.getElementById('email') ? document.getElementById('email').value.trim() : '',
            mobile: document.getElementById('mobile') ? document.getElementById('mobile').value.trim() : '',
            colegio_origen: document.getElementById('colegio_origen') ? document.getElementById('colegio_origen').value.trim() : ''
        };

        const mdContent = generateMarkdownReport(leadData, currentResult);
        const nameClean = (leadData.f_name || 'Estudiante').replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `Mi_Perfil_Vocacional_UIDE_${nameClean}.md`;

        const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function getCurrentResult() {
        return currentResult;
    }

    return {
        init,
        startTest,
        selectOption,
        calculateResult,
        generateMarkdownReport,
        getCurrentResult,
        AREAS,
        QUESTIONS
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VocationalTest };
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        VocationalTest.init();
    });
}
