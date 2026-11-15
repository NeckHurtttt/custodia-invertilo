// HEBREO (solo texto, sin voces): diccionario de los textos fijos más vistos, con la frase en español como clave.
// i18n.js lo consulta cuando el idioma es «he»; lo que aún no está aquí se muestra en inglés. Para sumar una frase: copia el texto
// español EXACTO de su T('…') y pon al lado la traducción. Las frases con datos dentro (`${…}`) aceptan un tercer argumento: T(es, en, he).
export const HE = {
  // arranque
  'CUSTODIA OS v4.1 · ESTACIÓN ORBITAL': 'CUSTODIA OS v4.1 · תחנת חלל',
  'MEMORIA ........................ OK': 'זיכרון ........................ תקין',
  'SOPORTE VITAL .................. OK': 'מערכות קיום ................... תקין',
  'ENERGÍA ........................ 71 %': 'אנרגיה ........................ 71 %',
  'ENLACE CON LA TIERRA ........... SEÑAL PERDIDA': 'קשר עם כדור הארץ .............. האות אבד',
  'CLIMA ESPACIAL (NASA DONKI) .... LLAMARADAS DETECTADAS': 'מזג אוויר בחלל (NASA DONKI) ... זוהו התפרצויות שמש',
  'TRIPULACIÓN ................... 3 A BORDO': 'צוות .......................... 3 על הסיפון',
  '> CUSTODIA: "Buenos días, tripulante. Todo está bajo control."': '> CUSTODIA: "בוקר טוב, איש צוות. הכול בשליטה."',
  '> CUSTODIA: "No intenten volver a casa. Es por su bien."': '> CUSTODIA: "אל תנסו לחזור הביתה. זה לטובתכם."',
  '> LA NAVE DE RESCATE LLEGA EN 10 DÍAS.': '> חללית החילוץ מגיעה בעוד 10 ימים.',
  '> MANTÉN VIVA LA BASE.': '> שמרו על הבסיס בחיים.',
  'SIN SEÑAL': 'אין אות', 'ARRANCANDO': 'מאתחל', 'toca o pulsa una tecla para saltar': 'געו במסך או לחצו על מקש כדי לדלג',
  // título
  'ENTRENAMIENTO DE CADETES ASTRONAUTA': 'אימון צוערי אסטרונאוטים',
  'MANTÉN VIVA LA BASE · VUELVE A CASA': 'שמרו על הבסיס בחיים · חזרו הביתה',
  'El rescate llega en 10 días: cumple la rutina, cuida los sistemas y esquiva a la IA que falla.': 'החילוץ מגיע בעוד 10 ימים: עמדו בשגרה, טפלו במערכות והתחמקו מהבינה המלאכותית שהשתבשה.',
  'ELIGE TU DESTINO': 'בחרו יעד', 'ELIGE TU NIVEL': 'בחרו רמה', 'ELEGIDO': 'נבחר', 'Tus estrellas aquí': 'הכוכבים שלכם כאן',
  'REFLEJOS': 'רפלקסים', 'Cuenta atrás en la Estación': 'ספירה לאחור בתחנה',
  'NUEVA PARTIDA': 'משחק חדש', 'JUGAR': 'שחקו', 'COOPERATIVO': 'משחק שיתופי', 'RETO DEL DÍA': 'אתגר היום', 'MEDALLAS': 'מדליות', 'ARCHIVO': 'ארכיון',
  'CÓMO SE JUEGA': 'איך משחקים', 'DATOS NASA': 'נתוני NASA', 'MÁS OPCIONES · modo de juego, personaje, sonido y vista': 'אפשרויות נוספות · מצב משחק, דמות, צליל ותצוגה',
  'CAMPAÑA · 10 días': 'מסע · 10 ימים', 'UNA NOCHE · 7 min': 'לילה אחד · 7 דקות', 'UNA NOCHE': 'לילה אחד', 'RETO': 'אתגר',
  'APRENDER': 'ללמוד', 'ENTRENAMIENTO GUIADO': 'אימון מודרך', 'ENTRENAMIENTO': 'אימון', 'MODO CLASE': 'מצב כיתה', 'PANEL DOCENTE': 'לוח המורה',
  '¿Sabías que…?': 'הידעתם…?', 'INSTALAR': 'התקנה', '✔ Listo para jugar sin internet': '✔ מוכן למשחק בלי אינטרנט',
  // inicio de misión y botones comunes
  'DÍA 1': 'יום 1', '1 · CUMPLE LA RUTINA': '1 · עמדו בשגרה', '2 · ESQUIVA A LA IA': '2 · התחמקו מהבינה המלאכותית', '3 · CUIDA LA BASE': '3 · טפלו בבסיס',
  'CONTROLES': 'מקשים', 'EMPEZAR': 'התחילו', 'A JUGAR': 'לשחק', 'ENTENDIDO': 'הבנתי', 'SALTAR': 'דלגו', 'CERRAR': 'סגירה', 'VOLVER': 'חזרה', 'SALIR': 'יציאה',
  'COPIAR': 'העתקה', 'GUARDAR': 'שמירה', 'QUITAR': 'הסרה', 'DESCARGAR': 'הורדה', 'COMPARTIR': 'שיתוף', 'ENTRAR': 'כניסה', 'CONECTAR': 'התחברות',
  'SÍ': 'כן', 'NO': 'לא', 'HOY': 'היום', 'AHORA': 'עכשיו', 'DÍA': 'יום', 'Día': 'יום',
  // HUD
  'TÚ': 'אתם', 'IA': 'בינה מלאכותית', 'SALUD': 'בריאות', 'TU ENERGÍA': 'האנרגיה שלכם', 'ENERGÍA': 'אנרגיה', 'FUERZA': 'כוח', 'SABER': 'ידע', 'OXÍGENO': 'חמצן',
  'ALERTA': 'כוננות', 'INTEGRIDAD': 'שלמות', 'SISTEMAS': 'מערכות', 'SISTEMAS DE LA BASE': 'מערכות הבסיס', 'TRIPULACIÓN': 'צוות', 'MOCHILA': 'תרמיל',
  'Mochila': 'תרמיל', 'Fabricar': 'בנייה', 'Inhibir': 'שיבוש', 'Mantenim.': 'תחזוקה', 'Plan': 'תוכנית', 'Amenazas': 'איומים', 'Avisos': 'התראות', 'Nombres': 'שמות', 'PAUSA': 'השהיה',
  'REVISIONES DE HOY · 08:00–12:00': 'בדיקות היום · 08:00–12:00', 'Revisar': 'בדקו', 'Duerme en tu cama': 'לכו לישון במיטה', '¡ve!': 'קדימה!', 'pide': 'מבקש', 'contento': 'מרוצה',
  'La nave de rescate llega mañana': 'חללית החילוץ מגיעה מחר', 'Sin amenazas especiales.': 'אין איומים מיוחדים.', 'ESCONDIDO': 'מוסתר',
  'ESCONDIDO · muévete o pulsa F para salir': 'מוסתרים · זוזו או לחצו F כדי לצאת', 'agachado: silencioso y difícil de ver': 'כפופים: שקטים וקשה לראות אתכם',
  'MANTENIMIENTO': 'תחזוקה', 'AMENAZAS': 'איומים', 'PLAN DE REGRESO': 'תוכנית החזרה', 'RUTAS DE ESCAPE': 'נתיבי בריחה', 'HISTORIAL': 'היסטוריה', 'BITÁCORA': 'יומן',
  'FABRICAR': 'בנייה', 'HACER': 'בנו', 'SOLTAR': 'הניחו', '(vacío)': '(ריק)', '(vacía)': '(ריק)', 'LLEVAS': 'אתם נושאים', 'TU ESCONDITE': 'המחבוא שלכם',
  // pausa y ajustes
  'SEGUIR': 'המשיכו', 'AJUSTES': 'הגדרות', 'AYUDA': 'עזרה', 'SALIR AL MENÚ (se guarda)': 'יציאה לתפריט (נשמר)', 'VOLUMEN': 'עוצמת קול', 'Bajar volumen': 'הנמיכו', 'Subir volumen': 'הגבירו',
  'MÚSICA': 'מוזיקה', 'Tecla M': 'מקש M', 'EFECTOS DE SONIDO': 'אפקטים קוליים', 'Pasos, alarmas y avisos': 'צעדים, אזעקות והתראות',
  'EFECTOS VISUALES SUAVES': 'אפקטים חזותיים עדינים', 'Sin sacudidas ni destellos': 'בלי רעידות ובלי הבזקים', 'NOMBRES DE OBJETOS': 'שמות חפצים', 'Tecla N': 'מקש N',
  'CRUZ DE FLECHAS': 'מקשי חצים', 'Si NO, te mueves deslizando el dedo por el mapa': 'אם לא, זזים בגרירת אצבע על המפה',
  // tormenta, final y resultados
  'Tormenta': 'סערה', 'en el refugio': 'במקלט', 'afuera': 'בחוץ', 'refugio': 'מקלט', 'Refugios': 'מקלטים', 'Clima espacial': 'מזג אוויר בחלל', 'CLIMA ESPACIAL REAL': 'מזג אוויר אמיתי בחלל',
  'EN VIVO': 'בשידור חי', 'Fuente': 'מקור', 'dosis': 'מנה', 'Dosis %': 'מנה %',
  '¡VOLVISTE A CASA!': 'חזרתם הביתה!', '¡VOLVIERON A CASA!': 'חזרתם הביתה!', 'MISIÓN PERDIDA': 'המשימה נכשלה', 'QUÉ PASÓ': 'מה קרה', 'de 3 estrellas': 'מתוך 3 כוכבים',
  'JUGAR OTRA VEZ': 'שחקו שוב', 'REINTENTAR': 'נסו שוב', 'MENÚ': 'תפריט', 'CERTIFICADO': 'תעודה', 'COMPARTIR RESULTADO': 'שתפו תוצאה', 'PREGUNTA DE CIERRE': 'שאלת סיכום',
  '✔ ¡Correcto!': '✔ נכון!', '✘ Casi. Ahora ya lo sabes:': '✘ כמעט. עכשיו אתם יודעים:', '¡NUEVO RÉCORD DEL DÍA!': 'שיא יומי חדש!',
  'La tripulación llegó viva al rescate': 'הצוות שרד עד החילוץ', 'Sistemas cuidados (promedio de 70 % o más)': 'המערכות טופלו (ממוצע 70% ומעלה)',
  'Poca radiación (menos de 50 % del límite) y base sana': 'מעט קרינה (פחות מ־50% מהגבול) ובסיס תקין', 'Escapaste de la base': 'ברחתם מהבסיס',
  'La regla ALARA dice: tan poca radiación como sea razonable.': 'כלל ALARA אומר: כמה שפחות קרינה, ככל שסביר.',
  // cooperativo
  'ASTRONAUTA': 'אסטרונאוט', 'CONTROL DE MISIÓN': 'מרכז הבקרה', 'TRIPULANTE': 'איש צוות', 'SEGUNDO JUGADOR': 'שחקן שני', 'DESTINO': 'יעד', 'CONEXIÓN': 'חיבור',
  '🎉 ¡MISIÓN CUMPLIDA!': '🎉 המשימה הושלמה!', '💀 MISIÓN FALLIDA': '💀 המשימה נכשלה', 'AVISAR: ¡AL REFUGIO!': 'התריעו: למקלט!',
};
