import { firebaseConfig } from './firebase-config.js';
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut,
  sendPasswordResetEmail, createUserWithEmailAndPassword, deleteUser
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  getFirestore, collection, doc, getDoc, getDocs, query, where, setDoc,
  updateDoc, deleteDoc, writeBatch, addDoc, onSnapshot
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const ROLES = { admin: 'Administración técnica', reception: 'Recepción', nursing: 'Enfermería', clinician: 'Profesional clínico' };
const SPECIALTIES = ['Medicina', 'Fisioterapia', 'Nutrición', 'Psicología', 'Enfermería', 'Otro / personalizado'];
const STATUSES = ['Recepción', 'Enfermería', 'Consulta', 'En atención', 'Atendido', 'Cancelado'];
const ACTIVE_VISIT_STATUSES = ['Recepción', 'Enfermería', 'Consulta', 'En atención'];
const NOTE_TYPES = ['Primera vez', 'Evolución', 'Consulta ambulatoria', 'Interconsulta', 'Referencia / traslado', 'Urgencias', 'Egreso', 'Adenda / aclaración'];
const MEDICAL_HISTORY_FIELDS = [
  ['antecedentes_heredofamiliares','Heredofamiliares'],
  ['antecedentes_gineco_obstetricos','Gineco-obstétricos'],
  ['otras_observaciones','Otras observaciones']
];
const RECOMMENDATION_FIELDS = [
  ['laboratorio_orden','Laboratorio / gabinete'],
  ['otras_indicaciones_recomendaciones','Otras indicaciones y recomendaciones']
];
const HISTORY_CHOICE_ICONS = {
  'Diabetes tipo 2':'🩸','Diabetes tipo 1':'🩸','Hipertensión arterial':'🫀','Obesidad':'⚖️','Dislipidemia':'🧪','Hipotiroidismo':'🦋','Hipertiroidismo':'🦋','Artritis reumatoide':'🦴',
  'Cardiopatía':'❤️','Insuficiencia cardiaca':'🫀','Arritmias':'💓','Asma':'🫁','EPOC':'🫁','Neumonías recurrentes':'🫁','Epilepsia':'🧠','Evento vascular cerebral previo':'🧠','Migraña':'🤕','Depresión':'🧠','Ansiedad':'🧠','Otro trastorno neurológico/psiquiátrico':'🧠',
  'Gastritis':'🩺','ERGE / reflujo':'🩺','Colitis / intestino irritable':'🩺','Hepatitis':'🧫','Hígado graso':'🧫','Úlcera péptica':'🩺','Insuficiencia renal':'🫘','Litiasis renal':'🫘','Tuberculosis':'🦠','VIH':'🧬','Cáncer':'🎗️','Enfermedad autoinmune':'🛡️',
  'Cirugías previas':'🏥','Hospitalizaciones':'🏥','Tabaquismo':'🚭','Consumo de alcohol':'🍷','Consumo de otras sustancias':'⚠️','Transfusiones previas':'🩸'
};
const MEDICAL_HISTORY_CHOICES = [
  { title:'Crónico-degenerativos', color:'#7A1F3D', items:['Diabetes tipo 2','Diabetes tipo 1','Hipertensión arterial','Obesidad','Dislipidemia','Hipotiroidismo','Hipertiroidismo','Artritis reumatoide'] },
  { title:'Cardiovasculares y respiratorios', color:'#C0392B', items:['Cardiopatía','Insuficiencia cardiaca','Arritmias','Asma','EPOC','Neumonías recurrentes'] },
  { title:'Neurológicos y psiquiátricos', color:'#6C5B9E', items:['Epilepsia','Evento vascular cerebral previo','Migraña','Depresión','Ansiedad','Otro trastorno neurológico/psiquiátrico'] },
  { title:'Gastrointestinales y hepáticos', color:'#A8740F', items:['Gastritis','ERGE / reflujo','Colitis / intestino irritable','Hepatitis','Hígado graso','Úlcera péptica'] },
  { title:'Renales, infecciosos y otros', color:'#1F8A70', items:['Insuficiencia renal','Litiasis renal','Tuberculosis','VIH','Cáncer','Enfermedad autoinmune'] },
  { title:'Quirúrgicos y hábitos', color:'#2F3437', items:['Cirugías previas','Hospitalizaciones','Tabaquismo','Consumo de alcohol','Consumo de otras sustancias','Transfusiones previas'] }
];
const DEFAULT_UI_SETTINGS = {
  roleColors: {admin:'#777d86',reception:'#25282d',nursing:'#d64550','Medicina':'#55adf6','Fisioterapia':'#e978b1','Nutrición':'#48a66b','Psicología':'#e2bd3f','Enfermería':'#d64550','Otro / personalizado':'#2463a6'},
  navLabels: {}, navOrder: {}, clinicalLabels: {}, clinicalOrder: {}, clinicalSchemas: {}, clinicalSchemaComplete: {}, clinicalActions: {},
  actionLabels: {start:'Iniciar consulta',finish_visit:'Finalizar consulta'}
};
const PATIENT_FIELDS = [
  ['first_name','Nombre(s)','text',true],['last_name1','Primer apellido','text',true],['last_name2','Segundo apellido','text',false],
  ['dob','Fecha de nacimiento','date',true],['sex','Sexo','select',true],['curp','CURP','text',false],
  ['phone','Teléfono','tel',false],['email','Correo electrónico','email',false],['address','Domicilio','text',false],
  ['occupation','Ocupación','text',false],['marital','Estado civil','text',false],['emergency_contact','Contacto responsable / emergencia','text',false],
  ['relationship','Parentesco','text',false],['emergency_phone','Teléfono de emergencia','tel',false],['guardian','Madre/padre/tutor','text',false]
];
const TRIAGE_FIELDS = [
  ['weight_kg','Peso (kg)','number'],['height_cm','Talla (cm)','number'],['temperature_c','Temperatura (°C)','number'],
  ['hr','Frecuencia cardiaca','number'],['rr','Frecuencia respiratoria','number'],['bp_sys','TA sistólica','number'],['bp_dia','TA diastólica','number'],
  ['spo2','SpO₂ (%)','number'],['glucose','Glucemia (si procede)','number'],['pain','Dolor (0–10)','number'],
  ['allergies','Alergias referidas','textarea'],['reason','Motivo / síntomas referidos','textarea'],
  ['observations','Observaciones de enfermería','textarea'],['urgent','Datos de alarma / prioridad','textarea']
];
const SOMATOMETRY_FIELDS = TRIAGE_FIELDS.filter(([, , type])=>type==='number');
const TEMPLATES = {
  'Medicina': [
    ['motivo','Motivo de consulta'],['peea','PEEA'],['exploracion','Exploración física'],['diagnostico','Impresión diagnóstica / Diagnóstico'],['observaciones_clinicas','Observaciones clínicas'],['pronostico','Pronóstico']
  ],
  'Fisioterapia': [['motivo','Motivo de atención y diagnóstico de referencia'],['historia','Historia del padecimiento / mecanismo de lesión'],['evaluacion','Evaluación funcional y exploración fisioterapéutica'],['dolor','Dolor: escala, localización y comportamiento'],['movilidad','Rangos de movilidad, fuerza y pruebas funcionales'],['objetivos','Objetivos terapéuticos'],['tratamiento','Intervenciones realizadas, dosis/tiempo y ejercicios'],['respuesta','Respuesta/tolerancia y eventos relevantes'],['plan','Plan domiciliario, progresión y sesiones'],['seguimiento','Revaloración y plan de seguimiento']],
  'Nutrición': [['motivo','Motivo de consulta y objetivos'],['historia','Historia clínica, antecedentes, alergias y medicamentos'],['alimentacion','Historia y hábitos alimentarios'],['antropometria','Evaluación antropométrica y composición corporal'],['clinica','Evaluación clínica / bioquímica disponible'],['diagnostico','Diagnóstico / evaluación nutricional'],['requerimientos','Requerimientos estimados y criterio de cálculo'],['plan','Plan alimentario individualizado'],['educacion','Educación, recomendaciones y metas'],['seguimiento','Seguimiento y próxima revaloración']],
  'Psicología': [['motivo','Motivo de consulta y consentimiento / encuadre'],['historia','Historia del problema y antecedentes pertinentes'],['evaluacion','Evaluación del estado mental y funcionamiento'],['riesgo','Evaluación de riesgo y medidas de seguridad, cuando aplique'],['impresion','Impresión clínica / hipótesis de trabajo'],['intervencion','Intervención realizada'],['plan','Plan terapéutico y objetivos'],['seguimiento','Seguimiento, acuerdos y referencia']],
  'Enfermería': [['motivo','Motivo de atención / indicación recibida'],['valoracion','Valoración de enfermería'],['procedimiento','Procedimiento / cuidados realizados y material'],['respuesta','Respuesta del paciente y vigilancia'],['indicaciones','Indicaciones, educación y signos de alarma'],['seguimiento','Seguimiento / comunicación al profesional responsable']],
  'Otro / personalizado': [['motivo','Motivo de atención'],['evaluacion','Evaluación'],['intervencion','Intervenciones'],['plan','Plan'],['seguimiento','Seguimiento / referencia']]
};
// BRIMA_TEMPLATE_SCHEMA_EDITOR_V1
// Las plantillas no alteran la ficha de identificación ni la somatometría comunes.
// Los cambios del administrador se guardan en configuracion/clinic_ui.clinicalSchemas.
const schemaOption = (label, icon='🔹') => ({label, icon});
const schemaField = (key,label,type='textarea',group='Historia clínica',icon='📝',options=[],required=false,placeholder='') => ({key,label,type,group,icon,options:options.map(x=>Array.isArray(x)?schemaOption(x[0],x[1]):x),required,placeholder});
const DEFAULT_CLINICAL_SCHEMAS = {
 'Fisioterapia': [
  schemaField('f_interrogatorio','Tipo de interrogatorio','choice','Datos de atención','🗣️',[['Directo','🗣️'],['Indirecto','👥']]),
  schemaField('f_motivo_mecanismo','Motivo de atención y mecanismo de lesión','textarea','Motivo y padecimiento actual','🎯',[],true,'Mecanismo de lesión, síntomas, inicio, evolución cronológica e impacto funcional…'),
  schemaField('f_comorbilidades','Antecedentes personales patológicos / comorbilidades','chips','Antecedentes relevantes','🩺',[['Diabetes','🩸'],['Hipertensión','❤️'],['Cardiopatía','🫀'],['Enfermedad reumática','🦴'],['Cáncer','🎗️'],['Enfermedad neurológica','🧠'],['Enfermedad respiratoria','🫁'],['Otra','➕']]),
  schemaField('f_cirugias_traumatismos','Cirugías y traumatismos previos','textarea','Antecedentes relevantes','🏥',[],false,'Tipo, región, fecha y secuelas…'),
  schemaField('f_protesis_implantes','Prótesis / implantes metálicos','text','Antecedentes relevantes','🦿'),
  schemaField('f_marcapasos','Marcapasos','choice','Antecedentes relevantes','💓',[['Sí','✅'],['No','⭕'],['No sabe','❔']]),
  schemaField('f_medicamentos_actuales','Medicamentos actuales (referidos)','textarea','Antecedentes relevantes','💊',[],false,'Registrar únicamente lo que el paciente refiere; no es una prescripción.'),
  schemaField('f_alergias_reacciones','Alergias y reacciones conocidas','textarea','Antecedentes relevantes','⚠️'),
  schemaField('f_dolor_eva','Dolor · escala EVA (0 a 10)','scale','Evaluación fisioterapéutica','🔥',[],false,'Selecciona intensidad de dolor de 0 a 10.'),
  schemaField('f_tipo_dolor','Tipo / comportamiento del dolor','chips','Evaluación fisioterapéutica','⚡',[['Agudo','⚡'],['Crónico','🕒'],['Punzante','📍'],['Quemante','🔥'],['Opresivo','〰️'],['Sordo','◯'],['Intermitente','🔁'],['Irradiado','➡️']]),
  schemaField('f_localizacion_dolor','Localización, irradiación y factores que modifican el dolor','textarea','Evaluación fisioterapéutica','📍'),
  schemaField('f_inspeccion_postura','Inspección · postura · marcha · cicatrices · edema','chips','Evaluación fisioterapéutica','👁️',[['Postura alterada','🧍'],['Cicatriz visible','🩹'],['Edema presente','💧'],['Alteración de la marcha','🚶'],['Atrofia muscular','💪'],['Asimetría','↔️'],['Sin hallazgos relevantes','✅']]),
  schemaField('f_palpacion_tono','Palpación kinésica · tono · puntos gatillo','chips','Evaluación fisioterapéutica','✋',[['Tono aumentado / espasticidad','⬆️'],['Tono disminuido / flacidez','⬇️'],['Puntos gatillo activos','🎯'],['Dolor a la palpación','⚡'],['Contractura muscular','🪢'],['Sin hallazgos relevantes','✅']]),
  schemaField('f_goniometria','Goniometría · rangos de movimiento articular','textarea','Evaluación fisioterapéutica','📐',[],false,'Registrar una línea por movimiento: articulación | lado | movimiento | rango en grados | comparación / observaciones.'),
  schemaField('f_fuerza_daniels','Fuerza muscular · escala de Daniels (0 a 5)','textarea','Evaluación fisioterapéutica','💪',[],false,'Registrar grupo muscular / movimiento | lado | grado 0–5 | observaciones.'),
  schemaField('f_pruebas_especiales','Pruebas clínicas especiales / ortopédicas','chips','Evaluación fisioterapéutica','🧪',[['Lachman','🦵'],['McMurray','🦵'],['Neer','💪'],['Hawkins','💪'],['Phalen','✋'],['Trendelenburg','🚶'],['Otra prueba','➕'],['No aplicadas','—']]),
  schemaField('f_resultados_pruebas','Resultado y descripción de pruebas funcionales','textarea','Evaluación fisioterapéutica','📝'),
  schemaField('f_fisiodiagnostico_cif','Diagnóstico fisioterapéutico / fisiodiagnóstico (CIF)','textarea','Diagnóstico y objetivos','🧩',[],true,'Deficiencias en funciones/estructuras, limitaciones de actividad y restricciones de participación.'),
  schemaField('f_objetivos_corto_largo','Objetivos terapéuticos a corto y largo plazo','textarea','Diagnóstico y objetivos','🎯',[],true),
  schemaField('f_modalidades','Agentes físicos / modalidades / técnicas propuestas','chips','Plan de intervención','🛠️',[['Termoterapia','🌡️'],['Crioterapia','🧊'],['Electroterapia','⚡'],['Ultrasonido terapéutico','〰️'],['Terapia manual','✋'],['Ejercicio terapéutico','🏃'],['Reeducación de marcha','🚶'],['Entrenamiento funcional','🧍'],['Otra intervención','➕']]),
  schemaField('f_intervenciones_dosis','Intervenciones realizadas y dosificación','textarea','Plan de intervención','📋',[],false,'Técnica / región / parámetros / intensidad / tiempo / respuesta.'),
  schemaField('f_respuesta_tolerancia','Respuesta, tolerancia y eventos relevantes','textarea','Plan de intervención','💬'),
  schemaField('f_plan_domiciliario','Plan domiciliario, progresión y recomendaciones','textarea','Plan de intervención','🏠'),
  schemaField('f_frecuencia_sesiones','Frecuencia y número estimado de sesiones','text','Seguimiento y pronóstico','📅'),
  schemaField('f_pronostico','Pronóstico funcional','choice','Seguimiento y pronóstico','🌤️',[['Bueno','🟢'],['Favorable con reservas','🟡'],['Reservado','🟠'],['Desfavorable','🔴'],['Por determinar','❔']]),
  schemaField('f_revaloracion','Criterios y fecha de revaloración','textarea','Seguimiento y pronóstico','🔄')
 ],
 'Nutrición': [
  schemaField('n_motivo_consulta','Motivo de consulta','textarea','Motivo y objetivos','🎯',[],true),
  schemaField('n_objetivo','Objetivo nutricional del paciente','textarea','Motivo y objetivos','🏁',[],true),
  schemaField('n_antecedentes_fisiopatologicos','Antecedentes fisiopatológicos · personal / familiar','chips','Antecedentes fisiopatológicos','🩺',[['Diabetes · personal','🩸'],['Diabetes · familiar','👨‍👩‍👧'],['HTA · personal','❤️'],['HTA · familiar','👨‍👩‍👧'],['Obesidad · personal','⚖️'],['Obesidad · familiar','👨‍👩‍👧'],['Infarto / arritmia · personal','🫀'],['Infarto / arritmia · familiar','👨‍👩‍👧'],['Colesterol elevado · personal','🧪'],['Colesterol elevado · familiar','👨‍👩‍👧'],['Triglicéridos elevados · personal','🧪'],['Triglicéridos elevados · familiar','👨‍👩‍👧'],['Trastorno hormonal · personal','🦋'],['Trastorno hormonal · familiar','👨‍👩‍👧'],['Cáncer · personal','🎗️'],['Cáncer · familiar','👨‍👩‍👧'],['Esofagitis','🩺'],['Gastritis','🩺'],['Colitis','🩺'],['Úlceras','🩺'],['Otro','➕'],['Ninguno referido','✅']]),
  schemaField('n_diabetes_tipo','Tipo de diabetes / observaciones relevantes','text','Antecedentes fisiopatológicos','🩸'),
  schemaField('n_prescripcion_medica','Prescripción médica o tratamiento actual referido','textarea','Antecedentes fisiopatológicos','📄',[],false,'Registrar lo referido por el paciente; no es una nueva prescripción.'),
  schemaField('n_datos_clinicos_sintomas','Datos clínicos y síntomas referidos','chips','Datos clínicos','🩺',[['Apetito satisfactorio','🍽️'],['Vómito','🤢'],['Poliuria','💧'],['Distensión abdominal','🫄'],['Diarrea','🚽'],['Estreñimiento','🚽'],['Cefalea','🤕'],['Flatulencias','💨'],['Fatiga','🥱'],['Caries','🦷'],['Otro síntoma','➕'],['Sin síntomas referidos','✅']]),
  schemaField('n_otros_datos_clinicos','Otros datos clínicos / evolución de síntomas','textarea','Datos clínicos','📝'),
  schemaField('n_actividad_fisica','Actividad física actual','choice','Estilo de vida','🏃',[['Sedentaria','🪑'],['Ligera','🚶'],['Moderada','🏃'],['Intensa','🏋️'],['No realiza','⭕']]),
  schemaField('n_tipo_actividad','Tipo de actividad física / deporte','text','Estilo de vida','🏅'),
  schemaField('n_frecuencia_actividad','Frecuencia de actividad física','text','Estilo de vida','📅'),
  schemaField('n_horas_sueno','Horas de sueño','number','Estilo de vida','🌙'),
  schemaField('n_horas_trabajo_escuela','Horas de trabajo y/o escuela','number','Estilo de vida','🕒'),
  schemaField('n_alcohol','Consumo de alcohol','choice','Estilo de vida','🍷',[['No','⭕'],['Sí','✅'],['Ocasional','🟡'],['Prefiere no responder','🔒']]),
  schemaField('n_alcohol_cantidad_frecuencia','Cantidad y frecuencia de consumo de alcohol','text','Estilo de vida','🍷'),
  schemaField('n_tabaco','Consumo de tabaco','choice','Estilo de vida','🚭',[['No','⭕'],['Sí','✅'],['Exfumador','↩️'],['Prefiere no responder','🔒']]),
  schemaField('n_tabaco_cantidad_frecuencia','Cantidad y frecuencia de consumo de tabaco','text','Estilo de vida','🚬'),
  schemaField('n_comidas_dia','Número de comidas al día','number','Datos dietéticos','🍽️'),
  schemaField('n_cuales_comidas','¿Cuáles comidas realiza?','chips','Datos dietéticos','🍴',[['Desayuno','🌅'],['Colación matutina','🍎'],['Comida','☀️'],['Colación vespertina','🥜'],['Cena','🌙'],['Colación nocturna','🌜']]),
  schemaField('n_tiempo_comer','Tiempo que tarda en comer','text','Datos dietéticos','⏱️'),
  schemaField('n_quien_prepara','¿Quién prepara los alimentos?','text','Datos dietéticos','👩‍🍳'),
  schemaField('n_donde_con_quien','¿Dónde y con quién ingiere los alimentos?','textarea','Datos dietéticos','🏠'),
  schemaField('n_dietas_previas','Dietas previas, duración y descripción','textarea','Datos dietéticos','📋'),
  schemaField('n_sal_tipo','Consumo de sal y tipo','text','Datos dietéticos','🧂'),
  schemaField('n_aceite_tipo','Consumo de aceite y tipo','text','Datos dietéticos','🫒'),
  schemaField('n_agua_litros','Litros de agua al día','number','Datos dietéticos','💧'),
  schemaField('n_otros_liquidos','Otros líquidos que consume','textarea','Datos dietéticos','🥤'),
  schemaField('n_alimentos_gustan','Alimentos que le gustan','textarea','Datos dietéticos','💚'),
  schemaField('n_alimentos_disgustan','Alimentos que le disgustan','textarea','Datos dietéticos','🚫'),
  schemaField('n_alergia_intolerancia','Alergia o intolerancia a alimentos','textarea','Datos dietéticos','⚠️'),
  schemaField('n_masa_muscular','Masa muscular (kg)','number','Antropometría complementaria','💪'),
  schemaField('n_grasa_corporal','Grasa corporal (kg o %)','text','Antropometría complementaria','⚖️'),
  schemaField('n_cintura_cadera_icc','Circunferencia de cintura / cadera / riesgo ICC','textarea','Antropometría complementaria','📏'),
  schemaField('n_circunferencias_brazos','Circunferencia de brazo derecho e izquierdo · relajado / contraído','textarea','Antropometría complementaria','💪'),
  schemaField('n_pliegues_cutaneos','Pliegues cutáneos opcionales · tríceps / bíceps / subescapular / suprailíaco','textarea','Antropometría complementaria','📐'),
  schemaField('n_observaciones','Observaciones nutricionales','textarea','Evaluación nutricional','📝'),
  schemaField('n_diagnostico','Diagnóstico nutricio','textarea','Evaluación nutricional','🧩',[],true),
  schemaField('n_calculos_dieteticos','Cálculos dietéticos y criterios utilizados','textarea','Evaluación nutricional','🧮'),
  schemaField('n_recordatorio_desayuno','Recordatorio de 24 horas · desayuno','textarea','Recordatorio de 24 horas','🌅'),
  schemaField('n_recordatorio_colacion1','Recordatorio de 24 horas · colación 1','textarea','Recordatorio de 24 horas','🍎'),
  schemaField('n_recordatorio_comida','Recordatorio de 24 horas · comida','textarea','Recordatorio de 24 horas','🍲'),
  schemaField('n_recordatorio_colacion2','Recordatorio de 24 horas · colación 2','textarea','Recordatorio de 24 horas','🥜'),
  schemaField('n_recordatorio_cena','Recordatorio de 24 horas · cena','textarea','Recordatorio de 24 horas','🌙'),
  schemaField('n_frecuencia_alimentaria','Frecuencia alimentaria semanal (veces por semana)','foodfreq','Frecuencia alimentaria','📊',[['Frutas','🍎'],['Verduras','🥦'],['Leche','🥛'],['Yogurt','🥣'],['Queso','🧀'],['Huevo','🥚'],['Embutidos','🌭'],['Leguminosas','🫘'],['Carne','🥩'],['Pollo','🍗'],['Pescado','🐟'],['Mariscos','🦐'],['Atún','🐟'],['Carne de puerco','🥓'],['Arroz','🍚'],['Tortillas / tostadas','🌮'],['Pan','🍞'],['Papa','🥔'],['Pasta','🍝'],['Galletas dulces','🍪'],['Frituras','🍟'],['Postres / pan dulce','🍰'],['Refresco','🥤'],['Café o té','☕'],['Saborizantes artificiales','🧃'],['Mantequilla / margarina','🧈'],['Edulcorantes','🍬'],['Aderezos','🥗'],['Dulces','🍭'],['Frutos secos','🥜']]),
  schemaField('n_plan_alimentario','Plan alimentario · opciones por tiempo de comida','foodplan','Plan de intervención','🥗',[],true)
 ],
 'Psicología': [
  schemaField('p_interrogatorio','Tipo de interrogatorio','choice','Datos de atención','🗣️',[['Directo','🗣️'],['Indirecto','👥'],['Mixto','🔄']]),
  schemaField('p_motivo_peea','Motivo de consulta y padecimiento actual (PEEA)','textarea','Motivo y padecimiento actual','🎯',[],true,'Problemática, síntomas, fecha de inicio, evolución cronológica e impacto en la vida diaria.'),
  schemaField('p_antecedentes_heredofamiliares','Antecedentes heredofamiliares','textarea','Antecedentes','👨‍👩‍👧',[],false,'Trastornos psiquiátricos, adicciones, enfermedades crónicas o conductas de riesgo en familia nuclear.'),
  schemaField('p_antecedentes_no_patologicos','Antecedentes personales no patológicos','textarea','Antecedentes','🏠',[],false,'Dinámica familiar actual, entorno social, vivienda, hábitos de sueño y alimentación, tabaco/alcohol u otras sustancias.'),
  schemaField('p_antecedentes_patologicos','Antecedentes personales patológicos','textarea','Antecedentes','🩺',[],false,'Tratamientos psicológicos o psiquiátricos previos, hospitalizaciones, cirugías, enfermedades diagnosticadas y alergias.'),
  schemaField('p_aspecto_alino','Aspecto y aliño','choice','Examen del estado mental','👤',[['Adecuado','✅'],['Descuidado','⚠️'],['Atípico / describir','📝'],['No evaluado','—']]),
  schemaField('p_actitud_evaluador','Actitud hacia el evaluador','chips','Examen del estado mental','🤝',[['Colaboradora','🤝'],['Reservada','🔒'],['Hostil','⚠️'],['Desconfiada','👀'],['Evasiva','↩️'],['Variable','🔄'],['Otra','➕']]),
  schemaField('p_conciencia_orientacion','Conciencia y orientación','chips','Examen del estado mental','🧭',[['Alerta','✅'],['Somnolencia','🌙'],['Desorientación temporal','🕒'],['Desorientación espacial','📍'],['Desorientación personal','👤'],['Alteración de conciencia','⚠️'],['No evaluado','—']]),
  schemaField('p_atencion_memoria','Atención y memoria','chips','Examen del estado mental','🧠',[['Conservadas','✅'],['Atención disminuida','⬇️'],['Memoria inmediata alterada','🧩'],['Memoria reciente alterada','🧩'],['Memoria remota alterada','🧩'],['Por explorar','🔎']]),
  schemaField('p_pensamiento','Pensamiento · curso y contenido','chips','Examen del estado mental','💭',[['Organizado','✅'],['Fuga de ideas','💨'],['Lentificado','🐢'],['Rumiativo','🔁'],['Ideas obsesivas','🔄'],['Contenido delirante referido','⚠️'],['Otro / describir','➕']]),
  schemaField('p_lenguaje_discurso','Lenguaje y discurso','chips','Examen del estado mental','💬',[['Coherente','✅'],['Fluido','🗣️'],['Pobreza del lenguaje','⬇️'],['Presión del habla','⬆️'],['Discurso desorganizado','⚠️'],['Otro / describir','➕']]),
  schemaField('p_afecto_animo','Afecto y estado de ánimo','chips','Examen del estado mental','❤️',[['Eutímico','🙂'],['Ansioso','😟'],['Deprimido','😔'],['Irritable','😠'],['Expansivo','😃'],['Afecto restringido','◼️'],['Lábil','🔄'],['Otro / describir','➕']]),
  schemaField('p_juicio_insight','Juicio e insight','chips','Examen del estado mental','🧭',[['Conservados','✅'],['Parcialmente conservados','🟡'],['Comprometidos','⚠️'],['Insight ausente / limitado','🔎'],['Por evaluar','—']]),
  schemaField('p_detalle_examen_mental','Observaciones descriptivas del examen mental','textarea','Examen del estado mental','📝'),
  schemaField('p_valoracion_riesgo','Valoración explícita de riesgo suicida / homicida','choice','Riesgo y seguridad','🛡️',[['Sin indicios identificados en esta valoración','✅'],['Requiere exploración adicional','🔎'],['Riesgo identificado: documentar evaluación y medidas','⚠️'],['No evaluado (documentar motivo)','—']],true),
  schemaField('p_riesgo_detalle','Detalle de riesgo, factores protectores y medidas de seguridad','textarea','Riesgo y seguridad','🛡️',[],false,'Documentar preguntas, hallazgos, factores de riesgo/protección, plan de seguridad, referencia y seguimiento según corresponda.'),
  schemaField('p_resultados_instrumentos','Resultados de evaluaciones o instrumentos','textarea','Evaluación e impresión clínica','🧪',[],false,'Prueba / instrumento / fecha / resultado / interpretación clínica.'),
  schemaField('p_impresion_diagnostica','Impresión diagnóstica o problemas clínicos','textarea','Evaluación e impresión clínica','🧩',[],true,'Cuando corresponda, registrar criterios y codificación clínica utilizados.'),
  schemaField('p_objetivos_terapeuticos','Objetivos terapéuticos','textarea','Plan y pronóstico','🎯',[],true),
  schemaField('p_enfoque_tecnicas','Enfoque y técnicas a utilizar','chips','Plan y pronóstico','🧰',[['Cognitivo-conductual','🧠'],['Conductual','🔁'],['Sistémico','👨‍👩‍👧'],['Humanista','🌱'],['Psicoeducación','📚'],['Entrevista motivacional','💬'],['Otro enfoque','➕']]),
  schemaField('p_tecnicas_detalle','Técnicas / intervención realizada y respuesta','textarea','Plan y pronóstico','📝'),
  schemaField('p_periodicidad_sesiones','Periodicidad de las sesiones','text','Plan y pronóstico','📅'),
  schemaField('p_pronostico_clinico','Pronóstico clínico','choice','Plan y pronóstico','🌤️',[['Favorable','🟢'],['Reservado','🟡'],['Desfavorable','🔴'],['Por determinar','❔']]),
  schemaField('p_seguimiento_referencia','Seguimiento, acuerdos y referencia','textarea','Plan y pronóstico','🔄')
 ],
 'Otro / personalizado': [
  schemaField('motivo','Motivo de atención','textarea','Atención','🎯',[],true),
  schemaField('evaluacion','Evaluación','textarea','Atención','🔎'),
  schemaField('intervencion','Intervenciones','textarea','Plan','🛠️'),
  schemaField('plan','Plan','textarea','Plan','📋'),
  schemaField('seguimiento','Seguimiento / referencia','textarea','Plan','🔄')
 ]
};

// Campos comunes de la nota clínica: configurables por Administración en cada especialidad.
// Ficha de identificación y somatometría permanecen fuera del editor, como pidió la clínica.
const COMMON_CLINICAL_SCHEMA_FIELDS = [
 schemaField('antecedentes_seleccionados','Antecedentes médicos · selección rápida','chips','Antecedentes médicos','🩺',MEDICAL_HISTORY_CHOICES.flatMap(g=>g.items.map(item=>[item,HISTORY_CHOICE_ICONS[item]||'🩺']))),
 schemaField('antecedentes_seleccionados_otro','Otros antecedentes seleccionados / detalle','textarea','Antecedentes médicos','📝'),
 schemaField('antecedentes_heredofamiliares','Heredofamiliares','textarea','Antecedentes médicos · notas complementarias','👨‍👩‍👧'),
 schemaField('antecedentes_gineco_obstetricos','Gineco-obstétricos','textarea','Antecedentes médicos · notas complementarias','🌸'),
 schemaField('otras_observaciones','Otras observaciones','textarea','Antecedentes médicos · notas complementarias','📋'),
 schemaField('alergias_seleccionadas','Alergias y reacciones · selección rápida','chips','Alergias y seguridad','⚠️',[['Penicilina','💊'],['Sulfas','💊'],['Aspirina / AINE','💊'],['Anestésicos','🩺'],['Látex','🧤'],['Yodo / medios de contraste','🧪'],['Alimentos','🥜'],['Polen / polvo','🌿'],['Picaduras de insectos','🐝'],['Ninguna conocida','✅']]),
 schemaField('alergias_detalle','Otras alergias, sustancia y reacción','textarea','Alergias y seguridad','⚠️'),
 schemaField('laboratorio_orden','Laboratorio / gabinete','textarea','Indicaciones y recomendaciones','🧪',[],false,'Un estudio por línea…'),
 schemaField('otras_indicaciones_recomendaciones','Otras indicaciones y recomendaciones','textarea','Indicaciones y recomendaciones','📋')
];
function isClinicalActionEnabled(specialty,action){
 const saved=state.uiSettings?.clinicalActions?.[specialty]||{};
 if(action==='labs')return saved.labsEnabled===true || (saved.labsEnabled===undefined && String(specialty||'').toLocaleLowerCase('es-MX')==='medicina');
 return false;
}
function defaultFormatActionLabels(specialty=''){
 const sp=String(specialty||'').trim().toLocaleLowerCase('es-MX');
 const plan=sp==='nutrición'?'Generar plan nutricional':sp==='fisioterapia'?'Generar plan de intervención':sp==='psicología'?'Generar plan terapéutico':sp==='enfermería'?'Generar plan de cuidados':'Generar plan profesional';
 return {prescription:'Generar solo receta',labs:'Generar solo orden de laboratorios',professional_plan:plan};
}
function formatActionLabels(format,specialty=''){
 return {...defaultFormatActionLabels(specialty),...(format?.action_labels&&typeof format.action_labels==='object'?format.action_labels:{})};
}

// Catálogo de documentos reutilizables. Las asignaciones por formato se guardan
// en configuracion/document_action_catalog para no alterar ni reordenar el schema existente.
const DOCUMENT_ACTION_CONFIG_KEY='document_action_catalog';
function normalizeDocumentActionSettings(raw){
 const source=raw&&typeof raw==='object'?raw:{};
 const catalog=Array.isArray(source.catalog)?source.catalog.filter(x=>x&&typeof x==='object'&&String(x.id||'').trim()).map(x=>({
  id:String(x.id),name:String(x.name||'Documento personalizado').trim().slice(0,80),
  documentTitle:String(x.documentTitle||x.name||'Documento').trim().slice(0,120),
  description:String(x.description||'').trim().slice(0,240),active:x.active!==false,
  created_at:String(x.created_at||''),updated_at:String(x.updated_at||'')
 })):[];
 const formats=source.formats&&typeof source.formats==='object'&&!Array.isArray(source.formats)?source.formats:{};
 const cleanFormats={};
 for(const [formatId,items] of Object.entries(formats)){
  if(!Array.isArray(items))continue;
  cleanFormats[String(formatId)]=items.filter(x=>x&&typeof x==='object'&&String(x.catalogId||'').trim()).map(x=>({
   catalogId:String(x.catalogId),buttonLabel:String(x.buttonLabel||'').trim().slice(0,80),
   documentTitle:String(x.documentTitle||'').trim().slice(0,120),
   fieldKeys:Array.isArray(x.fieldKeys)?[...new Set(x.fieldKeys.map(String))].slice(0,100):[],
   includePatientIdentity:x.includePatientIdentity!==false,
   includeSomatometry:x.includeSomatometry===true,
   includeProfessionalSignature:x.includeProfessionalSignature!==false,
   showGroups:x.showGroups!==false
  }));
 }
 return {version:1,catalog,formats:cleanFormats};
}
async function loadDocumentActionSettings(){
 try{
  const snap=await getDoc(doc(db,'configuracion',DOCUMENT_ACTION_CONFIG_KEY));
  state.documentActionSettings=snap.exists()&&snap.data().ownerUid===state.ownerUid
   ?normalizeDocumentActionSettings(snap.data().value):normalizeDocumentActionSettings({});
 }catch(err){
  console.warn('No se pudo cargar el catálogo de documentos reutilizables.',err);
  state.documentActionSettings=normalizeDocumentActionSettings({});
 }
 return state.documentActionSettings;
}
async function saveDocumentActionSettings(next){
 if(state.user?.role!=='admin')throw new Error('Solo Administración puede modificar el catálogo de documentos.');
 const normalized=normalizeDocumentActionSettings(next);
 const serializedSize=new TextEncoder().encode(JSON.stringify(normalized)).length;
 if(serializedSize>700000)throw new Error('El catálogo de documentos está alcanzando su límite seguro. Retira acciones antiguas o divide el catálogo antes de continuar.');
 await saveSetting(DOCUMENT_ACTION_CONFIG_KEY,normalized);
 state.documentActionSettings=normalized;
 return normalized;
}
function getFormatDocumentActions(formatId){
 if(!formatId)return [];
 const settings=normalizeDocumentActionSettings(state.documentActionSettings);
 const assigned=settings.formats[String(formatId)]||[];
 return assigned.map(config=>{
  const item=settings.catalog.find(x=>x.id===config.catalogId);
  if(!item||item.active===false)return null;
  return {...item,...config,name:item.name,buttonLabel:config.buttonLabel||`Generar ${item.name}`,documentTitle:config.documentTitle||item.documentTitle||item.name};
 }).filter(x=>x&&x.fieldKeys.length>0);
}
function getDocumentActionUsage(catalogId){
 const formats=normalizeDocumentActionSettings(state.documentActionSettings).formats;
 return Object.values(formats).filter(items=>Array.isArray(items)&&items.some(x=>x.catalogId===catalogId)).length;
}
function renderDocumentActionCatalogPanel(){
 const settings=normalizeDocumentActionSettings(state.documentActionSettings);
 const active=settings.catalog.filter(x=>x.active!==false);
 return `<div class="panel"><div class="panel-head"><div><h3>Catálogo de documentos reutilizables</h3><p>Crea una acción una sola vez y después asígnala a tantos formatos como necesites. Cada formato conserva sus propios campos y textos.</p></div><div class="actions"><button class="btn primary" id="document-action-catalog-manage">＋ Administrar catálogo</button></div></div>${active.length?`<div class="document-action-catalog-grid">${active.map(item=>`<div class="document-action-catalog-item"><strong>${esc(item.name)}</strong><span>${esc(item.documentTitle)}</span><small>${esc(item.description||'Documento reutilizable')}</small></div>`).join('')}</div>`:'<div class="empty-state"><strong>Aún no hay documentos reutilizables</strong><p>Agrega, por ejemplo, una ficha de seguimiento, recomendaciones, constancia o informe.</p></div>'}</div>`;
}
function openDocumentActionCatalogManager(){
 if(state.user?.role!=='admin'){toast('Solo Administración puede modificar el catálogo.','warning');return;}
 const renderRows=()=>{
  const items=normalizeDocumentActionSettings(state.documentActionSettings).catalog;
  const rows=items.map(item=>`<div class="document-catalog-row"><div><strong>${esc(item.name)}</strong><small>${esc(item.documentTitle)} · ${getDocumentActionUsage(item.id)} formato(s) asignado(s)</small><p>${esc(item.description||'Sin descripción')}</p></div><div class="actions"><button type="button" class="btn small" data-doc-catalog-edit="${esc(item.id)}">Editar</button><button type="button" class="btn small danger" data-doc-catalog-delete="${esc(item.id)}" ${getDocumentActionUsage(item.id)>0?'disabled title="Retira primero esta acción de los formatos"':''}>Eliminar</button></div></div>`).join('');
  return `<div class="document-catalog-list">${rows||'<div class="empty-state"><strong>Catálogo vacío</strong><p>Agrega tu primera acción reutilizable.</p></div>'}</div><div class="actions" style="margin-top:14px"><button type="button" class="btn primary" id="document-catalog-add">＋ Crear documento reutilizable</button></div>`;
 };
 openModal('Catálogo general de documentos',renderRows(),{size:'wide',buttons:[{action:'close',label:'Cerrar'}],afterOpen:root=>{
  root.addEventListener('click',async e=>{
   const edit=e.target.closest('[data-doc-catalog-edit]');
   if(edit){openDocumentActionCatalogItemEditor(edit.dataset.docCatalogEdit);return;}
   const del=e.target.closest('[data-doc-catalog-delete]');
   if(del){await deleteDocumentActionCatalogItem(del.dataset.docCatalogDelete);const modalBody=$('.modal-body',root);if(modalBody)modalBody.innerHTML=renderRows();return;}
   if(e.target.closest('#document-catalog-add'))openDocumentActionCatalogItemEditor('');
  });
 }});
}
function openDocumentActionCatalogItemEditor(itemId=''){
 const settings=normalizeDocumentActionSettings(state.documentActionSettings);
 const item=settings.catalog.find(x=>x.id===itemId)||null;
 openModal(item?'Editar documento reutilizable':'Nuevo documento reutilizable',`<div class="form-grid"><label class="form-field span-2"><span>Nombre de la acción *</span><input name="document_name" required maxlength="80" value="${esc(item?.name||'')}" placeholder="Ej. Ficha de seguimiento"></label><label class="form-field span-2"><span>Título que aparecerá en el documento *</span><input name="document_title" required maxlength="120" value="${esc(item?.documentTitle||'')}" placeholder="Ej. FICHA DE SEGUIMIENTO"></label><label class="form-field span-2"><span>Descripción / finalidad</span><textarea name="document_description" rows="2" maxlength="240" placeholder="Para qué se utilizará este documento">${esc(item?.description||'')}</textarea></label></div><div class="inline-note"><strong>Documento reutilizable</strong><span>Después podrás asignar esta acción a distintos formatos y elegir campos diferentes en cada uno. No modifica los campos ni el orden de ningún formato.</span></div>`,{size:'medium',buttons:[{action:'cancel',label:'Cancelar'},{action:'save',label:'Guardar documento',primary:true}],onAction:async(action,fd)=>{
  if(action!=='save')return true;
  const name=String(fd.get('document_name')||'').trim(),documentTitle=String(fd.get('document_title')||'').trim(),description=String(fd.get('document_description')||'').trim();
  if(!name||!documentTitle){toast('Escribe el nombre de la acción y el título del documento.','warning');return false;}
  const duplicate=settings.catalog.find(x=>x.id!==itemId&&x.name.toLocaleLowerCase('es-MX')===name.toLocaleLowerCase('es-MX'));
  if(duplicate){toast('Ya existe una acción con ese nombre en el catálogo.','warning');return false;}
  const id=itemId||`doc_${slugify(name).slice(0,35)}_${crypto.randomUUID().slice(0,8)}`;
  const nextItem={id,name,documentTitle,description,active:true,created_at:item?.created_at||nowIso(),updated_at:nowIso()};
  const catalog=item?settings.catalog.map(x=>x.id===id?nextItem:x):[...settings.catalog,nextItem];
  try{await saveDocumentActionSettings({...settings,catalog});toast(item?'Documento reutilizable actualizado.':'Documento reutilizable creado.');
   if(state.view==='templates')await renderTemplates();
   return true;
  }catch(err){toast('No se pudo guardar el catálogo. '+friendlyError(err),'error',8000);return false;}
 }});
}
async function deleteDocumentActionCatalogItem(id){
 if(getDocumentActionUsage(id)>0){toast('No puedes eliminar esta acción mientras esté asignada a uno o varios formatos. Retírala primero de cada formato.','warning',8000);return;}
 if(!confirm('¿Eliminar este documento reutilizable del catálogo?'))return;
 try{const settings=normalizeDocumentActionSettings(state.documentActionSettings);await saveDocumentActionSettings({...settings,catalog:settings.catalog.filter(x=>x.id!==id)});toast('Documento eliminado del catálogo.');}
 catch(err){toast('No se pudo eliminar el documento. '+friendlyError(err),'error',8000);}
}
function collectDocumentActionConfigsFromForm(fd,schema){
 const settings=normalizeDocumentActionSettings(state.documentActionSettings);
 const enabled=[...new Set(fd.getAll('doc_action_enabled').map(String))];
 const validKeys=new Set(schema.map(x=>x.key));
 const result=[];
 for(const catalogId of enabled){
  const item=settings.catalog.find(x=>x.id===catalogId&&x.active!==false);
  if(!item)continue;
  const fieldKeys=[...new Set(fd.getAll(`doc_action_fields_${catalogId}`).map(String).filter(key=>validKeys.has(key)))];
  const includePatientIdentity=fd.get(`doc_action_patient_${catalogId}`)==='on';
  const includeSomatometry=fd.get(`doc_action_somatometry_${catalogId}`)==='on';
  if(!fieldKeys.length&&!includePatientIdentity&&!includeSomatometry){throw new Error(`La acción “${item.name}” no tiene campos ni datos generales seleccionados.`);}
  const buttonLabel=String(fd.get(`doc_action_label_${catalogId}`)||`Generar ${item.name}`).trim();
  const documentTitle=String(fd.get(`doc_action_title_${catalogId}`)||item.documentTitle).trim();
  if(!buttonLabel||buttonLabel.length>80)throw new Error(`El texto del botón de “${item.name}” debe tener entre 1 y 80 caracteres.`);
  if(!documentTitle||documentTitle.length>120)throw new Error(`El título del documento de “${item.name}” debe tener entre 1 y 120 caracteres.`);
  const defaultButtonLabel=`Generar ${item.name}`;
  result.push({catalogId,
   // Empty overrides inherit the reusable catalog name/title; explicit per-format text stays local.
   buttonLabel:buttonLabel===defaultButtonLabel?'':buttonLabel,
   documentTitle:documentTitle===item.documentTitle?'':documentTitle,
   fieldKeys,includePatientIdentity,includeSomatometry,
   includeProfessionalSignature:fd.get(`doc_action_signature_${catalogId}`)==='on',
   showGroups:fd.get(`doc_action_groups_${catalogId}`)==='on'});
 }
 return result;
}
function readDocumentActionFormState(root){
 const form=$('#active-modal-form',root);if(!form)return [];
 const fd=new FormData(form),settings=normalizeDocumentActionSettings(state.documentActionSettings),enabled=fd.getAll('doc_action_enabled').map(String);
 return enabled.map(catalogId=>({catalogId,buttonLabel:String(fd.get(`doc_action_label_${catalogId}`)||''),documentTitle:String(fd.get(`doc_action_title_${catalogId}`)||''),fieldKeys:fd.getAll(`doc_action_fields_${catalogId}`).map(String),includePatientIdentity:fd.get(`doc_action_patient_${catalogId}`)==='on',includeSomatometry:fd.get(`doc_action_somatometry_${catalogId}`)==='on',includeProfessionalSignature:fd.get(`doc_action_signature_${catalogId}`)==='on',showGroups:fd.get(`doc_action_groups_${catalogId}`)==='on'}));
}
function renderFormatDocumentActionsPanel(formatId,schema,previous=[]) {
 const settings=normalizeDocumentActionSettings(state.documentActionSettings);
 const catalog=settings.catalog.filter(x=>x.active!==false);
 if(!catalog.length)return '<div class="inline-note"><strong>Sin acciones reutilizables</strong><span>Primero crea documentos en el catálogo general desde la pantalla de Formatos clínicos. Después podrás asignarlos a este formato.</span></div>';
 const configs=Array.isArray(previous)?previous:(settings.formats[String(formatId||'')]||[]);
 return `<div class="format-document-actions-list">${catalog.map(item=>{
  const cfg=configs.find(x=>x.catalogId===item.id)||null;
  return `<section class="format-document-action-card" data-format-doc-action="${esc(item.id)}"><label class="format-document-action-enable"><input type="checkbox" name="doc_action_enabled" value="${esc(item.id)}" ${cfg&&cfg.enabled!==false?'checked':''}><span><strong>${esc(item.name)}</strong><small>${esc(item.description||'Documento reutilizable')}</small></span></label><div class="form-grid two format-document-action-options"><label class="form-field"><span>Texto del botón para este formato</span><input name="doc_action_label_${esc(item.id)}" maxlength="80" value="${esc(cfg?.buttonLabel||`Generar ${item.name}`)}"></label><label class="form-field"><span>Título del documento</span><input name="doc_action_title_${esc(item.id)}" maxlength="120" value="${esc(cfg?.documentTitle||item.documentTitle)}"></label></div><div class="document-action-field-select"><strong>Campos que incluirá este documento</strong><div class="document-action-field-grid">${schema.map(field=>`<label class="document-action-field-option" data-doc-field-option><input type="checkbox" name="doc_action_fields_${esc(item.id)}" value="${esc(field.key)}" ${(cfg?.fieldKeys||[]).includes(field.key)?'checked':''}><span>${esc(field.label)}</span></label>`).join('')||'<small>Agrega campos al formato para poder seleccionarlos aquí.</small>'}</div></div><div class="document-action-include-options"><label class="document-action-field-option"><input type="checkbox" name="doc_action_patient_${esc(item.id)}" ${cfg?.includePatientIdentity!==false?'checked':''}><span>Ficha de identificación del paciente</span></label><label class="document-action-field-option"><input type="checkbox" name="doc_action_somatometry_${esc(item.id)}" ${cfg?.includeSomatometry===true?'checked':''}><span>Somatometría y signos vitales</span></label><label class="document-action-field-option"><input type="checkbox" name="doc_action_signature_${esc(item.id)}" ${cfg?.includeProfessionalSignature!==false?'checked':''}><span>Firma del profesional</span></label><label class="document-action-field-option"><input type="checkbox" name="doc_action_groups_${esc(item.id)}" ${cfg?.showGroups!==false?'checked':''}><span>Conservar secciones del formato</span></label></div></section>`;
 }).join('')}</div>`;
}
function formatGenerateButtonLabel(formatName){
 const name=String(formatName||'Documento').trim()||'Documento';
 return /^generar(?:\s|$)/i.test(name)?name:`Generar ${name}`;
}
function clinicalFieldText(value){
 if(value===null||value===undefined)return '';
 if(Array.isArray(value))return value.map(x=>String(x??'').trim()).filter(Boolean).join('\n');
 if(typeof value==='object')return value.meals?'':String(value.value??'');
 return String(value).trim();
}
function hasClinicalFieldValue(value){
 if(value===null||value===undefined)return false;
 if(typeof value==='string')return value.trim().length>0;
 if(typeof value==='number')return Number.isFinite(value);
 if(typeof value==='boolean')return value;
 if(Array.isArray(value))return value.some(hasClinicalFieldValue);
 if(typeof value==='object')return Object.values(value).some(hasClinicalFieldValue);
 return String(value).trim().length>0;
}
function isLaboratoryField(field){
 const key=String(field?.key||''),label=String(field?.label||''),group=String(field?.group||'');
 return /(laboratorio|gabinete|estudios?|pruebas?|an[aá]lisis|ex[aá]menes?)/i.test(`${key} ${label} ${group}`);
}
function extractLabsForFormat(payload){
 const fields=payload?.fields||{},schema=Array.isArray(payload?.format_schema_snapshot)?payload.format_schema_snapshot:[];
 const legacyKeys=['laboratorio_orden','laboratorio','plan_estudios','estudios'];
 const used=new Set(),parts=[];
 for(const field of schema){
  if(!isLaboratoryField(field))continue;
  const key=String(field?.key||''),label=String(field?.label||'');
  const value=clinicalFieldText(fields[key]);if(value&&!used.has(key)){used.add(key);parts.push(label?`${label}:\n${value}`:value);}
 }
 for(const key of legacyKeys){const value=clinicalFieldText(fields[key]);if(value&&!used.has(key)){used.add(key);parts.push(value);}}
 return parts.join('\n\n').trim();
}
// Devuelve campos que Administración asignó explícitamente a un documento secundario.
// Los formatos antiguos sin esta configuración conservan su comportamiento anterior.
function getConfiguredDocumentFields(payload,destination){
 const fields=payload?.fields||{};
 const schema=Array.isArray(payload?.format_schema_snapshot)?payload.format_schema_snapshot:[];
 return schema.filter(field=>Array.isArray(field?.document_destinations)&&field.document_destinations.includes(destination))
  .map(field=>({key:String(field.key||''),label:String(field.label||payload?.field_labels?.[field.key]||field.key||''),value:fields[field.key]}))
  .filter(item=>clinicalFieldText(item.value));
}
function renderConfiguredDocumentFields(payload,destination){
 return getConfiguredDocumentFields(payload,destination).map(item=>{
  const value=item.value&&typeof item.value==='object'&&item.value.meals
   ? renderNutritionPlanTable(item.value)
   : `<span>${esc(clinicalFieldText(item.value)).replace(/\n/g,'<br>')}</span>`;
  return `<div class="clinical-document-row"><strong>${esc(item.label)}</strong>${value}</div>`;
 }).join('');
}
const ROLE_NAV = {
  admin: [ ['queue','Sala de espera','◷'], ['reception','Recepción / registrar paciente','＋'], ['patients','Todos los pacientes','▧'], ['history','Historia clínica (HC)','▣'], ['users','Profesionales y usuarios','♙'], ['templates','Personalizar formatos clínicos','✎'], ['customize','Diseño, colores y palabras','◐'], ['deletion_requests','Solicitudes de eliminación','⌫'], ['inventory','Inventario','▦'], ['backups','Respaldos y recuperación','↻'], ['audit','Auditoría','≋'], ['clinic','Establecimiento','⌂'], ['profile','Mi perfil','◉'], ['privacy','Datos y privacidad','◇'] ],
  reception: [ ['queue','Sala de espera','◷'], ['profile','Perfil profesional','◉'] ],
  nursing: [ ['queue','Sala de espera','◷'], ['profile','Perfil profesional','◉'] ],
  clinician: [ ['queue','Sala de espera','◷'], ['history','Historias clínicas','▣'], ['interconsultations','Interconsultas','⇄'], ['profile','Perfil profesional','◉'] ]
};
const TITLES = Object.fromEntries(Object.values(ROLE_NAV).flat().map(([id,label])=>[id,label]));
const state = {
  currentUser:null, user:null, ownerUid:'', view:'queue', selectedVisitId:'', queue:[], professionals:[], patientsCache:new Map(),
  cacheFetchedAt:0, loadingQueue:false, loadingInterconsultations:false, customTemplates:{}, customCatalogs:[], clinicalFormats:[], documentActionSettings:{catalog:[],formats:{}}, documentActionsUnsubscribe:null, uiSettings:structuredClone(DEFAULT_UI_SETTINGS), activeInterTab:'incoming', interDraft:{}, auditRows:[], adminPatients:[], directoryPatients:[], patientGrantIds:new Set(), selectedPatientId:'', historyReturnView:'history', summariesSyncedAt:0, professionalBusyIds:new Set(), openingConsultVisitId:'', queueRefreshPending:false, queueUnsubscribe:null, uiSettingsUnsubscribe:null, templatesUnsubscribe:null,
  lastSync:null, modalCleanup:null, modalOnClose:null, bootstrapUser:null, bootstrapInProgress:false, activatingUid:'', presenceByUid:new Map(), presenceUnsubscribe:null, presenceHeartbeatTimer:null, presenceRefreshTimer:null, presenceSessionId:''
};
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));
const nowIso = () => new Date().toISOString();
const shortId = value => String(value||'').slice(0,8).toUpperCase();
const formatDate = value => { if(!value) return '—'; const d = new Date(value); return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'}); };
const patientName = patient => [patient?.first_name,patient?.last_name1,patient?.last_name2].filter(Boolean).join(' ') || 'Paciente sin nombre';
const initials = name => String(name||'BR').trim().split(/\s+/).slice(0,2).map(s=>s[0]||'').join('').toUpperCase() || 'BR';
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const slugify = value => String(value||'campo').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,55) || 'campo';
const fieldVal = (obj,key) => esc(obj?.[key] ?? '');
function specialtyOptions(){return Array.from(new Set([...SPECIALTIES,...(state.professionals||[]).map(p=>String(p.specialty||'').trim()).filter(Boolean)])).sort((a,b)=>a.localeCompare(b,'es-MX'));}
function specialtyDatalist(id='brima-specialty-options'){return `<datalist id="${esc(id)}">${specialtyOptions().map(s=>`<option value="${esc(s)}"></option>`).join('')}</datalist>`;}
function normaliseClinicalFormatSchema(schema){
 if(!Array.isArray(schema))return [];
 return schema.map((raw,i)=>{const f=raw&&typeof raw==='object'?raw:{};const key=String(f.key||`campo_${i+1}`);return {key,label:String(f.label||key),type:['textarea','text','number','date','choice','chips','scale','foodfreq','foodplan'].includes(f.type)?f.type:'textarea',group:String(f.group||'Documento'),icon:String(f.icon||'📝'),options:Array.isArray(f.options)?f.options.map(o=>Array.isArray(o)?{icon:String(o[1]||'🔹'),label:String(o[0]||'')}:{icon:String(o?.icon||'🔹'),label:String(o?.label||o?.value||'')}).filter(o=>o.label):[],required:f.required===true,include_in_professional_plan:f.include_in_professional_plan===true,include_in_labs_summary:f.include_in_labs_summary===true,include_in_prescription:f.include_in_prescription===true,document_destinations:Array.isArray(f.document_destinations)?f.document_destinations.filter(x=>['labs_summary','prescription'].includes(x)):[],placeholder:String(f.placeholder||''),min:Number.isFinite(Number(f.min))?Number(f.min):0,max:Number.isFinite(Number(f.max))?Number(f.max):10};});
}

function setVisible(id, visible){ $(id).classList.toggle('hidden',!visible); }
function setAuthMessage(text, type='error', target='#login-message'){ const el=$(target); if(el){el.textContent=text||'';el.style.color=type==='error'?'var(--danger)':type==='success'?'var(--success)':'var(--muted)';} }
function friendlyError(err){
  const s=String(err?.message||err||'Error desconocido');
  if(/permission-denied|missing or insufficient permissions|403/i.test(s)) return 'Firebase denegó esta operación (403). Revisa las reglas de Firestore, el rol de la cuenta y que la visita/expediente pertenezca a la clínica y tenga autorización vigente.';
  if(/auth\/invalid-credential|invalid login credentials|wrong-password|user-not-found/i.test(s)) return 'Correo o contraseña incorrectos.';
  if(/auth\/too-many-requests/i.test(s)) return 'Demasiados intentos. Espera un momento o restablece la contraseña.';
  if(/auth\/network-request-failed/i.test(s)||/network/i.test(s)) return 'No se pudo conectar con Firebase. Comprueba la conexión y vuelve a intentarlo.';
  if(/auth\/email-already-in-use/i.test(s)) return 'Ese correo ya tiene una cuenta de Firebase Authentication.';
  if(/auth\/weak-password/i.test(s)) return 'La contraseña debe tener al menos 6 caracteres.';
  if(/auth\/operation-not-allowed/i.test(s)) return 'Activa el proveedor Correo electrónico/Contraseña en Firebase Console > Authentication > Sign-in method.';
  if(/auth\/invalid-email/i.test(s)) return 'Escribe un correo electrónico válido.';
  if(/failed-precondition/i.test(s)&&/index/i.test(s)) return 'Firestore requiere un índice. Consulta el archivo firestore.indexes.json incluido y crea el índice indicado en Firebase Console.';
  return s;
}
function toast(message,type='success',duration=4200){ const region=$('#toast-region'); const el=document.createElement('div');el.className=`toast ${type}`;el.textContent=message;region.append(el);setTimeout(()=>el.remove(),duration); }
function setSync(text, ok=true){ $('#sync-label').textContent=text; const pill=$('.sync-pill');if(pill){pill.style.color=ok?'#267d64':'#a96a08';pill.style.background=ok?'#eff9f5':'#fff7e9';} }
// Firestore no admite valores undefined, ni siquiera en objetos anidados.
// Elimina propiedades undefined de objetos planos y conserva posiciones de arreglos como null.
// Mantiene intactos objetos especiales de Firebase (Timestamp, FieldValue, referencias, Date, etc.).
function stripUndefinedDeep(value){
  if(Array.isArray(value))return value.map(item=>item===undefined?null:stripUndefinedDeep(item));
  if(value&&typeof value==='object'){
    const prototype=Object.getPrototypeOf(value);
    if(prototype!==Object.prototype&&prototype!==null)return value;
    const clean={};
    for(const [key,nested] of Object.entries(value)){
      if(nested!==undefined)clean[key]=stripUndefinedDeep(nested);
    }
    return clean;
  }
  return value;
}
function stableStringify(value){
  if(value===null||typeof value!=='object') return JSON.stringify(value);
  if(Array.isArray(value)) return '['+value.map(v=>stableStringify(v)??'null').join(',')+']';
  return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stableStringify(value[k])).join(',')+'}';
}
async function sha256Text(text){const data=new TextEncoder().encode(text);const hash=await crypto.subtle.digest('SHA-256',data);return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');}
async function writeAudit(action, patientId='', recordId=''){
  try{
    if(!state.user||!state.ownerUid)return;
    const event={at:nowIso(),user_id:state.currentUser.uid,username:state.user.username||state.user.email||'',action:String(action),patient_id:String(patientId||''),record_id:String(recordId||''),previous_hash:''};
    event.event_hash=await sha256Text(stableStringify({at:event.at,user_id:event.user_id,username:event.username,action:event.action,patient_id:event.patient_id,record_id:event.record_id,previous_hash:event.previous_hash}));
    await setDoc(doc(collection(db,'auditoria')), {ownerUid:state.ownerUid,...event});
  }catch(err){console.warn('No se pudo registrar auditoría de este evento:',err);}
}
function profileFromDoc(uid,data){ return {...data,id:uid,username:data.username||data.email||'',role:data.role||'',active:data.active===true,profile:data.profile&&typeof data.profile==='object'?data.profile:{},ownerUid:data.ownerUid||''}; }
function showLogin(message=''){ state.bootstrapUser=null;$('#bootstrap-password').value='';$('#bootstrap-password-confirm').value='';setVisible('#loading-screen',false);setVisible('#auth-screen',true);setVisible('#bootstrap-screen',false);setVisible('#app-shell',false);if(message)setAuthMessage(message); }
function showBootstrap(fbUser=null){
  state.bootstrapUser=fbUser;
  const hint=$('#bootstrap-account-hint');
  const emailInput=$('#bootstrap-email-input');
  const passwordFields=$('#bootstrap-password-fields');
  const cancel=$('#bootstrap-cancel');
  const submit=$('#bootstrap-submit');
  if(fbUser){
    hint.textContent=`Cuenta autenticada: ${fbUser.email||'correo no disponible'}. Completa el perfil administrador.`;
    emailInput.value=fbUser.email||'';emailInput.disabled=true;
    passwordFields.classList.add('hidden');
    [$('#bootstrap-password'),$('#bootstrap-password-confirm')].forEach(input=>{input.required=false;input.disabled=true;});
    cancel.classList.remove('hidden');
    $('#bootstrap-existing-account').classList.add('hidden');
    submit.textContent='Registrar administrador y entrar';
  }else{
    hint.textContent='Este proyecto todavía no tiene un administrador registrado. Crea aquí la cuenta principal.';
    emailInput.disabled=false;emailInput.value='';
    passwordFields.classList.remove('hidden');
    [$('#bootstrap-password'),$('#bootstrap-password-confirm')].forEach(input=>{input.required=true;input.disabled=false;});
    cancel.classList.add('hidden');
    $('#bootstrap-existing-account').classList.remove('hidden');
    submit.textContent='Crear administrador y entrar';
  }
  $('#bootstrap-password').value='';$('#bootstrap-password-confirm').value='';
  setAuthMessage('','success','#bootstrap-message');
  setVisible('#loading-screen',false);setVisible('#auth-screen',false);setVisible('#bootstrap-screen',true);setVisible('#app-shell',false);
}
async function routeSignedOutUser(){
  setVisible('#loading-screen',true);setVisible('#auth-screen',false);setVisible('#bootstrap-screen',false);setVisible('#app-shell',false);
  try{
    const marker=await getDoc(doc(db,'configuracion','admin_principal'));
    if(marker.exists())showLogin();
    else showBootstrap();
  }catch(err){
    console.error('No se pudo consultar el estado de inicialización de BRIMA:',err);
    showLogin('No se pudo comprobar si BRIMA ya tiene administrador. Verifica la conexión y que hayas publicado las reglas Firestore de esta versión. '+friendlyError(err));
  }
}
async function activateSession(fbUser){
  if(state.activatingUid===fbUser.uid || state.bootstrapInProgress)return;
  state.activatingUid=fbUser.uid;
  try{
    const snap=await getDoc(doc(db,'usuarios',fbUser.uid));
    if(!snap.exists()){
      const marker=await getDoc(doc(db,'configuracion','admin_principal'));
      if(!marker.exists()){showBootstrap(fbUser);return;}
      await signOut(auth);
      showLogin('La cuenta existe en Firebase Authentication, pero no tiene perfil en BRIMA. El registro inicial ya fue completado; solicita al administrador que cree tu perfil.');return;
    }
    const user=profileFromDoc(fbUser.uid,snap.data());
    if(!user.active){await signOut(auth);showLogin('Esta cuenta BRIMA está desactivada. Contacta al administrador.');return;}
    if(!ROLES[user.role]){await signOut(auth);showLogin('El perfil de la cuenta no tiene un rol reconocido. Contacta al administrador.');return;}
    if(!user.ownerUid){await signOut(auth);showLogin('El perfil no tiene ownerUid configurado. Contacta al administrador.');return;}
    if(user.role==='admin'&&user.ownerUid!==fbUser.uid){await signOut(auth);showLogin('El perfil de administración no coincide con el UID principal de la clínica.');return;}
    state.currentUser=fbUser;state.user=user;state.ownerUid=user.ownerUid;state.presenceSessionId='';startPresenceWatch();if(user.role==='clinician')await startProfessionalPresence();document.body.dataset.brimaRole=user.role;document.body.dataset.brimaSpecialty=slugify(user.profile?.specialty||'');state.view='queue';state.selectedVisitId='';state.queue=[];state.patientsCache.clear();state.cacheFetchedAt=0;
    setVisible('#loading-screen',false);setVisible('#auth-screen',false);setVisible('#bootstrap-screen',false);setVisible('#app-shell',true);
    buildNavigation();renderUserIdentity();await loadProfessionals(true);await loadUiSettings();await loadCustomTemplates();await loadDocumentActionSettings();applyUiSettings();startSettingsSubscriptions();buildNavigation();renderUserIdentity();if(['admin','reception'].includes(user.role)){try{await syncClinicOperationalSummaries(true);}catch(summaryErr){console.warn('No se completó la preparación del directorio/sala. Verifica las reglas de Firestore de BRIMA HC HOME 0.3.12.1 y usa Actualizar directorio compartido si hace falta.',summaryErr);}}goView('queue');
    setSync('Conectado a Firestore');
    if(state.queueUnsubscribe){state.queueUnsubscribe();state.queueUnsubscribe=null;}
    const activeOwner=state.ownerUid;
    state.queueUnsubscribe=onSnapshot(query(collection(db,'sala_resumen'),where('ownerUid','==',activeOwner)),()=>{if(state.user&&state.ownerUid===activeOwner)loadQueue(true);},err=>{console.warn('La suscripción en tiempo real de sala falló; queda activo el refresco periódico.',err);setSync('Actualización periódica',false);});
    clearInterval(window.__brimaQueueInterval);window.__brimaQueueInterval=setInterval(()=>{if(state.user&&state.view==='queue')loadQueue(true);},20000);
    clearInterval(window.__brimaInterInterval);window.__brimaInterInterval=setInterval(()=>{if(state.user&&state.view==='interconsultations')renderInterconsultations(true);},12000);
  }catch(err){console.error(err);showLogin(friendlyError(err));}
  finally{state.activatingUid='';}
}
onAuthStateChanged(auth, fbUser=>{
  if(state.bootstrapInProgress)return;
  if(!fbUser){if(state.presenceHeartbeatTimer){clearInterval(state.presenceHeartbeatTimer);state.presenceHeartbeatTimer=null;}stopPresenceWatch();state.presenceSessionId='';delete document.body.dataset.brimaRole;delete document.body.dataset.brimaSpecialty;state.currentUser=null;state.user=null;state.ownerUid='';state.selectedVisitId='';state.selectedPatientId='';state.historyReturnView='history';state.queue=[];state.professionals=[];state.adminPatients=[];state.directoryPatients=[];state.patientGrantIds=new Set();state.interDraft={};state.summariesSyncedAt=0;state.professionalBusyIds=new Set();state.patientsCache.clear();if(state.queueUnsubscribe){state.queueUnsubscribe();state.queueUnsubscribe=null;}if(state.uiSettingsUnsubscribe){state.uiSettingsUnsubscribe();state.uiSettingsUnsubscribe=null;}if(state.templatesUnsubscribe){state.templatesUnsubscribe();state.templatesUnsubscribe=null;}if(state.documentActionsUnsubscribe){state.documentActionsUnsubscribe();state.documentActionsUnsubscribe=null;}state.documentActionSettings={catalog:[],formats:{}};closeModal();clearInterval(window.__brimaQueueInterval);clearInterval(window.__brimaInterInterval);routeSignedOutUser();return;}
  if(state.currentUser?.uid===fbUser.uid&&state.user)return;
  activateSession(fbUser);
});

$('#login-form').addEventListener('submit',async e=>{
  e.preventDefault();const email=$('#login-email').value.trim(),password=$('#login-password').value;
  $('#login-submit').disabled=true;setAuthMessage('Conectando con Firebase…','muted');
  try{await signInWithEmailAndPassword(auth,email,password);setAuthMessage('','success');}
  catch(err){setAuthMessage(friendlyError(err));}
  finally{$('#login-password').value='';$('#login-submit').disabled=false;}
});
$('#toggle-password').addEventListener('click',()=>{
 const input=$('#login-password'),button=$('#toggle-password');const visible=input.type==='password';input.type=visible?'text':'password';button.setAttribute('aria-label',visible?'Ocultar contraseña':'Mostrar contraseña');button.title=visible?'Ocultar contraseña':'Mostrar contraseña';button.innerHTML=visible?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.7A10.9 10.9 0 0112 5.5c6.1 0 9.5 6.5 9.5 6.5a16 16 0 01-3.4 4.1M6.2 6.3C3.8 8 2.5 12 2.5 12s3.4 6.5 9.5 6.5c1.2 0 2.3-.2 3.3-.6"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.4-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.4 6.5-9.5 6.5S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.6"/></svg>';input.focus();
});
$('#forgot-password').addEventListener('click',async()=>{
  const email=$('#login-email').value.trim();if(!email){setAuthMessage('Escribe primero tu correo electrónico y después solicita el restablecimiento.');return;}
  try{await sendPasswordResetEmail(auth,email);setAuthMessage('Si la cuenta existe y el correo está permitido, Firebase enviará las instrucciones de restablecimiento.','success');}catch(err){setAuthMessage(friendlyError(err));}
});
$('#bootstrap-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const fd=new FormData(e.currentTarget);
  const fullName=String(fd.get('full_name')||'').trim();
  const email=$('#bootstrap-email-input').value.trim().toLowerCase();
  let fbUser=state.bootstrapUser;
  let createdAuthAccount=false;
  const password=$('#bootstrap-password').value;
  const passwordConfirm=$('#bootstrap-password-confirm').value;
  if(!fullName||!email){setAuthMessage('Completa el nombre y el correo del administrador.','error','#bootstrap-message');return;}
  if(!fbUser&&(password.length<6||password!==passwordConfirm)){
    setAuthMessage(password.length<6?'La contraseña debe tener al menos 6 caracteres.':'Las contraseñas no coinciden.','error','#bootstrap-message');return;
  }
  if(fbUser&&email.toLowerCase()!==String(fbUser.email||'').toLowerCase()){
    setAuthMessage('El correo debe coincidir con la cuenta autenticada.','error','#bootstrap-message');return;
  }
  const btn=$('#bootstrap-submit');btn.disabled=true;state.bootstrapInProgress=true;
  setAuthMessage('Creando la cuenta segura y registrando el administrador…','muted','#bootstrap-message');
  try{
    if(!fbUser){
      const credential=await createUserWithEmailAndPassword(auth,email,password);
      fbUser=credential.user;
      createdAuthAccount=true;
      state.bootstrapUser=fbUser;
    }
    const profile={full_name:fullName,profession:'Administración',specialty:'',cedula:'',institution:'',address:'',phone:'',email:fbUser.email||email};
    const data={username:fbUser.email,email:fbUser.email,role:'admin',active:true,ownerUid:fbUser.uid,profile,created_at:nowIso()};
    const batch=writeBatch(db);
    batch.set(doc(db,'usuarios',fbUser.uid),data);
    batch.set(doc(db,'configuracion','admin_principal'),{uid:fbUser.uid,created_at:nowIso()});
    await batch.commit();
    $('#bootstrap-password').value='';$('#bootstrap-password-confirm').value='';
    state.bootstrapInProgress=false;
    toast('Administrador principal creado. La contraseña quedó administrada por Firebase Authentication.','success');
    await activateSession(fbUser);
  }catch(err){
    console.error('No se pudo completar el administrador inicial:',err);
    let marker=null;
    try{marker=await getDoc(doc(db,'configuracion','admin_principal'));}catch{}
    state.bootstrapInProgress=false;
    if(marker?.exists()&&marker.data()?.uid===fbUser?.uid){
      try{await activateSession(fbUser);return;}catch{}
    }
    if(marker?.exists()&&marker.data()?.uid!==fbUser?.uid){
      if(createdAuthAccount&&fbUser){try{await deleteUser(fbUser);}catch(cleanupErr){console.warn('No se pudo retirar la cuenta Auth que perdió la carrera de alta:',cleanupErr);}}
      try{await signOut(auth);}catch{}
      showLogin('La configuración inicial ya fue completada por otra cuenta. Inicia sesión con el administrador registrado.');
      return;
    }
    if(fbUser){showBootstrap(fbUser);}
    setAuthMessage(friendlyError(err)+' Si la cuenta ya se creó, vuelve a intentar registrar el perfil con esta misma sesión; no vuelvas a crear otra cuenta.','error','#bootstrap-message');
  }finally{
    $('#bootstrap-password').value='';$('#bootstrap-password-confirm').value='';
    state.bootstrapInProgress=false;btn.disabled=false;
  }
});
$('#bootstrap-cancel').addEventListener('click',async()=>{try{await signOut(auth);}catch(err){setAuthMessage(friendlyError(err),'error','#bootstrap-message');}});
$('#bootstrap-existing-account').addEventListener('click',()=>showLogin('Inicia sesión con tu cuenta Firebase existente; si todavía no hay administrador, podrás completar su perfil.'));
async function endSession(switchAccount=false){
 const prompt=switchAccount?'Se cerrará la sesión actual para que puedas entrar con otra cuenta. ¿Continuar?':'¿Cerrar tu sesión de BRIMA HC?';
 if(!confirm(prompt))return;
 try{
  await writeAudit(switchAccount?'CAMBIAR_DE_SESION':'CERRAR_SESION');
  await stopProfessionalPresence();
  if(switchAccount){$('#login-email').value='';$('#login-password').value='';$('#login-password').type='password';const toggle=$('#toggle-password');if(toggle){toggle.setAttribute('aria-label','Mostrar contraseña');toggle.title='Mostrar contraseña';toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.4-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.4 6.5-9.5 6.5S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.6"/></svg>';}}
  await signOut(auth);
  if(switchAccount){setAuthMessage('Sesión anterior cerrada. Ingresa las credenciales de la otra cuenta.','success');$('#login-email').focus();}
 }catch(err){toast('No se pudo cerrar la sesión correctamente. '+friendlyError(err),'error',7000);}
}
$('#sign-out').addEventListener('click',()=>endSession(false));
$('#switch-session').addEventListener('click',()=>endSession(true));
$('#header-avatar').addEventListener('click',()=>goView('profile'));
$('#refresh-view').addEventListener('click',()=>refreshCurrentView());
$('#mobile-menu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));

function navLabel(view, fallback){return String(state.uiSettings?.navLabels?.[view]||fallback);}
function navItemsForRole(role){
  const base=(ROLE_NAV[role]||[]).slice();const order=state.uiSettings?.navOrder?.[role];
  if(!Array.isArray(order)||!order.length)return base;
  const rank=new Map(order.map((id,i)=>[id,i]));return base.sort((a,b)=>(rank.has(a[0])?rank.get(a[0]):999)-(rank.has(b[0])?rank.get(b[0]):999));
}
async function loadUiSettings(){
  try{const snap=await getDoc(doc(db,'configuracion','clinic_ui'));const saved=snap.exists()&&snap.data().value&&typeof snap.data().value==='object'?snap.data().value:{};state.uiSettings={...structuredClone(DEFAULT_UI_SETTINGS),...saved,roleColors:{...DEFAULT_UI_SETTINGS.roleColors,...(saved.roleColors||{})},navLabels:{...(saved.navLabels||{})},navOrder:{...(saved.navOrder||{})},clinicalLabels:{...(saved.clinicalLabels||{})},clinicalOrder:{...(saved.clinicalOrder||{})},clinicalSchemas:{...(saved.clinicalSchemas||{})},clinicalSchemaComplete:{...(saved.clinicalSchemaComplete||{})},clinicalActions:{...(saved.clinicalActions||{})},actionLabels:{...DEFAULT_UI_SETTINGS.actionLabels,...(saved.actionLabels||{})}};}
  catch(err){console.warn('No se pudieron leer personalizaciones de BRIMA',err);state.uiSettings=structuredClone(DEFAULT_UI_SETTINGS);}
}
function tintHex(hex,amount=15){const h=String(hex||'#2463a6').replace('#','');if(!/^[0-9a-fA-F]{6}$/.test(h))return '#2e78b8';const n=parseInt(h,16);const clamp=x=>Math.max(0,Math.min(255,x));const r=clamp(((n>>16)&255)+amount),g=clamp(((n>>8)&255)+amount),b=clamp((n&255)+amount);return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');}
function applyUiSettings(){
  if(!state.user)return;const specialty=String(state.user.profile?.specialty||'');const key=state.user.role==='clinician'?specialty:state.user.role;const color=state.uiSettings?.roleColors?.[key]||DEFAULT_UI_SETTINGS.roleColors[key]||'#2463a6';
  const dark=tintHex(color,-34),light=tintHex(color,22);document.body.style.setProperty('--blue',color);document.body.style.setProperty('--blue-2',tintHex(color,18));document.body.style.setProperty('--teal',tintHex(color,30));document.body.style.setProperty('--role-color',color);document.body.style.setProperty('--role-color-dark',dark);document.body.style.setProperty('--role-color-light',light);
  const sidebar=$('.sidebar');if(sidebar)sidebar.style.background=`linear-gradient(180deg, ${dark}, ${color} 75%, ${light})`;
}
function buildNavigation(){
  const nav=$('#main-nav');nav.innerHTML=navItemsForRole(state.user.role).map(([id,label,icon])=>`<button class="nav-item ${id===state.view?'active':''}" data-nav="${id}"><span class="nav-icon">${icon}</span><span>${esc(navLabel(id,label))}</span></button>`).join('');
  nav.querySelectorAll('[data-nav]').forEach(btn=>btn.addEventListener('click',()=>{if(btn.dataset.nav==='history'&&state.user?.role==='clinician'){state.selectedPatientId='';state.historyReturnView='history';}goView(btn.dataset.nav);$('#sidebar').classList.remove('open');}));
}
function renderUserIdentity(){
  const p=state.user.profile||{},name=p.full_name||state.user.username||state.user.email||'Usuario';
  $('#side-user-name').textContent=name;$('#side-user-role').textContent=state.user.role==='clinician'?(p.specialty||p.profession||'Profesional clínico'):(ROLES[state.user.role]||state.user.role);
  $('#user-avatar').textContent=initials(name);$('#header-avatar').textContent=initials(name);$('#top-eyebrow').textContent='BRIMA HC / '+(state.user.profile?.institution||'CLÍNICA');
}
function goView(view){ if(!state.user)return;const allowed=(ROLE_NAV[state.user.role]||[]).some(x=>x[0]===view);if(!allowed)view='queue';state.view=view;$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.nav===view));const item=navItemsForRole(state.user.role).find(x=>x[0]===view);$('#page-title').textContent=navLabel(view,item?.[1]||TITLES[view]||'BRIMA HC');renderView(); }
async function renderView(){
  const root=$('#page-content');root.innerHTML='<div class="panel"><div class="empty-state"><span class="spinner"></span><p style="margin-top:13px">Cargando sección…</p></div></div>';
  try{
    if(state.view==='queue') await renderQueue();
    else if(state.view==='patients') await renderAllPatients();
    else if(state.view==='reception') renderReception();
    else if(state.view==='nursing') renderNursing();
    else if(state.view==='clinical') renderClinical();
    else if(state.view==='profile') renderProfile();
    else if(state.view==='templates'&&state.user.role==='admin') await renderTemplates();
    else if(state.view==='interconsultations') await renderInterconsultations();
    else if(state.view==='history') await renderHistory();
    else if(state.view==='deletion_requests'&&state.user.role==='admin') await renderDeletionRequests();
    else if(state.view==='customize'&&state.user.role==='admin') await renderCustomization();
    else if(state.view==='users') await renderUsers();
    else if(state.view==='inventory') await renderInventory();
    else if(state.view==='backups') renderBackups();
    else if(state.view==='audit') await renderAudit();
    else if(state.view==='clinic') await renderClinic();
    else if(state.view==='privacy') renderPrivacy();
    else renderQueue();
  }catch(err){console.error(err);root.innerHTML=`<div class="inline-note warning-note"><strong>No se pudo cargar la sección.</strong><span>${esc(friendlyError(err))}</span></div><button class="btn primary" data-retry-view>↻ Reintentar</button>`;const btn=$('[data-retry-view]',root);if(btn)btn.addEventListener('click',renderView);setSync('Revisar permisos',false);}
}
async function refreshCurrentView(){try{if(state.view==='queue')await loadQueue();else if(state.view==='interconsultations')await renderInterconsultations();else await renderView();toast('Vista actualizada.','success',1800);}catch(err){toast(friendlyError(err),'error');}}
function pageHeading(title,subtitle,eyebrow='BRIMA HC'){return `<div class="page-heading-row"><div><div class="eyebrow eyebrow-spaced">${esc(eyebrow)}</div><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div></div>`;}
function statusLabel(status){if(status==='Enfermería'&&['reception','admin'].includes(state.user?.role))return 'Nuevo paciente registrado';if(status==='Enfermería'&&state.user?.role==='nursing')return 'Paciente esperando valoración inicial';return ({'Recepción':'Nuevo paciente registrado','Enfermería':'Paciente esperando valoración inicial','Consulta':'Paciente listo para consulta','En atención':'Paciente en atención con el especialista','Atendido':'Atención finalizada','Cancelado':'Llegada cancelada'})[status]||status||'Sin estado';}
function badgeStatus(status){let cls='';if(status==='Enfermería')cls='status-enfermeria';else if(status==='Consulta'||status==='En atención')cls='status-consulta';else if(status==='Atendido')cls='status-atendido';else if(status==='Cancelado')cls='status-cancelado';return `<span class="badge ${cls}">${esc(statusLabel(status))}</span>`;}
function safeNameFromProfessional(uid){const p=state.professionals.find(x=>x.id===uid);return p?.full_name||p?.username||shortId(uid)||'Sin asignar';}
function makePatientDirectorySummary(patientId, patient){
  const payload=patient?.payload||{};
  return {ownerUid:state.ownerUid,patient_id:patientId,display_name:patientName(payload),assigned_professional_id:String(patient?.last_assigned_professional_id||''),specialty:String(patient?.last_service_specialty||''),created_at:String(patient?.created_at||nowIso()),updated_at:String(patient?.updated_at||nowIso())};
}
function makeRoomSummary(visitId, visit){
  // Este documento nunca contiene patient_id, nombre, fecha de nacimiento ni datos clínicos.
  return {ownerUid:state.ownerUid,visit_id:visitId,status:String(visit?.status||''),service_specialty:String(visit?.service_specialty||''),assigned_professional_id:String(visit?.assigned_professional_id||''),created_at:String(visit?.created_at||nowIso()),updated_at:String(visit?.updated_at||nowIso())};
}
function addPatientDirectoryToBatch(batch, patientId, patient){batch.set(doc(db,'pacientes_directorio',patientId),makePatientDirectorySummary(patientId,patient),{merge:true});}
function addRoomSummaryToBatch(batch, visitId, visit){const ref=doc(db,'sala_resumen',visitId);batch.set(ref,makeRoomSummary(visitId,visit),{merge:true});}
async function syncClinicOperationalSummaries(force=false){
  if(!['admin','reception'].includes(state.user?.role))throw new Error('Solo Administración o Recepción pueden inicializar los resúmenes operativos.');
  if(!force&&state.summariesSyncedAt&&Date.now()-state.summariesSyncedAt<5*60*1000)return {patients:0,visits:0,cached:true};
  const [patientSnap,visitSnap]=await Promise.all([
    getDocs(query(collection(db,'pacientes'),where('ownerUid','==',state.ownerUid))),
    getDocs(query(collection(db,'visitas'),where('ownerUid','==',state.ownerUid)))
  ]);
  const operations=[];
  for(const d of patientSnap.docs){const patient={id:d.id,...d.data(),payload:d.data().payload||{}};operations.push({type:'set',ref:doc(db,'pacientes_directorio',d.id),data:makePatientDirectorySummary(d.id,patient)});}
  for(const d of visitSnap.docs){const visit={id:d.id,...d.data()};operations.push({type:'set',ref:doc(db,'sala_resumen',d.id),data:makeRoomSummary(d.id,visit)});}
  for(let i=0;i<operations.length;i+=6){const batch=writeBatch(db);for(const op of operations.slice(i,i+6)){if(op.type==='set')batch.set(op.ref,op.data,{merge:true});else batch.delete(op.ref);}await batch.commit();}
  state.summariesSyncedAt=Date.now();return {patients:patientSnap.size,visits:visitSnap.size,cached:false};
}
async function loadProfessionals(force=false){
  if(!state.user)return [];
  if(!force&&state.professionalsLoadedAt&&Date.now()-state.professionalsLoadedAt<30000)return state.professionals;
  const snap=await getDocs(query(collection(db,'profesionales'),where('ownerUid','==',state.ownerUid)));
  state.professionals=snap.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.active===true);state.professionalsLoadedAt=Date.now();return state.professionals;
}
const PRESENCE_STALE_MS=90000;
function presenceTimeMs(value){if(value&&typeof value.toMillis==='function')return value.toMillis();if(value instanceof Date)return value.getTime();const n=Date.parse(value||'');return Number.isFinite(n)?n:0;}
function isProfessionalOnline(uid){const p=state.presenceByUid?.get(uid);return !!(p&&p.active===true&&Date.now()-presenceTimeMs(p.heartbeat_at)<PRESENCE_STALE_MS);}
function stopPresenceWatch(){if(state.presenceUnsubscribe){state.presenceUnsubscribe();state.presenceUnsubscribe=null;}clearInterval(state.presenceRefreshTimer);state.presenceRefreshTimer=null;state.presenceByUid=new Map();}
async function publishProfessionalPresence(active=true){
 if(state.user?.role!=='clinician'||!state.currentUser?.uid||!state.ownerUid)return;
 const uid=state.currentUser.uid,ref=doc(db,'presencia_profesionales',uid);if(!state.presenceSessionId)state.presenceSessionId=crypto.randomUUID();
 const data={ownerUid:state.ownerUid,professional_id:uid,role:'clinician',active:!!active,session_id:state.presenceSessionId,full_name:state.user.profile?.full_name||state.user.username||state.user.email||'Profesional',specialty:String(state.user.profile?.specialty||''),heartbeat_at:new Date()};
 await setDoc(ref,data,{merge:true});
}
function startPresenceWatch(){
 stopPresenceWatch();if(!state.user||!state.ownerUid)return;const owner=state.ownerUid;
 state.presenceUnsubscribe=onSnapshot(query(collection(db,'presencia_profesionales'),where('ownerUid','==',owner)),snap=>{
  if(!state.user||state.ownerUid!==owner)return;const map=new Map();snap.docs.forEach(d=>map.set(d.id,{id:d.id,...d.data()}));state.presenceByUid=map;
  if(state.view==='queue')renderProfessionalAvailability();
  ['form-professional','existing-professional'].forEach(id=>{const el=document.getElementById(id);if(el&&el.dataset.presenceBound==='1'){el.dispatchEvent(new Event('presence-refresh'));}});
 },err=>console.warn('No se pudo consultar la presencia en tiempo real; se mostrará Inactivo hasta confirmar sesión.',err));
 clearInterval(state.presenceRefreshTimer);state.presenceRefreshTimer=setInterval(()=>{if(state.view==='queue')renderProfessionalAvailability();},15000);
}
async function startProfessionalPresence(){
 if(state.user?.role!=='clinician')return;state.presenceSessionId=crypto.randomUUID();
 try{await publishProfessionalPresence(true);}catch(err){console.warn('No se pudo publicar el inicio de sesión profesional',err);}
 if(state.presenceHeartbeatTimer)clearInterval(state.presenceHeartbeatTimer);
 state.presenceHeartbeatTimer=setInterval(()=>{if(state.user?.role==='clinician')publishProfessionalPresence(true).catch(err=>console.warn('No se pudo renovar la presencia profesional',err));},30000);
}
async function stopProfessionalPresence(){
 if(state.presenceHeartbeatTimer){clearInterval(state.presenceHeartbeatTimer);state.presenceHeartbeatTimer=null;}
 if(state.user?.role==='clinician'){try{await publishProfessionalPresence(false);}catch(err){console.warn('No se pudo marcar la sesión como inactiva; caducará por tiempo.',err);}}
 state.presenceSessionId='';
}
async function loadPatientDoc(patientId,force=false){
  if(!patientId)return null;const cached=state.patientsCache.get(patientId);if(!force&&cached&&Date.now()-cached.at<60000)return cached.value;
  try{const snap=await getDoc(doc(db,'pacientes',patientId));if(!snap.exists()){state.patientsCache.delete(patientId);return null;}const data=snap.data();const value={id:snap.id,...data,payload:data.payload||{}};state.patientsCache.set(patientId,{value,at:Date.now()});return value;}
  catch(err){if(/permission-denied|403|insufficient permissions/i.test(String(err?.message||err)))return {id:patientId,ownerUid:state.ownerUid,payload:{},_restricted:true};throw err;}
}
async function loadVisitDoc(visitId){const snap=await getDoc(doc(db,'visitas',visitId));return snap.exists()?{id:snap.id,...snap.data()}:null;}
async function loadQueue(silent=false){
  if(!state.user)return;if(state.loadingQueue){state.queueRefreshPending=true;return;}state.loadingQueue=true;if(!silent)setSync('Actualizando datos…',true);
  try{
    const realVisits=[];
    if(state.user.role==='clinician'){
      const normal=query(collection(db,'visitas'),where('ownerUid','==',state.ownerUid),where('assigned_professional_id','==',state.currentUser.uid),where('status','in',ACTIVE_VISIT_STATUSES));
      const snap=await getDocs(normal);const assignedVisits=snap.docs.map(d=>({id:d.id,...d.data()})).filter(v=>ACTIVE_VISIT_STATUSES.includes(v.status));
      const grantSnap=await getDocs(query(collection(db,'paciente_accesos'),where('ownerUid','==',state.ownerUid),where('professional_id','==',state.currentUser.uid),where('active','==',true)));
      const grants=grantSnap.docs.map(d=>({id:d.id,...d.data()}));state.patientGrantIds=new Set(grants.filter(g=>g.patient_id).map(g=>g.patient_id));
      // Una interconsulta habilita lectura del expediente, no una consulta editable en la cola.
      realVisits.push(...assignedVisits.filter(v=>!String(v.interconsultation_request_id||'').trim()));
      const summarySnap=await getDocs(query(collection(db,'sala_resumen'),where('ownerUid','==',state.ownerUid)));
      state.professionalBusyIds=new Set(summarySnap.docs.map(d=>d.data()).filter(x=>x.status==='En atención'&&x.assigned_professional_id).map(x=>x.assigned_professional_id));
      const realById=new Map(realVisits.map(v=>[v.id,{...v,_queueRedacted:false}]));
      const merged=new Map();
      for(const d of summarySnap.docs){const summary={id:d.id,...d.data()};if(!ACTIVE_VISIT_STATUSES.includes(summary.status))continue;const real=realById.get(summary.visit_id||d.id);if(real)merged.set(real.id,real);else merged.set(summary.visit_id||d.id,{id:summary.visit_id||d.id,...summary,patient_id:'',_queueRedacted:true});}
      for(const v of realVisits)if(!merged.has(v.id))merged.set(v.id,{...v,_queueRedacted:false});
      state.queue=Array.from(merged.values()).sort((a,b)=>String(a.created_at||'').localeCompare(String(b.created_at||'')));
    }else{
      const snap=await getDocs(query(collection(db,'visitas'),where('ownerUid','==',state.ownerUid)));
      const allVisits=snap.docs.map(d=>({id:d.id,...d.data(),_queueRedacted:false}));state.professionalBusyIds=new Set(allVisits.filter(v=>v.status==='En atención'&&v.assigned_professional_id).map(v=>v.assigned_professional_id));
      state.queue=allVisits.filter(v=>ACTIVE_VISIT_STATUSES.includes(v.status)).sort((a,b)=>String(a.created_at||'').localeCompare(String(b.created_at||'')));
    }
    const root=$('#page-content');if(state.view==='queue'&&root)await renderQueueContent();
    state.lastSync=Date.now();setSync('Sincronizado · '+new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),true);
  }catch(err){console.error(err);setSync('Error de permisos / conexión',false);if(!silent)toast(friendlyError(err),'error');if(state.view==='queue')renderQueueError(err);}
  finally{state.loadingQueue=false;if(state.queueRefreshPending){state.queueRefreshPending=false;queueMicrotask(()=>loadQueue(true));}}
}
async function renderQueue(){
 const role=state.user.role;
 $('#page-content').innerHTML=`<section class="waiting-room-shell">
  <div class="room-intro"><div><div class="eyebrow eyebrow-spaced">BRIMA HC · CLÍNICA EN TIEMPO REAL</div><p>Flujo de pacientes</p></div><div class="room-live-state"><span class="room-live-dot"></span><span>Actualización en vivo</span><button class="btn ghost small" id="queue-refresh" type="button">↻ Actualizar</button></div></div>
  <div id="queue-toolbar" class="room-toolbar"></div>
  <div id="queue-table-container" class="waiting-room-board"><div class="room-loading"><span class="spinner"></span><span>Cargando sala…</span></div></div>
  <section class="availability-panel"><div class="availability-head"><div><h3>Disponibilidad de profesionales</h3><p>El estado cambia al iniciar o terminar una consulta.</p></div></div><div id="professional-availability" class="professional-chip-grid"></div></section>
  <p id="queue-selection-status" class="room-selection-status">La identidad del paciente solo se muestra a los usuarios autorizados.</p>
 </section>`;
 $('#queue-refresh').addEventListener('click',()=>loadQueue());renderQueueToolbar();await loadQueue(true);if(state.view==='queue')await renderQueueContent();
}
function renderQueueToolbar(){
 const el=$('#queue-toolbar');if(!el)return;
 let actions='';
 if(state.user.role==='reception')actions=`<button class="btn primary" data-queue-action="new">＋ Registrar llegada</button><button class="btn" data-queue-action="existing">Paciente existente</button>`;
 else if(state.user.role==='nursing')actions=`<button class="btn primary" data-queue-action="triage">＋ Somatometría</button>`;
 else if(state.user.role==='clinician')actions=`<button class="btn" data-queue-action="history">Ver historias clínicas</button>`;
 else actions=`<button class="btn primary" data-queue-action="new">＋ Registrar paciente</button><button class="btn" data-queue-action="existing">Nueva llegada existente</button>`;
 el.innerHTML=`<div class="search-box room-search"><input type="search" id="queue-search" placeholder="Buscar paciente o servicio…" aria-label="Buscar en sala de espera"></div><select class="small-select" id="queue-status-filter" aria-label="Filtrar por etapa"><option value="">Todas las etapas</option>${ACTIVE_VISIT_STATUSES.map(s=>`<option value="${esc(s)}">${esc(({Recepción:'Recepción',Enfermería:'Enfermería',Consulta:'En espera del profesional','En atención':'En consulta'})[s]||s)}</option>`).join('')}</select><div class="room-toolbar-actions">${actions}</div>`;
 $('#queue-search').addEventListener('input',()=>renderQueueContent());$('#queue-status-filter').addEventListener('change',()=>renderQueueContent());
 $$('[data-queue-action]',el).forEach(btn=>btn.addEventListener('click',()=>runQueueAction(btn.dataset.queueAction)));
}
async function renderQueueContent(){
 const el=$('#queue-table-container');if(!el)return;
 const search=String($('#queue-search')?.value||'').trim().toLocaleLowerCase('es-MX');
 const chosenStatus=$('#queue-status-filter')?.value||'';
 const raw=state.queue.filter(v=>!chosenStatus||v.status===chosenStatus);
 // Consultar expedientes autorizados en paralelo evita una petición secuencial por tarjeta.
 const list=await Promise.all(raw.map(async v=>{
  let patient=null,restricted=!!v._queueRedacted;
  if(!restricted&&v.patient_id){try{patient=await loadPatientDoc(v.patient_id);if(!patient||patient._restricted){restricted=true;patient=null;const original=state.queue.find(x=>x.id===v.id);if(original)original._queueRedacted=true;}}catch(_){restricted=true;patient=null;}}
  const name=restricted?(v.status==='Consulta'||v.status==='En atención'?'Paciente en servicio':'Paciente reservado'):patientName(patient?.payload||{});
  const original=state.queue.find(x=>x.id===v.id);if(original){original._queueRedacted=restricted;original._patientName=name;}
  const searchable=`${restricted?'':name} ${v.service_specialty||''} ${safeNameFromProfessional(v.assigned_professional_id)} ${v.status||''}`.toLocaleLowerCase('es-MX');
  return {...v,_patient:patient,_patientName:name,_queueRedacted:restricted,_searchable:searchable};
 }));
 const filtered=list.filter(v=>!search||v._searchable.includes(search));
 renderProfessionalAvailability();
 const stages=[
  {key:'nursing',title:'Pendientes de enfermería',sub:'Registro y somatometría',statuses:['Recepción','Enfermería'],icon:'＋',cls:'stage-nursing'},
  {key:'ready',title:'En espera del profesional',sub:'Listos para iniciar atención',statuses:['Consulta'],icon:'◷',cls:'stage-ready'},
  {key:'care',title:'En consulta',sub:'Atención ya iniciada',statuses:['En atención'],icon:'✚',cls:'stage-care'}
 ];
 const cardHtml=v=>{
  const safeName=v._queueRedacted?(v.status==='Consulta'||v.status==='En atención'?'Paciente en servicio':'Paciente reservado'):v._patientName;
  const statusText=({Recepción:'Recepción',Enfermería:'Enfermería',Consulta:'Listo para consulta','En atención':'En consulta'})[v.status]||v.status;
  const canOpen=state.user.role==='clinician'&&!v._queueRedacted&&['Consulta','En atención'].includes(v.status)&&v.patient_id;
  const canTriage=state.user.role==='nursing'&&!v._queueRedacted&&['Recepción','Enfermería'].includes(v.status)&&v.patient_id;
  const canManage=state.user.role==='reception'&&!v._queueRedacted&&['Recepción','Enfermería'].includes(v.status)&&v.patient_id;
  const action=canOpen?`<button type="button" class="btn primary room-card-action" data-room-open="${esc(v.id)}">${v.status==='Consulta'?'Abrir historia clínica':'Reanudar consulta'}</button>`:canTriage?`<button type="button" class="btn primary room-card-action" data-room-triage="${esc(v.id)}">Registrar somatometría</button>`:canManage?`<span class="room-card-hint">Pendiente de enfermería</span>`:v._queueRedacted?`<span class="room-card-hint">Datos reservados</span>`:`<span class="room-card-hint">${esc(statusText)}</span>`;
  const assigned=safeNameFromProfessional(v.assigned_professional_id);
  return `<article class="room-patient-card ${v._queueRedacted?'is-protected':''} ${state.selectedVisitId===v.id?'is-selected':''}" data-visit-card="${esc(v.id)}" tabindex="0" aria-label="${esc(safeName)} · ${esc(statusText)}">
   <div class="room-card-top"><span class="room-card-status ${v.status==='En atención'?'is-care':v.status==='Consulta'?'is-ready':'is-nursing'}"><i></i>${esc(statusText)}</span><time>${esc(formatDate(v.created_at))}</time></div>
   <h4>${esc(safeName||'Paciente')}</h4><div class="room-card-meta"><span>${esc(v.service_specialty||'Servicio por definir')}</span><span class="room-meta-dot">·</span><span>${esc(assigned)}</span></div>
   <div class="room-card-bottom">${action}</div>
  </article>`;
 };
 const html=stages.map(stage=>{
  const stageRows=filtered.filter(v=>stage.statuses.includes(v.status));
  return `<section class="room-stage ${stage.cls}"><header class="room-stage-head"><div class="room-stage-symbol">${stage.icon}</div><div class="room-stage-title"><h3>${stage.title}</h3><p>${stage.sub}</p></div><span class="room-stage-count">${stageRows.length}</span></header><div class="room-stage-list">${stageRows.length?stageRows.map(cardHtml).join(''):`<div class="room-stage-empty"><span>${stage.icon}</span><strong>Sin pacientes</strong></div>`}</div></section>`;
 }).join('');
 el.innerHTML=html;
 $$('[data-visit-card]',el).forEach(card=>{
  const activate=()=>{const id=card.dataset.visitCard;selectVisit(id);const v=state.queue.find(x=>x.id===id);if(state.user.role==='clinician'&&v&&!v._queueRedacted&&['Consulta','En atención'].includes(v.status)){runQueueAction('consult');}};
  card.addEventListener('click',e=>{if(e.target.closest('button'))return;activate();});
  card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});
 });
 $$('[data-room-open]',el).forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();selectVisit(btn.dataset.roomOpen);runQueueAction('consult');}));
 $$('[data-room-triage]',el).forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();selectVisit(btn.dataset.roomTriage);runQueueAction('triage');}));
 const selection=$('#queue-selection-status');if(selection&&state.selectedVisitId){const v=state.queue.find(x=>x.id===state.selectedVisitId);if(v)selection.textContent=`Seleccionada: ${v._queueRedacted?'paciente reservado':(v._patientName||shortId(v.patient_id||v.id))} · ${v.service_specialty||'Servicio'} · ${statusLabel(v.status)}`;}
}
function renderProfessionalAvailability(){
 const el=$('#professional-availability');if(!el)return;
 const busy=new Set(state.professionalBusyIds||[]);
 for(const v of state.queue)if(v.status==='En atención'&&v.assigned_professional_id)busy.add(v.assigned_professional_id);
 const clinicians=state.professionals.filter(p=>p.role==='clinician'&&p.active).sort((a,b)=>String(a.full_name||'').localeCompare(String(b.full_name||''),'es-MX'));
 if(!clinicians.length){el.innerHTML='<div class="room-stage-empty"><strong>No hay profesionales registrados</strong></div>';return;}
 const keyOf=p=>slugify(p.specialty||'otro');
 el.innerHTML=clinicians.map(p=>{const online=isProfessionalOnline(p.id),occupied=online&&busy.has(p.id);const label=!online?'Inactivo':occupied?'En consulta':'Disponible';const cls=!online?'is-offline':occupied?'is-busy':'is-available';return `<div class="professional-chip specialty-${esc(keyOf(p))} ${cls}"><span class="professional-chip-mark">${online?'●':'○'}</span><span class="professional-chip-name">${esc(p.full_name||p.username||shortId(p.id))}</span><span class="professional-chip-specialty">${esc(p.specialty||'Sin especialidad')}</span><span class="professional-chip-state">${label}</span></div>`;}).join('');
}

function renderQueueError(err){const el=$('#queue-table-container');if(el)el.innerHTML=`<div class="inline-note warning-note"><strong>No se pudo consultar la sala.</strong><span>${esc(friendlyError(err))}</span></div>`;}
function selectVisit(id){state.selectedVisitId=id;const v=state.queue.find(x=>x.id===id);$$('[data-visit-card]').forEach(card=>card.classList.toggle('is-selected',card.dataset.visitCard===id));const el=$('#queue-selection-status');if(el&&v)el.textContent=`Seleccionada: ${v._queueRedacted?'paciente reservado':(v._patientName||shortId(v.patient_id||v.id))} · ${v.service_specialty||'Sin servicio'} · ${statusLabel(v.status)}`;}
function selectedVisit(){return state.queue.find(v=>v.id===state.selectedVisitId)||null;}
async function runQueueAction(action){
 try{
  if(action==='new')return openPatientForm('new');if(action==='existing')return openExistingCheckin();
  if(action==='backups'){goView('backups');return;}
  if(action==='history'){if(state.user.role==='clinician'){state.selectedPatientId='';state.historyReturnView='history';goView('history');return;}const historyVisit=selectedVisit();if(historyVisit&&!historyVisit._queueRedacted){state.selectedPatientId=historyVisit.patient_id;goView('history');return;}goView(state.user.role==='admin'?'patients':'queue');return;}
  const visit=selectedVisit();if(!visit){toast('Selecciona una visita de la tabla.','warning');return;}
  if(state.user.role==='clinician'&&visit._queueRedacted){toast('Esta visita pertenece al flujo de otro profesional. Puedes ver su estado y la ocupación, pero no abrir ni consultar los datos del paciente.','warning',6500);return;}
  if(action==='edit')return openPatientForm('edit',await loadPatientDoc(visit.patient_id));
    if(action==='cancel')return cancelVisit(visit);
  if(action==='triage')return openTriage(visit);
  if(action==='consult')return openConsult(visit);
 }catch(err){console.error(err);toast(friendlyError(err),'error');}
}
function optionList(values,selected=''){return values.map(v=>`<option value="${esc(v)}" ${String(v)===String(selected)?'selected':''}>${esc(v)}</option>`).join('');}
function patientFieldsHtml(patient={},readonly=false){return PATIENT_FIELDS.map(([key,label,type,required])=>{
  if(type==='select')return `<div class="form-field"><label for="pf-${key}">${label}${required?' *':''}</label><select name="${key}" id="pf-${key}" ${required?'required':''} ${readonly?'disabled':''}><option value="">Selecciona</option>${optionList(['Femenino','Masculino','Intersexual / otra descripción','No especificado'],patient[key]||'')}</select></div>`;
  return `<div class="form-field"><label for="pf-${key}">${label}${required?' *':''}</label><input id="pf-${key}" name="${key}" type="${type}" value="${fieldVal(patient,key)}" ${required?'required':''} ${readonly?'disabled':''} ${key==='dob'?'max="'+new Date().toISOString().slice(0,10)+'"':''}></div>`;
}).join('');}
async function openPatientForm(mode,patientDoc=null){
 if(mode==='new'&&!['reception','admin'].includes(state.user.role)){toast('Solo Recepción o Administración pueden registrar un paciente nuevo.','warning');return;}
 if(mode==='edit'&&state.user.role!=='admin'){toast('Solo Administración puede corregir la identificación después del registro inicial.','warning');return;}
 if(mode==='edit'&&(!patientDoc||patientDoc._restricted)){toast('No tienes acceso a la identificación de ese expediente.','error');return;}
 const payload=patientDoc?.payload||{};await loadProfessionals();
 const routeFields=mode==='new'?`<div class="divider-label">Primera asignación</div><div class="form-field"><label>Servicio / especialidad *</label><select name="service_specialty" id="form-service" required>${optionList(specialtyOptions(),'')}</select></div><div class="form-field"><label>Profesional responsable *</label><select name="assigned_professional_id" id="form-professional" required><option value="">Selecciona servicio primero</option></select></div>`:'';
 openModal(mode==='new'?'Registrar nuevo paciente y llegada':'Editar identificación del paciente',`<p class="muted">${mode==='new'?'Se creará el expediente y su primera visita en una sola operación de Firestore.':'Los campos se precargan con lo registrado; solo se modificará la identificación.'}</p><div class="modal-section-title">Datos de identificación</div><div class="form-grid">${patientFieldsHtml(payload)}${routeFields}</div>`,{
  size:'wide',buttons:[{action:'cancel',label:'Cancelar'},{action:'save',label:mode==='new'?'Crear paciente y llegada':'Guardar cambios',primary:true}],
  afterOpen:modal=>{
    if(mode==='new'){
      const serv=$('#form-service',modal),pro=$('#form-professional',modal);
      const update=()=>{const current=pro.value;const people=state.professionals.filter(p=>p.role==='clinician'&&p.active===true&&isProfessionalOnline(p.id)&&String(p.specialty||'').toLocaleLowerCase('es-MX')===serv.value.toLocaleLowerCase('es-MX'));pro.innerHTML='<option value="">Selecciona profesional</option>'+people.map(p=>`<option value="${esc(p.id)}">${esc(p.full_name||p.username||p.id)}${p.specialty?' · '+esc(p.specialty):''}</option>`).join('');if(people.some(p=>p.id===current))pro.value=current;};pro.dataset.presenceBound='1';pro.addEventListener('presence-refresh',update);serv.addEventListener('change',update);update();
    }
  },
  onAction:async(action,fd)=>{
    if(action!=='save')return true;
    const payloadNew=mode==='edit'?{...(patientDoc?.payload||{})}:{};for(const [key] of PATIENT_FIELDS)payloadNew[key]=String(fd.get(key)||'').trim();
    if(!payloadNew.first_name||!payloadNew.last_name1||!payloadNew.dob||!payloadNew.sex){toast('Completa nombre, primer apellido, fecha de nacimiento y sexo.','warning');return false;}
    const dob=new Date(payloadNew.dob+'T00:00:00');if(Number.isNaN(dob.getTime())||dob>new Date()){toast('La fecha de nacimiento no es válida o es futura.','warning');return false;}
    if(mode==='edit'){
      const row=await getDoc(doc(db,'pacientes',patientDoc.id));if(!row.exists())throw new Error('El expediente ya no existe.');
      const at=nowIso(),updatedPatient={...patientDoc,payload:payloadNew,updated_at:at};const batch=writeBatch(db);batch.update(doc(db,'pacientes',patientDoc.id),{payload:payloadNew,updated_at:at});addPatientDirectoryToBatch(batch,patientDoc.id,updatedPatient);await batch.commit();state.patientsCache.delete(patientDoc.id);await writeAudit('ACTUALIZAR_IDENTIFICACION',patientDoc.id,'');toast('Identificación actualizada; los campos conservados se guardaron.');await loadQueue(true);return true;
    }
    const specialty=String(fd.get('service_specialty')||'').trim(),professionalId=String(fd.get('assigned_professional_id')||'').trim();if(!specialty||!professionalId){toast('Selecciona servicio y profesional responsable.','warning');return false;}
    const prof=state.professionals.find(p=>p.id===professionalId&&p.active&&p.role==='clinician'&&isProfessionalOnline(p.id)&&p.specialty===specialty);if(!prof){toast('El profesional está inactivo o su especialidad no coincide con el servicio. Actualiza la lista de profesionales.','error');return false;}
    const pid=crypto.randomUUID(),vid=crypto.randomUUID(),at=nowIso(),batch=writeBatch(db);
    const patientData={ownerUid:state.ownerUid,payload:payloadNew,created_at:at,updated_at:at,authorized_professional_ids:[professionalId],last_assigned_professional_id:professionalId,last_service_specialty:specialty};const visitData={ownerUid:state.ownerUid,patient_id:pid,status:'Enfermería',created_at:at,updated_at:at,closed_at:'',service_specialty:specialty,assigned_professional_id:professionalId,interconsultation_request_id:''};
    batch.set(doc(db,'pacientes',pid),patientData);addPatientDirectoryToBatch(batch,pid,patientData);
    batch.set(doc(db,'visitas',vid),visitData);addRoomSummaryToBatch(batch,vid,visitData);
    await batch.commit();state.patientsCache.delete(pid);state.selectedVisitId=vid;await writeAudit('REGISTRO_PACIENTE_Y_LLEGADA',pid,vid);await writeAudit('ASIGNAR_SERVICIO',pid,vid);await loadQueue(true);toast(`Paciente y primera llegada creados. Folio ${shortId(pid)}.`);return true;
  }
 });
}
async function loadAllReceptionPatients(){const snap=await getDocs(query(collection(db,'pacientes'),where('ownerUid','==',state.ownerUid)));return snap.docs.map(d=>({id:d.id,...d.data(),payload:d.data().payload||{}}));}
async function openExistingCheckin(){
 if(!['reception','admin'].includes(state.user.role))return;const patients=await loadAllReceptionPatients();if(!patients.length){toast('Todavía no hay expedientes registrados. Usa Nueva llegada / paciente.','warning');return;}await loadProfessionals();
 openModal('Nueva llegada de paciente existente',`<p class="muted">Busca el expediente por nombre, CURP o teléfono. Se creará una visita nueva; el paciente no se duplicará.</p><div class="form-grid"><div class="form-field span-2"><label>Buscar paciente</label><input id="existing-search" type="search" placeholder="Nombre, CURP o teléfono"></div><div class="form-field span-2"><label>Expediente *</label><select id="existing-patient-id" name="patient_id" required size="7">${patients.map(p=>`<option value="${esc(p.id)}">${esc(patientName(p.payload))} · ${esc(p.payload.curp||p.payload.phone||shortId(p.id))}</option>`).join('')}</select></div><div class="form-field"><label>Servicio / especialidad *</label><select id="existing-service" name="service_specialty" required>${optionList(specialtyOptions(),'')}</select></div><div class="form-field"><label>Profesional responsable *</label><select id="existing-professional" name="assigned_professional_id" required></select></div></div>`,{
  size:'wide',buttons:[{action:'cancel',label:'Cancelar'},{action:'create',label:'Registrar llegada',primary:true}],
  afterOpen:modal=>{
   const search=$('#existing-search',modal),sel=$('#existing-patient-id',modal),serv=$('#existing-service',modal),prof=$('#existing-professional',modal);
   const paintPatients=()=>{const keep=sel.value;const term=search.value.trim().toLocaleLowerCase('es-MX');const filtered=patients.filter(p=>{const x=p.payload||{};return `${patientName(x)} ${x.curp||''} ${x.phone||''}`.toLocaleLowerCase('es-MX').includes(term);});sel.innerHTML=filtered.map(p=>`<option value="${esc(p.id)}">${esc(patientName(p.payload))} · ${esc(p.payload.curp||p.payload.phone||shortId(p.id))}</option>`).join('');if(filtered.some(p=>p.id===keep))sel.value=keep;};search.addEventListener('input',paintPatients);
   const paintPros=()=>{const current=prof.value;const people=state.professionals.filter(p=>p.role==='clinician'&&p.active===true&&isProfessionalOnline(p.id)&&String(p.specialty||'').toLocaleLowerCase('es-MX')===serv.value.toLocaleLowerCase('es-MX'));prof.innerHTML='<option value="">Selecciona profesional</option>'+people.map(p=>`<option value="${esc(p.id)}">${esc(p.full_name||p.username||p.id)}</option>`).join('');if(people.some(p=>p.id===current))prof.value=current;};prof.dataset.presenceBound='1';prof.addEventListener('presence-refresh',paintPros);serv.addEventListener('change',paintPros);paintPros();
  },
  onAction:async(action,fd)=>{if(action!=='create')return true;const pid=String(fd.get('patient_id')||''),specialty=String(fd.get('service_specialty')||''),professional=String(fd.get('assigned_professional_id')||'');if(!pid||!specialty||!professional){toast('Selecciona expediente, servicio y profesional.','warning');return false;}const p=patients.find(x=>x.id===pid);const pr=state.professionals.find(x=>x.id===professional&&x.role==='clinician'&&x.active&&isProfessionalOnline(x.id)&&x.specialty===specialty);if(!p||!pr){toast('El expediente o profesional seleccionado ya no está disponible.','error');return false;}const authorized=Array.isArray(p.authorized_professional_ids)?p.authorized_professional_ids.slice():[];if(!authorized.includes(professional))authorized.push(professional);const at=nowIso(),vid=crypto.randomUUID(),batch=writeBatch(db);const updatedPatient={...p,authorized_professional_ids:authorized,last_assigned_professional_id:professional,last_service_specialty:specialty,updated_at:at};const visitData={ownerUid:state.ownerUid,patient_id:pid,status:'Enfermería',created_at:at,updated_at:at,closed_at:'',service_specialty:specialty,assigned_professional_id:professional,interconsultation_request_id:''};batch.update(doc(db,'pacientes',pid),{authorized_professional_ids:authorized,last_assigned_professional_id:professional,last_service_specialty:specialty,updated_at:at});addPatientDirectoryToBatch(batch,pid,updatedPatient);batch.set(doc(db,'visitas',vid),visitData);addRoomSummaryToBatch(batch,vid,visitData);await batch.commit();state.selectedVisitId=vid;state.patientsCache.delete(pid);await writeAudit('REGISTRAR_NUEVA_LLEGADA_PACIENTE_EXISTENTE',pid,vid);await writeAudit('ASIGNAR_SERVICIO',pid,vid);await loadQueue(true);toast('Nueva llegada creada sin duplicar el expediente.');return true;}
 });
}
async function openAssign(visit){
 if(state.user.role!=='reception')return;await loadProfessionals();
 const patientDoc=await loadPatientDoc(visit.patient_id);if(!patientDoc||patientDoc._restricted){toast('No fue posible leer el expediente asociado a la visita.','error');return;}
 openModal('Asignar / reasignar servicio',`<p class="muted">Paciente: <strong>${esc(patientName(patientDoc.payload))}</strong> · Folio ${esc(shortId(visit.patient_id))}. La asignación define el acceso a la consulta.</p><div class="form-grid"><div class="form-field"><label>Servicio / especialidad *</label><select id="assign-service" name="service_specialty" required>${optionList(specialtyOptions(),visit.service_specialty||'')}</select></div><div class="form-field"><label>Profesional responsable *</label><select id="assign-professional" name="assigned_professional_id" required></select></div></div>`,{
  buttons:[{action:'cancel',label:'Cancelar'},{action:'save',label:'Guardar asignación',primary:true}],
  afterOpen:modal=>{const serv=$('#assign-service',modal),pro=$('#assign-professional',modal);const paint=()=>{const current=pro.value||visit.assigned_professional_id;const people=state.professionals.filter(p=>p.role==='clinician'&&p.active===true&&isProfessionalOnline(p.id)&&p.specialty===serv.value);pro.innerHTML='<option value="">Selecciona profesional</option>'+people.map(p=>`<option value="${esc(p.id)}">${esc(p.full_name||p.username||p.id)}</option>`).join('');if(people.some(p=>p.id===current))pro.value=current;};pro.dataset.presenceBound='1';pro.addEventListener('presence-refresh',paint);serv.addEventListener('change',paint);paint();},
  onAction:async(action,fd)=>{if(action!=='save')return true;const specialty=String(fd.get('service_specialty')||''),uid=String(fd.get('assigned_professional_id')||'');const pro=state.professionals.find(p=>p.id===uid&&p.role==='clinician'&&p.active===true&&p.specialty===specialty&&isProfessionalOnline(p.id));if(!pro){toast('El profesional está inactivo o ya no tiene una sesión abierta. Selecciona uno disponible.','warning');return false;}const freshVisit=await loadVisitDoc(visit.id);const freshPatient=await getDoc(doc(db,'pacientes',visit.patient_id));if(!freshVisit||!freshPatient.exists())throw new Error('La visita o el expediente dejó de existir.');const pat=freshPatient.data();const ids=Array.isArray(pat.authorized_professional_ids)?pat.authorized_professional_ids.slice():[];const newIds=ids.filter(id=>id!==uid);newIds.push(uid);const at=nowIso();const batch=writeBatch(db);const updatedVisit={...freshVisit,service_specialty:specialty,assigned_professional_id:uid,updated_at:at};const updatedPatient={...pat,authorized_professional_ids:newIds,last_assigned_professional_id:uid,last_service_specialty:specialty,updated_at:at};batch.update(doc(db,'visitas',visit.id),{service_specialty:specialty,assigned_professional_id:uid,updated_at:at});batch.update(doc(db,'pacientes',visit.patient_id),{authorized_professional_ids:newIds,last_assigned_professional_id:uid,last_service_specialty:specialty,updated_at:at});addPatientDirectoryToBatch(batch,visit.patient_id,updatedPatient);addRoomSummaryToBatch(batch,visit.id,updatedVisit);await batch.commit();state.patientsCache.delete(visit.patient_id);await writeAudit('REASIGNAR_SERVICIO_Y_PROFESIONAL',visit.patient_id,visit.id);await loadQueue(true);toast('Servicio y profesional actualizados.');return true;}
 });
}
async function cancelVisit(visit){if(!['reception','admin'].includes(state.user.role))return;if(['Atendido','Cancelado'].includes(visit.status)){toast('La visita ya está cerrada.','warning');return;}if(!confirm('La visita dejará de aparecer en la sala activa. El expediente y las notas se conservarán. ¿Cancelar esta llegada?'))return;try{const at=nowIso(),batch=writeBatch(db);batch.update(doc(db,'visitas',visit.id),{status:'Cancelado',closed_at:at,updated_at:at});addRoomSummaryToBatch(batch,visit.id,{...visit,status:'Cancelado',closed_at:at,updated_at:at});await batch.commit();await writeAudit('CAMBIAR_ESTADO_VISITA:Cancelado',visit.patient_id,visit.id);await loadQueue(true);toast('Llegada cancelada; se retiró de la sala activa y el expediente se conservó.');}catch(err){toast(friendlyError(err),'error');}}

function renderReception(){ $('#page-content').innerHTML=pageHeading('Recepción','Registra llegadas, corrige identificación y define la asignación inicial del servicio y profesional responsable. La asignación no puede modificarse después de registrar la llegada.','OPERACIÓN / ADMISIONES')+
 `<div class="card-grid"><div class="stat-card"><span class="stat-icon">＋</span><div class="stat-label">Registrar paciente</div><div class="stat-value">01</div><div class="stat-foot">Crear expediente y llegada</div></div><div class="stat-card"><span class="stat-icon">◉</span><div class="stat-label">Expediente existente</div><div class="stat-value">02</div><div class="stat-foot">Nueva visita sin duplicar persona</div></div></div><div class="panel"><div class="panel-head"><div><h3>Acciones de recepción</h3><p>Selecciona una función. La sala de espera mostrará el resultado cuando la operación se confirme.</p></div></div><div class="actions"><button class="btn primary" id="rec-new">＋ Registrar paciente nuevo</button><button class="btn" id="rec-existing">Nueva llegada de expediente existente</button><button class="btn ghost" id="rec-queue">Volver a sala de espera</button></div></div>`;
 $('#rec-new').onclick=()=>openPatientForm('new');$('#rec-existing').onclick=()=>openExistingCheckin();$('#rec-queue').onclick=()=>goView('queue');
}
function renderNursing(){ $('#page-content').innerHTML=pageHeading('Enfermería','Enfermería captura únicamente somatometría y signos vitales. Al guardar, la visita pasa a la sala de espera del profesional.','ATENCIÓN / VALORACIÓN INICIAL')+
 `<div class="inline-note"><strong>Flujo de trabajo</strong><span>Abre Sala de espera, selecciona una llegada en estado Enfermería y pulsa “Registrar valoración”. Si ya existe una valoración, se mostrará en modo de consulta para no sobrescribirla.</span></div><div class="panel"><div class="panel-head"><div><h3>Valoración inicial</h3><p>Somatometría, signos vitales, motivo y observaciones.</p></div><button class="btn primary" id="nurse-open">♡ Abrir valoración de la visita seleccionada</button></div><button class="btn ghost" id="nurse-queue">Ver sala de espera</button></div>`;
 $('#nurse-open').onclick=()=>{const v=selectedVisit();if(v)openTriage(v);else toast('Selecciona una visita en Sala de espera.','warning');};$('#nurse-queue').onclick=()=>goView('queue');}
async function getTriage(visitId){const snap=await getDoc(doc(db,'valoraciones_iniciales',visitId));return snap.exists()?{id:snap.id,...snap.data()}:null;}
function calcBmi(weight,height){const w=parseFloat(weight),h=parseFloat(height);if(!w||!h||h<=0)return '';return (w/((h/100)**2)).toFixed(2);}
async function openTriage(visit){
 if(state.user.role!=='nursing'){toast('Solo Enfermería puede registrar valoración inicial.','warning');return;}
 if(!['Recepción','Enfermería'].includes(visit.status)){toast('La visita debe estar en Recepción o Enfermería.','warning');return;}
 try{
  const patientDoc=await loadPatientDoc(visit.patient_id);if(!patientDoc||patientDoc._restricted)throw new Error('No se puede leer la identificación del paciente.');
  const triage=await getTriage(visit.id);
  if(triage){openTriageReadOnly(triage,patientDoc,visit);return;}
  openModal(`Somatometría · ${patientName(patientDoc.payload)}`,`<p class="muted">Folio ${esc(shortId(visit.patient_id))} · Servicio ${esc(visit.service_specialty||'')}</p><div class="inline-note"><strong>Valoración de enfermería</strong><span>Captura únicamente lo medido. No se rellenan valores por defecto ni se infieren signos vitales.</span></div><div class="form-grid">${SOMATOMETRY_FIELDS.map(([key,label])=>`<div class="form-field"><label>${esc(label)}</label><input name="${key}" type="number" step="any" min="0" ${key==='pain'?'max="10"':''} ${key==='spo2'?'max="100"':''}></div>`).join('')}</div><p class="hint" id="bmi-preview">El IMC se calcula únicamente cuando existen peso y talla válidos.</p>`,{
   size:'wide',buttons:[{action:'cancel',label:'Cancelar'},{action:'save',label:'Guardar y enviar al profesional',primary:true}],
   afterOpen:modal=>{const update=()=>{$('#bmi-preview',modal).textContent='IMC calculado: '+(calcBmi($('[name=weight_kg]',modal).value,$('[name=height_cm]',modal).value)||'pendiente de peso y talla válidos');};$('[name=weight_kg]',modal).addEventListener('input',update);$('[name=height_cm]',modal).addEventListener('input',update);},
   onAction:async(action,fd)=>{
    if(action!=='save')return true;const payload={};for(const [key,label,type] of SOMATOMETRY_FIELDS){const raw=String(fd.get(key)||'').trim();if(type==='number'){if(raw===''){payload[key]=null;continue;}const n=Number(raw);if(!Number.isFinite(n)||n<0){toast(`${label}: captura un número no negativo.`,'warning');return false;}if(key==='pain'&&n>10){toast('El dolor debe estar entre 0 y 10.','warning');return false;}if(key==='spo2'&&n>100){toast('SpO₂ debe estar entre 0 y 100.','warning');return false;}payload[key]=n;}else payload[key]=raw;}
    if(payload.weight_kg&&payload.height_cm)payload.bmi=Number(calcBmi(payload.weight_kg,payload.height_cm));payload.measured_at=nowIso();payload.measured_by=state.user.profile?.full_name||state.user.username;
    const fresh=await loadVisitDoc(visit.id);if(!fresh||!['Recepción','Enfermería'].includes(fresh.status))throw new Error('El estado de la visita cambió. Actualiza la sala antes de registrar.');
    const at=nowIso(),assessment={ownerUid:state.ownerUid,visit_id:visit.id,patient_id:visit.patient_id,assigned_professional_id:fresh.assigned_professional_id||'',author_id:state.currentUser.uid,payload,created_at:at,updated_at:at};const batch=writeBatch(db);
    batch.set(doc(db,'valoraciones_iniciales',visit.id),assessment);batch.update(doc(db,'visitas',visit.id),{status:'Consulta',updated_at:at});addRoomSummaryToBatch(batch,visit.id,{...fresh,status:'Consulta',updated_at:at});await batch.commit();await writeAudit('GUARDAR_VALORACION_ENFERMERIA',visit.patient_id,visit.id);await loadQueue(true);toast('Somatometría guardada. El paciente ya está en la sala de espera del profesional.');return true;
   }
  });
 }catch(err){console.error(err);toast('No se pudo abrir la valoración. '+friendlyError(err),'error',8000);}
}
function openTriageReadOnly(triage,patientDoc,visit){const p=triage.payload||{};openModal(`Valoración guardada · ${patientName(patientDoc.payload)}`,`<p class="muted">Esta valoración ya existe y no se puede sobrescribir desde la web. Autor: ${esc(triage.author_id||'—')} · Fecha: ${esc(formatDate(triage.created_at))}</p><div class="form-grid">${TRIAGE_FIELDS.map(([key,label,type])=>`<div class="form-field ${type==='textarea'?'span-2':''}"><label>${esc(label)}</label><div class="note-preview">${esc(p[key]??'—')}</div></div>`).join('')}<div class="form-field"><label>IMC</label><div class="note-preview">${esc(p.bmi??'—')}</div></div></div>`,{size:'wide',buttons:[{action:'close',label:'Cerrar',primary:true}],onAction:async()=>true});}

function renderClinical(){ $('#page-content').innerHTML=pageHeading('Mi consulta / ficha clínica','Abre solo las visitas asignadas a tu cuenta y especialidad. Los registros finalizados quedan bloqueados; las correcciones se registran por adenda.','ATENCIÓN / PROFESIONAL')+
 `<div class="inline-note"><strong>Ficha clínica integrada</strong><span>Selecciona en Sala de espera un paciente asignado a tu cuenta. Al abrir la atención, elige uno de los formatos que Administración te asignó. La ficha reúne identificación, valoración de enfermería y el documento que generes; podrás imprimirlo y quedará guardado en el expediente.</span></div><div class="panel"><div class="panel-head"><div><h3>Consulta asignada</h3><p>Redacta una nota clínica y guárdala como borrador o finalízala con los requisitos de tu especialidad.</p></div></div><div class="actions"><button class="btn primary" id="clinical-open">✚ Abrir consulta asignada</button><button class="btn" id="clinical-history">▣ Ver historial permitido</button><button class="btn ghost" id="clinical-queue">Volver a sala</button></div></div>`;
 $('#clinical-open').onclick=()=>{const v=selectedVisit();if(v)openConsult(v);else toast('Selecciona una visita en Sala de espera.','warning');};$('#clinical-history').onclick=()=>goView('history');$('#clinical-queue').onclick=()=>goView('queue');}
async function loadCustomTemplates(){try{const snap=await getDoc(doc(db,'configuracion','custom_templates'));state.customTemplates=snap.exists()&&snap.data().value&&typeof snap.data().value==='object'?snap.data().value:{};}catch(err){console.warn('No se pudieron cargar formatos personalizados',err);state.customTemplates={};}}
const CLINICAL_FORMATS_COLLECTION='formatos_clinicos';
const LEGACY_FORMAT_MIGRATION_KEY='formatos_catalogo_migrado_v1';
async function ensureLegacyClinicalFormats(){
 const markerRef=doc(db,'configuracion',LEGACY_FORMAT_MIGRATION_KEY),marker=await getDoc(markerRef);
 if(marker.exists()&&marker.data().ownerUid===state.ownerUid)return;
 const existingSnap=await getDocs(query(collection(db,CLINICAL_FORMATS_COLLECTION),where('ownerUid','==',state.ownerUid)));
 const existingIds=new Set(existingSnap.docs.map(d=>d.id));
 const names=Array.from(new Set([...SPECIALTIES,...state.professionals.map(p=>String(p.specialty||'').trim()).filter(Boolean)])).filter(x=>x&&x!=='Enfermería');
 const batch=writeBatch(db),at=nowIso();let writes=0;
 for(const sp of names){
  const id=`legacy_${slugify(sp)}`;if(existingIds.has(id))continue;
  const schema=normaliseClinicalFormatSchema(getTemplateDefinitions(sp));
  batch.set(doc(db,CLINICAL_FORMATS_COLLECTION,id),{ownerUid:state.ownerUid,name:`Historia clínica · ${sp}`,specialty:sp,description:'Formato anterior de BRIMA importado para que Administración pueda asignarlo manualmente.',schema,assigned_professional_ids:[],enable_prescription:sp.toLocaleLowerCase('es-MX')==='medicina',enable_labs:isClinicalActionEnabled(sp,'labs'),enable_professional_plan:false,action_labels:defaultFormatActionLabels(sp),active:true,is_legacy:true,format_schema_version:2,created_by:state.currentUser.uid,created_at:at,updated_at:at});writes++;
 }
 if(writes)await batch.commit();
 if(marker.exists())await updateDoc(markerRef,{ownerUid:state.ownerUid,migrated:true,updated_at:nowIso()});
 else await setDoc(markerRef,{ownerUid:state.ownerUid,migrated:true,created_at:nowIso()});
}
async function loadClinicalFormats(){
 const snap=await getDocs(query(collection(db,CLINICAL_FORMATS_COLLECTION),where('ownerUid','==',state.ownerUid)));
 state.clinicalFormats=snap.docs.map(d=>({id:d.id,...d.data(),schema:normaliseClinicalFormatSchema(d.data().schema),assigned_professional_ids:Array.isArray(d.data().assigned_professional_ids)?d.data().assigned_professional_ids:[],action_labels:formatActionLabels(d.data(),d.data().specialty)})).filter(f=>f.active!==false).sort((a,b)=>String(a.specialty||'').localeCompare(String(b.specialty||''),'es-MX')||String(a.name||'').localeCompare(String(b.name||''),'es-MX'));
 return state.clinicalFormats;
}
async function loadFormatsAssignedToCurrentClinician(){
 if(state.user?.role!=='clinician')return [];
 const snap=await getDocs(query(collection(db,CLINICAL_FORMATS_COLLECTION),where('ownerUid','==',state.ownerUid),where('assigned_professional_ids','array-contains',state.currentUser.uid),where('active','==',true)));
 return snap.docs.map(d=>({id:d.id,...d.data(),schema:normaliseClinicalFormatSchema(d.data().schema),assigned_professional_ids:Array.isArray(d.data().assigned_professional_ids)?d.data().assigned_professional_ids:[],action_labels:formatActionLabels(d.data(),d.data().specialty)})).filter(f=>f.schema.length>0);
}

function startSettingsSubscriptions(){
 if(state.uiSettingsUnsubscribe){state.uiSettingsUnsubscribe();state.uiSettingsUnsubscribe=null;}
 if(state.templatesUnsubscribe){state.templatesUnsubscribe();state.templatesUnsubscribe=null;}
 const owner=state.ownerUid;
 state.uiSettingsUnsubscribe=onSnapshot(doc(db,'configuracion','clinic_ui'),snap=>{
  if(!state.user||state.ownerUid!==owner)return;
  const saved=snap.exists()&&snap.data().ownerUid===owner&&snap.data().value&&typeof snap.data().value==='object'?snap.data().value:{};
  state.uiSettings={...structuredClone(DEFAULT_UI_SETTINGS),...saved,roleColors:{...DEFAULT_UI_SETTINGS.roleColors,...(saved.roleColors||{})},navLabels:{...(saved.navLabels||{})},navOrder:{...(saved.navOrder||{})},clinicalLabels:{...(saved.clinicalLabels||{})},clinicalSchemas:{...(saved.clinicalSchemas||{})},clinicalSchemaComplete:{...(saved.clinicalSchemaComplete||{})},clinicalActions:{...(saved.clinicalActions||{})},actionLabels:{...DEFAULT_UI_SETTINGS.actionLabels,...(saved.actionLabels||{})}};
  applyUiSettings();buildNavigation();
 },err=>console.warn('No se pudo mantener la personalización en tiempo real',err));
 state.templatesUnsubscribe=onSnapshot(doc(db,'configuracion','custom_templates'),snap=>{
  if(!state.user||state.ownerUid!==owner)return;
  state.customTemplates=snap.exists()&&snap.data().ownerUid===owner&&snap.data().value&&typeof snap.data().value==='object'?snap.data().value:{};
  if(state.view==='templates'&&state.user.role==='admin')renderTemplates();
 },err=>console.warn('No se pudieron mantener los formatos en tiempo real',err));
 if(state.documentActionsUnsubscribe){state.documentActionsUnsubscribe();state.documentActionsUnsubscribe=null;}
 state.documentActionsUnsubscribe=onSnapshot(doc(db,'configuracion',DOCUMENT_ACTION_CONFIG_KEY),snap=>{
  if(!state.user||state.ownerUid!==owner)return;
  state.documentActionSettings=snap.exists()&&snap.data().ownerUid===owner?normalizeDocumentActionSettings(snap.data().value):normalizeDocumentActionSettings({});
 },err=>console.warn('No se pudo mantener el catálogo de documentos en tiempo real',err));
}

function getTemplateDefinitions(specialty){
 const labels=state.uiSettings?.clinicalLabels?.[specialty]||{};
 const saved=state.uiSettings?.clinicalSchemas?.[specialty];
 let source=[];
 if(Array.isArray(saved)&&saved.length){source=saved.map(f=>({...f,options:Array.isArray(f.options)?f.options.map(o=>({...o})):[]}));}
 else if(specialty==='Medicina'){
  source=(TEMPLATES.Medicina||[]).map(([key,label])=>({key,label,type:'textarea',group:'Formulario clínico · Medicina',icon:'📝',options:[],required:false,placeholder:''}));
 }else{
  const seed=DEFAULT_CLINICAL_SCHEMAS[specialty]||DEFAULT_CLINICAL_SCHEMAS['Otro / personalizado'];
  source=seed.map(f=>({...f,options:(f.options||[]).map(o=>({...o}))}));
  const legacy=Array.isArray(state.customTemplates?.[specialty])?state.customTemplates[specialty]:[];
  for(const item of legacy){const key=Array.isArray(item)?String(item[0]):String(item?.key||slugify(item?.label||''));const label=Array.isArray(item)?String(item[1]):String(item?.label||item?.key||'');if(key&&label&&!source.some(f=>f.key===key))source.push({key,label,type:'textarea',group:'Campos adicionales',icon:'➕',options:[],required:false,placeholder:''});}
 }
 if(specialty==='Nutrición'){
  const legacyPlan=source.find(f=>f.key==='n_plan_alimentario');
  const isLegacyNutrition=state.uiSettings?.clinicalSchemaComplete?.[specialty]!==true || (legacyPlan && legacyPlan.type!=='foodplan');
  if(isLegacyNutrition){
   // Migra notas antiguas de Nutrición a una tabla de seis opciones. Una estructura completa ya guardada
   // por Administración se respeta, salvo que aún conserve el campo antiguo de texto libre.
   if(legacyPlan)Object.assign(legacyPlan,{type:'foodplan',group:'Plan de intervención',label:legacyPlan.label||'Plan alimentario · opciones por tiempo de comida'});
   source=source.filter(f=>!['n_suplementacion','n_metas_seguimiento'].includes(f.key));
   if(!legacyPlan && state.uiSettings?.clinicalSchemaComplete?.[specialty]!==true)source.push(schemaField('n_plan_alimentario','Plan alimentario · opciones por tiempo de comida','foodplan','Plan de intervención','🥗',[],true));
  }
 }
 // En plantillas previas, agrega los apartados comunes de forma retrospectiva; cuando el administrador
 // guarda la estructura completa, la lista guardada es la autoridad y puede eliminar esos campos.
 if(state.uiSettings?.clinicalSchemaComplete?.[specialty]!==true){
  for(const f of COMMON_CLINICAL_SCHEMA_FIELDS){if(!source.some(x=>x.key===f.key))source.push({...f,options:(f.options||[]).map(o=>({...o}))});}
 }
 let defs=source.map((raw,i)=>{
  const f=raw&&typeof raw==='object'?raw:{};
  const key=String(f.key||`campo_${i+1}`),label=String((Array.isArray(saved)?f.label:(labels[key]||f.label))||key);
  const type=['textarea','text','number','date','choice','chips','scale','foodfreq','foodplan'].includes(f.type)?f.type:'textarea';
  const options=Array.isArray(f.options)?f.options.map(o=>Array.isArray(o)?{label:String(o[0]||''),icon:String(o[1]||'🔹')}:{label:String(o?.label||o?.value||''),icon:String(o?.icon||'🔹')}).filter(o=>o.label):[];
  return {key,label,type,group:String(f.group||'Historia clínica'),icon:String(f.icon||'📝'),options,required:!!f.required,include_in_professional_plan:f.include_in_professional_plan===true,placeholder:String(f.placeholder||''),min:Number.isFinite(Number(f.min))?Number(f.min):0,max:Number.isFinite(Number(f.max))?Number(f.max):10};
 });
 const order=state.uiSettings?.clinicalOrder?.[specialty];
 if(!Array.isArray(saved)&&Array.isArray(order)&&order.length){const rank=new Map(order.map((k,i)=>[String(k),i]));defs=defs.map((f,i)=>({f,i,r:rank.has(f.key)?rank.get(f.key):Number.MAX_SAFE_INTEGER})).sort((a,b)=>a.r-b.r||a.i-b.i).map(x=>x.f);}
 return defs;
}

function getTemplateSet(specialty){return getTemplateDefinitions(specialty).map(f=>[f.key,f.label]);}
async function chooseClinicalFormatForVisit(visit,patient,triage,specialty,{drafts=[],prefill=null,mode='full'}={}){
 let formats=[];
 try{formats=await loadFormatsAssignedToCurrentClinician();}
 catch(err){console.error(err);toast('No se pudieron consultar tus formatos asignados. '+friendlyError(err),'error',8000);return;}
 if(!formats.length){toast('No tienes formatos asignados. Solicita a Administración que te asigne uno o varios formatos desde “Personalizar formatos clínicos”.','warning',10000);return;}
 const options=formats.map(f=>`<option value="${esc(f.id)}">${esc(f.name)} · ${esc(f.specialty||'General')}</option>`).join('');
 openModal(`Seleccionar formato · ${patientName(patient)}`,`<p class="muted">Elige qué documento vas a elaborar para este paciente. Solo aparecen los formatos que Administración te asignó; puedes tener varios, aunque compartas especialidad con otros profesionales.</p><div class="form-field"><label>Formato a utilizar *</label><select name="format_id" required>${options}</select></div><div class="inline-note"><strong>El expediente conservará el documento</strong><span>El formato, sus respuestas y el nombre con el que se generó quedarán guardados en el expediente del paciente. El documento se puede imprimir o guardar como PDF.</span></div>`,{buttons:[{action:'cancel',label:'Cancelar'},{action:'use_format',label:'Usar formato',primary:true}],onAction:async(action,fd)=>{
  if(action!=='use_format')return true;
  const selected=formats.find(f=>f.id===String(fd.get('format_id')||''));if(!selected){toast('Selecciona un formato válido.','warning');return false;}
  let existing=prefill;
  if(!existing){
   const matches=drafts.filter(d=>d.visit_id===visit.id&&(d.payload?.format_id===selected.id||(!d.payload?.format_id&&selected.is_legacy&&String(d.specialty||'')===specialty))).sort((a,b)=>String(b.updated_at||b.created_at||'').localeCompare(String(a.updated_at||a.created_at||'')));
   if(matches.length&&confirm(`Ya existe un borrador para este formato (${selected.name}). ¿Deseas continuar desde donde quedó?`))existing=matches[0];
  }
  closeModal('format-selected');queueMicrotask(()=>openNoteEditor(visit,patient,triage,existing,specialty,mode,false,selected));return false;
 }});
}
async function openConsult(visit){
 if(state.user.role!=='clinician'){toast('Se requiere una cuenta de profesional clínico.','warning');return;}
 if(!['Consulta','En atención'].includes(visit.status)){toast('La visita debe estar primero en estado “Paciente listo para consulta”.','warning');return;}
 const specialty=String(state.user.profile?.specialty||'').trim();if(!specialty||specialty.toLocaleLowerCase('es-MX')!==String(visit.service_specialty||'').toLocaleLowerCase('es-MX')){toast('La especialidad de tu perfil no coincide con el servicio asignado. Contacta a Recepción o al administrador.','error');return;}
 if(state.openingConsultVisitId===visit.id)return;state.openingConsultVisitId=visit.id;
 try{
  const patientDoc=await loadPatientDoc(visit.patient_id);if(!patientDoc||patientDoc._restricted)throw new Error('No tienes acceso vigente al expediente.');
  if(visit.interconsultation_request_id){const gs=await getDoc(doc(db,'paciente_accesos',`${visit.patient_id}__${state.currentUser.uid}`));if(!gs.exists()||gs.data().active!==true||gs.data().request_id!==visit.interconsultation_request_id)throw new Error('La autorización de interconsulta ya no está vigente.');}
  let triage=null;try{triage=await getTriage(visit.id);}catch(err){console.warn('Valoración de enfermería no disponible para esta cuenta',err);}
  const ds=await getDocs(query(collection(db,'consultas'),where('ownerUid','==',state.ownerUid),where('patient_id','==',visit.patient_id),where('specialty','==',specialty),where('author_id','==',state.currentUser.uid),where('status','==','draft')));
  const drafts=ds.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.visit_id===visit.id);
  await chooseClinicalFormatForVisit(visit,patientDoc.payload,triage,specialty,{drafts});
 }catch(err){console.error(err);toast('No se pudo abrir la consulta. '+friendlyError(err),'error',8000);}finally{if(state.openingConsultVisitId===visit.id)state.openingConsultVisitId='';}
}
function triageSummary(t){const p=t?.payload||{};const rows=[['weight_kg','Peso kg'],['height_cm','Talla cm'],['bmi','IMC'],['temperature_c','Temp °C'],['hr','FC'],['rr','FR'],['bp_sys','TA sistólica'],['bp_dia','TA diastólica'],['spo2','SpO₂'],['pain','Dolor']].filter(([k])=>p[k]!==undefined&&p[k]!==null&&p[k]!=='').map(([k,l])=>`${l}: ${p[k]}`);return rows.join(' · ');}
function prescriptionEditorRow(m={}){
 const value=(...keys)=>{for(const k of keys){if(m[k]!==undefined&&m[k]!==null)return String(m[k]);}return '';};
 return `<div class="rx-editor-row"><label>Medicamento<input name="rx_name" value="${esc(value('name','medicamento','m'))}" placeholder="Nombre y presentación"></label><label>Dosis<input name="rx_dose" value="${esc(value('dose','dosis','d'))}" placeholder="Dosis"></label><label>Vía<input name="rx_route" value="${esc(value('route','via'))}" placeholder="Vía"></label><label>Frecuencia<input name="rx_frequency" value="${esc(value('frequency','frecuencia'))}" placeholder="Cada cuánto"></label><label>Duración<input name="rx_duration" value="${esc(value('duration','duracion'))}" placeholder="Días / semanas"></label><label>Indicaciones<input name="rx_instructions" value="${esc(value('instructions','indicaciones'))}" placeholder="Indicaciones adicionales"></label><button type="button" class="rx-remove" data-rx-remove aria-label="Quitar medicamento" title="Quitar medicamento">×</button></div>`;
}
function bindMedicationEditor(root){
 root.addEventListener('click',e=>{
  const add=e.target.closest('[data-rx-add]');if(add){const rows=$('#rx-editor-rows',root);if(rows)rows.insertAdjacentHTML('beforeend',prescriptionEditorRow());return;}
  const remove=e.target.closest('[data-rx-remove]');if(remove){const rows=$('#rx-editor-rows',root);const row=remove.closest('.rx-editor-row');if(!row||!rows)return;if(rows.children.length>1)row.remove();else row.querySelectorAll('input').forEach(input=>input.value='');}
 });
}
function renderSpecialtyField(field,prior){
 const key=field.key,name=`field_${key}`,saved=prior[key],required=field.required?'required':'',icon=field.icon?`<span class="schema-field-icon" aria-hidden="true">${esc(field.icon)}</span>`:'';
 const optionHtml=(o,kind,checked)=>`<label class="schema-choice-chip ${checked?'selected':''}"><input type="${kind}" name="${esc(name)}" value="${esc(o.label)}" ${checked?'checked':''} ${kind==='radio'&&required?'required':''}><span class="schema-choice-icon" aria-hidden="true">${esc(o.icon||'🔹')}</span><span>${esc(o.label)}</span></label>`;
 let control='';
 if(field.type==='chips'){
  const selected=Array.isArray(saved)?saved:(saved?[String(saved)]:[]);
  control=field.options.length?`<div class="schema-choice-grid">${field.options.map(o=>optionHtml(o,'checkbox',selected.includes(o.label))).join('')}</div>`:`<textarea name="${esc(name)}" rows="3">${esc(Array.isArray(saved)?saved.join(', '):saved||'')}</textarea>`;
 }else if(field.type==='choice'){
  control=field.options.length?`<div class="schema-choice-grid">${field.options.map(o=>optionHtml(o,'radio',String(saved||'')===o.label)).join('')}</div>`:`<input name="${esc(name)}" type="text" value="${esc(saved||'')}" ${required}>`;
 }else if(field.type==='scale'){
  const v=saved!==undefined&&saved!==''?Number(saved):field.min;
  control=`<div class="schema-scale-control"><input name="${esc(name)}" type="range" min="${field.min}" max="${field.max}" step="1" value="${Number.isFinite(v)?v:field.min}" oninput="this.nextElementSibling.value=this.value"><output>${Number.isFinite(v)?v:field.min}</output><span>${field.min}–${field.max}</span></div>`;
 }else if(field.type==='foodfreq'){
  const freqMap={};String(saved||'').split(/\r?\n/).forEach(line=>{const ix=line.indexOf(':');if(ix>0)freqMap[line.slice(0,ix).trim()]=line.slice(ix+1).replace(/[^0-7]/g,'').trim();});
  control=`<div class="schema-food-frequency">${field.options.map((o,i)=>`<label><span>${esc(o.icon||'🍽️')} ${esc(o.label)}</span><select name="${esc(name)}_${i}"><option value="">—</option>${Array.from({length:8},(_,n)=>`<option value="${n}" ${freqMap[o.label]===String(n)?'selected':''}>${n}</option>`).join('')}</select></label>`).join('')}</div><small class="hint">Veces por semana (0 a 7).</small>`;
 }else if(field.type==='foodplan'){
  const plan=saved&&typeof saved==='object'?saved:{};const meals=['desayuno','almuerzo','comida','colacion','cena'];const labels=['Desayuno','Almuerzo','Comida','Colación','Cena'];
  const cell=(meal,i)=>esc(plan.meals?.[meal]?.[i]||'');
  control=`<div class="nutrition-plan-edit-wrap"><table class="nutrition-plan-edit"><thead><tr><th>PLAN ALIMENTARIO</th>${Array.from({length:6},(_,i)=>`<th>OPCIÓN ${i+1}</th>`).join('')}</tr></thead><tbody>${meals.map((meal,ri)=>`<tr><th>${labels[ri]}</th>${Array.from({length:6},(_,i)=>`<td><textarea name="${esc(name)}_${meal}_${i}" rows="2" placeholder="Alimentos / porción">${cell(meal,i)}</textarea></td>`).join('')}</tr>`).join('')}<tr><th>Suplementación nutricional</th><td colspan="6"><textarea name="${esc(name)}_supplementation" rows="2" placeholder="Producto, porción, frecuencia, duración y precauciones">${esc(plan.supplementation||'')}</textarea></td></tr><tr><th>Metas, seguimiento y próxima revaloración</th><td colspan="6"><textarea name="${esc(name)}_goals" rows="3" placeholder="Metas, seguimiento y fecha de revaloración">${esc(plan.goals||'')}</textarea></td></tr></tbody></table></div>`;
 }else if(field.type==='textarea'){
  control=`<textarea name="${esc(name)}" rows="3" placeholder="${esc(field.placeholder)}" ${required}>${esc(saved||'')}</textarea>`;
 }else{
  const type=['text','number','date'].includes(field.type)?field.type:'text';
  control=`<input name="${esc(name)}" type="${type}" value="${esc(saved??'')}" placeholder="${esc(field.placeholder)}" ${type==='number'?'step="any" min="0"':''} ${required}>`;
 }
 return `<div class="schema-clinical-field ${field.type==='chips'||field.type==='choice'?'schema-clinical-field-wide':''}"><label class="schema-clinical-label">${icon}<span>${esc(field.label)}${field.required?' *':''}</span></label>${field.group?`<span class="schema-field-group">${esc(field.group)}</span>`:''}${control}</div>`;
}
function renderSpecialtyFieldsHtml(definitions,prior){
 let lastGroup=null;return definitions.map(f=>{const heading=f.group&&f.group!==lastGroup?`<div class="divider-label schema-section-heading">${esc(f.group)}</div>`:'';lastGroup=f.group;return heading+renderSpecialtyField(f,prior);}).join('');
}
function openNoteEditor(visit,patient,triage,existing,specialty,mode='full',editExisting=false,format=null){
 const savedSchema=existing?.payload?.format_schema_snapshot;
 const hasSelectedFormat=!!(format&&typeof format==='object');
 const hasFormatSchema=hasSelectedFormat&&Array.isArray(format.schema);
 const schemaSource=hasFormatSchema?format.schema:(savedSchema?.length?savedSchema:getTemplateDefinitions(specialty));
 const formatSchema=normaliseClinicalFormatSchema(schemaSource);
 if(hasFormatSchema&&!formatSchema.length){toast('Este formato no contiene campos. Pide a Administración que agregue al menos un campo antes de utilizarlo.','error',8000);return;}
 const allDefinitions=formatSchema.length?formatSchema:(hasSelectedFormat?[]:getTemplateDefinitions(specialty));
 const formatName=String(format?.name||existing?.payload?.format_name||`Historia clínica · ${specialty}`);
 const formatId=String(format?.id||existing?.payload?.format_id||'');
 const enablePrescription=format?format.enable_prescription===true:(String(specialty||'').trim().toLocaleLowerCase('es-MX')==='medicina');
 const labsEnabled=format?format.enable_labs===true:isClinicalActionEnabled(specialty,'labs');
 const professionalPlanEnabled=format?.enable_professional_plan===true;
 const formatActions=formatActionLabels(format,specialty);
 const savedActionSettings=normalizeDocumentActionSettings(state.documentActionSettings);const hasCurrentFormatActionConfig=Object.prototype.hasOwnProperty.call(savedActionSettings.formats,formatId);const customDocumentActions=hasCurrentFormatActionConfig?getFormatDocumentActions(formatId):(Array.isArray(existing?.payload?.document_actions_snapshot)?existing.payload.document_actions_snapshot:[]);
 const specialtyDefinitions=mode==='ambulatory'?allDefinitions.filter(f=>!['antecedentes_seleccionados','antecedentes_seleccionados_otro','antecedentes_heredofamiliares','antecedentes_gineco_obstetricos','otras_observaciones','alergias_seleccionadas','alergias_detalle'].includes(f.key)):allDefinitions;
 const specialtyFields=specialtyDefinitions.map(f=>[f.key,f.label]);
 const specialtyDefinitionMap=new Map(specialtyDefinitions.map(f=>[f.key,f]));
 const savedFields=existing?.payload?.fields||{};
 const historyBackup=existing?.payload?.history_backup||{};
 const prior={...historyBackup,...savedFields};
 const formFields=specialtyFields;
 const currentType=editExisting?(existing?.payload?.note_type||existing?.kind||'Primera vez'):(existing?.payload?.note_type||(formatId?formatName:(mode==='ambulatory'?'Consulta ambulatoria':'Primera vez')));
 const triagePayload=triage?.payload||existing?.payload?.triage_snapshot||{};
 const identityFields=PATIENT_FIELDS.map(([key,label])=>`<div class="form-field"><label>${esc(label)}</label><div class="note-preview">${esc(patient[key]||'—')}</div></div>`).join('');
 const recordedSomatometry=SOMATOMETRY_FIELDS.filter(([key])=>triagePayload[key]!==undefined&&triagePayload[key]!==null&&triagePayload[key]!=='');
 const triageFields=recordedSomatometry.map(([key,label])=>`<div class="form-field"><label>${esc(label)}</label><div class="note-preview">${esc(triagePayload[key])}</div></div>`).join('')+(triagePayload.bmi!==undefined&&triagePayload.bmi!==null&&triagePayload.bmi!==''?`<div class="form-field"><label>IMC</label><div class="note-preview">${esc(triagePayload.bmi)}</div></div>`:'')||'<div class="form-field span-2"><div class="note-preview">No hay somatometría registrada todavía.</div></div>';
 const specialtyFieldsHtml=`<div class="divider-label" style="margin:18px 0 10px">${esc(formatName)}</div><div class="schema-clinical-grid">${renderSpecialtyFieldsHtml(specialtyDefinitions,prior)}</div>`;

 const savedMeds=Array.isArray(prior.medicamentos_receta)?prior.medicamentos_receta:[];
 const medicationRows=savedMeds.length?savedMeds:[{}];
 const isMedicineSpecialty=enablePrescription;
 const medicationEditorHtml=isMedicineSpecialty?`<section class="rx-editor-section"><div class="rx-editor-head"><div><h3>Medicamentos de la receta</h3><p>Captura por separado medicamento, dosis, vía, frecuencia y duración.</p></div><button type="button" class="btn small" data-rx-add>＋ Agregar medicamento</button></div><div id="rx-editor-rows">${medicationRows.map(m=>prescriptionEditorRow(m)).join('')}</div></section>`:'';
 const recommendationsHtml=`<section class="rx-editor-section recommendations-section"><div class="rx-editor-head"><div><h3>Indicaciones y recomendaciones</h3><p>Incluye estudios solicitados y recomendaciones para el paciente.</p></div></div><label class="form-field">${esc(state.uiSettings?.clinicalLabels?.[specialty]?.laboratorio_orden||'Laboratorio / gabinete')}<textarea name="field_laboratorio_orden" rows="3" placeholder="Un estudio por línea…">${fieldVal(prior,'laboratorio_orden')||fieldVal(prior,'laboratorio')||fieldVal(prior,'estudios')}</textarea></label><label class="form-field">${esc(state.uiSettings?.clinicalLabels?.[specialty]?.otras_indicaciones_recomendaciones||'Otras indicaciones y recomendaciones')}<textarea name="field_otras_indicaciones_recomendaciones" rows="3" placeholder="Cuidados, recomendaciones, preparación y seguimiento…">${fieldVal(prior,'otras_indicaciones_recomendaciones')||fieldVal(prior,'indicaciones')}</textarea></label></section>`;
 const body=`<div class="profile-block"><div class="avatar">${esc(initials(patientName(patient)))}</div><div><h3>${esc(patientName(patient))}</h3><p>Folio BRIMA ${esc(shortId(visit.patient_id))} · ${esc(visit.service_specialty)} · ${esc(formatName)} · ${esc(statusLabel(visit.status))}</p><p class="autosave-indicator" id="note-autosave-status">${editExisting?'Edición de una nota existente · se conservará el mismo registro':'Guardado automático activado'}</p></div></div>${mode==='ambulatory'?'<div class="inline-note"><strong>Consulta ambulatoria</strong><span>Los antecedentes médicos se conservan en el expediente y no se muestran en este formulario.</span></div>':''}<details open><summary class="divider-label">Datos del paciente</summary><div class="form-grid">${identityFields}</div></details><details open><summary class="divider-label">Somatometría y signos vitales</summary><div class="form-grid">${triageFields}</div></details>${specialtyFieldsHtml}${medicationEditorHtml}<div class="inline-note warning-note" style="margin-top:15px"><strong>Responsabilidad profesional</strong><span>Revisa que la nota corresponda a la atención real. Las notas finalizadas quedan bloqueadas; las correcciones deben registrarse mediante adenda.</span></div>`;
 const draftId=existing?.id||crypto.randomUUID();
 let saveChain=Promise.resolve();let autosaveTimer=null;let editorForm=null;let suppressAutosave=false;let lastSavedFingerprint=existing?.status==='draft'?stableStringify({fields:existing.payload?.fields||{},history_backup:existing.payload?.history_backup||{},note_type:existing.payload?.note_type||currentType,mode}):'';
 function buildNoteData(fd,status='draft'){
  // The selected format is the sole source of editable/printable fields.
  // Do not carry stale answers from a different or older schema into this document.
  const fieldsObj=Object.fromEntries(Object.entries(savedFields).filter(([key])=>specialtyDefinitionMap.has(key)));
  if(mode==='ambulatory'){
   for(const [key] of MEDICAL_HISTORY_FIELDS)delete fieldsObj[key];
   delete fieldsObj.antecedentes_seleccionados;delete fieldsObj.antecedentes_seleccionados_otro;
  }
  for(const [key] of formFields){const def=specialtyDefinitionMap.get(key);if(def?.type==='chips')fieldsObj[key]=fd.getAll(`field_${key}`).map(String);else if(def?.type==='foodfreq')fieldsObj[key]=(def.options||[]).map((o,i)=>{const n=String(fd.get(`field_${key}_${i}`)||'').trim();return n?`${o.label}: ${n} veces/semana`:'';}).filter(Boolean).join('\n');else if(def?.type==='foodplan'){const meals={};for(const meal of ['desayuno','almuerzo','comida','colacion','cena'])meals[meal]=Array.from({length:6},(_,i)=>String(fd.get(`field_${key}_${meal}_${i}`)||'').trim());fieldsObj[key]={meals,supplementation:String(fd.get(`field_${key}_supplementation`)||'').trim(),goals:String(fd.get(`field_${key}_goals`)||'').trim()};}else fieldsObj[key]=String(fd.get(`field_${key}`)||'').trim();}
  if(isMedicineSpecialty){
   const rxNames=fd.getAll('rx_name');
   const rxMeds=rxNames.map((name,i)=>({name:String(name||'').trim(),dose:String(fd.getAll('rx_dose')[i]||'').trim(),route:String(fd.getAll('rx_route')[i]||'').trim(),frequency:String(fd.getAll('rx_frequency')[i]||'').trim(),duration:String(fd.getAll('rx_duration')[i]||'').trim(),instructions:String(fd.getAll('rx_instructions')[i]||'').trim()})).filter(m=>m.name);
   fieldsObj.medicamentos_receta=rxMeds;fieldsObj.medicamentos=rxMeds.map(m=>[m.name,m.dose,m.route,m.frequency,m.duration,m.instructions].filter(Boolean).join(' · ')).join('\n');
  }else{
   delete fieldsObj.medicamentos_receta;delete fieldsObj.medicamentos;
  }
  const noteType=currentType;
  const carriedHistory={...historyBackup};
  for(const [key] of MEDICAL_HISTORY_FIELDS){if(fieldsObj[key]!==undefined)carriedHistory[key]=fieldsObj[key];else if(prior[key]!==undefined)carriedHistory[key]=prior[key];}
  if(mode==='full'){
   // Un formato personalizado o una nota de evolución puede no incluir estos campos.
   // No copiar undefined al respaldo: conserva el dato previo cuando exista y, si no, lo omite.
   if(fieldsObj.antecedentes_seleccionados!==undefined)carriedHistory.antecedentes_seleccionados=fieldsObj.antecedentes_seleccionados;
   else if(prior.antecedentes_seleccionados!==undefined)carriedHistory.antecedentes_seleccionados=prior.antecedentes_seleccionados;
   if(fieldsObj.antecedentes_seleccionados_otro!==undefined)carriedHistory.antecedentes_seleccionados_otro=fieldsObj.antecedentes_seleccionados_otro;
   else if(prior.antecedentes_seleccionados_otro!==undefined)carriedHistory.antecedentes_seleccionados_otro=prior.antecedentes_seleccionados_otro;
  }else{
   if(prior.antecedentes_seleccionados!==undefined)carriedHistory.antecedentes_seleccionados=prior.antecedentes_seleccionados;
   if(prior.antecedentes_seleccionados_otro!==undefined)carriedHistory.antecedentes_seleccionados_otro=prior.antecedentes_seleccionados_otro;
  }
  const fieldLabels=Object.fromEntries(specialtyDefinitions.map(f=>[f.key,f.label]));
  const fieldOrder=[...specialtyDefinitions.map(f=>f.key),'medicamentos_receta'];
  const at=nowIso();
  const payload=stripUndefinedDeep({note_type:noteType,format_id:formatId,format_name:formatName,format_schema_snapshot:specialtyDefinitions.map(f=>({...f,options:(f.options||[]).map(o=>({...o}))})),document_actions_snapshot:customDocumentActions.map(item=>({catalogId:item.catalogId,name:item.name,buttonLabel:item.buttonLabel,documentTitle:item.documentTitle,fieldKeys:[...(item.fieldKeys||[])],includePatientIdentity:item.includePatientIdentity!==false,includeSomatometry:item.includeSomatometry===true,includeProfessionalSignature:item.includeProfessionalSignature!==false,showGroups:item.showGroups!==false})),enable_prescription:enablePrescription,enable_labs:labsEnabled,enable_professional_plan:professionalPlanEnabled,action_labels:formatActions,fields:fieldsObj,field_labels:fieldLabels,field_groups:Object.fromEntries(specialtyDefinitions.map(f=>[f.key,f.group||'Historia clínica'])),field_order:fieldOrder,schema_version:3,note_mode:mode,history_backup:carriedHistory,patient_snapshot:{...patient},triage_snapshot:triagePayload,patient_id:visit.patient_id,visit_id:visit.id,specialty,professional:state.user.profile||{},author_username:state.user.username||state.user.email||'',generated_at:at,app_version:'0.3.18'});
  const data=stripUndefinedDeep({ownerUid:state.ownerUid,patient_id:visit.patient_id,visit_id:visit.id,kind:noteType,specialty,author_id:state.currentUser.uid,assigned_professional_id:visit.assigned_professional_id||state.currentUser.uid,interconsultation_request_id:String(visit.interconsultation_request_id||''),created_at:existing?.created_at||at,updated_at:at,finalized_at:status==='finalized'?at:'',status,payload,content_hash:''});
  const fingerprint=stableStringify(stripUndefinedDeep({fields:fieldsObj,history_backup:carriedHistory,note_type:noteType,format_id:formatId,mode}));
  return {id:draftId,data,fieldsObj:data.payload.fields,carriedHistory:data.payload.history_backup,noteType,fingerprint};
 }
 async function persistDraft(fd,{silent=true}={}){
  if(editExisting||suppressAutosave)return existing;
  const built=buildNoteData(fd,'draft');
  const task=saveChain.then(async()=>{
   if(lastSavedFingerprint===built.fingerprint&&existing?.status==='draft')return existing;
   await setDoc(doc(db,'consultas',draftId),built.data);
   lastSavedFingerprint=built.fingerprint;existing={...built.data,id:draftId,_localFingerprint:built.fingerprint};
   const status=$('#note-autosave-status');if(status&&status.isConnected)status.textContent=`Borrador guardado · ${new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}`;
   if(!silent)toast('Borrador guardado automáticamente en Firestore.');
   return existing;
  });
  saveChain=task.catch(err=>{console.warn('No se pudo guardar automáticamente el borrador clínico',err);const status=$('#note-autosave-status');if(status&&status.isConnected)status.textContent='No se pudo sincronizar el borrador; revisa tu conexión.';if(!silent)toast('No se pudo guardar el borrador. '+friendlyError(err),'error',7000);});
  return task;
 }
 openModal(`${formatName} · ${esc(specialty)}`,body,{
  size:'clinical',
  buttons:editExisting?[{action:'cancel',label:'Cancelar'},{action:'edit_save',label:'Guardar cambios en este mismo documento',primary:true}]:[{action:'start',label:visit.status==='En atención'?'✓ Consulta iniciada':(state.uiSettings?.actionLabels?.start||'Iniciar consulta'),disabled:visit.status!=='Consulta'}, {action:'finalize',label:formatGenerateButtonLabel(formatName),primary:true},...(enablePrescription?[{action:'recipe',label:formatActions.prescription}]:[]),...(labsEnabled?[{action:'labs',label:formatActions.labs}]:[]),...(professionalPlanEnabled?[{action:'professional_plan',label:formatActions.professional_plan}]:[]),...customDocumentActions.map(item=>({action:`custom_document:${item.catalogId}`,label:item.buttonLabel})),{action:'finish_visit',label:state.uiSettings?.actionLabels?.finish_visit||'Finalizar consulta',disabled:visit.status!=='En atención'}],
  afterOpen:root=>{
   editorForm=$('#active-modal-form',root);
   const allergyChecks=$$('input[name="allergy_option"]',root);
   allergyChecks.forEach(chk=>chk.addEventListener('change',()=>{if(chk.value==='Ninguna conocida'&&chk.checked)allergyChecks.forEach(other=>{if(other!==chk)other.checked=false;});else if(chk.checked){const none=allergyChecks.find(x=>x.value==='Ninguna conocida');if(none)none.checked=false;}}));
   bindMedicationEditor(root);
   const scheduleSave=()=>{if(suppressAutosave||!editorForm)return;clearTimeout(autosaveTimer);autosaveTimer=setTimeout(()=>{if(editorForm?.isConnected)persistDraft(new FormData(editorForm),{silent:true}).catch(()=>{});},650);};
   if(!editExisting){editorForm.addEventListener('input',scheduleSave);editorForm.addEventListener('change',scheduleSave);}
  },
  onClose:()=>{clearTimeout(autosaveTimer);if(editExisting||suppressAutosave||!editorForm?.isConnected)return;try{const snapshot=new FormData(editorForm);persistDraft(snapshot,{silent:false}).catch(()=>{});}catch(err){console.warn('No se pudo preparar el guardado de cierre',err);}},
  onAction:async(action,fd)=>{
   if(action==='started_status')return false;
   if(action==='edit_save'&&editExisting){
    const reason=prompt('Motivo de la corrección de este documento clínico (se guardará en el historial de revisiones):');
    if(reason===null)return false;if(!reason.trim()){toast('Escribe el motivo de la corrección.','warning');return false;}
    const freshSnap=await getDoc(doc(db,'consultas',draftId));if(!freshSnap.exists())throw new Error('La nota original ya no existe.');
    const fresh={id:freshSnap.id,...freshSnap.data()};
    if(fresh.author_id!==state.currentUser.uid||fresh.assigned_professional_id!==state.currentUser.uid||String(fresh.interconsultation_request_id||''))throw new Error('Solo el autor responsable puede editar esta nota y no se permite editar historias recibidas por interconsulta.');
    const builtEdit=buildNoteData(fd,fresh.status||'draft'),at=nowIso(),revisionId=crypto.randomUUID();
    builtEdit.data.created_at=fresh.created_at||builtEdit.data.created_at;builtEdit.data.status=fresh.status;builtEdit.data.finalized_at=fresh.finalized_at||'';
    builtEdit.data.payload={...builtEdit.data.payload,generated_at:fresh.payload?.generated_at||builtEdit.data.payload.generated_at,edited_at:at};
    builtEdit.data.content_hash=fresh.status==='finalized'?await sha256Text(stableStringify(builtEdit.data.payload)):fresh.content_hash||'';
    const revision={ownerUid:state.ownerUid,encounter_id:draftId,patient_id:fresh.patient_id,author_id:state.currentUser.uid,assigned_professional_id:state.currentUser.uid,specialty:fresh.specialty||specialty,revision_reason:reason.trim().slice(0,1000),previous_payload:fresh.payload||{},new_payload:builtEdit.data.payload,previous_status:fresh.status||'draft',created_at:at};
    const batch=writeBatch(db);batch.set(doc(db,'consultas_revisiones',revisionId),revision);batch.update(doc(db,'consultas',draftId),{payload:builtEdit.data.payload,kind:builtEdit.data.kind,specialty:builtEdit.data.specialty,updated_at:at,last_revision_id:revisionId,revision_count:Number(fresh.revision_count||0)+1,content_hash:builtEdit.data.content_hash});
    await batch.commit();await writeAudit('EDITAR_HISTORIA_CLINICA_EXISTENTE',fresh.patient_id,draftId);suppressAutosave=true;closeModal('edit-existing-note');toast('La misma historia clínica fue actualizada. Se conservó la versión anterior en el historial de revisiones.');return true;
   }
   if(action==='start'){
    await persistDraft(fd,{silent:true});
    if(visit.status==='En atención')return false;
    if(visit.status!=='Consulta'){toast('La visita ya no está lista para iniciar una consulta. Actualiza la sala de espera.','warning');return false;}
    const atStart=nowIso(),fresh=await loadVisitDoc(visit.id);if(!fresh||fresh.status!=='Consulta')throw new Error('El estado de la visita cambió en otro equipo. Actualiza la sala antes de continuar.');
    const startBatch=writeBatch(db);startBatch.update(doc(db,'visitas',visit.id),{status:'En atención',updated_at:atStart});addRoomSummaryToBatch(startBatch,visit.id,{...fresh,status:'En atención',updated_at:atStart});await startBatch.commit();visit={...visit,status:'En atención',updated_at:atStart};
    const startedBtn=$('[data-modal-action="start"]');if(startedBtn){startedBtn.dataset.modalAction='started_status';startedBtn.textContent='✓ Consulta iniciada';startedBtn.classList.add('start-complete');startedBtn.disabled=true;startedBtn.dataset.permanentlyDisabled='true';}
    const finishBtn=$('[data-modal-action="finish_visit"]');if(finishBtn){finishBtn.disabled=false;delete finishBtn.dataset.permanentlyDisabled;}
    await loadQueue(true);await renderQueueContent();await writeAudit('INICIAR_CONSULTA_ESPECIALISTA',visit.patient_id,visit.id);toast('Consulta iniciada. El estado compartido cambió a “En atención”.');return false;
   }
   const built=buildNoteData(fd,'draft');
   if(action==='finish_visit'){
    await persistDraft(fd,{silent:true});
    if(visit.status!=='En atención'){toast('Primero debes pulsar “Iniciar consulta”.','warning');return false;}
    if(!confirm('¿Finalizar la atención de este paciente? El borrador se conservará y la visita saldrá de “En consulta”.'))return false;
    const fresh=await loadVisitDoc(visit.id);if(!fresh||fresh.status!=='En atención')throw new Error('La visita ya no figura como En atención. Actualiza la sala.');
    const closedAt=nowIso(),finishBatch=writeBatch(db);finishBatch.update(doc(db,'visitas',visit.id),{status:'Atendido',updated_at:closedAt,closed_at:closedAt,finished_by:state.currentUser.uid});addRoomSummaryToBatch(finishBatch,visit.id,{...fresh,status:'Atendido',updated_at:closedAt,closed_at:closedAt,finished_by:state.currentUser.uid});await finishBatch.commit();await writeAudit('FINALIZAR_CONSULTA',visit.patient_id,visit.id);suppressAutosave=true;closeModal('finish-visit');await loadQueue(true);await renderQueueContent();toast('Consulta finalizada. El paciente salió de “En consulta” y el profesional volvió a estar disponible.');return false;
   }
   if(action==='recipe'){if(!enablePrescription){toast('La receta no está habilitada para este formato.','warning');return false;}const saved=await persistDraft(fd,{silent:true});openPrescriptionPrint(saved||{...built.data,id:draftId},patient);return false;}
   if(action==='labs'){if(!labsEnabled){toast('La orden de laboratorios no está habilitada para este formato.','warning');return false;}const saved=await persistDraft(fd,{silent:true});openLabsPrint(saved||{...built.data,id:draftId},patient);return false;}
   if(action==='professional_plan'){if(!professionalPlanEnabled){toast('El plan profesional no está habilitado para este formato.','warning');return false;}const saved=await persistDraft(fd,{silent:true});openProfessionalPlanPrint(saved||{...built.data,id:draftId},patient);return false;}
   if(action.startsWith('custom_document:')){const actionId=action.slice('custom_document:'.length),config=customDocumentActions.find(x=>x.catalogId===actionId);if(!config){toast('La acción personalizada ya no está disponible. Actualiza BRIMA.','warning');return false;}const saved=await persistDraft(fd,{silent:true});openCustomDocumentPrint(saved||{...built.data,id:draftId},patient,config);return false;}
   if(action==='save_patient'){await persistDraft(fd,{silent:false});return false;}
   if(action!=='finalize')return false;
   if(visit.status!=='En atención'){toast('Primero pulsa “Iniciar consulta”.','warning');return false;}
   const missing=[];if(!String(state.user.profile?.full_name||'').trim())missing.push('Nombre completo en Mi perfil');if(!String(state.user.profile?.cedula||'').trim())missing.push('Cédula profesional en Mi perfil');const requiredKeys=specialtyDefinitions.filter(field=>field.required===true).map(field=>field.key);for(const key of requiredKeys)if(!hasClinicalFieldValue(built.fieldsObj[key]))missing.push((built.data.payload.field_labels||{})[key]||key);if(missing.length){toast('Completa antes de finalizar: '+missing.join('; '),'warning',7000);return false;}
   if(!confirm(`El documento “${formatName}” quedará bloqueado como registro final. ¿Confirmas que revisaste su contenido y corresponde a este paciente?`))return false;
   // Conservar el borrador editable y guardar la historia emitida como una versión final independiente.
   // Así “Generar [nombre del formato]” no sustituye a “Finalizar consulta” ni oculta la visita activa.
   await persistDraft(fd,{silent:true});
   const at=nowIso(),historyId=crypto.randomUUID(),finalData={...built.data,status:'finalized',updated_at:at,finalized_at:at};finalData.payload={...built.data.payload,generated_at:at};finalData.content_hash=await sha256Text(stableStringify(finalData.payload));
   const batch=writeBatch(db);batch.set(doc(db,'consultas',historyId),finalData);await batch.commit();await writeAudit('GENERAR_DOCUMENTO_CLINICO',visit.patient_id,historyId);suppressAutosave=true;toast(`Documento “${formatName}” guardado como una versión nueva. La consulta continúa abierta hasta que pulses “Finalizar consulta”.`);closeModal('generated-history');openNotePrint({...finalData,id:historyId},historyId,patient);await loadQueue(true);return false;
  }
 });
}
function clinicalPrintThemeAttr(specialty){
 const requested=String(specialty||state.user?.profile?.specialty||'Medicina').trim();
 const configured=state.uiSettings?.roleColors||{};
 const defaults=DEFAULT_UI_SETTINGS?.roleColors||{};
 const requestedLower=requested.toLocaleLowerCase('es-MX');
 const key=Object.keys(configured).find(k=>String(k).trim().toLocaleLowerCase('es-MX')===requestedLower)
   || Object.keys(defaults).find(k=>String(k).trim().toLocaleLowerCase('es-MX')===requestedLower);
 let color=(key?configured[key]:null)||(key?defaults[key]:null)||configured['Otro / personalizado']||defaults['Otro / personalizado']||'#2463a6';
 color=String(color).trim();
 if(!/^#[0-9a-f]{6}$/i.test(color)) color='#2463a6';
 const r=parseInt(color.slice(1,3),16),g=parseInt(color.slice(3,5),16),b=parseInt(color.slice(5,7),16);
 const rgba=`${r},${g},${b}`;
 return `style="--brima-print-color:${color};--brima-print-tint:rgba(${rgba},.09);--brima-print-border:rgba(${rgba},.28);--brima-print-watermark:rgba(${rgba},.045)"`;
}

function printClinicalDocument(documentHtml){
 // El documento se imprime en un iframe independiente para que el modal y sus estilos no lo oculten.
 const frame=document.createElement('iframe');frame.setAttribute('title','Historia clínica para imprimir');frame.setAttribute('aria-hidden','true');
 frame.style.cssText='position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none';document.body.appendChild(frame);
 const d=frame.contentDocument;if(!d){frame.remove();toast('No se pudo preparar el documento para imprimir.','error');return;}
 const css=`@page{size:letter;margin:10mm}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#343434;font:10.5px/1.4 Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}.clinical-document{width:100%;max-width:100%;margin:0 auto;padding:0;background:#fff;color:#343434;font:10.5px/1.4 Arial,Helvetica,sans-serif;position:relative}.clinical-document:after{content:'✚';position:fixed;left:27%;bottom:18%;font-size:190px;color:rgba(35,105,91,.045);z-index:0;pointer-events:none}.clinical-document>*{position:relative;z-index:1}.clinical-document-header{margin:0 0 12px;text-align:left;position:relative;padding-bottom:12px;border-bottom:4px solid #b68a45}.clinical-document-brand{font-size:19px;font-weight:700;letter-spacing:0;color:#7e1e42}.clinical-document-subtitle{font-size:12px;color:#b68a45;font-weight:700;margin:2px 0}.clinical-document-profline{font-size:9.5px;color:#69645e;line-height:1.4}.clinical-document-titlebar{display:flex;align-items:center;justify-content:space-between;gap:12px;background:#861f46;color:#fff;border-radius:6px;padding:10px 13px;margin:12px 0 14px}.clinical-document-titlebar strong{font-size:14px;letter-spacing:2px}.clinical-document-titlebar span{font-size:9.5px;text-align:right}.clinical-document-section{margin:12px 0 0;break-inside:auto;page-break-inside:auto}.clinical-document-section h2{font-size:12px;letter-spacing:.4px;color:#861f46;margin:0 0 7px;padding-bottom:4px;border-bottom:1px solid #e9e2d8;break-after:avoid}.clinical-document-section h2:after{content:'';display:block;width:52px;border-bottom:3px solid #b68a45;margin-bottom:-6px;position:relative;top:6px}.clinical-document-section h3{font-size:10.5px;margin:0 0 6px;color:#861f46}.clinical-document-row{display:grid;grid-template-columns:30% 1fr;gap:8px;padding:4px 5px;border-bottom:1px solid #eee9e2;break-inside:avoid;page-break-inside:avoid;white-space:normal;overflow-wrap:anywhere}.clinical-document-row strong{font-size:9.5px;font-weight:700;color:#861f46;text-transform:none}.clinical-document-row span{white-space:pre-wrap;overflow-wrap:anywhere}.clinical-patient-grid{display:grid;grid-template-columns:1.6fr .8fr .8fr;gap:0 10px;margin-top:2px}.clinical-patient-grid .clinical-document-row{display:block;padding:5px 3px;min-height:27px}.clinical-patient-grid .clinical-document-row strong{display:inline;margin-right:4px}.clinical-patient-grid .clinical-document-row span{display:inline}.clinical-highlight{background:#faf7f1;border-left:3px solid #b68a45;border-radius:0 5px 5px 0;padding:9px 11px;margin-top:9px}.clinical-vitals{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;margin-top:9px}.clinical-vital{border:1px solid #eee4d5;border-radius:6px;padding:6px 3px;text-align:center;min-height:43px}.clinical-vital b{display:block;font-size:8px;color:#a47b3d;font-weight:700;margin-bottom:3px}.clinical-vital span{font-size:10px;font-weight:700}.clinical-document-table{width:100%;border-collapse:collapse;margin-top:6px}.clinical-document-table th{background:#7e1e42;color:#fff;text-align:left;padding:7px 8px;font-size:9px}.clinical-document-table td{border-bottom:1px solid #eee;padding:6px 8px}.clinical-document-signature{margin:30px 0 0 auto;width:45%;text-align:center;border-top:1px solid #555;padding-top:7px;display:flex;flex-direction:column;gap:2px;break-inside:avoid;page-break-inside:avoid}.clinical-document-signature strong{color:#861f46}.clinical-document-signature small{color:#777}.clinical-empty{color:#777;font-style:italic}.clinical-allergy{color:#861f46;font-weight:700}@media print{.clinical-document-section{break-inside:auto;page-break-inside:auto}.clinical-document-row,.clinical-vital{break-inside:avoid;page-break-inside:avoid}.clinical-document-titlebar,.clinical-document-table th{-webkit-print-color-adjust:exact;print-color-adjust:exact}}.clinical-document.palette-medicina .clinical-document-header{border-color:#2e78b8!important}.clinical-document.palette-medicina .clinical-document-brand,.clinical-document.palette-medicina .clinical-document-section h2,.clinical-document.palette-medicina .clinical-document-section h3,.clinical-document.palette-medicina .clinical-document-row strong,.clinical-document.palette-medicina .clinical-document-signature strong{color:#2463a6!important}.clinical-document.palette-medicina .clinical-document-titlebar,.clinical-document.palette-medicina .clinical-document-table th{background:#2463a6!important}.clinical-document.palette-medicina .clinical-document-subtitle,.clinical-document.palette-medicina .clinical-document-section h2:after,.clinical-document.palette-medicina .clinical-highlight{border-color:#2e78b8!important}.clinical-document.palette-medicina .clinical-document-subtitle{color:#2e78b8!important}.clinical-document.palette-medicina .clinical-highlight{background:#eaf3fb!important;border-left-color:#139b93!important}.clinical-document.palette-medicina .clinical-vital b{color:#2463a6!important}.clinical-document.palette-fisioterapia .clinical-document-header{border-color:#dd75ad!important}.clinical-document.palette-fisioterapia .clinical-document-brand,.clinical-document.palette-fisioterapia .clinical-document-section h2,.clinical-document.palette-fisioterapia .clinical-document-section h3,.clinical-document.palette-fisioterapia .clinical-document-row strong,.clinical-document.palette-fisioterapia .clinical-document-signature strong{color:#c94f91!important}.clinical-document.palette-fisioterapia .clinical-document-titlebar,.clinical-document.palette-fisioterapia .clinical-document-table th{background:#c94f91!important}.clinical-document.palette-fisioterapia .clinical-document-subtitle{color:#dd75ad!important}.clinical-document.palette-fisioterapia .clinical-document-section h2:after{border-color:#dd75ad!important}.clinical-document.palette-fisioterapia .clinical-highlight{background:#fbedf5!important;border-left-color:#ad6095!important}.clinical-document.palette-fisioterapia .clinical-vital b{color:#c94f91!important}.clinical-document.palette-nutricion .clinical-document-header{border-color:#94b34e!important}.clinical-document.palette-nutricion .clinical-document-brand,.clinical-document.palette-nutricion .clinical-document-section h2,.clinical-document.palette-nutricion .clinical-document-section h3,.clinical-document.palette-nutricion .clinical-document-row strong,.clinical-document.palette-nutricion .clinical-document-signature strong{color:#7c9b39!important}.clinical-document.palette-nutricion .clinical-document-titlebar,.clinical-document.palette-nutricion .clinical-document-table th{background:#7c9b39!important}.clinical-document.palette-nutricion .clinical-document-subtitle{color:#94b34e!important}.clinical-document.palette-nutricion .clinical-document-section h2:after{border-color:#94b34e!important}.clinical-document.palette-nutricion .clinical-highlight{background:#f2f7e8!important;border-left-color:#b0c967!important}.clinical-document.palette-nutricion .clinical-vital b{color:#7c9b39!important}.clinical-document.palette-psicologia .clinical-document-header{border-color:#8982c1!important}.clinical-document.palette-psicologia .clinical-document-brand,.clinical-document.palette-psicologia .clinical-document-section h2,.clinical-document.palette-psicologia .clinical-document-section h3,.clinical-document.palette-psicologia .clinical-document-row strong,.clinical-document.palette-psicologia .clinical-document-signature strong{color:#6d67a9!important}.clinical-document.palette-psicologia .clinical-document-titlebar,.clinical-document.palette-psicologia .clinical-document-table th{background:#6d67a9!important}.clinical-document.palette-psicologia .clinical-document-subtitle{color:#8982c1!important}.clinical-document.palette-psicologia .clinical-document-section h2:after{border-color:#8982c1!important}.clinical-document.palette-psicologia .clinical-highlight{background:#f0effa!important;border-left-color:#a49bd1!important}.clinical-document.palette-psicologia .clinical-vital b{color:#6d67a9!important}.clinical-document.palette-enfermeria .clinical-document-header{border-color:#20a6ad!important}.clinical-document.palette-enfermeria .clinical-document-brand,.clinical-document.palette-enfermeria .clinical-document-section h2,.clinical-document.palette-enfermeria .clinical-document-section h3,.clinical-document.palette-enfermeria .clinical-document-row strong,.clinical-document.palette-enfermeria .clinical-document-signature strong{color:#168a91!important}.clinical-document.palette-enfermeria .clinical-document-titlebar,.clinical-document.palette-enfermeria .clinical-document-table th{background:#168a91!important}.clinical-document.palette-enfermeria .clinical-document-subtitle{color:#20a6ad!important}.clinical-document.palette-enfermeria .clinical-document-section h2:after{border-color:#20a6ad!important}.clinical-document.palette-enfermeria .clinical-highlight{background:#e8f8f8!important;border-left-color:#66c4c5!important}.clinical-document.palette-enfermeria .clinical-vital b{color:#168a91!important}.clinical-document.palette-otro .clinical-document-header{border-color:#2e78b8!important}.clinical-document.palette-otro .clinical-document-brand,.clinical-document.palette-otro .clinical-document-section h2,.clinical-document.palette-otro .clinical-document-section h3,.clinical-document.palette-otro .clinical-document-row strong,.clinical-document.palette-otro .clinical-document-signature strong{color:#2463a6!important}.clinical-document.palette-otro .clinical-document-titlebar,.clinical-document.palette-otro .clinical-document-table th{background:#2463a6!important}.clinical-document.palette-otro .clinical-document-subtitle{color:#2e78b8!important}.clinical-document.palette-otro .clinical-highlight{background:#eaf3fb!important;border-left-color:#139b93!important}`; 
 const safeDocumentHtml=String(documentHtml||"").replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi,"$1").replace(/(?:https?:\/\/|www\.)[^\s<>\"']+/gi,"").replace(/\b[a-z0-9][a-z0-9.-]*\.(?:com|net|org|mx|app|clinic|health|io)(?:\/[^\s<>\"']*)?/gi,"");const dynamicPaletteCss=`
 .clinical-document[style*="--brima-print-color"] .clinical-document-header{border-bottom-color:var(--brima-print-color)!important}
 .clinical-document[style*="--brima-print-color"] .clinical-document-brand,
 .clinical-document[style*="--brima-print-color"] .clinical-document-subtitle,
 .clinical-document[style*="--brima-print-color"] .clinical-document-section h2,
 .clinical-document[style*="--brima-print-color"] .clinical-document-section h3,
 .clinical-document[style*="--brima-print-color"] .clinical-document-row strong,
 .clinical-document[style*="--brima-print-color"] .clinical-document-signature strong,
 .clinical-document[style*="--brima-print-color"] .clinical-vital b,
 .clinical-document[style*="--brima-print-color"] .clinical-allergy{color:var(--brima-print-color)!important}
 .clinical-document[style*="--brima-print-color"] .clinical-document-titlebar,
 .clinical-document[style*="--brima-print-color"] .clinical-document-table th{background:var(--brima-print-color)!important}
 .clinical-document[style*="--brima-print-color"] .clinical-document-section h2:after{border-bottom-color:var(--brima-print-color)!important}
 .clinical-document[style*="--brima-print-color"] .clinical-highlight{background:var(--brima-print-tint)!important;border-left-color:var(--brima-print-color)!important}
 .clinical-document[style*="--brima-print-color"] .clinical-vital{border-color:var(--brima-print-border)!important}
 .clinical-document[style*="--brima-print-color"]:after{color:var(--brima-print-watermark)!important}
 `;
 d.open();d.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Documento clínico</title><style>${css}${dynamicPaletteCss}</style></head><body>${safeDocumentHtml}</body></html>`);d.close();
 const cleanup=()=>{try{frame.remove()}catch(_){}};frame.contentWindow.addEventListener('afterprint',cleanup,{once:true});
 window.setTimeout(()=>{try{frame.contentWindow.focus();frame.contentWindow.print()}catch(err){cleanup();console.error(err);toast('No se pudo abrir la impresión. Intenta de nuevo.','error',7000)}window.setTimeout(cleanup,60000)},250);
}
function printSomatometrySection(triage){
 const t=triage||{};
 const values=[['Peso',t.weight_kg!==undefined&&t.weight_kg!==null&&t.weight_kg!==''?`${t.weight_kg} kg`:'' ],['Talla',t.height_cm!==undefined&&t.height_cm!==null&&t.height_cm!==''?`${t.height_cm} cm`:'' ],['IMC',t.bmi!==undefined&&t.bmi!==null&&t.bmi!==''?t.bmi:(t.weight_kg&&t.height_cm?(Number(t.weight_kg)/(Number(t.height_cm)/100)**2).toFixed(1):'')],['Temperatura',t.temperature_c!==undefined&&t.temperature_c!==null&&t.temperature_c!==''?`${t.temperature_c} °C`:'' ],['Presión arterial',(t.bp_sys||t.bp_dia)?`${t.bp_sys||'—'}/${t.bp_dia||'—'} mmHg`:'' ],['Frecuencia cardiaca',t.hr!==undefined&&t.hr!==null&&t.hr!==''?`${t.hr} lpm`:'' ],['Frecuencia respiratoria',t.rr!==undefined&&t.rr!==null&&t.rr!==''?`${t.rr} rpm`:'' ],['SpO₂',t.spo2!==undefined&&t.spo2!==null&&t.spo2!==''?`${t.spo2}%`:'' ],['Glucemia',t.glucose!==undefined&&t.glucose!==null&&t.glucose!==''?`${t.glucose} mg/dL`:'' ],['Dolor',t.pain!==undefined&&t.pain!==null&&t.pain!==''?`${t.pain}/10`:'' ]].filter(([,v])=>String(v??'').trim()!=='');
 if(!values.length)return '';
 return `<section class="clinical-document-section"><h2>SOMATOMETRÍA Y SIGNOS VITALES</h2><div class="clinical-vitals">${values.map(([k,v])=>`<div class="clinical-vital"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join('')}</div></section>`;
}
function renderNutritionPlanTable(value){
 if(!value||typeof value!=='object'||!value.meals)return '';
 const meals=['desayuno','almuerzo','comida','colacion','cena'],labels=['DESAYUNO','ALMUERZO','COMIDA','COLACIÓN','CENA'];
 const cell=v=>esc(v||'').replace(/\n/g,'<br>');
 return `<table class="nutrition-plan-print clinical-document-table"><thead><tr><th>PLAN ALIMENTARIO</th>${Array.from({length:6},(_,i)=>`<th>OPCIÓN ${i+1}</th>`).join('')}</tr></thead><tbody>${meals.map((m,i)=>`<tr><th>${labels[i]}</th>${Array.from({length:6},(_,j)=>`<td>${cell(value.meals?.[m]?.[j])}</td>`).join('')}</tr>`).join('')}<tr><th>SUPLEMENTACIÓN NUTRICIONAL</th><td colspan="6">${cell(value.supplementation)}</td></tr><tr><th>METAS, SEGUIMIENTO Y PRÓXIMA REVALORACIÓN</th><td colspan="6">${cell(value.goals)}</td></tr></tbody></table>`;
}
function openNotePrint(encounter,eid,patient){
 const payload=encounter.payload||{},fields=payload.fields||{},patientData=payload.patient_snapshot||patient||{},prof=payload.professional||{},triage=payload.triage_snapshot||{};
 const value=v=>String(v&&typeof v==='object'&&v.meals?'':Array.isArray(v)?v.join(', '):v??'').trim();
 const row=(label,v,extra='')=>value(v)?`<div class="clinical-document-row ${extra}"><strong>${esc(label)}</strong><span>${esc(value(v)).replace(/\n/g,'<br>')}</span></div>`:'';
 const titleFor=key=>payload.field_labels?.[key]||((getTemplateSet(payload.specialty||'Medicina').find(x=>x[0]===key)||[])[1])||({'antecedentes_heredofamiliares':'Heredofamiliares','antecedentes_gineco_obstetricos':'Gineco-obstétricos','otras_observaciones':'Otras observaciones','antecedentes_seleccionados':'Antecedentes médicos seleccionados','antecedentes_seleccionados_otro':'Otros antecedentes seleccionados / detalle','alergias_detalle':'Detalle de alergias / reacciones','laboratorio_orden':'Laboratorio / gabinete','otras_indicaciones_recomendaciones':'Otras indicaciones y recomendaciones'}[key]||key.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()));
 const age=dob=>{if(!dob)return '';const d=new Date(`${dob}T00:00:00`);if(Number.isNaN(d.getTime()))return '';const today=new Date();let y=today.getFullYear()-d.getFullYear();if(today.getMonth()<d.getMonth()||(today.getMonth()===d.getMonth()&&today.getDate()<d.getDate()))y--;return `${Math.max(0,y)} años`;};
 const patientRows=[['Paciente',patientName(patientData)||'No registrado'],['Edad',age(patientData.dob)],['Fecha de nacimiento',patientData.dob],['Sexo',patientData.sex],['Ocupación',patientData.occupation],['Estado civil',patientData.marital],['Teléfono',patientData.phone],['CURP',patientData.curp],['Domicilio',patientData.address],['Correo',patientData.email],['Contacto de emergencia',[patientData.emergency_contact,patientData.emergency_phone].filter(Boolean).join(' · ')],['Tipo de sangre',patientData.blood_type||patientData.tipo_sangre]].filter(([,v])=>value(v));
 const identificationHtml=patientRows.map(([k,v])=>row(k,v)).join('');
 const allergyList=[...(Array.isArray(fields.alergias_seleccionadas)?fields.alergias_seleccionadas:[]),fields.alergias_detalle,triage.allergies].map(value).filter(Boolean).join(' · ');
 const historyRows=payload.schema_version>=2?'':[...MEDICAL_HISTORY_FIELDS.map(([k,l])=>row(payload.field_labels?.[k]||l,fields[k]??payload.history_backup?.[k])),row('Antecedentes médicos seleccionados',(fields.antecedentes_seleccionados||payload.history_backup?.antecedentes_seleccionados||[]).join?.(', ')||(fields.antecedentes_seleccionados||payload.history_backup?.antecedentes_seleccionados||'')),row('Otros antecedentes',fields.antecedentes_seleccionados_otro||payload.history_backup?.antecedentes_seleccionados_otro),row('Alergias y reacciones',allergyList),row('Medicamentos actuales',triage.current_medications||fields.medicamentos_actuales)].filter(Boolean).join('');
 const historyKeys=payload.schema_version>=2?new Set(['medicamentos','medicamentos_receta']):new Set([...MEDICAL_HISTORY_FIELDS.map(([k])=>k),'antecedentes_seleccionados','antecedentes_seleccionados_otro','alergias_seleccionadas','alergias_detalle','medicamentos_actuales','medicamentos','medicamentos_receta','laboratorio_orden','laboratorio','plan_estudios','estudios','laboratorio_indicaciones','otras_indicaciones_recomendaciones','indicaciones']);
 const rawKeys=Array.isArray(payload.field_order)?payload.field_order:Object.keys(fields);
 const orderedKeys=[...rawKeys,...Object.keys(fields).filter(k=>!rawKeys.includes(k))].filter((k,i,a)=>a.indexOf(k)===i);
 const entries=orderedKeys.filter(k=>Object.prototype.hasOwnProperty.call(fields,k)&&!historyKeys.has(k)&&(fields[k]&&typeof fields[k]==='object'&&fields[k].meals?true:value(fields[k])!=='')).map(k=>({key:k,label:titleFor(k),value:fields[k]}));
 const useSchemaGroups=payload.field_groups&&Object.keys(payload.field_groups).length>0;
 const diagnosis=[],prognosis=[],plan=[],clinical=[],other=[];
 let schemaGroupedNoteHtml='';
 if(useSchemaGroups){const grouped=new Map();for(const item of entries){const group=String(payload.field_groups[item.key]||'Historia clínica');if(!grouped.has(group))grouped.set(group,[]);grouped.get(group).push(item);}const groupHtml=Array.from(grouped.entries()).map(([group,items])=>`<h3 class="clinical-document-subheading">${esc(group)}</h3>${items.map(x=>(x.key==='n_plan_alimentario'||x.key==='plan_alimentario'||(x.value&&typeof x.value==='object'&&x.value.meals))?`<div class=\"clinical-document-row\"><strong>${esc(x.label)}</strong>${renderNutritionPlanTable(x.value)}</div>`:row(x.label,x.value)).join('')}`).join('');schemaGroupedNoteHtml=`<section class="clinical-document-section"><h2>${esc(payload.format_name||`HISTORIA CLÍNICA · ${payload.specialty||prof.specialty||'Consulta'}`)}</h2>${groupHtml}</section>`;}
 else{for(const item of entries){const k=item.key+' '+item.label;if(/pron[oó]stico/i.test(k)){prognosis.push(item);continue;}if(/diagn[oó]stic|impresi[oó]n cl[ií]nica|hip[oó]tesis/i.test(k)){diagnosis.push(item);continue;}if(/tratamiento|intervenci[oó]n|plan |seguimiento|laboratorio|gabinete|estudio|indicaci[oó]n|recomendaci|educaci[oó]n|objetivos|metas|ejercicios|prescripci/i.test(k)){plan.push(item);continue;}if(/motivo|peea|padecimiento|exploraci[oó]n|evaluaci[oó]n|valoraci[oó]n|historia|observaciones|hallazgos|riesgo|respuesta|alimentaci[oó]n|antropometr[ií]a|contexto|interrogatorio/i.test(k)){clinical.push(item);continue;}other.push(item);}}
 const renderEntries=arr=>arr.map(x=>row(x.label,x.value)).join('');
 const noteHtml=useSchemaGroups?schemaGroupedNoteHtml:(clinical.length?`<section class="clinical-document-section"><h2>NOTA CLÍNICA · ${esc(payload.specialty||prof.specialty||'Consulta')}</h2>${renderEntries(clinical)}</section>`:'');
 const diagnosisHtml=!useSchemaGroups&&(diagnosis.length||prognosis.length)?`<section class="clinical-document-section"><h2>DIAGNÓSTICO Y PRONÓSTICO</h2>${renderEntries(diagnosis)}${renderEntries(prognosis)}</section>`:'';
 const meds=Array.isArray(fields.medicamentos_receta)?fields.medicamentos_receta.filter(m=>value(m.name||m.medicamento)):[];
 const medTable=meds.length?`<h3>Prescripción / medicamentos</h3><table class="clinical-document-table"><thead><tr><th>Medicamento</th><th>Dosis</th><th>Vía</th><th>Frecuencia</th><th>Duración</th><th>Indicaciones</th></tr></thead><tbody>${meds.map(m=>`<tr><td>${esc(m.name||m.medicamento||'')}</td><td>${esc(m.dose||m.dosis||'—')}</td><td>${esc(m.route||m.via||'—')}</td><td>${esc(m.frequency||m.frecuencia||'—')}</td><td>${esc(m.duration||m.duracion||'—')}</td><td>${esc(m.instructions||m.indicaciones||'—')}</td></tr>`).join('')}</tbody></table>`:'';
 const planRows=[...plan];
 if(value(fields.laboratorio_orden||fields.laboratorio||fields.plan_estudios||fields.estudios))planRows.push({key:'laboratorio_orden',label:titleFor('laboratorio_orden')||'Laboratorio / gabinete',value:fields.laboratorio_orden||fields.laboratorio||fields.plan_estudios||fields.estudios});
 if(value(fields.laboratorio_indicaciones))planRows.push({key:'laboratorio_indicaciones',label:titleFor('laboratorio_indicaciones')||'Indicaciones para laboratorio',value:fields.laboratorio_indicaciones});
 if(value(fields.otras_indicaciones_recomendaciones||fields.indicaciones))planRows.push({key:'otras_indicaciones_recomendaciones',label:titleFor('otras_indicaciones_recomendaciones')||'Otras indicaciones y recomendaciones',value:fields.otras_indicaciones_recomendaciones||fields.indicaciones});
 const planHtml=(planRows.length||medTable)&&!useSchemaGroups?`<section class="clinical-document-section"><h2>PLAN TERAPÉUTICO E INDICACIONES</h2>${renderEntries(planRows)}${medTable}</section>`:(!useSchemaGroups&&medTable?`<section class="clinical-document-section"><h2>PLAN TERAPÉUTICO E INDICACIONES</h2>${medTable}</section>`:'');
 const otherHtml=other.length&&!useSchemaGroups?`<section class="clinical-document-section"><h2>OTROS DATOS CLÍNICOS</h2>${renderEntries(other)}</section>`:'';
 const profLine=[prof.profession||payload.specialty||'',prof.cedula?`Cédula profesional: ${prof.cedula}`:'',prof.institution||'',prof.phone?`Teléfono: ${prof.phone}`:''].filter(Boolean).map(esc).join(' · ');
 const dateText=formatDate(encounter.finalized_at||encounter.updated_at||payload.generated_at);
 const doc=`<article id="print-note" class="clinical-document" ${clinicalPrintThemeAttr(payload.specialty||state.user?.profile?.specialty||'Medicina')}><header class="clinical-document-header"><div class="clinical-document-brand">${esc(prof.full_name||'Profesional responsable')}</div><div class="clinical-document-subtitle">${esc(prof.profession||payload.specialty||'Atención clínica')}</div><div class="clinical-document-profline">${profLine}</div></header><div class="clinical-document-titlebar"><strong>${esc(payload.format_name||'HISTORIA CLÍNICA')}</strong><span>Fecha: <b>${esc(dateText)}</b></span></div><section class="clinical-document-section"><h2>DATOS DE IDENTIFICACIÓN</h2><div class="clinical-patient-grid">${identificationHtml}</div></section>${historyRows?`<section class="clinical-document-section"><h2>ANTECEDENTES MÉDICOS</h2>${historyRows}</section>`:''}${printSomatometrySection(triage)}${noteHtml}${diagnosisHtml}${planHtml}${otherHtml}<footer class="clinical-document-signature"><strong>${esc(prof.full_name||'Profesional responsable')}</strong><small>${esc(prof.cedula?`Cédula profesional: ${prof.cedula}`:'')}</small><span>Firma del profesional</span></footer></article>`;
 openModal(`${payload.format_name||'Documento'} · Vista de impresión`,`<div class="historia-print-shell"><div class="historia-print-success"><span>✓</span> Documento generado correctamente</div><div class="historia-print-preview">${doc}</div><div class="historia-print-help">Documento “${esc(payload.format_name||'Historia clínica')}” listo para impresión. Revisa los datos antes de imprimir.</div></div>`,{size:'wide',buttons:[{action:'close',label:'Cerrar'},...(payload.enable_prescription?[{action:'recipe',label:formatActionLabels({action_labels:payload.action_labels},payload.specialty).prescription}]:[]),...(payload.enable_labs?[{action:'labs',label:formatActionLabels({action_labels:payload.action_labels},payload.specialty).labs}]:[]),...(payload.enable_professional_plan?[{action:'professional_plan',label:formatActionLabels({action_labels:payload.action_labels},payload.specialty).professional_plan}]:[]),...(Array.isArray(payload.document_actions_snapshot)?payload.document_actions_snapshot.map((item,index)=>({action:`custom_document:${index}`,label:item.buttonLabel||`Generar ${item.name||item.documentTitle||'documento'}`})):[]),{action:'download',label:'Descargar PDF'},{action:'saveas',label:'Guardar como…'},{action:'print',label:'Imprimir'}],onAction:async action=>{if(action==='recipe'){openPrescriptionPrint(encounter,patientData);return false;}if(action==='labs'){openLabsPrint(encounter,patientData);return false;}if(action==='professional_plan'){openProfessionalPlanPrint(encounter,patientData);return false;}if(action.startsWith('custom_document:')){const index=Number(action.slice('custom_document:'.length));const customAction=Array.isArray(payload.document_actions_snapshot)?payload.document_actions_snapshot[index]:null;if(customAction){openCustomDocumentPrint(encounter,patientData,customAction);}else toast('No se encontró la configuración histórica de este documento.','warning');return false;}if(['download','saveas','print'].includes(action)){if(action==='download')toast('En el cuadro de impresión selecciona “Guardar como PDF” para guardar el documento.','info',6500);else if(action==='saveas')toast('En el cuadro de impresión puedes elegir “Guardar como PDF” y seleccionar la ubicación.','info',6500);printClinicalDocument(doc);return false;}return true;}});
}
function customDocumentValueHtml(value){
 if(value&&typeof value==='object'&&value.meals)return renderNutritionPlanTable(value);
 const text=Array.isArray(value)?value.map(x=>String(x??'').trim()).filter(Boolean).join(', '):typeof value==='object'?clinicalFieldText(value):String(value??'');
 return `<span>${esc(text).replace(/\n/g,'<br>')}</span>`;
}
function customDocumentPatientRows(patientData){
 const p=patientData&&typeof patientData==='object'?patientData:{};
 const birth=p.dob?new Date(`${p.dob}T00:00:00`):null;
 let age='';
 if(birth&&!Number.isNaN(birth.getTime())){const today=new Date();let years=today.getFullYear()-birth.getFullYear();if(today.getMonth()<birth.getMonth()||(today.getMonth()===birth.getMonth()&&today.getDate()<birth.getDate()))years--;age=`${Math.max(0,years)} años`;}
 const rows=[['Paciente',patientName(p)],['Edad',age],['Fecha de nacimiento',p.dob],['Sexo',p.sex],['CURP',p.curp],['Teléfono',p.phone],['Correo electrónico',p.email],['Domicilio',p.address],['Ocupación',p.occupation],['Estado civil',p.marital],['Contacto de emergencia',p.emergency_contact],['Parentesco',p.relationship],['Teléfono de emergencia',p.emergency_phone],['Madre/padre/tutor',p.guardian]];
 return rows.filter(([,v])=>v!==undefined&&v!==null&&String(v).trim()!=='').map(([label,value])=>`<div class="clinical-document-row"><strong>${esc(label)}</strong><span>${esc(value)}</span></div>`).join('');
}
function openCustomDocumentPrint(encounter,patient,actionConfig){
 const p=encounter?.payload||{},fields=p.fields||{},schema=Array.isArray(p.format_schema_snapshot)?p.format_schema_snapshot:[],professional=p.professional||{},triage=p.triage_snapshot||{};
 const selectedKeys=new Set(Array.isArray(actionConfig?.fieldKeys)?actionConfig.fieldKeys:[]);
 const entries=schema.filter(field=>selectedKeys.has(String(field.key||''))&&hasClinicalFieldValue(fields[field.key]));
 const patientData=(patient?.payload&&typeof patient.payload==='object')?patient.payload:((p.patient_snapshot&&typeof p.patient_snapshot==='object')?p.patient_snapshot:(patient||{}));
 const includePatient=actionConfig?.includePatientIdentity!==false,includeSomatometry=actionConfig?.includeSomatometry===true,includeSignature=actionConfig?.includeProfessionalSignature!==false,showGroups=actionConfig?.showGroups!==false;
 if(!entries.length&&!includePatient&&!includeSomatometry){toast('Este documento no tiene datos capturados para imprimir. Revisa los campos seleccionados en Administración.','warning',8000);return;}
 let content='';
 if(showGroups){
  const grouped=new Map();for(const field of entries){const group=String(field.group||'Documento');if(!grouped.has(group))grouped.set(group,[]);grouped.get(group).push(field);}
  content=Array.from(grouped.entries()).map(([group,items])=>`<section class="clinical-document-section"><h2>${esc(group)}</h2>${items.map(field=>`<div class="clinical-document-row"><strong>${esc(field.label||field.key)}</strong>${customDocumentValueHtml(fields[field.key])}</div>`).join('')}</section>`).join('');
 }else{
  content=`<section class="clinical-document-section"><h2>INFORMACIÓN</h2>${entries.map(field=>`<div class="clinical-document-row"><strong>${esc(field.label||field.key)}</strong>${customDocumentValueHtml(fields[field.key])}</div>`).join('')}</section>`;
 }
 const documentTitle=String(actionConfig?.documentTitle||actionConfig?.name||'DOCUMENTO').trim();
 const profLine=[professional.profession||p.specialty||'',professional.cedula?`Cédula profesional: ${professional.cedula}`:'',professional.institution||'',professional.phone?`Teléfono: ${professional.phone}`:''].filter(Boolean).map(esc).join(' · ');
 const identity=includePatient?`<section class="clinical-document-section"><h2>DATOS DE IDENTIFICACIÓN</h2><div class="clinical-patient-grid">${customDocumentPatientRows(patientData)}</div></section>`:'';
 const soma=includeSomatometry?printSomatometrySection(triage):'';
 const signature=includeSignature?`<footer class="clinical-document-signature"><strong>${esc(professional.full_name||'Profesional responsable')}</strong><small>${esc(professional.cedula?`Cédula profesional: ${professional.cedula}`:'')}</small><span>Firma del profesional</span></footer>`:'';
 const docHtml=`<article id="print-note" class="clinical-document" ${clinicalPrintThemeAttr(p.specialty||state.user?.profile?.specialty||'Medicina')}><header class="clinical-document-header"><div class="clinical-document-brand">${esc(professional.full_name||'Profesional responsable')}</div><div class="clinical-document-subtitle">${esc(professional.profession||p.specialty||'Atención clínica')}</div><div class="clinical-document-profline">${profLine}</div></header><div class="clinical-document-titlebar"><strong>${esc(documentTitle)}</strong><span>Fecha: <b>${esc(formatDate(encounter?.finalized_at||encounter?.updated_at||p.generated_at))}</b></span></div>${identity}${soma}${content}${signature}</article>`;
 openModal(`${documentTitle} · Vista previa`,`<div class="historia-print-shell"><div class="historia-print-preview">${docHtml}</div><div class="historia-print-help">Documento reutilizable · ${esc(actionConfig?.buttonLabel||'Generación personalizada')}.</div></div>`,{size:'wide',buttons:[{action:'close',label:'Cerrar'},{action:'print',label:'Imprimir / guardar PDF',primary:true}],onAction:async action=>{if(action==='print'){printClinicalDocument(docHtml);return false;}return true;}});
}

function openPrescriptionPrint(encounter,patient){
 const p=encounter.payload||{},f=p.fields||{},specialty=p.specialty||'Medicina',prof=p.professional||{},triage=p.triage_snapshot||{};
 const isMedicine=p.force_professional_plan!==true&&(p.enable_prescription===true||(p.enable_prescription===undefined&&String(specialty).trim().toLocaleLowerCase('es-MX')==='medicina'));
 const meds=isMedicine&&Array.isArray(f.medicamentos_receta)?f.medicamentos_receta.filter(m=>String(m.name||m.medicamento||'').trim()):[];
 const patientRows=[['Paciente',patientName(patient)],['Fecha de nacimiento',patient?.dob],['Sexo',patient?.sex],['Teléfono',patient?.phone],['Alergias',f.alergias_detalle||((Array.isArray(f.alergias_seleccionadas)?f.alergias_seleccionadas:[]).join(', '))]].filter(([,v])=>String(v||'').trim()).map(([k,v])=>`<div class="clinical-document-row"><strong>${esc(k)}</strong><span>${esc(v)}</span></div>`).join('');
 const lab=String(f.laboratorio_orden||f.laboratorio||f.estudios||'').trim();
 const extra=String(f.otras_indicaciones_recomendaciones||f.indicaciones||'').trim();
 let labToPrint=lab,extraToPrint=extra;
 let title='',planHtml='';
 if(isMedicine){
  if(!meds.length&&!extra){toast('Agrega al menos un medicamento o indicación antes de generar la receta.','warning');return;}
  title='RECETA MÉDICA';
  planHtml=meds.length?`<table class="clinical-document-table"><thead><tr><th>Medicamento</th><th>Dosis</th><th>Vía</th><th>Frecuencia</th><th>Duración</th><th>Indicaciones</th></tr></thead><tbody>${meds.map(m=>`<tr><td>${esc(m.name||m.medicamento||'')}</td><td>${esc(m.dose||m.dosis||'—')}</td><td>${esc(m.route||m.via||'—')}</td><td>${esc(m.frequency||m.frecuencia||'—')}</td><td>${esc(m.duration||m.duracion||'—')}</td><td>${esc(m.instructions||m.indicaciones||'—')}</td></tr>`).join('')}</tbody></table>`:'';
 }else{
  const groups=p.field_groups||{};
  const allowed=/plan|interv|tratamiento|seguimiento|pron[oó]stico|objetivos|educaci[oó]n|requerimientos|frecuencia|t[eé]cnicas|modalidades|recomendaciones/i;
  const exclude=/medicamento|receta|laboratorio_orden|indicaciones_recomendaciones|alergia|^laboratorio$|^plan_estudios$|^estudios$|^indicaciones$/i;
  const planSchema=Array.isArray(p.format_schema_snapshot)?p.format_schema_snapshot:[];
  const hasExplicitPlanConfig=planSchema.some(field=>field&&Object.prototype.hasOwnProperty.call(field,'include_in_professional_plan'));
  const selectedPlanFields=new Set(planSchema.filter(field=>field?.include_in_professional_plan===true).map(field=>String(field.key||'')));
  if(hasExplicitPlanConfig){
   const selectedLegacyLab=['laboratorio_orden','laboratorio','plan_estudios','estudios'].some(key=>selectedPlanFields.has(key));
   const selectedLegacyExtra=['otras_indicaciones_recomendaciones','indicaciones'].some(key=>selectedPlanFields.has(key));
   if(!selectedLegacyLab)labToPrint='';
   if(!selectedLegacyExtra)extraToPrint='';
  }
  const entries=Object.entries(f).filter(([key,value])=>{ 
   if(exclude.test(key))return false;
   const text=(value&&typeof value==='object'&&value.meals)?JSON.stringify(value):(Array.isArray(value)?value.join(', '):String(value??'').trim());
   const belongs=hasExplicitPlanConfig?selectedPlanFields.has(key):allowed.test(String(groups[key]||key.replace(/_/g,' '))+' '+String(p.field_labels?.[key]||''));
   return Boolean(text)&&belongs;
  });
  if(!entries.length&&!extraToPrint&&!labToPrint){toast('Completa al menos uno de los campos seleccionados para el plan profesional antes de generar el documento.','warning');return;}
  const configuredPlanTitle=String(p.action_labels?.professional_plan||'').replace(/^generar\s*/i,'').trim();
  title=configuredPlanTitle?configuredPlanTitle.toLocaleUpperCase('es-MX'):(String(specialty).toLocaleLowerCase('es-MX')==='fisioterapia'?'PLAN DE INTERVENCIÓN FISIOTERAPÉUTICA':String(specialty).toLocaleLowerCase('es-MX')==='nutrición'?'PLAN NUTRICIONAL Y SUPLEMENTACIÓN':String(specialty).toLocaleLowerCase('es-MX')==='psicología'?'PLAN TERAPÉUTICO':'PLAN PROFESIONAL');
  planHtml=entries.map(([key,value])=>{
   const label=p.field_labels?.[key]||key.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
   if((key==='n_plan_alimentario'||key==='plan_alimentario')||(value&&typeof value==='object'&&value.meals))return `<div class="clinical-document-row"><strong>${esc(label)}</strong>${renderNutritionPlanTable(value)}</div>`;
   const text=Array.isArray(value)?value.join(', '):String(value??'');
   return `<div class="clinical-document-row"><strong>${esc(label)}</strong><span>${esc(text).replace(/\n/g,'<br>')}</span></div>`;
  }).join('');
 }
 const configuredExtra=isMedicine?renderConfiguredDocumentFields(p,'prescription'):'';
 if(configuredExtra)planHtml+=configuredExtra;
 const docHtml=`<article id="print-note" class="clinical-document" ${clinicalPrintThemeAttr(specialty)}><header class="clinical-document-header"><div class="clinical-document-brand">${esc(prof.full_name||'Profesional responsable')}</div><div class="clinical-document-subtitle">${esc(prof.profession||specialty)}</div><div class="clinical-document-profline">${esc(prof.cedula?`Cédula profesional: ${prof.cedula}`:'')}</div></header><div class="clinical-document-titlebar"><strong>${esc(title)}</strong><span>Fecha: <b>${esc(formatDate(encounter.finalized_at||encounter.updated_at||p.generated_at))}</b></span></div><section class="clinical-document-section"><h2>DATOS DEL PACIENTE</h2>${patientRows}</section>${printSomatometrySection(triage)}<section class="clinical-document-section"><h2>${isMedicine?'PRESCRIPCIÓN':'PLAN DE INTERVENCIÓN'}</h2>${planHtml}</section>${labToPrint?`<section class="clinical-document-section"><h2>ESTUDIOS SOLICITADOS</h2><div class="clinical-document-row"><strong>Laboratorio / gabinete</strong><span>${esc(labToPrint).replace(/\n/g,'<br>')}</span></div>`:''}${extraToPrint?`<section class="clinical-document-section"><h2>INDICACIONES Y RECOMENDACIONES</h2><div class="clinical-document-row"><strong>Indicaciones</strong><span>${esc(extraToPrint).replace(/\n/g,'<br>')}</span></div></section>`:''}<footer class="clinical-document-signature"><strong>${esc(prof.full_name||'Profesional responsable')}</strong><small>${esc(prof.cedula?`Cédula profesional: ${prof.cedula}`:'')}</small><span>Firma del profesional</span></footer></article>`;
 openModal(`${title} · Vista previa`,`<div class="historia-print-shell"><div class="historia-print-preview">${docHtml}</div><div class="historia-print-help">Somatometría procedente de la valoración registrada por Enfermería.</div></div>`,{size:'wide',buttons:[{action:'close',label:'Cerrar'},{action:'print',label:'Imprimir / guardar PDF',primary:true}],onAction:async action=>{if(action==='print'){printClinicalDocument(docHtml);return false;}return true;}});
}
function openProfessionalPlanPrint(encounter,patient){
 const payload=encounter?.payload||{};
 // Reutiliza el diseño profesional, pero fuerza la ruta de plan incluso si el formato pertenece a Medicina.
 openPrescriptionPrint({...encounter,payload:{...payload,enable_prescription:false,force_professional_plan:true}},patient);
}
function openLabsPrint(encounter,patient){
 const p=encounter.payload||{},f=p.fields||{},prof=p.professional||{},triage=p.triage_snapshot||{},specialty=p.specialty||'';
 const labs=extractLabsForFormat(p);
 if(!labs){toast('Captura al menos un estudio en “Laboratorio / gabinete” para generar la orden.','warning');return;}
 const patientRows=[['Paciente',patientName(patient)],['Fecha de nacimiento',patient?.dob],['Sexo',patient?.sex],['Teléfono',patient?.phone],['Alergias',f.alergias_detalle||((Array.isArray(f.alergias_seleccionadas)?f.alergias_seleccionadas:[]).join(', '))]].filter(([,v])=>String(v||'').trim()).map(([k,v])=>`<div class="clinical-document-row"><strong>${esc(k)}</strong><span>${esc(v)}</span></div>`).join('');
 const configuredSummary=getConfiguredDocumentFields(p,'labs_summary');
 const diagnosis=f.diagnostico||f.impresion||f.impresion_diagnostica||f.diagnostico_nutricional||f.evaluacion||'';
 const peea=f.peea||f.historia||f.historia_padecimiento||f.padecimiento_actual||'';
 const summaryHtml=configuredSummary.length
  ? configuredSummary.map(item=>`<div class="clinical-document-row"><strong>${esc(item.label)}</strong><span>${esc(clinicalFieldText(item.value)).replace(/\n/g,'<br>')}</span></div>`).join('')
  : `<div class="clinical-document-row"><strong>Diagnóstico</strong><span>${esc(diagnosis||'No registrado en la nota')}</span></div><div class="clinical-document-row"><strong>PEEA</strong><span>${esc(peea||'No registrado en la nota')}</span></div>`;
 const docHtml=`<article id="print-note" class="clinical-document" ${clinicalPrintThemeAttr(specialty)}><header class="clinical-document-header"><div class="clinical-document-brand">${esc(prof.full_name||'Profesional responsable')}</div><div class="clinical-document-subtitle">${esc(prof.profession||specialty||'Atención clínica')}</div><div class="clinical-document-profline">${esc(prof.cedula?`Cédula profesional: ${prof.cedula}`:'')}</div></header><div class="clinical-document-titlebar"><strong>ORDEN DE LABORATORIOS / GABINETE</strong><span>Fecha: <b>${esc(formatDate(encounter.finalized_at||encounter.updated_at||p.generated_at))}</b></span></div><section class="clinical-document-section"><h2>DATOS DEL PACIENTE</h2>${patientRows}</section>${printSomatometrySection(triage)}<section class="clinical-document-section"><h2>ESTUDIOS SOLICITADOS</h2><div class="clinical-document-row"><strong>Laboratorio / gabinete</strong><span>${esc(labs).replace(/\n/g,'<br>')}</span></div>${String(f.laboratorio_indicaciones||'').trim()?`<div class="clinical-document-row"><strong>Indicaciones para el estudio</strong><span>${esc(f.laboratorio_indicaciones).replace(/\n/g,'<br>')}</span></div>`:''}</section><section class="clinical-document-section"><h2>RESUMEN CLÍNICO</h2>${summaryHtml}</section><footer class="clinical-document-signature"><strong>${esc(prof.full_name||'Profesional responsable')}</strong><small>${esc(prof.cedula?`Cédula profesional: ${prof.cedula}`:'')}</small><span>Firma del profesional</span></footer></article>`;
 openModal('Orden de laboratorios · Vista previa',`<div class="historia-print-shell"><div class="historia-print-preview">${docHtml}</div></div>`,{size:'wide',buttons:[{action:'close',label:'Cerrar'},{action:'print',label:'Imprimir / guardar PDF',primary:true}],onAction:async action=>{if(action==='print'){printClinicalDocument(docHtml);return false;}return true;}});
}

async function renderHistory(){
 const visit=selectedVisit();const patientId=state.selectedPatientId||(visit&&!visit._queueRedacted?visit.patient_id:'');
 if(!patientId&&state.user?.role==='clinician'){await renderClinicianDirectory();return;}
 if(!patientId){const target=state.user.role==='admin'?'patients':'queue';const label=state.user.role==='admin'?'Ir a todos los pacientes':'Ir a sala de espera';$('#page-content').innerHTML=pageHeading('Historia clínica (HC)','Consulta la historia de un paciente seleccionado y para el que tu rol tenga autorización.','EXPEDIENTE / TRAZABILIDAD')+`<div class="panel"><div class="empty-state"><div class="empty-icon">▣</div><strong>No has seleccionado un paciente</strong><p>Selecciona una visita autorizada en la sala de espera${state.user.role==='admin'?' o abre Todos los pacientes':''}.</p><button class="btn primary" id="history-go-patients">${label}</button></div></div>`;$('#history-go-patients').onclick=()=>goView(target);return;}
 const patient=await loadPatientDoc(patientId,true);if(!patient||patient._restricted)throw new Error('No tienes permiso vigente para consultar este expediente.');
 const [notesSnap,visitsSnap]=await Promise.all([
   getDocs(query(collection(db,'consultas'),where('ownerUid','==',state.ownerUid),where('patient_id','==',patientId))),
   getDocs(query(collection(db,'visitas'),where('ownerUid','==',state.ownerUid),where('patient_id','==',patientId)))
 ]);
 const rows=notesSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
 const visits=visitsSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
 const triages=[];for(const v of visits){try{const t=await getTriage(v.id);if(t)triages.push({visit:v,triage:t});}catch(err){console.warn('La valoración de una visita no está disponible para este usuario',err);}}
 const activeVisits=visits.filter(v=>ACTIVE_VISIT_STATUSES.includes(v.status));
 $('#page-content').innerHTML=pageHeading('Historia clínica (HC)',`${patientName(patient.payload)} · Folio ${shortId(patientId)}. Las notas y valoraciones que aparecen están sujetas a las reglas de Firestore.`, 'EXPEDIENTE / TRAZABILIDAD')+
 `<div class="panel"><div class="panel-head"><div><h3>Identificación</h3><p>Datos vinculados al expediente seleccionado.</p></div><span class="badge">${rows.length} nota(s)</span></div><div class="form-grid three"><div class="form-field"><label>Paciente</label><div class="note-preview">${esc(patientName(patient.payload))}</div></div><div class="form-field"><label>Fecha de nacimiento</label><div class="note-preview">${esc(patient.payload.dob||'—')}</div></div><div class="form-field"><label>Responsable actual</label><div class="note-preview">${esc(safeNameFromProfessional(patient.last_assigned_professional_id))}</div></div></div><div class="actions" style="margin-top:14px"><button class="btn ghost" id="history-back-patients">${state.historyReturnView==='interconsultations'?'Volver a interconsultas':'Volver al directorio'}</button><button class="btn ghost" id="history-refresh">↻ Actualizar historial</button>${state.user?.role==='clinician'&&state.historyReturnView==='interconsultations'?'<button class="btn danger" id="history-finish-reading">Terminar lectura y cerrar acceso</button>':''}</div></div>
 <div class="panel"><div class="panel-head"><div><h3>Visitas del expediente</h3><p>Las visitas atendidas se conservan en el historial, pero no aparecen en la sala activa.</p></div><span class="badge">${visits.length} visita(s)</span></div>${visits.length?`<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Servicio</th><th>Profesional</th><th>Estado</th><th>Folio visita</th></tr></thead><tbody>${visits.map(v=>`<tr><td>${esc(formatDate(v.created_at))}</td><td>${esc(v.service_specialty||'—')}</td><td>${esc(safeNameFromProfessional(v.assigned_professional_id))}</td><td>${badgeStatus(v.status)}</td><td>${esc(shortId(v.id))}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state"><strong>No hay visitas registradas</strong></div>`}</div>
 <div class="panel"><div class="panel-head"><div><h3>Valoraciones de enfermería</h3><p>Registros históricos disponibles para este acceso.</p></div><span class="badge">${triages.length}</span></div>${triages.length?`<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Folio visita</th><th>Resumen</th><th>Autor</th></tr></thead><tbody>${triages.map(x=>`<tr><td>${esc(formatDate(x.triage.created_at))}</td><td>${esc(shortId(x.visit.id))}</td><td>${esc(triageSummary(x.triage)||'Valoración registrada')}</td><td>${esc(shortId(x.triage.author_id))}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state"><strong>No hay valoraciones disponibles</strong></div>`}</div>
 <div class="panel"><div class="panel-head"><div><h3>Notas y consultas</h3><p>Las notas finalizadas permanecen bloqueadas; las correcciones deben documentarse conforme al procedimiento aplicable.</p></div></div>${rows.length?`<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Especialidad</th><th>Tipo</th><th>Profesional</th><th>Estado</th><th>Integridad</th><th></th></tr></thead><tbody>${rows.map(n=>`<tr><td>${esc(formatDate(n.created_at))}</td><td>${esc(n.specialty||'—')}</td><td>${esc(n.kind||n.payload?.note_type||'—')}</td><td>${esc(n.payload?.professional?.full_name||n.payload?.author_username||shortId(n.author_id))}</td><td><span class="badge ${n.status==='finalized'?'status-atendido':''}">${n.status==='finalized'?'Finalizada':'Borrador'}</span></td><td>${n.status==='finalized'?'<span class="badge">'+(n.content_hash?'Hash guardado':'Sin hash')+'</span>':'—'}</td><td><button class="btn small" data-note-view="${esc(n.id)}">Ver</button>${state.user?.role==='clinician'&&n.author_id===state.currentUser.uid&&n.assigned_professional_id===state.currentUser.uid&&!String(n.interconsultation_request_id||'')?` <button class="btn small" data-note-edit="${esc(n.id)}">Editar</button>`:''}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state"><strong>No hay notas registradas</strong><p>Las notas aparecerán cuando los profesionales registren y guarden su atención.</p></div>`}</div>`;
 $('#history-back-patients').onclick=()=>{if(state.user?.role==='clinician'){state.selectedPatientId='';if(state.historyReturnView==='interconsultations'){state.historyReturnView='history';goView('interconsultations');}else goView('history');}else goView('patients');};$('#history-refresh').onclick=()=>renderHistory();const finishRead=$('#history-finish-reading');if(finishRead)finishRead.onclick=()=>finishInterconsultationReading(patientId);$$('[data-note-view]').forEach(btn=>btn.addEventListener('click',()=>{const note=rows.find(n=>n.id===btn.dataset.noteView);if(note)showEncounter(note,patient.payload);}));$$('[data-note-edit]').forEach(btn=>btn.addEventListener('click',()=>{const note=rows.find(n=>n.id===btn.dataset.noteEdit);if(note)editExistingClinicalNote(note,patient);}));
}
function showEncounter(note,patient){const p=note.payload||{};const fields=p.fields||{};const arr=Object.entries(fields).filter(([k,v])=>String(Array.isArray(v)?v.join(', '):v??'').trim()!=='').map(([k,v])=>[((TEMPLATES[p.specialty]||TEMPLATES['Otro / personalizado']).find(x=>x[0]===k)||[])[1]||({'alergias_seleccionadas':'Alergias seleccionadas','alergias_detalle':'Detalle de alergias / reacciones','antecedentes_seleccionados':'Antecedentes médicos seleccionados','antecedentes_seleccionados_otro':'Otros antecedentes seleccionados / detalle','laboratorio_orden':'Laboratorio / gabinete','laboratorio_indicaciones':'Indicaciones para laboratorio','otras_indicaciones_recomendaciones':'Otras indicaciones y recomendaciones'}[k])||k.replace(/_/g,' '),Array.isArray(v)?v.join(', '):v]);openModal(`${p.note_type||note.kind||'Nota'} · ${note.status==='finalized'?'Finalizada':'Borrador'}`,`<div class="profile-block"><div class="avatar">${esc(initials(patientName(patient)))}</div><div><h3>${esc(patientName(p.patient_snapshot||patient))}</h3><p>${esc(p.specialty||note.specialty||'')} · ${esc(formatDate(note.finalized_at||note.updated_at))} · Folio ${esc(shortId(note.patient_id))}</p></div></div><div class="clinical-document-section"><h3>Datos del especialista</h3><div class="clinical-document-row"><strong>Nombre</strong><span>${esc(p.professional?.full_name||'—')}</span></div><div class="clinical-document-row"><strong>Especialidad</strong><span>${esc(p.specialty||'—')}</span></div><div class="clinical-document-row"><strong>Cédula profesional</strong><span>${esc(p.professional?.cedula||'—')}</span></div></div><div class="note-preview">${arr.map(([l,v])=>`${l}\n${v||'—'}`).join('\n\n')}</div>`,{size:'wide',buttons:[{action:'close',label:'Cerrar'},{action:'print',label:'Imprimir / guardar PDF',primary:true}],onAction:async action=>{if(action==='print'){openNotePrint(note,note.id,p.patient_snapshot||patient);return false;}return true;}});}

function visibleActiveInterconsultations(rows){
 const active=(rows||[]).filter(r=>['pending','approved'].includes(r.status));
 active.sort((a,b)=>((b.status==='approved')-(a.status==='approved'))||String(b.created_at||'').localeCompare(String(a.created_at||'')));
 const seen=new Set(),out=[];
 for(const r of active){const key=[r.patient_id,r.source_professional_id||r.requester_professional_id,r.recipient_professional_id].join('|');if(seen.has(key))continue;seen.add(key);out.push(r);}
 return out.sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
}
async function renderInterconsultations(silent=false){
 if(state.user.role!=='clinician')return;const root=$('#page-content');if(!root)return;
 if(silent&&state.activeInterTab==='new')return;
 if(!silent)root.innerHTML=pageHeading('Interconsultas entre profesionales','El especialista destinatario ve la historia autorizada en modo lectura. El profesional responsable puede cancelar o revocar el acceso.','COORDINACIÓN / ACCESO AUTORIZADO')+
 `<div class="inline-note warning-note"><strong>Privacidad clínica</strong><span>Para enviar basta con seleccionar paciente, especialista y motivo. El expediente completo se comparte al aceptar.</span></div><div class="panel"><div class="tabs"><button class="tab-btn ${state.activeInterTab==='incoming'?'active':''}" data-inter-tab="incoming">Solicitudes recibidas</button><button class="tab-btn ${state.activeInterTab==='sent'?'active':''}" data-inter-tab="sent">Solicitudes enviadas</button><button class="tab-btn ${state.activeInterTab==='shared'?'active':''}" data-inter-tab="shared">Pacientes compartidos conmigo</button><button class="tab-btn ${state.activeInterTab==='new'?'active':''}" data-inter-tab="new">Nueva interconsulta</button></div><div id="inter-content"><div class="empty-state"><span class="spinner"></span><p>Cargando bandeja…</p></div></div></div>`;
 if(!silent)$$('[data-inter-tab]').forEach(btn=>btn.addEventListener('click',()=>{if(state.activeInterTab==='new')captureInterDraft();state.activeInterTab=btn.dataset.interTab;renderInterconsultations();}));
 try{
  const view=$('#inter-content');if(!view)return;
  if(state.activeInterTab==='incoming'){
   const snap=await getDocs(query(collection(db,'interconsultas_solicitudes'),where('ownerUid','==',state.ownerUid),where('recipient_professional_id','==',state.currentUser.uid)));
   const rows=visibleActiveInterconsultations(snap.docs.map(d=>({id:d.id,...d.data()})));
   view.innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Paciente / folio</th><th>Profesional responsable</th><th>Motivo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(formatDate(r.created_at))}</td><td><span title="Folio completo">${esc(r.patient_id)}</span></td><td><div class="table-primary">${esc(r.requester_name||safeNameFromProfessional(r.source_professional_id))}</div><div class="table-secondary">${esc(r.requester_specialty||'')}</div></td><td>${esc(r.clinical_request?.reason||'—')}</td><td>${requestBadge(r.status)}</td><td><div class="table-actions"><button class="btn small" data-inter-detail="${esc(r.id)}">Detalle</button>${r.status==='pending'?`<button class="btn small success" data-inter-approve="${esc(r.id)}">Aceptar</button><button class="btn small danger" data-inter-reject="${esc(r.id)}">Rechazar</button>`:'<span class="table-secondary">Acceso autorizado</span>'}</div></td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state"><div class="empty-icon">⇄</div><strong>No tienes solicitudes pendientes</strong><p>Las solicitudes rechazadas o canceladas ya no aparecen en esta bandeja.</p></div>`;
   $$('[data-inter-detail]',view).forEach(b=>b.onclick=()=>showRequestDetails(rows.find(r=>r.id===b.dataset.interDetail)));
   $$('[data-inter-approve]',view).forEach(b=>b.onclick=()=>respondToInterconsultation(rows.find(r=>r.id===b.dataset.interApprove),true));
   $$('[data-inter-reject]',view).forEach(b=>b.onclick=()=>respondToInterconsultation(rows.find(r=>r.id===b.dataset.interReject),false));
  } else if(state.activeInterTab==='sent'){
   const snap=await getDocs(query(collection(db,'interconsultas_solicitudes'),where('ownerUid','==',state.ownerUid),where('requester_professional_id','==',state.currentUser.uid)));
   const rows=visibleActiveInterconsultations(snap.docs.map(d=>({id:d.id,...d.data()})));
   view.innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Paciente / folio</th><th>Destinatario</th><th>Motivo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(formatDate(r.created_at))}</td><td><span title="Folio completo">${esc(r.patient_id)}</span></td><td>${esc(r.recipient_name||safeNameFromProfessional(r.recipient_professional_id))}<div class="table-secondary">${esc(r.recipient_specialty||'—')}</div></td><td>${esc(r.clinical_request?.reason||'—')}</td><td>${requestBadge(r.status)}</td><td><div class="table-actions"><button class="btn small" data-inter-detail="${esc(r.id)}">Detalle</button><button class="btn small danger" data-inter-revoke="${esc(r.id)}">${r.status==='pending'?'Cancelar solicitud':'Revocar acceso'}</button></div></td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state"><div class="empty-icon">⇄</div><strong>No tienes solicitudes activas</strong><p>Solo se muestran solicitudes pendientes o accesos autorizados.</p></div>`;
   $$('[data-inter-detail]',view).forEach(b=>b.onclick=()=>showRequestDetails(rows.find(r=>r.id===b.dataset.interDetail)));
   $$('[data-inter-revoke]',view).forEach(b=>b.onclick=()=>revokeInterconsultation(rows.find(r=>r.id===b.dataset.interRevoke)));
  } else if(state.activeInterTab==='shared'){
   const gs=await getDocs(query(collection(db,'paciente_accesos'),where('ownerUid','==',state.ownerUid),where('professional_id','==',state.currentUser.uid),where('active','==',true)));const rows=[];for(const d of gs.docs){const g={id:d.id,...d.data()};try{const p=await loadPatientDoc(g.patient_id,true);if(p&&!p._restricted)rows.push({grant:g,patient:p});}catch(e){console.warn(e);}}
   view.innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr><th>Paciente</th><th>Folio</th><th>Profesional responsable</th><th>Autorizado</th><th></th></tr></thead><tbody>${rows.map(x=>`<tr><td><div class="table-primary">${esc(patientName(x.patient.payload))}</div><div class="table-secondary">${esc(x.patient.payload.dob||'')}</div></td><td><span title="Folio completo">${esc(x.patient.id)}</span></td><td>${esc(safeNameFromProfessional(x.grant.granted_by_uid))}</td><td>${esc(formatDate(x.grant.created_at))}</td><td><button class="btn primary small" data-shared-open="${esc(x.patient.id)}">Leer historia clínica</button></td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state"><div class="empty-icon">♙</div><strong>No tienes pacientes compartidos</strong><p>Cuando aceptes una solicitud, el expediente aparecerá aquí mientras el permiso siga vigente.</p></div>`;
   $$('[data-shared-open]',view).forEach(b=>b.onclick=()=>{state.selectedPatientId=b.dataset.sharedOpen;state.historyReturnView='interconsultations';state.activeInterTab='shared';goView('history');});
  } else await renderInterconsultationRequestForm(view);
  if(!silent)await writeAudit('CONSULTAR_BANDEJA_INTERCONSULTAS');
 }catch(err){console.error(err);$('#inter-content').innerHTML=`<div class="inline-note warning-note"><strong>No se pudo actualizar la bandeja.</strong><span>${esc(friendlyError(err))}</span></div><button class="btn" id="inter-retry">Reintentar</button>`;$('#inter-retry').onclick=()=>renderInterconsultations();}
}
function requestBadge(status){const cls={pending:'status-pending',approved:'status-approved',rejected:'status-rejected',revoked:'status-revoked'}[status]||'';const label={pending:'Pendiente',approved:'Acceso autorizado',rejected:'Rechazada',revoked:'Acceso revocado'}[status]||status;return `<span class="badge ${cls}">${esc(label)}</span>`;}
function captureInterDraft(){const form=$('#inter-request-form');if(!form)return;state.interDraft=Object.fromEntries(new FormData(form).entries());const status=$('#inter-request-status');if(status&&status.textContent.startsWith('Solicitud registrada'))status.textContent='Los cambios del formulario aún no se han enviado.';const submit=$('button[type=submit]',form);if(submit){submit.disabled=false;submit.textContent='Enviar solicitud de autorización';}}
async function renderInterconsultationRequestForm(view){
 const clinicians=state.professionals.filter(p=>p.role==='clinician'&&p.active&&p.id!==state.currentUser.uid);
 let ownPatients=[];
 try{const snap=await getDocs(query(collection(db,'pacientes'),where('ownerUid','==',state.ownerUid),where('last_assigned_professional_id','==',state.currentUser.uid)));ownPatients=snap.docs.map(d=>({id:d.id,...d.data(),payload:d.data().payload||{}})).sort((a,b)=>patientName(a.payload).localeCompare(patientName(b.payload),'es-MX'));}
 catch(err){console.warn('No se pudieron cargar pacientes asignados para interconsulta',err);}
 const patientOptions=ownPatients.map(p=>`<option value="${esc(p.id)}">${esc(patientName(p.payload))} · Folio ${esc(p.id)}</option>`).join('');
 view.innerHTML=`<div class="inline-note"><strong>Enviar interconsulta</strong><span>El destinatario recibirá la historia completa en modo lectura cuando acepte.</span></div>${ownPatients.length?'':`<div class="inline-note warning-note"><strong>No hay pacientes asignados</strong><span>Primero debe existir un expediente asignado a tu cuenta.</span></div>`}<form id="inter-request-form" class="form-grid"><div class="form-field span-2"><label>Paciente a tu cargo *</label><select name="patient_id" required ${ownPatients.length?'':'disabled'}><option value="">Selecciona paciente</option>${patientOptions}</select></div><div class="form-field span-2"><label>Especialista destinatario *</label><select name="recipient_professional_id" required><option value="">Selecciona especialista</option>${clinicians.map(p=>`<option value="${esc(p.id)}">${esc(p.full_name||p.username||p.id)} · ${esc(p.specialty||'')}</option>`).join('')}</select></div><div class="form-field span-2"><label>Motivo de interconsulta *</label><textarea name="reason" required rows="3" maxlength="2000" placeholder="Describe brevemente por qué solicitas la interconsulta."></textarea></div><div class="span-2 actions"><button class="btn primary" type="submit" ${ownPatients.length?'':'disabled'}>Enviar interconsulta</button><button class="btn ghost" id="inter-request-clear" type="button">Limpiar</button></div></form><p id="inter-request-status" class="hint" role="status"></p>`;
 const requestForm=$('#inter-request-form',view);for(const [key,value] of Object.entries(state.interDraft||{})){const field=requestForm.elements.namedItem(key);if(field)field.value=value;}
 requestForm.addEventListener('input',captureInterDraft);requestForm.addEventListener('change',captureInterDraft);
 $('#inter-request-clear',view).addEventListener('click',()=>{requestForm.reset();state.interDraft={};const status=$('#inter-request-status',view);if(status)status.textContent='Formulario limpio.';const submit=$('button[type=submit]',requestForm);if(submit){submit.disabled=!ownPatients.length;submit.textContent='Enviar interconsulta';}});
 requestForm.addEventListener('submit',async e=>{
  e.preventDefault();
  // Snapshot while the submit event is live. Event.currentTarget becomes null after the callback awaits.
  const form=requestForm,fd=new FormData(form),data=Object.fromEntries(fd.entries());
  const required=['patient_id','recipient_professional_id','reason'];
  if(required.some(k=>!String(data[k]||'').trim())){toast('Selecciona paciente, especialista y escribe el motivo.','warning');return;}
  if(data.recipient_professional_id===state.currentUser.uid){toast('Selecciona otro profesional.','warning');return;}
  const patient=ownPatients.find(p=>p.id===data.patient_id);if(!patient){toast('El paciente ya no está asignado a tu cuenta. Actualiza la pantalla.','error');return;}
  const recipient=clinicians.find(p=>p.id===data.recipient_professional_id),btn=$('button[type=submit]',form),statusEl=$('#inter-request-status',view);btn.disabled=true;btn.textContent='Enviando…';
  try{
   // No duplicar el mismo paciente-responsable-destinatario mientras exista una solicitud pendiente o un permiso aprobado.
   const ownSentSnap=await getDocs(query(collection(db,'interconsultas_solicitudes'),where('ownerUid','==',state.ownerUid),where('requester_professional_id','==',state.currentUser.uid)));
   const duplicate=visibleActiveInterconsultations(ownSentSnap.docs.map(d=>({id:d.id,...d.data()}))).find(r=>r.patient_id===patient.id&&r.recipient_professional_id===data.recipient_professional_id);
   if(duplicate){state.activeInterTab='sent';toast(`Ya existe una solicitud activa para este paciente y especialista (${duplicate.status==='approved'?'acceso autorizado':'pendiente de respuesta'}). No se duplicó.`,'warning',7000);await renderInterconsultations();return;}
   const at=nowIso(),ref=doc(collection(db,'interconsultas_solicitudes'));
   const clinical_request={reason:String(data.reason).trim()};
   const request={ownerUid:state.ownerUid,patient_id:patient.id,patient_name:patientName(patient.payload),source_professional_id:state.currentUser.uid,requester_professional_id:state.currentUser.uid,recipient_professional_id:data.recipient_professional_id,requester_name:state.user.profile?.full_name||state.user.username||state.user.email,requester_specialty:state.user.profile?.specialty||'',recipient_name:recipient?.full_name||recipient?.username||'',recipient_specialty:recipient?.specialty||'',status:'pending',clinical_request,created_at:at,updated_at:at};
   await setDoc(ref,request);await writeAudit('ENVIAR_INTERCONSULTA_A_ESPECIALISTA',patient.id,ref.id);
   state.interDraft={};form.reset();if(statusEl)statusEl.textContent=`Solicitud enviada a ${recipient?.full_name||recipient?.username||'el especialista'}. Solo se creó una solicitud.`;toast('Interconsulta enviada correctamente.');btn.disabled=false;btn.textContent='Enviar interconsulta';
  }catch(err){console.error(err);toast('No se pudo enviar la interconsulta. '+friendlyError(err),'error',8000);btn.disabled=false;btn.textContent='Enviar interconsulta';}
 });
}
function showRequestDetails(r){
 if(!r)return;const c=r.clinical_request||{};
 openModal(`Solicitud de interconsulta · ${shortId(r.id)}`,`<div class="form-grid"><div class="form-field"><label>Paciente / folio</label><div class="note-preview">${esc(r.patient_name||r.patient_id)}</div><small>${esc(r.patient_id)}</small></div><div class="form-field"><label>Estado</label><div>${requestBadge(r.status)}</div></div><div class="form-field"><label>Profesional responsable</label><div class="note-preview">${esc(r.requester_name||safeNameFromProfessional(r.source_professional_id))}</div></div><div class="form-field"><label>Especialista destinatario</label><div class="note-preview">${esc(r.recipient_name||safeNameFromProfessional(r.recipient_professional_id)||'—')} · ${esc(r.recipient_specialty||'')}</div></div><div class="form-field span-2"><label>Motivo de interconsulta</label><div class="note-preview">${esc(c.reason||'—')}</div></div>${r.rejected_reason?`<div class="form-field span-2"><label>Motivo de rechazo</label><div class="note-preview">${esc(r.rejected_reason)}</div></div>`:''}</div>`,{size:'wide',buttons:[{action:'close',label:'Cerrar'}],onAction:async()=>true});
}
async function respondToInterconsultation(r,approve,rejectionReason=''){
 if(!r||r.status!=='pending'){toast('Solo se pueden resolver solicitudes pendientes.','warning');return;}
 if(r.recipient_professional_id!==state.currentUser.uid){toast('Esta solicitud no está dirigida a tu cuenta.','error');return;}
 if(!approve&&!rejectionReason){
  openModal('Rechazar interconsulta',`<div class="inline-note warning-note"><strong>El rechazo requiere justificación</strong><span>Al confirmar, la solicitud dejará de aparecer en las bandejas activas.</span></div><div class="form-field"><label>Motivo de rechazo *</label><textarea name="rejected_reason" required rows="4" maxlength="2000" placeholder="Explica brevemente por qué rechazas la interconsulta."></textarea></div>`,{size:'narrow',buttons:[{action:'cancel',label:'Cancelar'},{action:'reject',label:'Confirmar rechazo',danger:true}],onAction:async(action,fd)=>{if(action!=='reject')return true;const reason=String(fd.get('rejected_reason')||'').trim();if(!reason){toast('Escribe el motivo de rechazo para continuar.','warning');return false;}const result=await respondToInterconsultation(r,false,reason);return result!==false;}});return;
 }
 if(approve&&!confirm(`Aceptar interconsulta de ${r.requester_name||safeNameFromProfessional(r.source_professional_id)} para el paciente ${r.patient_name||r.patient_id}. La historia podrá leerse mientras este permiso siga activo. ¿Continuar?`))return;
 try{
  const at=nowIso(),reqRef=doc(db,'interconsultas_solicitudes',r.id),batch=writeBatch(db);
  const updates={status:approve?'approved':'rejected',updated_at:at,resolved_at:at,resolved_by_uid:state.currentUser.uid};
  if(!approve)updates.rejected_reason=String(rejectionReason).trim();
  batch.update(reqRef,updates);
  if(approve){const grantId=`${r.patient_id}__${state.currentUser.uid}`,gRef=doc(db,'paciente_accesos',grantId),grantSnap=await getDoc(gRef);const grant={ownerUid:state.ownerUid,patient_id:r.patient_id,professional_id:state.currentUser.uid,granted_by_uid:r.source_professional_id,request_id:r.id,active:true,reason:String(r.clinical_request?.reason||''),created_at:at,updated_at:at};if(grantSnap.exists()){if(grantSnap.data().active===true)throw new Error('Ya tienes acceso activo a este expediente.');batch.update(gRef,{active:true,request_id:r.id,reason:grant.reason,created_at:at,updated_at:at});}else batch.set(gRef,grant);}
  await batch.commit();await writeAudit(approve?'ACEPTAR_INTERCONSULTA':'RECHAZAR_INTERCONSULTA',r.patient_id,r.id);toast(approve?'Interconsulta aceptada. La historia aparece en Pacientes compartidos conmigo.':'Interconsulta rechazada; el registro queda oculto de las bandejas activas.');await renderInterconsultations();return true;
 }catch(err){console.error(err);toast('No se pudo resolver la interconsulta. '+friendlyError(err),'error',8000);return false;}
}
async function revokeInterconsultation(r){
 if(!r||!['pending','approved'].includes(r.status)){toast('La solicitud ya no está activa.','warning');return;}
 if(r.source_professional_id!==state.currentUser.uid){toast('Solo el profesional que envió la interconsulta puede cancelarla o revocar su acceso.','warning');return;}
 const label=r.status==='pending'?'Cancelar la solicitud aún no aceptada':'Revocar el acceso a la historia clínica';
 if(!confirm(`${label}. También se cerrarán duplicados activos de la misma combinación paciente/destinatario. ¿Continuar?`))return;
 try{
  const at=nowIso(),gRef=doc(db,'paciente_accesos',`${r.patient_id}__${r.recipient_professional_id||r.requester_professional_id}`),grantSnap=await getDoc(gRef);
  let visits=[];
  if(r.status==='approved'){
   if(!grantSnap.exists()||grantSnap.data().active!==true||grantSnap.data().request_id!==r.id)throw new Error('La concesión activa no existe o pertenece a otra autorización. Actualiza la bandeja antes de intentarlo.');
   const vs=await getDocs(query(collection(db,'visitas'),where('ownerUid','==',state.ownerUid),where('patient_id','==',r.patient_id),where('interconsultation_request_id','==',r.id)));visits=vs.docs;
  }
  // Retirar también duplicados activos del mismo paciente y destinatario para que no reaparezcan al cerrar el principal.
  const sentSnap=await getDocs(query(collection(db,'interconsultas_solicitudes'),where('ownerUid','==',state.ownerUid),where('requester_professional_id','==',state.currentUser.uid)));
  const samePair=sentSnap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.patient_id===r.patient_id&&x.recipient_professional_id===r.recipient_professional_id&&['pending','approved'].includes(x.status));
  const batch=writeBatch(db);
  for(const item of samePair){
   // Un acceso aprobado actual siempre se revoca en el mismo batch; los duplicados pendientes/stale aprobados quedan ocultos.
   batch.update(doc(db,'interconsultas_solicitudes',item.id),{status:'revoked',updated_at:at,resolved_at:at,resolved_by_uid:state.currentUser.uid});
  }
  if(r.status==='approved'&&grantSnap.exists()&&grantSnap.data().active===true&&grantSnap.data().request_id===r.id)batch.update(gRef,{active:false,revoked_at:at,updated_at:at});
  await batch.commit();let failedVisitBatches=0;const active=visits.filter(d=>ACTIVE_VISIT_STATUSES.includes(d.data().status));
  for(let i=0;i<active.length;i+=6){try{const b=writeBatch(db);for(const d of active.slice(i,i+6)){const v={id:d.id,...d.data()};b.update(d.ref,{status:'Cancelado',closed_at:at,updated_at:at});addRoomSummaryToBatch(b,d.id,{...v,status:'Cancelado',closed_at:at,updated_at:at});}await b.commit();}catch(batchErr){failedVisitBatches++;console.error('Permiso revocado; falló la actualización de visitas operativas',batchErr);}}
  await writeAudit('REVOCAR_INTERCONSULTA',r.patient_id,r.id);toast(failedVisitBatches?'Acceso revocado. Algunas visitas antiguas requieren revisión administrativa.':'Solicitud cancelada/acceso revocado y duplicados activos retirados.',failedVisitBatches?'warning':'success',8000);await renderInterconsultations();await loadQueue(true);
 }catch(err){console.error(err);toast('No se pudo cancelar o revocar la interconsulta. '+friendlyError(err),'error',8000);}
}

async function finishInterconsultationReading(patientId){
 if(state.user?.role!=='clinician'||!patientId||state.historyReturnView!=='interconsultations')return;
 try{
  const grantRef=doc(db,'paciente_accesos',`${patientId}__${state.currentUser.uid}`),grantSnap=await getDoc(grantRef);
  if(!grantSnap.exists()||grantSnap.data().active!==true)throw new Error('El acceso ya está cerrado o no existe.');
  const grant=grantSnap.data(),requestId=String(grant.request_id||'');if(!requestId)throw new Error('La autorización no contiene folio de solicitud.');
  const requestRef=doc(db,'interconsultas_solicitudes',requestId),requestSnap=await getDoc(requestRef);if(!requestSnap.exists())throw new Error('La solicitud de interconsulta ya no existe.');
  const request=requestSnap.data();if(request.status!=='approved'||request.recipient_professional_id!==state.currentUser.uid||request.patient_id!==patientId)throw new Error('La autorización ya no está vigente o no corresponde a este usuario.');
  if(!confirm('Terminar la lectura y cerrar el acceso a esta historia clínica? El expediente dejará de aparecer en “Pacientes compartidos conmigo” y no podrás seguir abriéndolo con esta autorización.'))return;
  // Leer las visitas vinculadas antes de revocar el permiso: después de revocar, Firestore ya no debe permitir listarlas.
  const qv=query(collection(db,'visitas'),where('ownerUid','==',state.ownerUid),where('patient_id','==',patientId),where('interconsultation_request_id','==',requestId)),visits=await getDocs(qv);
  const at=nowIso(),batch=writeBatch(db);batch.update(requestRef,{status:'revoked',updated_at:at,resolved_at:at,resolved_by_uid:state.currentUser.uid});batch.update(grantRef,{active:false,revoked_at:at,updated_at:at});await batch.commit();let pendingUpdates=0;
  const active=visits.docs.filter(d=>ACTIVE_VISIT_STATUSES.includes(d.data().status));
  for(let i=0;i<active.length;i+=6){try{const b=writeBatch(db);for(const d of active.slice(i,i+6)){const v={id:d.id,...d.data()};b.update(d.ref,{status:'Cancelado',closed_at:at,updated_at:at});addRoomSummaryToBatch(b,d.id,{...v,status:'Cancelado',closed_at:at,updated_at:at});}await b.commit();}catch(err){pendingUpdates++;console.warn('Acceso cerrado, pero una visita compartida requiere revisión',err);}}
  await writeAudit('TERMINAR_LECTURA_INTERCONSULTA',patientId,requestId);state.selectedPatientId='';state.historyReturnView='history';goView('interconsultations');toast(pendingUpdates?'Acceso cerrado. Una visita anterior requiere revisión administrativa.':'Lectura terminada; el acceso se ha cerrado y la historia ya no está compartida.',pendingUpdates?'warning':'success',8000);
 }catch(err){console.error(err);toast('No se pudo cerrar la lectura de interconsulta. '+friendlyError(err),'error',9000);}
}

async function startSharedConsultation(patientId){try{const grantRef=doc(db,'paciente_accesos',`${patientId}__${state.currentUser.uid}`),gs=await getDoc(grantRef);if(!gs.exists()||gs.data().active!==true)throw new Error('No existe una autorización vigente.');const grant=gs.data(),specialty=String(state.user.profile?.specialty||'').trim();if(!specialty)throw new Error('Completa tu especialidad en Mi perfil antes de abrir la consulta.');const qv=query(collection(db,'visitas'),where('ownerUid','==',state.ownerUid),where('patient_id','==',patientId),where('interconsultation_request_id','==',grant.request_id));const vs=await getDocs(qv);const existing=vs.docs.map(d=>({id:d.id,...d.data()})).find(v=>['Recepción','Enfermería','Consulta','En atención'].includes(v.status));if(existing){state.selectedVisitId=existing.id;goView('queue');toast('Ya existe una visita activa de esta interconsulta.');return;}const id=crypto.randomUUID(),at=nowIso(),visitData={ownerUid:state.ownerUid,patient_id:patientId,status:'Consulta',created_at:at,updated_at:at,closed_at:'',service_specialty:specialty,assigned_professional_id:state.currentUser.uid,interconsultation_request_id:grant.request_id},batch=writeBatch(db);batch.set(doc(db,'visitas',id),visitData);addRoomSummaryToBatch(batch,id,visitData);await batch.commit();await writeAudit('ABRIR_CONSULTA_POR_INTERCONSULTA',patientId,id);state.selectedVisitId=id;await loadQueue(true);goView('queue');toast('Consulta compartida abierta. El profesional responsable original se conserva.');}catch(err){toast(friendlyError(err),'error',8000);}}

function captureDocumentActionPanel(root){
 const panel=$('#format-document-actions-panel',root);if(!panel)return [];
 return $$('.format-document-action-card',panel).map(card=>{
  const id=card.dataset.formatDocAction||'';
  const get=name=>Array.from(card.querySelectorAll('[name]')).find(x=>x.name===name)||null;
  return {catalogId:id,enabled:!!get('doc_action_enabled')?.checked,buttonLabel:String(get(`doc_action_label_${id}`)?.value||''),documentTitle:String(get(`doc_action_title_${id}`)?.value||''),fieldKeys:$$(`[name="doc_action_fields_${id}"]:checked`,card).map(x=>x.value),includePatientIdentity:!!get(`doc_action_patient_${id}`)?.checked,includeSomatometry:!!get(`doc_action_somatometry_${id}`)?.checked,includeProfessionalSignature:!!get(`doc_action_signature_${id}`)?.checked,showGroups:!!get(`doc_action_groups_${id}`)?.checked};
 });
}
async function renderTemplates(){
 if(state.user?.role!=='admin')return;
 await loadProfessionals(true);
 try{await loadDocumentActionSettings();await ensureLegacyClinicalFormats();await loadClinicalFormats();}
 catch(err){console.error('No se pudo preparar el catálogo de formatos',err);toast('No se pudieron cargar los formatos. '+friendlyError(err),'error',9000);}
 const rows=state.clinicalFormats||[];
 $('#page-content').innerHTML=pageHeading('Formatos clínicos','Crea documentos independientes desde cero, asigna cada formato a uno o varios profesionales y elimina los que ya no se utilicen. Los documentos ya guardados en expedientes no se borran al eliminar un formato.','CONFIGURACIÓN CLÍNICA')+
 `<div class="inline-note"><strong>Formatos independientes por profesional</strong><span>Un profesional puede tener varios formatos y otro profesional de la misma especialidad puede tener formatos distintos. La asignación se realiza manualmente; cada profesional elige el formato al abrir la atención.</span></div><div class="panel"><div class="panel-head"><div><h3>Catálogo de formatos</h3><p>${rows.length} formato(s) disponibles. Los formatos importados de la versión anterior no tienen profesionales asignados hasta que Administración los autorice.</p></div><div class="actions"><button class="btn primary" id="template-new">＋ Crear nuevo formato</button></div></div><div class="table-wrap"><table><thead><tr><th>ESPECIALIDAD</th><th>NOMBRE DEL FORMATO</th><th>CAMPOS</th><th>PROFESIONALES ASIGNADOS</th><th>ACCIONES</th></tr></thead><tbody>${rows.length?rows.map(f=>{const assigned=(f.assigned_professional_ids||[]).map(id=>state.professionals.find(p=>p.id===id)?.full_name||shortId(id)).filter(Boolean);return `<tr><td><span class="table-primary">${esc(f.specialty||'General')}</span></td><td><span class="table-primary">${esc(f.name||'Formato sin nombre')}</span>${f.is_legacy?'<div class="table-secondary">Importado de versión anterior</div>':''}</td><td>${(f.schema||[]).length}</td><td>${assigned.length?esc(assigned.join(', ')):'<span class="status-pill">Sin asignar</span>'}</td><td><div class="table-actions"><button class="btn small" data-format-view="${esc(f.id)}">Vista previa</button><button class="btn small primary" data-format-edit="${esc(f.id)}">Editar formato</button><button class="btn small danger" data-format-delete="${esc(f.id)}">Eliminar formato</button></div></td></tr>`;}).join(''):'<tr><td colspan="5"><div class="empty-state"><strong>Aún no hay formatos</strong><p>Crea un formato clínico desde cero para comenzar.</p></div></td></tr>'}</tbody></table></div></div>${renderDocumentActionCatalogPanel()}<div class="panel"><div class="panel-head"><div><h3>Catálogos de texto rápido</h3><p>Opciones adicionales compartidas guardadas en Firestore.</p></div></div><div class="actions"><button class="btn" id="catalog-refresh">Actualizar catálogos</button><button class="btn primary" id="catalog-add">＋ Añadir texto rápido</button></div><div id="catalog-content" style="margin-top:15px"></div></div>`;
 $('#document-action-catalog-manage').onclick=()=>openDocumentActionCatalogManager();
 $('#template-new').onclick=()=>openClinicalFormatEditor();
 $$('[data-format-view]').forEach(b=>b.onclick=()=>showClinicalFormatPreview(b.dataset.formatView));
 $$('[data-format-edit]').forEach(b=>b.onclick=()=>openClinicalFormatEditor(state.clinicalFormats.find(f=>f.id===b.dataset.formatEdit)));
 $$('[data-format-delete]').forEach(b=>b.onclick=()=>deleteClinicalFormat(b.dataset.formatDelete));
 $('#catalog-refresh').onclick=loadCustomCatalogs;$('#catalog-add').onclick=()=>openCatalogModal();loadCustomCatalogs();
}
function showClinicalFormatPreview(formatId){
 const f=state.clinicalFormats.find(x=>x.id===formatId);if(!f)return;
 openModal(`Vista previa · ${f.name}`,`<p class="muted">Especialidad: ${esc(f.specialty||'General')} · ${f.schema.length} campo(s) · ${f.assigned_professional_ids.length} profesional(es) asignado(s).</p><div class="table-wrap"><table><thead><tr><th>Sección</th><th>Campo</th><th>Tipo</th><th>Obligatorio</th></tr></thead><tbody>${f.schema.map(x=>`<tr><td>${esc(x.group||'Documento')}</td><td>${esc(x.label)}</td><td>${esc(x.type)}</td><td>${x.required?'Sí':'No'}</td></tr>`).join('')}</tbody></table></div>`,{size:'wide',buttons:[{action:'close',label:'Cerrar'}],onAction:async()=>true});
}
function formatAssignmentChecks(format){
 const clinicians=(state.professionals||[]).filter(p=>p.active!==false&&p.role==='clinician').sort((a,b)=>String(a.full_name||'').localeCompare(String(b.full_name||''),'es-MX'));
 if(!clinicians.length)return '<p class="muted">Todavía no hay profesionales clínicos activos. Puedes guardar el formato y asignarlo después.</p>';
 const selected=new Set(format?.assigned_professional_ids||[]);
 return `<div class="format-assignment-grid">${clinicians.map(p=>`<label class="format-assignment-item"><input type="checkbox" name="format_professional" value="${esc(p.id)}" ${selected.has(p.id)?'checked':''}><span><strong>${esc(p.full_name||p.username||shortId(p.id))}</strong><small>${esc(p.specialty||'Sin especialidad')} · ${esc(p.username||'')}</small></span></label>`).join('')}</div>`;
}
function openClinicalFormatEditor(format=null){
 if(state.user?.role!=='admin'){toast('Solo Administración puede crear o editar formatos.','warning');return;}
 const isNew=!format,source=normaliseClinicalFormatSchema(format?.schema||[]),name=String(format?.name||''),specialty=String(format?.specialty||'Medicina');
 const existingDocActions=normalizeDocumentActionSettings(state.documentActionSettings).formats[String(format?.id||'')]||[];
 const body=`<div class="form-grid two"><label class="form-field span-2"><span>NOMBRE DEL FORMATO *</span><input name="format_name" required maxlength="120" value="${esc(name)}" placeholder="Ej. Certificado médico, Carta de buena salud"></label><label class="form-field"><span>Especialidad *</span><input name="format_specialty" list="brima-specialty-options" required maxlength="80" value="${esc(specialty)}" placeholder="Ej. Ginecología"><small>Escribe una especialidad nueva o elige una existente.</small>${specialtyDatalist()}</label><label class="form-field"><span>Descripción / uso</span><input name="format_description" maxlength="240" value="${esc(format?.description||'')}" placeholder="Para qué se utiliza este documento"></label><div class="form-field span-2"><label>Asignar a profesionales (opcional)</label><small>Marca manualmente uno o varios profesionales. Solo ellos podrán elegir este formato al abrir una atención. Puedes asignarlo después.</small>${formatAssignmentChecks(format)}</div></div><div class="divider-label">Acciones estándar de este formato</div><p class="hint">Estas acciones mantienen sus generadores especializados. Si no las activas, no aparecerán en la consulta.</p><div class="form-grid two format-action-settings"><div class="form-field"><label class="check-label"><input type="checkbox" name="format_enable_prescription" ${format?.enable_prescription?'checked':''}> Mostrar generador de receta / medicamentos</label><label class="form-field"><span>Texto del botón</span><input name="format_action_label_prescription" maxlength="80" value="${esc(formatActionLabels(format, specialty).prescription)}"></label></div><div class="form-field"><label class="check-label"><input type="checkbox" name="format_enable_labs" ${format?.enable_labs?'checked':''}> Mostrar generador de orden de laboratorios / gabinete</label><label class="form-field"><span>Texto del botón</span><input name="format_action_label_labs" maxlength="80" value="${esc(formatActionLabels(format, specialty).labs)}"></label></div><div class="form-field"><label class="check-label"><input type="checkbox" name="format_enable_professional_plan" ${format?.enable_professional_plan?'checked':''}> Mostrar generador de plan profesional</label><label class="form-field"><span>Texto del botón</span><input name="format_action_label_professional_plan" maxlength="80" value="${esc(formatActionLabels(format, specialty).professional_plan)}"></label></div></div><div class="divider-label">Documentos personalizados reutilizables</div><p class="hint">Asigna documentos creados en el catálogo general. Cada formato conserva su propia selección de campos, texto del botón y opciones de impresión. No se altera el orden ni las claves de los campos del formato.</p><div id="format-document-actions-panel">${renderFormatDocumentActionsPanel(format?.id,source,existingDocActions.map(x=>({...x,enabled:true})))}</div><div class="divider-label">Campos del documento</div><p class="hint">Los campos y su orden se conservan tal como los configures. Los datos de identificación y la somatometría se pueden agregar por separado a cada documento personalizado.</p><div id="clinical-format-builder-list" class="template-builder-list">${source.map((f,i)=>templateBuilderRow(f,i,true)).join('')}</div><div class="actions"><button type="button" class="btn" id="clinical-format-builder-add">＋ Agregar campo</button></div>`;
 openModal(isNew?'Crear nuevo formato':'Editar formato clínico',body,{size:'wide',buttons:[{action:'cancel',label:'Cancelar'},{action:'save',label:isNew?'Crear formato':'Guardar cambios',primary:true}],afterOpen:root=>{
  const list=$('#clinical-format-builder-list',root),add=$('#clinical-format-builder-add',root),panel=$('#format-document-actions-panel',root),specialtyInput=$('input[name="format_specialty"]',root),planLabelInput=$('input[name="format_action_label_professional_plan"]',root);
  let customPlanLabel=!!(format?.action_labels?.professional_plan&&format.action_labels.professional_plan!==defaultFormatActionLabels(specialty).professional_plan);
  const refreshDocActions=()=>{
   const previous=captureDocumentActionPanel(root);
   const schemaNow=$$('[data-schema-row]',list).map(row=>({key:String($('input[name="schema_key"]',row)?.value||''),label:String($('input[name="schema_label"]',row)?.value||'')})).filter(x=>x.key);
   panel.innerHTML=renderFormatDocumentActionsPanel(format?.id,schemaNow,previous);
  };
  specialtyInput?.addEventListener('change',()=>{if(!customPlanLabel&&planLabelInput)planLabelInput.value=defaultFormatActionLabels(specialtyInput.value).professional_plan;});
  planLabelInput?.addEventListener('input',()=>{customPlanLabel=true;});
  add.onclick=()=>{const index=$$('[data-schema-row]',list).length+1;const key=`campo_${slugify($('#active-modal-form [name="format_name"]',root)?.value||$('#active-modal-form [name="format_specialty"]',root)?.value||'formato')}_${crypto.randomUUID().slice(0,8)}`;list.insertAdjacentHTML('beforeend',templateBuilderRow({key,label:'Nuevo campo',group:'Documento',type:'textarea',icon:'📝',options:[],required:false,placeholder:''},index-1,true));refreshDocActions();};
  list.addEventListener('click',e=>{const row=e.target.closest('[data-schema-row]');if(!row)return;if(e.target.closest('[data-schema-remove]')){row.remove();refreshDocActions();}else if(e.target.closest('[data-schema-up]')){const prev=row.previousElementSibling;if(prev)list.insertBefore(row,prev);}else if(e.target.closest('[data-schema-down]')){const next=row.nextElementSibling;if(next)list.insertBefore(next,row);}});
  list.addEventListener('change',e=>{const row=e.target.closest('[data-schema-row]');if(!row)return;if(e.target.matches('[data-schema-required]')){const hidden=$('input[name="schema_required"]',row);if(hidden)hidden.value=e.target.checked?'1':'0';}if(e.target.matches('[data-schema-plan-include]')){const hidden=$('input[name="schema_include_plan"]',row);if(hidden)hidden.value=e.target.checked?'1':'0';}if(e.target.matches('[data-schema-labs-summary]')){const hidden=$('input[name="schema_include_labs_summary"]',row);if(hidden)hidden.value=e.target.checked?'1':'0';}if(e.target.matches('[data-schema-prescription]')){const hidden=$('input[name="schema_include_prescription"]',row);if(hidden)hidden.value=e.target.checked?'1':'0';}if(e.target.matches('[name="schema_label"]'))refreshDocActions();});
 },onAction:async(action,fd)=>{
  if(action!=='save')return true;
  const formatName=String(fd.get('format_name')||'').trim(),formatSpecialty=String(fd.get('format_specialty')||'').trim(),description=String(fd.get('format_description')||'').trim(),assigned=fd.getAll('format_professional').map(String).filter(Boolean);
  if(!formatName||!formatSpecialty){toast('Escribe el nombre del formato y su especialidad.','warning');return false;}
  const keys=fd.getAll('schema_key').map(String),labels=fd.getAll('schema_label').map(String),groups=fd.getAll('schema_group').map(String),types=fd.getAll('schema_type').map(String),icons=fd.getAll('schema_icon').map(String),placeholders=fd.getAll('schema_placeholder').map(String),mins=fd.getAll('schema_min').map(String),maxs=fd.getAll('schema_max').map(String),optionTexts=fd.getAll('schema_options').map(String),required=fd.getAll('schema_required').map(String),includePlan=fd.getAll('schema_include_plan').map(String),includeLabsSummary=fd.getAll('schema_include_labs_summary').map(String),includePrescription=fd.getAll('schema_include_prescription').map(String);
  if(!keys.length){toast('Agrega al menos un campo al formato.','warning');return false;}if(keys.length>100){toast('Un formato no puede tener más de 100 campos.','warning');return false;}
  const schema=[],seen=new Set();
  for(let i=0;i<keys.length;i++){
   const key=keys[i].trim(),label=labels[i].trim();if(!key||!label){toast('Todos los campos deben tener nombre.','warning');return false;}if(seen.has(key)){toast(`La clave ${key} está duplicada.`, 'warning');return false;}seen.add(key);
   const opts=optionTexts[i].split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map(line=>{const ix=line.indexOf('|');return ix>=0?{icon:line.slice(0,ix).trim()||'🔹',label:line.slice(ix+1).trim()}:{icon:'🔹',label:line};}).filter(o=>o.label);
   if(['choice','chips','foodfreq'].includes(types[i])&&!opts.length){toast(`El campo “${label}” usa botones, pero no tiene opciones. Agrega al menos una opción o cambia el tipo de respuesta.`, 'warning');return false;}
   const min=Number(mins[i]||0),max=Number(maxs[i]||10);if(types[i]==='scale'&&(!Number.isFinite(min)||!Number.isFinite(max)||max<=min)){toast(`La escala “${label}” debe tener un máximo mayor que el mínimo.`, 'warning');return false;}
   schema.push({key,label,group:groups[i].trim()||'Documento',type:types[i],icon:icons[i].trim()||'📝',placeholder:placeholders[i].trim(),options:opts,required:required[i]==='1',include_in_professional_plan:includePlan[i]==='1',include_in_labs_summary:includeLabsSummary[i]==='1',include_in_prescription:includePrescription[i]==='1',document_destinations:[...(includeLabsSummary[i]==='1'?['labs_summary']:[]),...(includePrescription[i]==='1'?['prescription']:[])],min,max});
  }
  let documentActions;try{documentActions=collectDocumentActionConfigsFromForm(fd,schema);}catch(err){toast(err.message,'warning',8000);return false;}
  const seenAssigned=new Set();for(const uid of assigned){if(!seenAssigned.has(uid))seenAssigned.add(uid);}
  const clinicians=new Set((state.professionals||[]).filter(p=>p.role==='clinician'&&p.active!==false).map(p=>p.id));if([...seenAssigned].some(uid=>!clinicians.has(uid))){toast('Uno de los profesionales seleccionados ya no está activo. Actualiza la pantalla y vuelve a asignar.','warning');return false;}
  const duplicate=(state.clinicalFormats||[]).find(f=>f.id!==format?.id&&String(f.name||'').trim().toLocaleLowerCase('es-MX')===formatName.toLocaleLowerCase('es-MX')&&String(f.specialty||'').trim().toLocaleLowerCase('es-MX')===formatSpecialty.toLocaleLowerCase('es-MX')&&(f.assigned_professional_ids||[]).some(uid=>seenAssigned.has(uid)));if(duplicate){toast('Ese profesional ya tiene asignado otro formato con el mismo nombre y especialidad. Cambia el nombre para que pueda distinguirlos al abrir una atención.','warning');return false;}
  const enableLabs=fd.get('format_enable_labs')==='on',enableProfessionalPlan=fd.get('format_enable_professional_plan')==='on';
  if(enableLabs&&!schema.some(isLaboratoryField)){toast('Para habilitar la orden de laboratorios, agrega al formato al menos un campo cuyo nombre o sección identifique laboratorio, gabinete, estudios o pruebas.','warning',9000);return false;}
  if(enableProfessionalPlan&&!schema.some(field=>field.include_in_professional_plan)){toast('Para habilitar el plan profesional, marca al menos un campo en “Incluir este campo al generar el plan profesional”.','warning',9000);return false;}
  const actionLabels={prescription:String(fd.get('format_action_label_prescription')||'').trim()||defaultFormatActionLabels(formatSpecialty).prescription,labs:String(fd.get('format_action_label_labs')||'').trim()||defaultFormatActionLabels(formatSpecialty).labs,professional_plan:String(fd.get('format_action_label_professional_plan')||'').trim()||defaultFormatActionLabels(formatSpecialty).professional_plan};
  if(Object.values(actionLabels).some(label=>label.length>80)){toast('Los nombres de los botones no pueden superar 80 caracteres.','warning');return false;}
  const at=nowIso(),record={ownerUid:state.ownerUid,name:formatName,specialty:formatSpecialty,description,schema,assigned_professional_ids:[...seenAssigned],enable_prescription:fd.get('format_enable_prescription')==='on',enable_labs:enableLabs,enable_professional_plan:enableProfessionalPlan,action_labels:actionLabels,active:true,is_legacy:false,format_schema_version:2,updated_at:at};
  const formatId=format?.id||doc(collection(db,CLINICAL_FORMATS_COLLECTION)).id;
  try{
   if(format){await updateDoc(doc(db,CLINICAL_FORMATS_COLLECTION,formatId),record);}else await setDoc(doc(db,CLINICAL_FORMATS_COLLECTION,formatId),{...record,is_legacy:false,created_by:state.currentUser.uid,created_at:at});
   const actionSettings=normalizeDocumentActionSettings(state.documentActionSettings),nextFormats={...actionSettings.formats};nextFormats[formatId]=documentActions;
   try{await saveDocumentActionSettings({...actionSettings,formats:nextFormats});}
   catch(configErr){console.error('Formato guardado, pero sus acciones personalizadas no se sincronizaron.',configErr);toast(`El formato se guardó, pero no se guardaron los documentos personalizados: ${friendlyError(configErr)}. Vuelve a editarlo y guarda nuevamente.`,'warning',11000);return true;}
   await writeAudit(format?'ACTUALIZAR_FORMATO_CLINICO':'CREAR_FORMATO_CLINICO','',formatId);toast(format?'Formato actualizado.':'Formato creado desde cero.');await renderTemplates();return true;
  }catch(err){console.error(err);toast('No se pudo guardar el formato. '+friendlyError(err),'error',9000);return false;}
 }});
}

async function deleteClinicalFormat(formatId){
 const format=state.clinicalFormats.find(f=>f.id===formatId);if(!format||state.user?.role!=='admin')return;
 if(!confirm(`¿Eliminar el formato “${format.name}”?\n\nEsta acción elimina la plantilla del catálogo. Las consultas y documentos ya guardados en expedientes se conservarán con su nombre y campos históricos. Primero se comprobará que no existan borradores abiertos que dependan de este formato.`))return;
 try{
  // No borrar una plantilla si deja borradores guardados sin posibilidad de reabrirlos.
  const draftsSnap=await getDocs(query(collection(db,'consultas'),where('ownerUid','==',state.ownerUid),where('status','==','draft')));
  const dependentDrafts=draftsSnap.docs.filter(d=>String(d.data()?.payload?.format_id||'')===format.id);
  if(dependentDrafts.length){toast(`No se puede eliminar “${format.name}” todavía: ${dependentDrafts.length} borrador(es) guardado(s) dependen de él. Finaliza esos documentos o cámbialos a otro formato antes de eliminar la plantilla.`,'warning',11000);return;}
  await deleteDoc(doc(db,CLINICAL_FORMATS_COLLECTION,format.id));
  const actionSettings=normalizeDocumentActionSettings(state.documentActionSettings),nextFormats={...actionSettings.formats};
  if(Object.prototype.hasOwnProperty.call(nextFormats,format.id)){delete nextFormats[format.id];try{await saveDocumentActionSettings({...actionSettings,formats:nextFormats});}catch(cleanErr){console.warn('El formato se eliminó, pero no se pudo limpiar su asignación de documentos reutilizables.',cleanErr);toast('El formato se eliminó, pero quedó una asignación huérfana en el catálogo. Puedes retirarla al editar la configuración.','warning',9000);}}
  await writeAudit('ELIMINAR_FORMATO_CLINICO','',format.id);toast(`Formato “${format.name}” eliminado. Los expedientes y documentos finalizados se conservaron.`);await renderTemplates();
 }catch(err){console.error(err);toast('No se pudo eliminar el formato. '+friendlyError(err),'error',9000);}
}
async function renderCustomization(){
 if(state.user?.role!=='admin')return;await loadProfessionals(true);const root=$('#page-content');const uniqueNav=new Map();Object.values(ROLE_NAV).flat().forEach(([id,label])=>{if(!uniqueNav.has(id))uniqueNav.set(id,label);});
 const colorKeys=Array.from(new Set([...Object.keys(DEFAULT_UI_SETTINGS.roleColors),...state.professionals.map(p=>p.specialty).filter(Boolean)]));
 const labelKeys=Array.from(uniqueNav.entries());const orderRoles=Object.keys(ROLE_NAV);const actionLabelKeys=[['start','Iniciar consulta'],['finish_visit','Finalizar consulta']];
 root.innerHTML=pageHeading('Diseño, colores y palabras','Personaliza el acento de cada espacio, los nombres de las opciones y el orden del panel. Los cambios se guardan en Firestore para todos los equipos de la clínica.','ADMINISTRACIÓN / PERSONALIZACIÓN')+
 `<form id="ui-customize-form" class="panel"><div class="panel-head"><div><h3>Colores por espacio profesional</h3><p>El color de un profesional clínico se determina por su especialidad.</p></div></div><div class="form-grid three">${colorKeys.map((key,i)=>`<label class="form-field color-setting"><span>${esc(key)}</span><input type="color" name="color_${i}" value="${esc(state.uiSettings.roleColors?.[key]||DEFAULT_UI_SETTINGS.roleColors[key]||'#2463a6')}" required><input type="hidden" name="color_key_${i}" value="${esc(key)}"></label>`).join('')}</div><div class="divider-label">Palabras de navegación</div><p class="hint">Cambia los nombres que ve el personal. Las claves entre paréntesis son internas; no se imprimen en la interfaz.</p><div class="form-grid two">${labelKeys.map(([id,label],i)=>`<label class="form-field"><span>${esc(label)} <small>(${esc(id)})</small></span><input name="nav_label_${i}" value="${fieldVal(state.uiSettings.navLabels,id)||esc(label)}" maxlength="70"><input type="hidden" name="nav_id_${i}" value="${esc(id)}"></label>`).join('')}</div><div class="divider-label">Botones del flujo de consulta</div><p class="hint">Personaliza el inicio y el cierre de la atención. El botón Generar y las acciones de receta, laboratorio y plan se configuran individualmente dentro de cada formato clínico.</p><div class="form-grid two">${actionLabelKeys.map(([id,label],i)=>`<label class="form-field"><span>${esc(label)}</span><input name="action_label_${i}" value="${esc(state.uiSettings.actionLabels?.[id]||DEFAULT_UI_SETTINGS.actionLabels[id])}" maxlength="70"><input type="hidden" name="action_id_${i}" value="${esc(id)}"></label>`).join('')}</div><div class="divider-label">Orden del panel por tipo de usuario</div><p class="hint">Escribe los identificadores separados por comas. Los elementos que omitas se conservarán al final. Identificadores válidos: ${Array.from(new Set(Object.values(ROLE_NAV).flat().map(x=>x[0]))).map(esc).join(', ')}.</p><div class="form-grid two">${orderRoles.map(role=>`<label class="form-field"><span>${esc(ROLES[role]||role)}</span><input name="order_${esc(role)}" value="${esc((state.uiSettings.navOrder?.[role]||ROLE_NAV[role].map(x=>x[0])).join(', '))}"></label>`).join('')}</div><div class="actions" style="margin-top:18px"><button class="btn primary" type="submit">Guardar personalización</button><button class="btn" type="button" id="ui-reset-defaults">Restaurar valores predeterminados</button><button class="btn ghost" type="button" id="ui-open-templates">Personalizar historia clínica</button></div></form>`;
 $('#ui-customize-form').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget),next={...state.uiSettings,roleColors:{...(state.uiSettings.roleColors||{})},navLabels:{...(state.uiSettings.navLabels||{})},navOrder:{...(state.uiSettings.navOrder||{})},clinicalLabels:{...(state.uiSettings.clinicalLabels||{})},actionLabels:{...DEFAULT_UI_SETTINGS.actionLabels,...(state.uiSettings.actionLabels||{})}};
  for(let i=0;i<colorKeys.length;i++){const key=String(fd.get(`color_key_${i}`)||'');const value=String(fd.get(`color_${i}`)||'');if(key&&/^#[0-9a-fA-F]{6}$/.test(value))next.roleColors[key]=value;}
  for(let i=0;i<labelKeys.length;i++){const id=String(fd.get(`nav_id_${i}`)||'');const label=String(fd.get(`nav_label_${i}`)||'').trim();if(id&&label)next.navLabels[id]=label;}
  for(let i=0;i<actionLabelKeys.length;i++){const id=String(fd.get(`action_id_${i}`)||'');const label=String(fd.get(`action_label_${i}`)||'').trim();if(id&&label)next.actionLabels[id]=label;}
  for(const role of orderRoles){const valid=new Set(ROLE_NAV[role].map(x=>x[0]));const order=String(fd.get(`order_${role}`)||'').split(',').map(x=>x.trim()).filter((x,i,a)=>valid.has(x)&&a.indexOf(x)===i);next.navOrder[role]=order;}
  try{await saveSetting('clinic_ui',next);state.uiSettings=next;applyUiSettings();buildNavigation();renderUserIdentity();await renderCustomization();toast('Personalización sincronizada con Firestore.');await writeAudit('ACTUALIZAR_PERSONALIZACION_INTERFAZ');}catch(err){toast('No se pudo guardar la personalización. '+friendlyError(err),'error',8000);}
 };
 $('#ui-reset-defaults').onclick=async()=>{if(!confirm('¿Restaurar colores, textos y orden predeterminados?'))return;try{const next=structuredClone(DEFAULT_UI_SETTINGS);next.clinicalSchemas={...(state.uiSettings?.clinicalSchemas||{})};next.clinicalSchemaComplete={...(state.uiSettings?.clinicalSchemaComplete||{})};next.clinicalActions={...(state.uiSettings?.clinicalActions||{})};await saveSetting('clinic_ui',next);state.uiSettings=next;applyUiSettings();buildNavigation();await renderCustomization();toast('Se restauraron los valores predeterminados.');}catch(err){toast(friendlyError(err),'error');}};
 $('#ui-open-templates').onclick=()=>goView('templates');
}
function templateBuilderOptionText(options){return (options||[]).map(o=>`${o.icon||'🔹'}|${o.label||''}`).join('\n');}
function templateBuilderRow(field,index,showDestinations=false){
 const types=[['textarea','Texto amplio'],['text','Texto corto'],['number','Número'],['date','Fecha'],['choice','Botones · elegir uno'],['chips','Botones · elegir varios'],['scale','Escala numérica'],['foodfreq','Frecuencia por alimento (0 a 7 / semana)'],['foodplan','Plan alimentario · tabla de seis opciones']];
 return `<section class="template-builder-row" data-schema-row><div class="template-builder-row-head"><strong>Campo ${index+1}</strong><div class="template-builder-row-actions"><button type="button" class="btn small" data-schema-up title="Subir">↑</button><button type="button" class="btn small" data-schema-down title="Bajar">↓</button><button type="button" class="btn small danger" data-schema-remove>Eliminar</button></div></div><div class="form-grid two"><label class="form-field"><span>Clave técnica (no modificar)</span><input name="schema_key" value="${esc(field.key)}" readonly></label><label class="form-field"><span>Nombre del campo *</span><input name="schema_label" value="${esc(field.label)}" required maxlength="120"></label><label class="form-field"><span>Grupo / sección</span><input name="schema_group" value="${esc(field.group||'Historia clínica')}" maxlength="100"></label><label class="form-field"><span>Tipo de respuesta</span><select name="schema_type">${types.map(([v,l])=>`<option value="${v}" ${field.type===v?'selected':''}>${l}</option>`).join('')}</select></label><label class="form-field"><span>Icono del campo</span><input name="schema_icon" value="${esc(field.icon||'📝')}" maxlength="8" placeholder="🩺"></label><label class="form-field"><span>Texto de ayuda / ejemplo</span><input name="schema_placeholder" value="${esc(field.placeholder||'')}" maxlength="220"></label><label class="form-field"><span>Valor mínimo (para escalas)</span><input name="schema_min" type="number" step="any" value="${Number.isFinite(Number(field.min))?field.min:0}"></label><label class="form-field"><span>Valor máximo (para escalas)</span><input name="schema_max" type="number" step="any" value="${Number.isFinite(Number(field.max))?field.max:10}"></label><label class="form-field span-2"><span>Opciones de botones (solo para elegir uno o varios)</span><textarea name="schema_options" rows="3" placeholder="🩸|Diabetes&#10;❤️|Hipertensión">${esc(templateBuilderOptionText(field.options))}</textarea><small class="hint">Una opción por línea. Formato: emoji|texto. Ejemplo: 🩸|Diabetes. Se muestran como botones gráficos.</small></label><label class="check-label span-2"><input type="checkbox" data-schema-required ${field.required?'checked':''}> Campo obligatorio para generar este formato</label><input type="hidden" name="schema_required" value="${field.required?'1':'0'}"><label class="check-label span-2"><input type="checkbox" data-schema-plan-include ${field.include_in_professional_plan?'checked':''}> Incluir este campo al generar el plan profesional (si el formato tiene esa acción)</label><input type="hidden" name="schema_include_plan" value="${field.include_in_professional_plan?'1':'0'}">${showDestinations?`<div class="form-field span-2"><strong>Usar también este campo en documentos secundarios</strong><label class="check-label"><input type="checkbox" data-schema-labs-summary ${field.include_in_labs_summary||field.document_destinations?.includes('labs_summary')?'checked':''}> Incluir en el resumen clínico de la orden de laboratorios</label><input type="hidden" name="schema_include_labs_summary" value="${field.include_in_labs_summary||field.document_destinations?.includes('labs_summary')?'1':'0'}"><label class="check-label"><input type="checkbox" data-schema-prescription ${field.include_in_prescription||field.document_destinations?.includes('prescription')?'checked':''}> Incluir en la receta / documento de prescripción</label><input type="hidden" name="schema_include_prescription" value="${field.include_in_prescription||field.document_destinations?.includes('prescription')?'1':'0'}"></div>`:''}</div></section>`;
}
function openTemplateLabelsModal(initialSpecialty='Fisioterapia'){
 if(state.user?.role!=='admin'){toast('Solo administración puede modificar formatos clínicos.','warning');return;}
 const specialties=Array.from(new Set([...SPECIALTIES,...state.professionals.map(p=>p.specialty).filter(Boolean)])).filter(s=>s!=='Enfermería');
 const initial=specialties.includes(initialSpecialty)?initialSpecialty:(specialties[0]||'Fisioterapia');
 openModal('Editor completo de formatos clínicos',`<p class="muted">Modifica totalmente la estructura de la especialidad seleccionada, incluida Medicina. Puedes crear, eliminar, renombrar, reordenar y agrupar campos, elegir el tipo de respuesta y configurar botones con iconos. La ficha de identificación y la somatometría compartidas no se editan aquí.</p><div class="form-grid"><label class="form-field span-2"><span>Especialidad / formato</span><select name="builder_specialty" required>${optionList(specialties,initial)}</select></label></div><div class="inline-note"><strong>Cómo crear botones rápidos</strong><span>Elige “Botones · elegir uno” o “Botones · elegir varios”. En Opciones escribe una por línea con el formato emoji|texto, por ejemplo: 🦴|Dolor articular. Puedes cambiar todos los textos e iconos.</span></div><label class="check-label" style="display:flex;gap:10px;align-items:center;margin:12px 0"><input type="checkbox" id="template-labs-enabled"> Permitir a esta especialidad generar orden de laboratorios / gabinete</label><div id="template-builder-list" class="template-builder-list"></div><div class="actions"><button type="button" class="btn" id="template-builder-add">＋ Agregar campo</button></div>`,{size:'wide',buttons:[{action:'cancel',label:'Cancelar'},{action:'save',label:'Guardar formato',primary:true}],afterOpen:root=>{
  const sel=$('select[name="builder_specialty"]',root),list=$('#template-builder-list',root),add=$('#template-builder-add',root);
  const render=sp=>{const defs=getTemplateDefinitions(sp);list.innerHTML=defs.map((f,i)=>templateBuilderRow(f,i)).join('');const labs=$('#template-labs-enabled',root);if(labs)labs.checked=isClinicalActionEnabled(sp,'labs');};
  render(sel.value);sel.addEventListener('change',()=>render(sel.value));
  add.onclick=()=>{const rows=$$('[data-schema-row]',list);const index=rows.length+1;const key=`campo_${slugify(sel.value)}_${index}`;const field={key,label:'Nuevo campo',group:'Nueva sección',type:'textarea',icon:'📝',options:[],required:false,placeholder:''};list.insertAdjacentHTML('beforeend',templateBuilderRow(field,index-1));};
  list.addEventListener('click',e=>{const row=e.target.closest('[data-schema-row]');if(!row)return;if(e.target.closest('[data-schema-remove]')){row.remove();}else if(e.target.closest('[data-schema-up]')){const prev=row.previousElementSibling;if(prev)list.insertBefore(row,prev);}else if(e.target.closest('[data-schema-down]')){const next=row.nextElementSibling;if(next)list.insertBefore(next,row);}});
  list.addEventListener('change',e=>{const row=e.target.closest('[data-schema-row]');if(!row)return;if(e.target.matches('[data-schema-required]')){const hidden=$('input[name="schema_required"]',row);if(hidden)hidden.value=e.target.checked?'1':'0';}if(e.target.matches('[data-schema-plan-include]')){const hidden=$('input[name="schema_include_plan"]',row);if(hidden)hidden.value=e.target.checked?'1':'0';}});
 },onAction:async(action,fd)=>{
  if(action!=='save')return true;
  const specialty=String(fd.get('builder_specialty')||'');if(!specialty||specialty==='Enfermería'){toast('Selecciona una especialidad clínica.','warning');return false;}
  const keys=fd.getAll('schema_key').map(String),labels=fd.getAll('schema_label').map(String),groups=fd.getAll('schema_group').map(String),types=fd.getAll('schema_type').map(String),icons=fd.getAll('schema_icon').map(String),placeholders=fd.getAll('schema_placeholder').map(String),mins=fd.getAll('schema_min').map(String),maxs=fd.getAll('schema_max').map(String),optionTexts=fd.getAll('schema_options').map(String),required=fd.getAll('schema_required').map(String),includePlan=fd.getAll('schema_include_plan').map(String);
  if(!keys.length){toast('El formato debe conservar al menos un campo.','warning');return false;}
  const schema=[],seen=new Set();
  for(let i=0;i<keys.length;i++){
   const key=keys[i].trim(),label=labels[i].trim();if(!key||!label){toast('Todos los campos deben tener nombre.','warning');return false;}if(seen.has(key)){toast(`La clave ${key} está duplicada.`, 'warning');return false;}seen.add(key);
   const opts=optionTexts[i].split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map(line=>{const ix=line.indexOf('|');return ix>=0?{icon:line.slice(0,ix).trim()||'🔹',label:line.slice(ix+1).trim()}:{icon:'🔹',label:line};}).filter(o=>o.label);
   if(['choice','chips','foodfreq'].includes(types[i])&&!opts.length){toast(`El campo “${label}” usa botones, pero no tiene opciones. Agrega al menos una opción o cambia el tipo de respuesta.`, 'warning');return false;}
   const min=Number(mins[i]||0),max=Number(maxs[i]||10);if(types[i]==='scale'&&(!Number.isFinite(min)||!Number.isFinite(max)||max<=min)){toast(`La escala “${label}” debe tener un máximo mayor que el mínimo.`, 'warning');return false;}
   schema.push({key,label,group:groups[i].trim()||'Historia clínica',type:types[i],icon:icons[i].trim()||'📝',placeholder:placeholders[i].trim(),options:opts,required:required[i]==='1',include_in_professional_plan:includePlan[i]==='1',min,max});
  }
  const next={...state.uiSettings,clinicalSchemas:{...(state.uiSettings?.clinicalSchemas||{}),[specialty]:schema},clinicalSchemaComplete:{...(state.uiSettings?.clinicalSchemaComplete||{}),[specialty]:true},clinicalActions:{...(state.uiSettings?.clinicalActions||{}),[specialty]:{...(state.uiSettings?.clinicalActions?.[specialty]||{}),labsEnabled:!!$('#template-labs-enabled')?.checked}}};
  try{await saveSetting('clinic_ui',next);state.uiSettings=next;await writeAudit('ACTUALIZAR_ESTRUCTURA_FORMATO_CLINICO','',specialty);toast(`Formato de ${specialty} guardado. Se aplicará a nuevas consultas; las notas históricas permanecen intactas.`);return true;}catch(err){toast('No se pudo guardar el formato. '+friendlyError(err),'error',8000);return false;}
 }});
}
async function saveSetting(key,value){const ref=doc(db,'configuracion',key),snap=await getDoc(ref);if(snap.exists())await updateDoc(ref,{value,updated_at:nowIso()});else await setDoc(ref,{ownerUid:state.ownerUid,value,updated_at:nowIso()});}
async function loadCustomCatalogs(){try{const snap=await getDocs(query(collection(db,'catalogos'),where('ownerUid','==',state.ownerUid),where('kind','==','quick_text')));state.customCatalogs=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.active!==false);const el=$('#catalog-content');if(el)el.innerHTML=state.customCatalogs.length?`<div class="table-wrap"><table><thead><tr><th>Texto</th><th>Detalle</th><th>Estado</th>${state.user.role==='admin'?'<th></th>':''}</tr></thead><tbody>${state.customCatalogs.map(c=>`<tr><td>${esc(c.label||'')}</td><td>${esc(c.detail||'')}</td><td>${c.active===false?'Inactivo':'Activo'}</td>${state.user.role==='admin'?`<td><button class="btn small danger" data-catalog-deactivate="${esc(c.id)}">Desactivar</button></td>`:''}</tr>`).join('')}</tbody></table></div>`:`<div class="empty-state"><strong>Sin textos rápidos personalizados</strong><p>Los textos predeterminados siguen disponibles en la aplicación de escritorio; esta vista muestra las opciones web guardadas en Firestore.</p></div>`;$$('[data-catalog-deactivate]').forEach(b=>b.onclick=()=>deactivateCatalog(b.dataset.catalogDeactivate));}catch(err){const el=$('#catalog-content');if(el)el.innerHTML=`<p class="muted">${esc(friendlyError(err))}</p>`;}}
function openCatalogModal(){if(state.user.role!=='admin'){toast('Solo administración puede administrar catálogos.','warning');return;}openModal('Añadir texto rápido',`<div class="form-grid"><div class="form-field"><label>Nombre / etiqueta *</label><input name="label" required maxlength="150"></div><div class="form-field span-2"><label>Texto o detalle *</label><textarea name="detail" required rows="4"></textarea></div></div>`,{buttons:[{action:'cancel',label:'Cancelar'},{action:'save',label:'Guardar',primary:true}],onAction:async(action,fd)=>{if(action!=='save')return true;const label=String(fd.get('label')||'').trim(),detail=String(fd.get('detail')||'').trim();if(!label||!detail){toast('Completa etiqueta y texto.','warning');return false;}if(state.customCatalogs.some(c=>c.label.toLocaleLowerCase()===label.toLocaleLowerCase())){toast('Ya existe un texto con esa etiqueta.','warning');return false;}await setDoc(doc(collection(db,'catalogos')),{ownerUid:state.ownerUid,kind:'quick_text',label,detail,active:true,created_at:nowIso()});await writeAudit('AGREGAR_TEXTO_RAPIDO');toast('Texto rápido añadido.');await renderTemplates();return true;}});}
async function deactivateCatalog(id){if(state.user.role!=='admin')return;if(!confirm('¿Desactivar este texto rápido? No se borrará el historial.'))return;try{await updateDoc(doc(db,'catalogos',id),{active:false,updated_at:nowIso()});await writeAudit('DESACTIVAR_CATALOGO','',id);toast('Catálogo desactivado.');await loadCustomCatalogs();}catch(err){toast(friendlyError(err),'error');}}

async function renderAllPatients(){
 if(state.user.role==='clinician')return renderClinicianDirectory();
 if(state.user.role!=='admin')return;
 const root=$('#page-content');
 root.innerHTML=pageHeading('Todos los pacientes','Vista administrativa de los expedientes de esta clínica. Administración puede consultar su historial y eliminar expedientes de forma definitiva.','ADMINISTRACIÓN / EXPEDIENTES')+
 `<div class="inline-note warning-note"><strong>Acciones destructivas</strong><span>Eliminar un paciente borra de Firestore su ficha, visitas, notas, valoraciones y solicitudes de interconsulta vinculadas. No se puede deshacer desde la web; genera y valida un respaldo antes.</span></div><div class="card-grid" id="admin-patient-stats"></div><div class="panel"><div class="panel-head"><div><h3>Directorio completo de pacientes</h3><p id="admin-patient-count">Cargando expedientes autorizados…</p></div><div class="actions"><button class="btn ghost small" id="admin-sync-summaries">↻ Actualizar directorio compartido</button><button class="btn ghost small" id="admin-patients-refresh">↻ Actualizar</button></div></div><div id="admin-sync-message" class="hint" role="status"></div><div class="toolbar"><div class="search-box"><input type="search" id="admin-patient-search" placeholder="Buscar por nombre, folio, servicio o profesional…" aria-label="Buscar pacientes de la clínica"></div><select class="small-select" id="admin-patient-specialty"><option value="">Todas las especialidades</option>${optionList(specialtyOptions(),'')}</select></div><div id="admin-patient-table"><div class="empty-state"><span class="spinner"></span><p>Consultando pacientes…</p></div></div></div>`;
 $('#admin-patients-refresh').onclick=()=>renderAllPatients();$('#admin-sync-summaries').onclick=()=>syncClinicSummariesFromButton();
 try{
  const snap=await getDocs(query(collection(db,'pacientes'),where('ownerUid','==',state.ownerUid)));
  state.adminPatients=snap.docs.map(d=>({id:d.id,...d.data(),payload:d.data().payload||{}})).sort((a,b)=>patientName(a.payload).localeCompare(patientName(b.payload),'es-MX'));
  // One-time, administrator-authorized backfill for existing records created before v0.3.1.
  if(!state.summariesSyncedAt){try{const result=await syncClinicOperationalSummaries(true);$('#admin-sync-message').textContent=`Directorio y resumen de sala actualizados: ${result.patients} pacientes y ${result.visits} visitas revisadas.`;}catch(syncErr){console.warn('No se pudo inicializar el directorio operativo',syncErr);$('#admin-sync-message').textContent='No se completó la inicialización automática; pulsa “Actualizar directorio compartido” después de revisar las reglas actuales de Firestore.';}}
  const specialties=new Set(state.adminPatients.map(p=>String(p.last_service_specialty||'Sin asignar')));
  $('#admin-patient-stats').innerHTML=[['Total de pacientes',state.adminPatients.length,'Todos los expedientes de la clínica','♙'],['Especialidades presentes',specialties.size,'Según la última asignación','▦'],['Sin asignación registrada',state.adminPatients.filter(p=>!p.last_assigned_professional_id).length,'Revisar el dato de asignación','!']].map(([label,value,foot,icon])=>`<div class="stat-card"><span class="stat-icon">${icon}</span><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-foot">${foot}</div></div>`).join('');
  const filter=$('#admin-patient-specialty');const specialtyOptions=Array.from(new Set([...SPECIALTIES,...specialties])).sort((a,b)=>a.localeCompare(b,'es-MX'));filter.innerHTML='<option value="">Todas las especialidades</option>'+optionList(specialtyOptions,'');
  $('#admin-patient-count').textContent=`${state.adminPatients.length} expediente(s) de toda la clínica.`;$('#admin-patient-search').addEventListener('input',renderAllPatientsTable);filter.addEventListener('change',renderAllPatientsTable);renderAllPatientsTable();await writeAudit('CONSULTAR_DIRECTORIO_COMPLETO_PACIENTES');
 }catch(err){console.error(err);$('#admin-patient-count').textContent='No se pudo cargar el directorio.';$('#admin-patient-table').innerHTML=`<div class="inline-note warning-note"><strong>Acceso denegado o consulta fallida.</strong><span>${esc(friendlyError(err))} Revisa que estén publicadas las reglas incluidas con BRIMA HC HOME 0.3.12.1.</span></div>`;}
}
async function syncClinicSummariesFromButton(){const el=$('#admin-sync-message');if(el)el.textContent='Actualizando directorio y estado operativo…';try{const result=await syncClinicOperationalSummaries(true);if(el)el.textContent=`Completado: ${result.patients} directorios de pacientes y ${result.visits} visitas verificadas.`;toast('Directorio compartido y sala de espera actualizados.');if(state.view==='patients'&&state.user.role==='admin')await renderAllPatients();}catch(err){if(el)el.textContent='No se pudo actualizar. '+friendlyError(err);toast(friendlyError(err),'error',8000);}}
async function renderClinicianDirectory(){
 const root=$('#page-content');root.innerHTML=`<section class="history-directory-shell"><div class="directory-header"><div><div class="eyebrow eyebrow-spaced">EXPEDIENTES AUTORIZADOS</div><h2>Historias clínicas</h2><p>Abre el expediente o corrige una nota ya guardada sin crear una nueva visita en la sala de espera.</p></div><button id="clinician-directory-refresh" class="btn ghost small">↻ Actualizar</button></div><div class="directory-tools"><div class="search-box"><input type="search" id="clinician-directory-search" placeholder="Buscar por nombre…" aria-label="Buscar pacientes"></div><span id="clinician-directory-count" class="directory-count">Cargando…</span></div><div id="clinician-directory-table" class="patient-directory-list"><div class="room-loading"><span class="spinner"></span><span>Cargando expedientes…</span></div></div></section>`;
 $('#clinician-directory-refresh').onclick=()=>renderClinicianDirectory();
 try{
  const assignedSnap=await getDocs(query(collection(db,'pacientes_directorio'),where('ownerUid','==',state.ownerUid),where('assigned_professional_id','==',state.currentUser.uid)));
  state.patientGrantIds=new Set();
  state.directoryPatients=assignedSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.display_name||'').localeCompare(String(b.display_name||''),'es-MX'));
  $('#clinician-directory-count').textContent=`${state.directoryPatients.length} paciente(s)`;
  $('#clinician-directory-search').addEventListener('input',renderClinicianDirectoryTable);renderClinicianDirectoryTable();
 }catch(err){console.error(err);$('#clinician-directory-count').textContent='No se pudo cargar';$('#clinician-directory-table').innerHTML=`<div class="inline-note warning-note"><strong>No se pudo cargar el directorio.</strong><span>${esc(friendlyError(err))} Pide al administrador que revise el directorio compartido y las reglas de Firestore.</span></div>`;}
}
async function chooseExistingNoteToEdit(patientId){
 try{
  if(state.user?.role!=='clinician')return;
  const patient=await loadPatientDoc(patientId,true);if(!patient||patient._restricted)throw new Error('No tienes acceso al expediente.');
  if(patient.last_assigned_professional_id!==state.currentUser.uid)throw new Error('Solo el profesional responsable puede corregir sus notas originales; las historias recibidas por interconsulta son de solo lectura.');
  const snap=await getDocs(query(collection(db,'consultas'),where('ownerUid','==',state.ownerUid),where('patient_id','==',patientId)));
  const notes=snap.docs.map(d=>({id:d.id,...d.data()})).filter(n=>n.author_id===state.currentUser.uid&&n.assigned_professional_id===state.currentUser.uid&&!String(n.interconsultation_request_id||'')).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
  if(!notes.length){toast('Este paciente aún no tiene una historia clínica elaborada por tu cuenta. Abre una consulta desde la sala cuando el paciente acuda.','warning',7000);return;}
  const html=`<p class="muted">Selecciona la nota que deseas corregir. Se actualizará el mismo registro y se conservará la versión anterior.</p><div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Estado</th><th></th></tr></thead><tbody>${notes.map(n=>`<tr><td>${esc(formatDate(n.created_at))}</td><td>${esc(n.kind||n.payload?.note_type||'Nota')}</td><td>${n.status==='finalized'?'Finalizada':'Borrador'}</td><td><button class="btn small primary" data-edit-existing-note="${esc(n.id)}">Editar esta historia</button></td></tr>`).join('')}</tbody></table></div>`;
  openModal('Editar historia clínica existente',html,{size:'wide',buttons:[{action:'close',label:'Cerrar'}],afterOpen:root=>{$$('[data-edit-existing-note]',root).forEach(btn=>btn.addEventListener('click',()=>{const note=notes.find(n=>n.id===btn.dataset.editExistingNote);closeModal('choose-existing-note');if(note)editExistingClinicalNote(note,patient); }));},onAction:async()=>true});
 }catch(err){console.error(err);toast('No se pudo preparar la edición. '+friendlyError(err),'error',8000);}
}
async function editExistingClinicalNote(note,patientDoc=null){
 try{
  if(state.user?.role!=='clinician')throw new Error('Solo un profesional clínico puede editar su propia nota.');
  const freshSnap=await getDoc(doc(db,'consultas',note.id));if(!freshSnap.exists())throw new Error('La nota ya no existe.');note={id:freshSnap.id,...freshSnap.data()};
  if(note.author_id!==state.currentUser.uid||note.assigned_professional_id!==state.currentUser.uid||String(note.interconsultation_request_id||''))throw new Error('Esta historia no pertenece a tu autoría o es una interconsulta de solo lectura.');
  const patient=patientDoc||await loadPatientDoc(note.patient_id,true);if(!patient||patient._restricted)throw new Error('No tienes acceso vigente al paciente.');
  let visit=note.visit_id?await loadVisitDoc(note.visit_id):null;if(!visit)visit={id:note.visit_id||`historico_${note.id}`,patient_id:note.patient_id,status:'Atendido',service_specialty:note.specialty,assigned_professional_id:state.currentUser.uid,interconsultation_request_id:''};
  let triage=null;if(note.payload?.triage_snapshot)triage={payload:note.payload.triage_snapshot};else if(note.visit_id){try{triage=await getTriage(note.visit_id);}catch(_){}}
  const mode=note.payload?.note_mode||(String(note.payload?.note_type||note.kind||'').toLocaleLowerCase('es-MX').includes('ambulatoria')?'ambulatory':'full');
  const historicalFormat={id:String(note.payload?.format_id||''),name:String(note.payload?.format_name||`Historia clínica · ${note.specialty||'Medicina'}`),specialty:note.specialty||'',schema:normaliseClinicalFormatSchema(note.payload?.format_schema_snapshot?.length?note.payload.format_schema_snapshot:getTemplateDefinitions(note.specialty||'Medicina')),enable_prescription:note.payload?.enable_prescription===true,enable_labs:note.payload?.enable_labs===true,enable_professional_plan:note.payload?.enable_professional_plan===true,action_labels:formatActionLabels({action_labels:note.payload?.action_labels},note.specialty),is_legacy:!note.payload?.format_id};openNoteEditor(visit,patient.payload,triage,note,note.specialty||state.user.profile?.specialty||'Medicina',mode,true,historicalFormat);
 }catch(err){console.error(err);toast('No se pudo abrir la edición. '+friendlyError(err),'error',8000);}
}
function renderClinicianDirectoryTable(){
 const el=$('#clinician-directory-table');if(!el)return;
 const term=String($('#clinician-directory-search')?.value||'').trim().toLocaleLowerCase('es-MX');
 const rows=state.directoryPatients.filter(p=>(p.assigned_professional_id===state.currentUser.uid||state.patientGrantIds.has(p.patient_id||p.id))&&(!term||String(p.display_name||'').toLocaleLowerCase('es-MX').includes(term)));
 if(!rows.length){el.innerHTML=`<div class="directory-empty"><span>▣</span><strong>${term?'No hay coincidencias':'Todavía no tienes pacientes asignados'}</strong><p>${term?'Prueba con otra parte del nombre.':'Cuando Recepción registre un paciente y Enfermería termine la somatometría, aparecerá aquí.'}</p></div>`;return;}
 el.innerHTML=rows.map(p=>{const id=p.patient_id||p.id;const shared=state.patientGrantIds.has(id)&&p.assigned_professional_id!==state.currentUser.uid;return `<article class="patient-directory-row"><div class="directory-patient-name"><span class="directory-patient-avatar">${esc(initials(p.display_name||'Paciente'))}</span><strong>${esc(p.display_name||'Paciente')}</strong></div><div class="directory-patient-actions"><button class="btn primary small" data-clinician-patient-history="${esc(id)}">Abrir historia clínica</button>${shared?'':`<button class="btn small" data-clinician-patient-edit="${esc(id)}">Editar Historia Clínica</button><button class="btn small danger" data-clinician-patient-delete-request="${esc(id)}">Solicitar eliminación</button>`}</div></article>`;}).join('');
 $$('[data-clinician-patient-history]',el).forEach(b=>b.onclick=()=>{state.selectedPatientId=b.dataset.clinicianPatientHistory;state.historyReturnView='history';goView('history');});
 $$('[data-clinician-patient-edit]',el).forEach(b=>b.onclick=()=>chooseExistingNoteToEdit(b.dataset.clinicianPatientEdit));
 $$('[data-clinician-patient-delete-request]',el).forEach(b=>b.onclick=()=>requestPatientHistoryDeletion(b.dataset.clinicianPatientDeleteRequest));
}
async function openClinicianPatient(patientId){if(state.user?.role!=='clinician')return;try{const patient=await loadPatientDoc(patientId,true);if(!patient||patient._restricted)throw new Error('No tienes acceso a la identificación de este paciente.');const grant=state.patientGrantIds.has(patientId),primary=patient.last_assigned_professional_id===state.currentUser.uid;if(!grant&&!primary)throw new Error('El paciente aparece en el directorio, pero no está asignado a tu cuenta ni tienes interconsulta vigente.');showClinicianPatientDetails(patient);}catch(err){toast(friendlyError(err),'error',7000);}}

async function startNewEncounterFromHistory(patientId,mode='full'){
 if(state.user?.role!=='clinician')return;try{
  const specialty=String(state.user.profile?.specialty||'').trim();if(!specialty)throw new Error('Completa tu especialidad en Mi perfil.');
  const patient=await loadPatientDoc(patientId,true);if(!patient||patient._restricted)throw new Error('No tienes acceso vigente a este expediente.');
  if(patient.last_assigned_professional_id!==state.currentUser.uid)throw new Error('Solo el profesional responsable puede iniciar una nueva atención desde este directorio.');
  let prefill=null;
  const previousSnap=await getDocs(query(collection(db,'consultas'),where('ownerUid','==',state.ownerUid),where('patient_id','==',patientId)));
  const previous=previousSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.updated_at||b.created_at||'').localeCompare(String(a.updated_at||a.created_at||'')))[0];
  if(previous?.payload){const previousFields=previous.payload.fields||{},commonKeys=new Set([...COMMON_CLINICAL_SCHEMA_FIELDS.map(f=>f.key),...MEDICAL_HISTORY_FIELDS.map(([k])=>k)]),commonFields=Object.fromEntries(Object.entries(previousFields).filter(([k])=>commonKeys.has(k)));const history={...(previous.payload.history_backup||{}),...commonFields};prefill={payload:{...previous.payload,fields:commonFields,history_backup:history,format_id:'',format_name:''}};}
  const id=crypto.randomUUID(),at=nowIso(),visit={id,ownerUid:state.ownerUid,patient_id:patientId,status:'Consulta',created_at:at,updated_at:at,closed_at:'',service_specialty:specialty,assigned_professional_id:state.currentUser.uid,interconsultation_request_id:''};
  const batch=writeBatch(db);batch.set(doc(db,'visitas',id),visit);addRoomSummaryToBatch(batch,id,visit);await batch.commit();state.selectedVisitId=id;await writeAudit(mode==='ambulatory'?'INICIAR_CONSULTA_AMBULATORIA_DESDE_HISTORIAL':'INICIAR_HISTORIA_ACTUAL_DESDE_HISTORIAL',patientId,id);await loadQueue(true);await chooseClinicalFormatForVisit(visit,patient.payload,null,specialty,{prefill,mode});
 }catch(err){console.error(err);toast('No se pudo iniciar una nueva atención. '+friendlyError(err),'error',8000);}
}
async function requestPatientHistoryDeletion(patientId){
 if(state.user?.role!=='clinician')return;try{
  const patient=await loadPatientDoc(patientId,true);if(!patient||patient._restricted)throw new Error('No tienes autorización para solicitar esta acción sobre el expediente.');
  if(patient.last_assigned_professional_id!==state.currentUser.uid)throw new Error('La solicitud solo puede iniciarla el profesional responsable del expediente.');
  const reason=prompt(`Solicitar al administrador la eliminación definitiva del historial de ${patientName(patient.payload)}.

Indica el motivo de la solicitud:`);if(reason===null)return;if(!reason.trim()){toast('Escribe un motivo para la solicitud.','warning');return;}
  const ref=doc(collection(db,'solicitudes_eliminacion_historial'));const at=nowIso();await setDoc(ref,{ownerUid:state.ownerUid,patient_id:patientId,patient_name:patientName(patient.payload),requester_uid:state.currentUser.uid,requester_name:state.user.profile?.full_name||state.user.email||'Profesional',requester_specialty:state.user.profile?.specialty||'',reason:reason.trim().slice(0,1000),status:'pending',created_at:at,updated_at:at});await writeAudit('SOLICITAR_ELIMINACION_HISTORIAL',patientId,ref.id);toast('Solicitud enviada al administrador para su autorización.');
 }catch(err){console.error(err);toast('No se pudo enviar la solicitud. '+friendlyError(err),'error',8000);}
}
async function renderDeletionRequests(){
 if(state.user?.role!=='admin')return;const root=$('#page-content');root.innerHTML=pageHeading('Solicitudes de eliminación de historial','El administrador revisa el motivo, confirma la decisión y, si aprueba, elimina en forma definitiva el expediente y los registros clínicos vinculados.','ADMINISTRACIÓN / PRIVACIDAD');
 try{const snap=await getDocs(query(collection(db,'solicitudes_eliminacion_historial'),where('ownerUid','==',state.ownerUid)));const rows=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
  root.innerHTML+=rows.length?`<div class="panel"><div class="panel-head"><div><h3>Solicitudes recibidas</h3><p>${rows.filter(r=>r.status==='pending'||r.status==='approved').length} pendiente(s) o en proceso</p></div><button class="btn ghost" id="delete-requests-refresh">↻ Actualizar</button></div><div class="table-wrap"><table><thead><tr><th>Paciente</th><th>Solicitante</th><th>Motivo</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.patient_name||shortId(r.patient_id))}</td><td>${esc(r.requester_name||shortId(r.requester_uid))}<div class="table-secondary">${esc(r.requester_specialty||'')}</div></td><td>${esc(r.reason||'—')}</td><td>${esc(formatDate(r.created_at))}</td><td><span class="badge ${r.status==='pending'?'status-consulta':r.status==='approved'?'status-enfermeria':'status-atendido'}">${esc(r.status||'pending')}</span></td><td><div class="table-actions">${r.status==='pending'?`<button class="btn small primary" data-delete-approve="${esc(r.id)}">Aprobar y eliminar</button><button class="btn small danger" data-delete-reject="${esc(r.id)}">Rechazar</button>`:''}${r.status==='approved'?`<button class="btn small primary" data-delete-approve="${esc(r.id)}">Reintentar eliminación</button>`:''}</div></td></tr>`).join('')}</tbody></table></div></div>`:`<div class="panel"><div class="panel-head"><div><h3>Solicitudes recibidas</h3><p>No hay solicitudes registradas.</p></div><button class="btn ghost" id="delete-requests-refresh">↻ Actualizar</button></div><div class="empty-state"><strong>Todo al día</strong><p>Las solicitudes de eliminación que envíen los profesionales aparecerán aquí.</p></div></div>`;
  $('#delete-requests-refresh').onclick=()=>renderDeletionRequests();$$('[data-delete-approve]').forEach(b=>b.onclick=()=>resolveHistoryDeletion(b.dataset.deleteApprove,true));$$('[data-delete-reject]').forEach(b=>b.onclick=()=>resolveHistoryDeletion(b.dataset.deleteReject,false));
 }catch(err){console.error(err);root.innerHTML+=`<div class="inline-note warning-note"><strong>No se pudieron cargar las solicitudes.</strong><span>${esc(friendlyError(err))}</span></div>`;}
}
async function resolveHistoryDeletion(requestId,approve){
 if(state.user?.role!=='admin')return;try{const ref=doc(db,'solicitudes_eliminacion_historial',requestId),snap=await getDoc(ref);if(!snap.exists())throw new Error('La solicitud ya no existe.');const r=snap.data();if(r.ownerUid!==state.ownerUid)throw new Error('La solicitud no pertenece a esta clínica.');
  if(!approve){if(!confirm('¿Rechazar esta solicitud de eliminación? El expediente clínico se conservará.'))return;await deleteDoc(ref);await writeAudit('RECHAZAR_SOLICITUD_ELIMINACION_HISTORIAL',r.patient_id,requestId);toast('Solicitud rechazada; el expediente se conserva.');await renderDeletionRequests();return;}
  if(r.status==='pending')await updateDoc(ref,{status:'approved',resolved_at:nowIso(),resolved_by_uid:state.currentUser.uid,updated_at:nowIso()});
  const patient=await loadPatientDoc(r.patient_id,true);if(!patient||patient._restricted){await deleteDoc(ref);toast('El expediente ya no existe o no está disponible; se cerró la solicitud.','warning');await renderDeletionRequests();return;}
  const removed=await deletePatientCascade(patient);if(removed){/* La cascada elimina también esta solicitud, por patient_id. No volver a borrar el mismo documento. */await writeAudit('APROBAR_SOLICITUD_ELIMINACION_HISTORIAL_COMPLETADA',r.patient_id,requestId);toast('Solicitud aprobada y expediente eliminado definitivamente.');await renderDeletionRequests();}
 }catch(err){console.error(err);toast('No se pudo resolver la solicitud. '+friendlyError(err),'error',9000);}
}
function showClinicianPatientDetails(patient){const p=patient.payload||{};const fields=PATIENT_FIELDS.map(([key,label])=>`<div class="form-field"><label>${esc(label)}</label><div class="note-preview">${esc(p[key]||'—')}</div></div>`).join('');openModal(`Expediente autorizado · ${patientName(p)}`,`<div class="inline-note"><strong>Acceso clínico autorizado</strong><span>Solo lectura de identificación desde el directorio. La consulta clínica se abre desde Sala de espera cuando existe una visita asignada o de interconsulta.</span></div><div class="form-grid">${fields}<div class="form-field"><label>Servicio responsable</label><div class="note-preview">${esc(patient.last_service_specialty||'—')}</div></div><div class="form-field"><label>Profesional responsable</label><div class="note-preview">${esc(safeNameFromProfessional(patient.last_assigned_professional_id))}</div></div></div>`,{size:'wide',buttons:[{action:'close',label:'Cerrar'},{action:'history',label:'Historial del paciente',primary:true}],onAction:async action=>{if(action==='history'){state.selectedPatientId=patient.id;goView('history');}return true;}});writeAudit('VER_IDENTIFICACION_PACIENTE_AUTORIZADO',patient.id,'');}
function renderAllPatientsTable(){
 const el=$('#admin-patient-table');if(!el)return;const search=String($('#admin-patient-search')?.value||'').trim().toLocaleLowerCase('es-MX'),specialty=String($('#admin-patient-specialty')?.value||'');
 const rows=state.adminPatients.filter(p=>{if(specialty&&String(p.last_service_specialty||'Sin asignar')!==specialty)return false;const q=[patientName(p.payload),p.id,p.last_service_specialty,safeNameFromProfessional(p.last_assigned_professional_id),p.payload?.phone,p.payload?.curp].join(' ').toLocaleLowerCase('es-MX');return !search||q.includes(search);});
 if(!rows.length){el.innerHTML=`<div class="empty-state"><div class="empty-icon">⌕</div><strong>${search||specialty?'Sin resultados con esos filtros':'No hay pacientes registrados'}</strong><p>${search||specialty?'Prueba otro nombre, folio, servicio o profesional.':'Cuando se registren expedientes aparecerán aquí.'}</p></div>`;return;}
 el.innerHTML=`<div class="table-wrap"><table><thead><tr><th>Folio</th><th>Paciente</th><th>Fecha de nacimiento</th><th>Servicio / especialidad</th><th>Profesional responsable</th><th>Última actualización</th><th>Acciones</th></tr></thead><tbody>${rows.map(p=>`<tr><td><span class="table-primary">${esc(shortId(p.id))}</span></td><td><div class="table-primary">${esc(patientName(p.payload))}</div><div class="table-secondary">${esc(p.payload?.phone||'Sin teléfono registrado')}</div></td><td>${esc(p.payload?.dob||'—')}</td><td>${esc(p.last_service_specialty||'Sin asignar')}</td><td>${esc(safeNameFromProfessional(p.last_assigned_professional_id))}</td><td>${esc(formatDate(p.updated_at||p.created_at))}</td><td><div class="table-actions"><button class="btn small" data-admin-patient-detail="${esc(p.id)}">Ver datos</button><button class="btn small" data-admin-patient-edit="${esc(p.id)}">Editar</button><button class="btn small" data-admin-patient-history="${esc(p.id)}">Historial</button><button class="btn small danger" data-admin-patient-delete="${esc(p.id)}">Eliminar</button></div></td></tr>`).join('')}</tbody></table></div><p class="hint" style="margin-top:12px">Mostrando ${rows.length} de ${state.adminPatients.length} pacientes de esta clínica.</p>`;
 $$('[data-admin-patient-detail]',el).forEach(b=>b.onclick=()=>{const patient=state.adminPatients.find(p=>p.id===b.dataset.adminPatientDetail);if(patient)showAdminPatientDetails(patient);});$$('[data-admin-patient-edit]',el).forEach(b=>b.onclick=()=>{const patient=state.adminPatients.find(p=>p.id===b.dataset.adminPatientEdit);if(patient)openPatientForm('edit',patient);});$$('[data-admin-patient-history]',el).forEach(b=>b.onclick=()=>{state.selectedPatientId=b.dataset.adminPatientHistory;goView('history');});$$('[data-admin-patient-delete]',el).forEach(b=>b.onclick=()=>{const patient=state.adminPatients.find(p=>p.id===b.dataset.adminPatientDelete);if(patient)deletePatientCascade(patient);});
}
function showAdminPatientDetails(patient){
 if(state.user?.role!=='admin'||!patient||patient.ownerUid!==state.ownerUid){toast('El expediente no pertenece a esta clínica o no tienes autorización.','error');return;}
 const p=patient.payload||{},fields=PATIENT_FIELDS.map(([key,label])=>`<div class="form-field"><label>${esc(label)}</label><div class="note-preview">${esc(p[key]||'—')}</div></div>`).join('');
 openModal(`Expediente · ${patientName(p)}`,`<div class="inline-note warning-note"><strong>Vista administrativa</strong><span>Administración puede consultar el historial clínico de esta clínica. Eliminar el expediente borra sus registros relacionados y requiere confirmación explícita y respaldo previo.</span></div><div class="form-grid">${fields}<div class="divider-label">Asignación actual</div><div class="form-field"><label>Servicio / especialidad</label><div class="note-preview">${esc(patient.last_service_specialty||'Sin asignar')}</div></div><div class="form-field"><label>Profesional responsable</label><div class="note-preview">${esc(safeNameFromProfessional(patient.last_assigned_professional_id))}</div></div><div class="form-field"><label>Folio completo</label><div class="note-preview">${esc(patient.id)}</div></div><div class="form-field"><label>Registrado</label><div class="note-preview">${esc(formatDate(patient.created_at))}</div></div><div class="form-field"><label>Actualizado</label><div class="note-preview">${esc(formatDate(patient.updated_at))}</div></div></div>`,{size:'wide',buttons:[{action:'close',label:'Cerrar'},{action:'history',label:'Historial clínico'},{action:'delete',label:'Eliminar expediente',danger:true}],onAction:async action=>{if(action==='history'){state.selectedPatientId=patient.id;goView('history');return true;}if(action==='delete'){await deletePatientCascade(patient);return true;}return true;}});writeAudit('VER_IDENTIFICACION_PACIENTE_ADMIN',patient.id,'');
}
async function deletePatientCascade(patient){
 if(state.user?.role!=='admin'||!patient||patient.ownerUid!==state.ownerUid)return false;
 const name=patientName(patient.payload||{});if(!confirm(`ELIMINACIÓN DEFINITIVA

Se borrará de Firestore el expediente de ${name}, sus visitas, notas clínicas, valoraciones e interconsultas vinculadas. No se puede deshacer desde BRIMA.

¿Tienes un respaldo validado y quieres continuar?`))return false;
  const phrase=prompt(`Escribe ELIMINAR para confirmar el expediente ${shortId(patient.id)}:`);if(phrase!=='ELIMINAR'){toast('Eliminación cancelada.','warning');return false;}
 try{
  await writeAudit('ELIMINAR_EXPEDIENTE_PACIENTE_INICIADO',patient.id,'');
  const specs=[['visitas','patient_id'],['consultas','patient_id'],['valoraciones_iniciales','patient_id'],['interconsultas_solicitudes','patient_id'],['paciente_accesos','patient_id'],['interconsultas_recibidas','patient_id'],['solicitudes_eliminacion_historial','patient_id']];const snaps=await Promise.all(specs.map(([col,field])=>getDocs(query(collection(db,col),where('ownerUid','==',state.ownerUid),where(field,'==',patient.id)))));
  const [directorySnap,roomSummarySnap]=await Promise.all([
   getDocs(query(collection(db,'pacientes_directorio'),where('ownerUid','==',state.ownerUid))),
   getDocs(query(collection(db,'sala_resumen'),where('ownerUid','==',state.ownerUid)))
  ]);
  const refs=new Map();snaps.forEach(snap=>snap.docs.forEach(d=>refs.set(d.ref.path,d.ref)));const visitSnap=snaps[0];const visitIds=new Set(visitSnap.docs.map(d=>d.id));
  for(const d of roomSummarySnap.docs){if(visitIds.has(d.data().visit_id||d.id))refs.set(d.ref.path,d.ref);}
  for(const d of directorySnap.docs){if(d.id===patient.id||d.data().patient_id===patient.id)refs.set(d.ref.path,d.ref);}
  const allRefs=Array.from(refs.values());for(let i=0;i<allRefs.length;i+=400){const batch=writeBatch(db);for(const ref of allRefs.slice(i,i+400))batch.delete(ref);await batch.commit();}
  await deleteDoc(doc(db,'pacientes',patient.id));state.patientsCache.delete(patient.id);state.adminPatients=state.adminPatients.filter(p=>p.id!==patient.id);if(state.selectedPatientId===patient.id)state.selectedPatientId='';await writeAudit('ELIMINAR_EXPEDIENTE_PACIENTE_COMPLETADO',patient.id,'');toast('El expediente y sus registros vinculados se eliminaron de Firestore.');if(state.view==='patients')await renderAllPatients();return true;
 }catch(err){console.error(err);toast('No se pudo completar la eliminación. Puede haber registros ya eliminados parcialmente; no repitas sin revisar Firestore. '+friendlyError(err),'error',10000);return false;}
}
async function renderUsers(){if(state.user.role!=='admin')return;const snap=await getDocs(query(collection(db,'usuarios'),where('ownerUid','==',state.ownerUid)));const users=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.profile?.full_name||a.email||'').localeCompare(String(b.profile?.full_name||b.email||''),'es'));$('#page-content').innerHTML=pageHeading('Profesionales y usuarios','Administra perfiles y roles. Las contraseñas no se muestran; al crear una cuenta se envía un correo de restablecimiento de contraseña.','ADMINISTRACIÓN TÉCNICA')+
 `<div class="inline-note"><strong>Mínimo privilegio</strong><span>Desactivar una cuenta bloquea su acceso a BRIMA aunque la cuenta de Firebase Authentication todavía exista. El rol se vuelve a comprobar en Firestore en cada operación.</span></div><div class="panel"><div class="panel-head"><div><h3>Cuentas de la clínica</h3><p>${users.length} perfil(es) registrado(s).</p></div><button class="btn primary" id="user-new">＋ Crear nuevo profesional / cuenta</button></div><div class="table-wrap"><table><thead><tr><th>Profesional</th><th>Correo</th><th>Rol</th><th>Especialidad</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${users.map(u=>`<tr><td><div class="table-primary">${esc(u.profile?.full_name||u.username||u.email||u.id)}</div><div class="table-secondary">UID ${esc(shortId(u.id))}</div></td><td>${esc(u.email||u.username||'—')}</td><td>${esc(ROLES[u.role]||u.role)}</td><td>${esc(u.profile?.specialty||'—')}</td><td><span class="badge ${u.active?'status-atendido':'status-cancelado'}">${u.active?'Activa':'Desactivada'}</span></td><td><div class="table-actions"><button class="btn small" data-user-edit="${esc(u.id)}">Editar</button><button class="btn small" data-user-reset="${esc(u.id)}">Restablecer acceso</button>${u.role==='clinician'?`<button class="btn small danger" data-user-delete="${esc(u.id)}">Eliminar profesional</button>`:''}</div></td></tr>`).join('')}</tbody></table></div></div>`;
 $('#user-new').onclick=openCreateUser;$$('[data-user-edit]').forEach(b=>b.onclick=()=>openEditUser(users.find(u=>u.id===b.dataset.userEdit)));$$('[data-user-reset]').forEach(b=>b.onclick=()=>resetUserPassword(users.find(u=>u.id===b.dataset.userReset)));$$('[data-user-delete]').forEach(b=>b.onclick=()=>deleteSpecialist(users.find(u=>u.id===b.dataset.userDelete)));
}
async function deleteSpecialist(user){
 if(state.user?.role!=='admin'||!user||user.role!=='clinician'||user.id===state.currentUser.uid)return;
 try{
  await loadProfessionals(true);
  const [patientsSnap,visitsSnap,grantInSnap,grantOutSnap,requestsSnap]=await Promise.all([
   getDocs(query(collection(db,'pacientes'),where('ownerUid','==',state.ownerUid),where('last_assigned_professional_id','==',user.id))),
   getDocs(query(collection(db,'visitas'),where('ownerUid','==',state.ownerUid),where('assigned_professional_id','==',user.id))),
   getDocs(query(collection(db,'paciente_accesos'),where('ownerUid','==',state.ownerUid),where('professional_id','==',user.id))),
   getDocs(query(collection(db,'paciente_accesos'),where('ownerUid','==',state.ownerUid),where('granted_by_uid','==',user.id))),
   getDocs(query(collection(db,'interconsultas_solicitudes'),where('ownerUid','==',state.ownerUid)))
  ]);
  const activeGrants=[...grantInSnap.docs,...grantOutSnap.docs].filter(d=>d.data().active===true);
  const unresolvedRequests=requestsSnap.docs.filter(d=>['pending','approved'].includes(d.data().status)&&(d.data().source_professional_id===user.id||d.data().requester_professional_id===user.id));
  if(activeGrants.length||unresolvedRequests.length){
   const blockers=[];if(activeGrants.length)blockers.push(`${activeGrants.length} permiso(s) de interconsulta activo(s)`);if(unresolvedRequests.length)blockers.push(`${unresolvedRequests.length} solicitud(es) pendiente(s) o aprobada(s)`);
   toast('Antes de eliminar, resuelve los accesos de interconsulta relacionados para no dejar permisos abiertos: '+blockers.join('; ')+'.','warning',10000);return;
  }
  const candidates=state.professionals.filter(p=>p.role==='clinician'&&p.active&&p.id!==user.id&&String(p.specialty||'')===String(user.profile?.specialty||user.specialty||''));
  const activeVisits=visitsSnap.docs.filter(d=>ACTIVE_VISIT_STATUSES.includes(d.data().status));
  const successorOptions=candidates.map(p=>`<option value="${esc(p.id)}">${esc(p.full_name||p.username||shortId(p.id))} · ${esc(p.specialty||'')}</option>`).join('');
  const label=user.profile?.full_name||user.email||user.id;
  openModal(`Eliminar profesional · ${label}`,`<div class="inline-note warning-note"><strong>Acción administrativa permanente</strong><span>Se eliminará el perfil de BRIMA. Las notas e historial previos se conservan. La cuenta de Firebase Authentication no se elimina desde el navegador y, si también debe darse de baja, se elimina aparte en Firebase Console.</span></div><div class="form-grid"><div class="form-field span-2"><label>Pacientes actualmente asignados</label><div class="note-preview">${patientsSnap.size} expediente(s)</div></div><div class="form-field span-2"><label>Visitas activas de este especialista</label><div class="note-preview">${activeVisits.length} visita(s)</div></div>${patientsSnap.size?`<div class="form-field span-2"><label>Destino de los pacientes asignados *</label><select name="successor_uid" required><option value="">Selecciona una opción</option>${successorOptions}<option value="__unassigned__">Dejar pacientes sin responsable (requerirán nueva asignación)</option></select><small>El nuevo responsable debe ser de la misma especialidad. Si los dejas sin responsable, no podrán abrir sus expedientes desde una cuenta profesional hasta reasignarlos.</small></div>`:`<p class="span-2 muted">No hay pacientes asignados directamente a este especialista.</p>`}<div class="span-2"><label class="check-label"><input type="checkbox" name="confirm_history" required> Confirmo que las notas históricas se conservarán y que revisé el destino de los pacientes y visitas.</label></div></div>`,{size:'wide',buttons:[{action:'cancel',label:'Cancelar'},{action:'delete',label:'Reasignar y eliminar especialista',danger:true}],onAction:async(action,fd)=>{
   if(action!=='delete')return true;
   if(!fd.get('confirm_history')){toast('Confirma que revisaste el destino de pacientes y la conservación del historial.','warning');return false;}
   const target=patientsSnap.size?String(fd.get('successor_uid')||''):'';
   if(patientsSnap.size&&!target){toast('Selecciona otro profesional o decide dejar los pacientes sin responsable.','warning');return false;}
   let replacement=null;if(target&&target!=='__unassigned__'){replacement=candidates.find(p=>p.id===target&&p.active&&p.role==='clinician');if(!replacement){toast('El profesional de destino ya no está activo. Actualiza e inténtalo otra vez.','error');return false;}}
   if(!confirm(`Se reasignarán ${patientsSnap.size} expediente(s) ${replacement?`a ${replacement.full_name||replacement.id}`:'a “sin responsable”'}; ${activeVisits.length} visita(s) activa(s) ${replacement?'se transferirán':'se cancelarán'} y después se eliminará el perfil de ${label}. ¿Continuar?`))return false;
   const phrase=prompt(`Escribe ELIMINAR para confirmar la baja de ${label}:`);if(phrase!=='ELIMINAR'){toast('Eliminación cancelada.','warning');return false;}
   // Revalidar dependencias inmediatamente antes de escribir.
   const [freshPatients,freshVisits,freshIn,freshOut,freshRequests]=await Promise.all([
    getDocs(query(collection(db,'pacientes'),where('ownerUid','==',state.ownerUid),where('last_assigned_professional_id','==',user.id))),
    getDocs(query(collection(db,'visitas'),where('ownerUid','==',state.ownerUid),where('assigned_professional_id','==',user.id))),
    getDocs(query(collection(db,'paciente_accesos'),where('ownerUid','==',state.ownerUid),where('professional_id','==',user.id))),
    getDocs(query(collection(db,'paciente_accesos'),where('ownerUid','==',state.ownerUid),where('granted_by_uid','==',user.id))),
    getDocs(query(collection(db,'interconsultas_solicitudes'),where('ownerUid','==',state.ownerUid)))
   ]);
   if([...freshIn.docs,...freshOut.docs].some(d=>d.data().active===true)||freshRequests.docs.some(d=>['pending','approved'].includes(d.data().status)&&(d.data().source_professional_id===user.id||d.data().requester_professional_id===user.id)))throw new Error('Apareció una interconsulta activa mientras se preparaba la eliminación. Resuélvela y vuelve a intentar.');
   await writeAudit('ELIMINAR_ESPECIALISTA_BRIMA_INICIADO','',user.id);
   const patientRows=freshPatients.docs.map(d=>({id:d.id,...d.data(),payload:d.data().payload||{}}));
   // Small batches keep Firestore security-rule getAfter calls inside documented batch limits.
   for(let i=0;i<patientRows.length;i+=3){const batch=writeBatch(db);for(const patient of patientRows.slice(i,i+3)){const at=nowIso(),nextUid=replacement?replacement.id:'',authorized=replacement?[replacement.id]:[];const updated={...patient,last_assigned_professional_id:nextUid,authorized_professional_ids:authorized,updated_at:at};batch.update(doc(db,'pacientes',patient.id),{last_assigned_professional_id:nextUid,authorized_professional_ids:authorized,updated_at:at});addPatientDirectoryToBatch(batch,patient.id,updated);}await batch.commit();}
   const freshActive=freshVisits.docs.filter(d=>ACTIVE_VISIT_STATUSES.includes(d.data().status));
   for(let i=0;i<freshActive.length;i+=3){const batch=writeBatch(db);for(const d of freshActive.slice(i,i+3)){const v={id:d.id,...d.data()},at=nowIso();if(replacement){const updated={...v,assigned_professional_id:replacement.id,updated_at:at};batch.update(d.ref,{assigned_professional_id:replacement.id,updated_at:at});addRoomSummaryToBatch(batch,d.id,updated);}else{const updated={...v,assigned_professional_id:'',status:'Cancelado',closed_at:at,updated_at:at};batch.update(d.ref,{assigned_professional_id:'',status:'Cancelado',closed_at:at,updated_at:at});addRoomSummaryToBatch(batch,d.id,updated);}}await batch.commit();}
   // Retirar al profesional de las asignaciones de formatos para no dejar permisos colgantes.
   const formatsSnap=await getDocs(query(collection(db,CLINICAL_FORMATS_COLLECTION),where('ownerUid','==',state.ownerUid)));
   const formatsToUpdate=formatsSnap.docs.filter(d=>Array.isArray(d.data().assigned_professional_ids)&&d.data().assigned_professional_ids.includes(user.id));
   for(let i=0;i<formatsToUpdate.length;i+=400){const batch=writeBatch(db);for(const d of formatsToUpdate.slice(i,i+400)){batch.update(d.ref,{assigned_professional_ids:d.data().assigned_professional_ids.filter(uid=>uid!==user.id),updated_at:nowIso()});}await batch.commit();}
   const final=writeBatch(db);final.delete(doc(db,'usuarios',user.id));final.delete(doc(db,'profesionales',user.id));await final.commit();
   await writeAudit('ELIMINAR_ESPECIALISTA_BRIMA_COMPLETADO','',`${user.id}; pacientes=${patientRows.length}; visitas_activas=${freshActive.length}; formatos_desasignados=${formatsToUpdate.length}; destino=${replacement?.id||'sin_responsable'}`);
   await loadProfessionals(true);toast(`Profesional eliminado de BRIMA. ${patientRows.length} expediente(s) preservados; ${freshActive.length} visita(s) ${replacement?'transferidas':'canceladas'}; ${formatsToUpdate.length} formato(s) desasignados.`, 'success',9000);await renderUsers();
   return true;
  }});
 }catch(err){console.error(err);toast('No se pudo eliminar el especialista. '+friendlyError(err),'error',9000);}
}
function randomPassword(){const bytes=crypto.getRandomValues(new Uint8Array(32));const chars='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';return Array.from(bytes,b=>chars.charAt(b%chars.length)).join('');}
async function openCreateUser(){
 await loadProfessionals(true);
 openModal('Crear cuenta profesional',`<p class="muted">Se crea la cuenta en Firebase Authentication, se registra el perfil en Firestore y se envía un correo para establecer la contraseña. El administrador no recibe la contraseña definitiva.</p><div class="form-grid"><div class="form-field span-2"><label>Correo electrónico *</label><input name="email" type="email" required></div><div class="form-field"><label>Rol *</label><select name="role" required>${optionList(['reception','nursing','clinician'].map(k=>k), 'clinician')}</select></div><div class="form-field"><label>Nombre completo *</label><input name="full_name" required></div><div class="form-field"><label>Profesión</label><input name="profession"></div><div class="form-field"><label>Especialidad *</label><input name="specialty" list="brima-create-specialty-options" maxlength="80" placeholder="Ej. Ginecología, Traumatología, Química clínica">${specialtyDatalist('brima-create-specialty-options')}<small>Escribe una especialidad nueva o selecciona una existente. No estás limitado al catálogo actual.</small></div><div class="form-field"><label>Cédula profesional</label><input name="cedula"></div><div class="form-field"><label>Institución / consultorio</label><input name="institution"></div><div class="form-field"><label>Teléfono</label><input name="phone" type="tel"></div><div class="form-field span-2"><label>Domicilio profesional</label><input name="address"></div></div>`,{size:'wide',buttons:[{action:'cancel',label:'Cancelar'},{action:'create',label:'Crear cuenta y enviar acceso',primary:true}],onAction:async(action,fd)=>{
  if(action!=='create')return true;const email=String(fd.get('email')||'').trim().toLowerCase(),role=String(fd.get('role')||''),fullName=String(fd.get('full_name')||'').trim(),specialty=role==='clinician'?String(fd.get('specialty')||'').trim():'';if(!email||!fullName||!['reception','nursing','clinician'].includes(role)){toast('Completa correo, nombre y rol válido.','warning');return false;}if(role==='clinician'&&!specialty){toast('Para un profesional clínico, selecciona su especialidad.','warning');return false;}
  let provisionAuth=null,credential=null,uid='';try{
   const secondaryName='brima-provision-'+Date.now();const secondaryApp=initializeApp(firebaseConfig,secondaryName);provisionAuth=getAuth(secondaryApp);const generated=randomPassword();credential=await createUserWithEmailAndPassword(provisionAuth,email,generated);uid=credential.user.uid;
   const profile={full_name:fullName,profession:String(fd.get('profession')||''),specialty:role==='clinician'?specialty:'',cedula:String(fd.get('cedula')||''),institution:String(fd.get('institution')||''),address:String(fd.get('address')||''),phone:String(fd.get('phone')||''),email};const at=nowIso();
   await setDoc(doc(db,'usuarios',uid),{username:email,email,role,active:true,ownerUid:state.ownerUid,profile,created_at:at});
   await setDoc(doc(db,'profesionales',uid),{username:email,role,active:true,full_name:fullName,specialty:profile.specialty,profession:profile.profession,ownerUid:state.ownerUid});
   let resetSent=true;try{await sendPasswordResetEmail(auth,email);}catch(resetErr){resetSent=false;console.warn(resetErr);}
   try{await signOut(provisionAuth);}catch{};await writeAudit('CREAR_CUENTA_BRIMA','',uid);toast(resetSent?'Cuenta creada; se envió correo para establecer contraseña.':'Cuenta creada, pero no se confirmó el correo de restablecimiento. Usa “Restablecer acceso”.',resetSent?'success':'warning',7000);await renderUsers();return true;
  }catch(err){console.error(err);if(credential?.user){try{await deleteUser(credential.user);}catch(cleanupErr){console.error('No fue posible eliminar la cuenta Auth incompleta',cleanupErr);}}if(uid){try{await deleteDoc(doc(db,'usuarios',uid));}catch{}try{await deleteDoc(doc(db,'profesionales',uid));}catch{}}toast('No se pudo completar el alta. '+friendlyError(err),'error',9000);return false;}
 }});
}
function openEditUser(user){if(!user)return;const p=user.profile||{};openModal(`Editar usuario · ${user.email||user.username}`,`<div class="form-grid"><div class="form-field span-2"><label>Correo de acceso (no editable)</label><div class="note-preview">${esc(user.email||user.username||'')}</div></div><div class="form-field"><label>Rol</label><select name="role">${optionList(['reception','nursing','clinician'].map(k=>k),user.role==='admin'?'clinician':user.role)}</select></div><div class="form-field"><label>Estado</label><select name="active">${optionList(['true','false'],String(user.active===true))}</select></div><div class="form-field span-2"><label>Nombre completo</label><input name="full_name" required value="${fieldVal(p,'full_name')}"></div><div class="form-field"><label>Profesión</label><input name="profession" value="${fieldVal(p,'profession')}"></div><div class="form-field"><label>Especialidad *</label><input name="specialty" list="brima-edit-specialty-options" maxlength="80" value="${fieldVal(p,'specialty')}" placeholder="Ej. Ginecología, Traumatología">${specialtyDatalist('brima-edit-specialty-options')}<small>Escribe libremente la especialidad profesional.</small></div><div class="form-field"><label>Cédula profesional</label><input name="cedula" value="${fieldVal(p,'cedula')}"></div><div class="form-field"><label>Institución</label><input name="institution" value="${fieldVal(p,'institution')}"></div><div class="form-field"><label>Teléfono</label><input name="phone" value="${fieldVal(p,'phone')}"></div><div class="form-field span-2"><label>Domicilio</label><input name="address" value="${fieldVal(p,'address')}"></div></div><p class="hint">Desactivar el perfil impide entrar a BRIMA. No elimina las notas ni los datos clínicos ya registrados.</p>`,{size:'wide',buttons:[{action:'cancel',label:'Cancelar'},{action:'save',label:'Guardar perfil',primary:true}],onAction:async(action,fd)=>{if(action!=='save')return true;const role=String(fd.get('role')||user.role),active=String(fd.get('active'))==='true',specialty=role==='clinician'?String(fd.get('specialty')||'').trim():'';if(!['reception','nursing','clinician'].includes(role)&&user.id!==state.currentUser.uid){toast('No se puede asignar el rol de administrador a otra cuenta desde esta pantalla.','warning');return false;}if(role==='clinician'&&!specialty){toast('Selecciona una especialidad para el profesional clínico.','warning');return false;}const profile={...p,full_name:String(fd.get('full_name')||'').trim(),profession:String(fd.get('profession')||''),specialty,cedula:String(fd.get('cedula')||''),institution:String(fd.get('institution')||''),phone:String(fd.get('phone')||''),address:String(fd.get('address')||''),email:user.email||user.username};await updateDoc(doc(db,'usuarios',user.id),{role,active,profile,updated_at:nowIso()});await updateDoc(doc(db,'profesionales',user.id),{role,active,full_name:profile.full_name,specialty,profession:profile.profession});await writeAudit('ACTUALIZAR_CUENTA_BRIMA','',user.id);toast('Perfil actualizado.');await loadProfessionals(true);await renderUsers();return true;}});}
async function resetUserPassword(user){if(!user)return;if(!confirm(`Enviar instrucciones para restablecer la contraseña a ${user.email||user.username}?`))return;try{await sendPasswordResetEmail(auth,user.email||user.username);toast('Solicitud de restablecimiento enviada a Firebase.');await writeAudit('SOLICITAR_RESTABLECIMIENTO_CUENTA','',user.id);}catch(err){toast(friendlyError(err),'error');}}

async function renderInventory(){if(state.user.role!=='admin')return;const snap=await getDocs(query(collection(db,'inventario'),where('ownerUid','==',state.ownerUid)));const rows=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.item||'').localeCompare(String(b.item||''),'es'));$('#page-content').innerHTML=pageHeading('Inventario','Control administrativo de insumos. Este módulo no concede permisos de acceso clínico.','ADMINISTRACIÓN / INSUMOS')+
 `<div class="panel"><div class="panel-head"><div><h3>Existencias</h3><p>${rows.length} artículo(s) registrado(s).</p></div><button class="btn primary" id="stock-add">＋ Agregar artículo</button></div>${rows.length?`<div class="table-wrap"><table><thead><tr><th>Artículo</th><th>Lote</th><th>Caducidad</th><th>Cantidad</th><th>Unidad</th><th>Notas</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.item||'')}</td><td>${esc(r.lot||'—')}</td><td>${esc(r.expiry||'—')}</td><td>${esc(r.quantity??'—')}</td><td>${esc(r.unit||'—')}</td><td>${esc(r.notes||'—')}</td><td><button class="btn small danger" data-stock-delete="${esc(r.id)}">Eliminar</button></td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state"><strong>Inventario vacío</strong><p>Agrega los insumos necesarios; se guardarán en Firestore bajo las reglas de administración.</p></div>`}</div>`;
 $('#stock-add').onclick=openStockModal;$$('[data-stock-delete]').forEach(b=>b.onclick=()=>deleteStock(b.dataset.stockDelete));}
function openStockModal(){openModal('Agregar artículo al inventario',`<div class="form-grid"><div class="form-field span-2"><label>Artículo *</label><input name="item" required></div><div class="form-field"><label>Lote</label><input name="lot"></div><div class="form-field"><label>Caducidad</label><input name="expiry" type="date"></div><div class="form-field"><label>Cantidad *</label><input name="quantity" type="number" min="0" step="any" required></div><div class="form-field"><label>Unidad *</label><input name="unit" required placeholder="piezas, cajas, etc."></div><div class="form-field span-2"><label>Notas</label><textarea name="notes"></textarea></div></div>`,{buttons:[{action:'cancel',label:'Cancelar'},{action:'save',label:'Guardar artículo',primary:true}],onAction:async(action,fd)=>{if(action!=='save')return true;const item=String(fd.get('item')||'').trim(),quantity=Number(fd.get('quantity')),unit=String(fd.get('unit')||'').trim();if(!item||!Number.isFinite(quantity)||quantity<0||!unit){toast('Revisa artículo, cantidad y unidad.','warning');return false;}await setDoc(doc(collection(db,'inventario')),{ownerUid:state.ownerUid,item,lot:String(fd.get('lot')||''),expiry:String(fd.get('expiry')||''),quantity,unit,notes:String(fd.get('notes')||''),updated_at:nowIso()});await writeAudit('AGREGAR_INVENTARIO','',item);toast('Artículo guardado.');await renderInventory();return true;}});}
async function deleteStock(id){if(!confirm('¿Eliminar este artículo del inventario?'))return;try{await deleteDoc(doc(db,'inventario',id));await writeAudit('ELIMINAR_INVENTARIO','',id);toast('Artículo eliminado.');await renderInventory();}catch(err){toast(friendlyError(err),'error');}}

function renderBackups(){if(state.user.role!=='admin')return;$('#page-content').innerHTML=pageHeading('Respaldos y recuperación','Los respaldos de Firestore se administran desde Google Cloud/Firebase, no desde una base local del navegador. Esta página no simula una copia de seguridad.','CONTINUIDAD / RECUPERACIÓN')+
 `<div class="inline-note warning-note"><strong>Antes de continuar</strong><span>Realiza exportaciones y restauraciones primero en un proyecto aislado. Una restauración puede modificar colecciones existentes y debe contar con un respaldo verificado previo.</span></div><div class="card-grid"><div class="stat-card"><span class="stat-icon">↗</span><div class="stat-label">Exportación</div><div class="stat-value">Cloud</div><div class="stat-foot">Google Cloud CLI / bucket</div></div><div class="stat-card"><span class="stat-icon">↻</span><div class="stat-label">Restauración</div><div class="stat-value">Validar</div><div class="stat-foot">Proyecto aislado primero</div></div></div><div class="panel"><div class="panel-head"><div><h3>Comandos operativos</h3><p>Ejecuta desde una terminal con Google Cloud CLI configurada y permisos IAM apropiados.</p></div></div><label class="field-label">Exportar la base de datos</label><pre class="note-preview">gcloud firestore export gs://TU_BUCKET/respaldos/brima-$(date +%Y%m%d-%H%M%S) --project=${esc(firebaseConfig.projectId)}</pre><label class="field-label">Importar un respaldo (solo después de validar en un entorno aislado)</label><pre class="note-preview">gcloud firestore import gs://TU_BUCKET/RUTA_DEL_RESPALDO --project=ID_DEL_PROYECTO_DE_PRUEBA</pre><div class="actions"><button class="btn" id="backup-copy-export">Copiar comando de exportación</button><button class="btn" id="backup-guide">Abrir guía de respaldos</button></div></div><div class="panel"><div class="panel-head"><div><h3>Checklist previo a restaurar</h3><p>Confirma cada paso antes de tocar datos clínicos.</p></div></div><div class="form-stack"><label class="check-label"><input type="checkbox"> Confirmé el proyecto, bucket, identidad y permisos de IAM.</label><label class="check-label"><input type="checkbox"> Probé la importación en un proyecto aislado con datos ficticios.</label><label class="check-label"><input type="checkbox"> Verifiqué la integridad y cantidad de registros recuperados.</label><label class="check-label"><input type="checkbox"> Documenté hora, operador y aprobación de la restauración.</label></div></div>`;
 $('#backup-copy-export').onclick=async()=>{const cmd=`gcloud firestore export gs://TU_BUCKET/respaldos/brima-$(date +%Y%m%d-%H%M%S) --project=${firebaseConfig.projectId}`;await navigator.clipboard.writeText(cmd);toast('Comando copiado. Reemplaza TU_BUCKET y ejecuta solo después de validar los permisos.');};$('#backup-guide').onclick=()=>window.open('https://cloud.google.com/firestore/docs/manage-data/export-import','_blank','noopener');}

async function renderAudit(){if(state.user.role!=='admin')return;const snap=await getDocs(query(collection(db,'auditoria'),where('ownerUid','==',state.ownerUid)));const rows=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')));state.auditRows=rows;$('#page-content').innerHTML=pageHeading('Auditoría','Eventos técnicos y de operación registrados por las cuentas de la clínica. No deben contener contraseñas ni secretos.','SEGURIDAD / TRAZABILIDAD')+
 `<div class="panel"><div class="panel-head"><div><h3>Bitácora de actividad</h3><p>${rows.length} evento(s) recuperado(s).</p></div><div class="actions"><button class="btn" id="audit-verify">✓ Verificar hashes</button><button class="btn" id="audit-export">Exportar CSV</button></div></div>${rows.length?`<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Paciente</th><th>Registro</th><th>Hash</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(formatDate(r.at))}</td><td>${esc(r.username||shortId(r.user_id))}</td><td>${esc(r.action||'')}</td><td><span title="Folio completo">${esc(r.patient_id)}</span></td><td>${esc(shortId(r.record_id))}</td><td>${esc(String(r.event_hash||'').slice(0,14))}…</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state"><strong>Sin eventos</strong><p>Los eventos aparecerán aquí cuando la aplicación los registre.</p></div>`}<p id="audit-result" class="hint" style="margin-top:12px"></p></div>`;
 $('#audit-verify').onclick=verifyAuditRows;$('#audit-export').onclick=()=>exportCsv(rows.map(r=>({Fecha:r.at,Usuario:r.username,Accion:r.action,Paciente:r.patient_id,Registro:r.record_id,Hash:r.event_hash})),'brima-auditoria.csv');}
async function verifyAuditRows(){let checked=0,bad=[];for(const r of state.auditRows){const event={at:r.at||'',user_id:r.user_id||'',username:r.username||'',action:r.action||'',patient_id:r.patient_id||'',record_id:r.record_id||'',previous_hash:r.previous_hash||''};const digest=await sha256Text(stableStringify(event));checked++;if(digest!==r.event_hash)bad.push(r.id);}const el=$('#audit-result');el.textContent=bad.length?`Advertencia: ${bad.length} hash(es) no coinciden. Primer documento: ${bad[0]}.`: `Verificación de hash terminada: ${checked} evento(s) revisado(s); todos los hashes coinciden con su contenido visible. Esto no prueba que la bitácora sea inmutable ni completa.`;el.style.color=bad.length?'var(--danger)':'var(--success)';}
function exportCsv(rows,filename){const keys=rows.length?Object.keys(rows[0]):[];const csv=[keys.join(','),...rows.map(r=>keys.map(k=>'"'+String(r[k]??'').replace(/"/g,'""')+'"').join(','))].join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);}

async function renderClinic(){if(state.user.role!=='admin')return;let setting={};try{const snap=await getDoc(doc(db,'configuracion','clinic_profile'));if(snap.exists())setting=snap.data().value||{};}catch(err){console.warn(err);}$('#page-content').innerHTML=pageHeading('Establecimiento','Configura los datos generales que utilizará la interfaz y futuras plantillas de impresión.','ADMINISTRACIÓN / CONFIGURACIÓN')+
 `<div class="panel"><div class="panel-head"><div><h3>Datos del establecimiento</h3><p>Se guardan en configuracion/clinic_profile dentro de la misma clínica.</p></div></div><form id="clinic-form" class="form-grid"><div class="form-field span-2"><label>Nombre del establecimiento</label><input name="name" value="${fieldVal(setting,'name')}"></div><div class="form-field span-2"><label>Domicilio</label><input name="address" value="${fieldVal(setting,'address')}"></div><div class="form-field"><label>Teléfono</label><input name="phone" value="${fieldVal(setting,'phone')}"></div><div class="form-field"><label>Correo</label><input name="email" type="email" value="${fieldVal(setting,'email')}"></div><div class="form-field span-2"><label>Identificador interno</label><input name="internal_id" value="${fieldVal(setting,'internal_id')}"></div><div class="span-2 actions"><button class="btn primary" type="submit">Guardar establecimiento</button></div></form></div>`;
 $('#clinic-form').addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const value=Object.fromEntries(fd.entries());try{await saveSetting('clinic_profile',value);await writeAudit('ACTUALIZAR_ESTABLECIMIENTO');state.user.profile={...state.user.profile,institution:value.name||state.user.profile.institution};renderUserIdentity();toast('Datos del establecimiento guardados.');}catch(err){toast(friendlyError(err),'error');}});}
function renderPrivacy(){const p=state.user.profile||{};$('#page-content').innerHTML=pageHeading('Datos y privacidad','Herramientas de cuenta y límites operativos de esta versión web.','CUENTA / PRIVACIDAD')+
 `<div class="panel"><div class="profile-block"><div class="avatar">${esc(initials(p.full_name||state.user.email))}</div><div><h3>${esc(p.full_name||state.user.email)}</h3><p>${esc(state.user.email||state.user.username)} · ${esc(ROLES[state.user.role])}</p></div></div><div class="form-grid"><div class="form-field"><label>UID autenticado</label><div class="note-preview">${esc(state.currentUser.uid)}</div></div><div class="form-field"><label>Clínica / ownerUid</label><div class="note-preview">${esc(state.ownerUid)}</div></div></div><div class="actions" style="margin-top:18px"><button class="btn" id="privacy-reset">Enviar restablecimiento de contraseña</button><button class="btn" id="privacy-switch-session">Cambiar de sesión</button><button class="btn danger" id="privacy-logout">Cerrar sesión</button></div></div><div class="panel"><div class="panel-head"><div><h3>Notas de privacidad y operación</h3></div></div><div class="form-stack"><div class="inline-note"><strong>Permisos</strong><span>Los botones de la web no son la barrera de seguridad. Cada operación también depende de las reglas Firestore desplegadas en tu proyecto.</span></div><div class="inline-note warning-note"><strong>Exportación</strong><span>No exportes pacientes o notas a equipos compartidos sin autorización. Los archivos descargados pueden salir del perímetro de reglas de Firebase y deben protegerse.</span></div><div class="inline-note warning-note"><strong>Cifrado</strong><span>El cliente web utiliza HTTPS y autenticación Firebase, pero esta entrega no implementa cifrado de extremo a extremo para cada campo clínico. No debe asumirse equivalente al cifrado de campos de la versión local SQLite.</span></div><div class="inline-note"><strong>Validación normativa</strong><span>Esta aplicación es una herramienta de trabajo y no se declara certificada ni como SIRES homologado. La adecuación clínica y jurídica debe validarse para tu operación real.</span></div></div></div>`;
 $('#privacy-reset').onclick=async()=>{try{await sendPasswordResetEmail(auth,state.currentUser.email);toast('Instrucciones para restablecer la contraseña solicitadas.');}catch(err){toast(friendlyError(err),'error');}};$('#privacy-logout').onclick=()=>endSession(false);$('#privacy-switch-session').onclick=()=>endSession(true);}

function renderProfile(){
 const p=state.user.profile||{},isAdmin=state.user.role==='admin',isClinician=state.user.role==='clinician';
 const val=(key)=>fieldVal(p,key);const field=(label,key,type='text',span=false)=>`<div class="form-field ${span?'span-2':''}"><label>${label}</label><input name="${key}" type="${type}" value="${val(key)}" ${isClinician?'disabled':''}></div>`;
 $('#page-content').innerHTML=pageHeading('Mi perfil',isClinician?'La información profesional registrada solo puede modificarla Administración. Puedes solicitar cambios al administrador y restablecer tu contraseña.':'Mantén actualizados los datos de tu cuenta. La especialidad y los permisos deben mantenerse coherentes con la función asignada.','CUENTA / PERFIL PROFESIONAL')+
 `<div class="panel"><div class="profile-block"><div class="avatar">${esc(initials(p.full_name||state.user.email))}</div><div><h3>${esc(p.full_name||state.user.email)}</h3><p>${esc(ROLES[state.user.role])} · ${esc(state.user.email||state.user.username)}</p></div></div>${isClinician?`<div class="inline-note warning-note"><strong>Edición administrada</strong><span>Nombre, profesión, especialidad, cédula, clínica y datos de contacto profesional son de solo lectura para profesionales clínicos. Pide al administrador que modifique estos datos en “Profesionales y usuarios”.</span></div>`:''}<form id="profile-form" class="form-grid"><div class="form-field span-2"><label>Nombre completo</label><input name="full_name" required value="${val('full_name')}" ${isClinician?'disabled':''}></div><div class="form-field"><label>Correo de contacto</label><input name="email" type="email" value="${val('email')||fieldVal(state.user,'email')}" ${isClinician?'disabled':''}></div><div class="form-field"><label>Profesión</label><input name="profession" value="${val('profession')}" ${isClinician?'disabled':''}></div><div class="form-field"><label>Especialidad</label>${isAdmin?`<input name="specialty" list="brima-profile-specialty-options" maxlength="80" value="${val('specialty')}" placeholder="Ej. Ginecología, Traumatología">${specialtyDatalist('brima-profile-specialty-options')}`:`<div class="note-preview">${esc(p.specialty||'No asignada')}</div>`}</div><div class="form-field"><label>Cédula profesional</label>${isAdmin?`<input name="cedula" value="${val('cedula')}">`:`<div class="note-preview">${esc(p.cedula||'Pendiente')}</div>`}</div><div class="form-field"><label>Institución / consultorio</label>${isAdmin?`<input name="institution" value="${val('institution')}">`:`<div class="note-preview">${esc(p.institution||'—')}</div>`}</div><div class="form-field"><label>Teléfono</label><input name="phone" value="${val('phone')}" ${isClinician?'disabled':''}></div><div class="form-field span-2"><label>Domicilio</label><input name="address" value="${val('address')}" ${isClinician?'disabled':''}></div><div class="span-2 actions">${!isClinician?'<button class="btn primary" type="submit">Guardar perfil</button>':''}<button class="btn" id="profile-reset" type="button">Restablecer contraseña</button></div></form></div>`;
 $('#profile-form').addEventListener('submit',async e=>{e.preventDefault();if(isClinician){toast('Solo administración puede modificar la información del profesional.','warning');return;}const fd=new FormData(e.currentTarget);const next={...p,full_name:String(fd.get('full_name')||'').trim(),email:String(fd.get('email')||''),profession:String(fd.get('profession')||''),phone:String(fd.get('phone')||''),address:String(fd.get('address')||'')};if(isAdmin){next.specialty=String(fd.get('specialty')||'');next.cedula=String(fd.get('cedula')||'');next.institution=String(fd.get('institution')||'');}try{await updateDoc(doc(db,'usuarios',state.currentUser.uid),{profile:next,updated_at:nowIso()});const publicUpdate={full_name:next.full_name,profession:next.profession};if(isAdmin)Object.assign(publicUpdate,{specialty:next.specialty});await updateDoc(doc(db,'profesionales',state.currentUser.uid),publicUpdate).catch(err=>{if(state.user.role==='admin')console.warn(err);else throw err;});state.user.profile=next;renderUserIdentity();await writeAudit('ACTUALIZAR_PERFIL');toast('Perfil actualizado.');renderProfile();}catch(err){toast(friendlyError(err),'error',7000);}});
 $('#profile-reset').onclick=async()=>{try{await sendPasswordResetEmail(auth,state.currentUser.email);toast('Se solicitó el restablecimiento de contraseña.');}catch(err){toast(friendlyError(err),'error');}};
}
function openModal(title,body,{size='',buttons=[{action:'cancel',label:'Cancelar'},{action:'save',label:'Guardar',primary:true}],onAction=async()=>true,afterOpen=()=>{},onClose=()=>{},description='',wide=false}={}){
 closeModal('replace');const host=$('#modal-host');state.modalOnClose=onClose;host.innerHTML=`<div class="modal-backdrop"><section class="modal-card ${size==='wide'||wide||size==='clinical'?'wide':''} ${size==='clinical'?'clinical-editor-modal':''} ${size==='narrow'?'narrow':''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-header"><div><h2>${esc(title)}</h2>${description?`<p>${esc(description)}</p>`:''}</div><button class="modal-close" type="button" data-modal-close aria-label="Cerrar">×</button></div><form id="active-modal-form"><div class="modal-body">${body}</div><div class="modal-footer">${buttons.map(b=>`<button type="button" class="btn ${b.primary?'primary':b.danger?'danger':''}" data-modal-action="${esc(b.action)}" ${b.disabled?'disabled data-permanently-disabled="true"':''}>${esc(b.label)}</button>`).join('')}</div></form></section></div>`;
 const backdrop=$('.modal-backdrop',host),form=$('#active-modal-form',host);const escapeClose=e=>{if(e.key==='Escape')closeModal('escape');};document.addEventListener('keydown',escapeClose);state.modalCleanup=()=>document.removeEventListener('keydown',escapeClose);
 $('[data-modal-close]',host).onclick=()=>closeModal('x-button');backdrop.addEventListener('click',e=>{if(e.target===backdrop)closeModal('backdrop');});
 const actionButtons=$$('[data-modal-action]',host);let busy=false;
 const run=async(action)=>{if(busy)return;busy=true;actionButtons.forEach(b=>b.disabled=true);try{const fd=new FormData(form);const result=await onAction(action,fd,form);if(result!==false)closeModal('action:'+action);}catch(err){console.error(err);toast(friendlyError(err),'error',8000);}finally{busy=false;actionButtons.forEach(b=>{if(b.isConnected)b.disabled=Boolean(b.dataset.permanentlyDisabled==='true');});}};
 actionButtons.forEach(btn=>btn.addEventListener('click',()=>{const action=btn.dataset.modalAction;if(action==='cancel'||action==='close'){closeModal('button:'+action);return;}run(action);}));form.addEventListener('submit',e=>{e.preventDefault();const primary=buttons.find(b=>b.primary)||buttons.find(b=>b.action==='save');if(primary)run(primary.action);});
 try{afterOpen(backdrop);}catch(err){console.error(err);}const first=$('input,select,textarea,button',backdrop);if(first)first.focus();return backdrop;
}
function closeModal(reason='dismiss'){
 const host=$('#modal-host');const callback=state.modalOnClose;state.modalOnClose=null;
 if(state.modalCleanup)state.modalCleanup();state.modalCleanup=null;
 // The callback runs while the form is still connected so FormData snapshots remain valid.
 try{if(typeof callback==='function'){const result=callback(reason);if(result&&typeof result.then==='function')result.catch(err=>console.warn('No se completó una acción al cerrar el formulario',err));}}catch(err){console.warn('No se completó una acción al cerrar el formulario',err);}
 if(host)host.innerHTML='';
}

$('#page-content').addEventListener('click',e=>{const nav=e.target.closest('[data-nav]');if(nav)goView(nav.dataset.nav);});
window.addEventListener('online',()=>setSync('Conexión restaurada',true));window.addEventListener('offline',()=>setSync('Sin conexión',false));

// A minimum diagnostic is intentionally non-destructive and does not list clinical records.
window.addEventListener('error',e=>console.error('Error de interfaz BRIMA Web',e.error||e.message));


// Instalación como PWA: solo almacena el shell estático, nunca los expedientes ni respuestas Firestore.
let deferredInstallPrompt = null;
const installButtons = ['#install-app-login', '#install-app-sidebar'].map(sel => document.querySelector(sel)).filter(Boolean);
function updateInstallButtons(show=true){ installButtons.forEach(btn=>btn.classList.toggle('hidden',!show)); }
function isDesktopShell(){ return Boolean(window.brimaDesktop && window.brimaDesktop.isDesktop); }
function isPwaStandalone(){ return Boolean(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || Boolean(navigator.standalone === true); }
function pwaInstallHelp(){
  toast('Para instalar BRIMA como aplicación, abre el sitio por HTTPS en Chrome o Edge y usa el icono Instalar de la barra de direcciones o el menú ⋮ → Instalar BRIMA HC. En Safari de iPhone/iPad usa Compartir → Añadir a pantalla de inicio. La instalación no funciona abriendo el HTML directamente desde una carpeta.', 'info', 9000);
}
async function installBrima(){
  if(isDesktopShell()){ toast('BRIMA ya está abierta como aplicación de escritorio.','info'); return; }
  if(!deferredInstallPrompt){ pwaInstallHelp(); return; }
  const promptEvent=deferredInstallPrompt;deferredInstallPrompt=null;
  try{await promptEvent.prompt();const choice=await promptEvent.userChoice;if(choice?.outcome==='accepted'){updateInstallButtons(false);toast('BRIMA se está instalando en este equipo.','success');}else{toast('La instalación no se completó. Puedes volver a intentarlo desde el botón Instalar.','info');}}catch(err){console.warn('Instalación PWA',err);pwaInstallHelp();}
}
installButtons.forEach(btn=>btn.addEventListener('click',installBrima));
if(isDesktopShell() || isPwaStandalone()) updateInstallButtons(false);
else {
  updateInstallButtons(true);
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;updateInstallButtons(true);});
  window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;updateInstallButtons(false);toast('BRIMA quedó instalada en este equipo.','success');});
  if('serviceWorker' in navigator && location.protocol!=='file:'){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(err=>console.warn('No se pudo registrar el service worker de BRIMA:',err)));
  }
}
