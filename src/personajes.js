// PERSONALIDAD de la tripulación: cada compañero tiene su oficio, su forma de ser y su manera de hablar.
// Datos y lógica pura (sin pantalla ni azar propio): la frase sale de un hash de la semilla, el día y la hora, así que es
// determinista y NO consume el azar de la partida. Todo en español e inglés (ver i18n.js). Personajes inventados; sin violencia.
//   tipos de frase: idle · peligro · tormenta · alivio · noche · trabajo · gracias · distrae · traicion · rescate
import { T } from './i18n.js';

const P = (rol, rasgo, frase, lineas) => ({ rol, rasgo, frase, ...lineas });
export const PERSONAS = {
  // ---------- Estación ----------
  'María': P(['Comandante', 'Commander'], ['Calmada y protectora', 'Calm and protective'], ['Con calma, cadete. Un paso a la vez.', 'Easy, cadet. One step at a time.'], {
    idle: [['Con calma. Un paso a la vez.', 'Easy does it. One step at a time.'], ['Tres misiones y nunca perdí a nadie. No empiezo hoy.', 'Three missions and I never lost anyone. Not starting today.'], ['De cadete me tocaba pelar papas. Hoy, la base.', 'As a cadet I peeled potatoes. Today, the base.'], ['Respira hondo: los problemas se achican.', 'Breathe deep: problems get smaller.']],
    peligro: [['¡Con calma! Sigan el protocolo.', 'Stay calm! Follow the protocol.'], ['¡Todos atrás! Yo me encargo.', 'Everyone back! I will handle it.']],
    tormenta: [['¡Al refugio, todos! Sin correr.', 'To the shelter, everyone! No running.'], ['Las partículas no avisan dos veces.', 'Particles do not warn you twice.']],
    alivio: [['Pasó. Buen trabajo, equipo.', 'It passed. Good work, team.']],
    noche: [['A dormir. El cansancio comete errores.', 'Go to sleep. Tired people make mistakes.'], ['Yo hago la guardia un rato más.', 'I will keep watch a little longer.']],
    trabajo: [['Primero lo importante: soporte vital.', 'First things first: life support.'], ['Mantenimiento hecho, base tranquila.', 'Maintenance done, calm base.']],
    gracias: [['Gracias. Sabía que podía contar contigo.', 'Thank you. I knew I could count on you.'], ['Me salvaste el día, cadete.', 'You saved my day, cadet.']],
    distrae: [['Déjamelo a mí: tengo preguntas del reglamento.', 'Leave it to me: I have questions about the rules.'], ['Yo los entretengo. Tú ve.', 'I will keep them busy. You go.']],
    traicion: [['Pensé que eras de los nuestros.', 'I thought you were one of us.']],
    rescate: [['Lo logramos. Todos vivos. Todos.', 'We did it. All alive. All of us.']],
  }),
  'Kenji': P(['Ingeniero', 'Engineer'], ['Bromista y curioso', 'Joker and curious'], ['Si no funciona, le falta cinta adhesiva.', 'If it does not work, it needs more duct tape.'], {
    idle: [['Si no funciona, le falta cinta adhesiva.', 'If it does not work, it needs more duct tape.'], ['Le puse nombre al dron: Pepito. Él no lo sabe.', 'I named the drone Pepito. He does not know.'], ['¿Sabías que un robot no se ríe de mis chistes?', 'Did you know robots do not laugh at my jokes?'], ['Armé un radio con una cuchara. Casi funciona.', 'I built a radio out of a spoon. It almost works.']],
    peligro: [['¡Ay, ay, ay! ¡Eso no estaba en el manual!', 'Uh-oh! That was not in the manual!'], ['¡Alguien traiga cinta... y valentía!', 'Somebody bring tape... and courage!']],
    tormenta: [['¡Corramos! Les gano al refugio.', 'Let us run! I will beat you to the shelter.'], ['¡Mis cejas sienten radiación! ¡Corran!', 'My eyebrows can feel radiation! Run!']],
    alivio: [['Uf. Ahora sí, a chistear de nuevo.', 'Phew. Now I can joke again.']],
    noche: [['Zzz... no, estoy despierto... zzz.', 'Zzz... no, I am awake... zzz.'], ['Cuento satélites en vez de ovejas.', 'I count satellites instead of sheep.']],
    trabajo: [['Filtro limpio. Soy un genio con trapos.', 'Clean filter. I am a genius with rags.'], ['Cada tornillo cuenta. Literalmente.', 'Every screw counts. Literally.']],
    gracias: [['¡Eres lo máximo! Te debo un chiste.', 'You are the best! I owe you a joke.'], ['Te lo recompenso con ingeniería.', 'I will pay you back with engineering.']],
    distrae: [['Voy a contarle un chiste al dron.', 'I am going to tell the drone a joke.'], ['Distracción en marcha: ¡modo payaso!', 'Distraction on its way: clown mode!']],
    traicion: [['Y yo que te iba a regalar mi mejor chiste.', 'And I was going to give you my best joke.']],
    rescate: [['¡Lo logramos! Ahora sí, chiste de celebración.', 'We did it! Now, a celebration joke.']],
  }),
  'Amara': P(['Doctora', 'Doctor'], ['Valiente y optimista', 'Brave and upbeat'], ['Siempre hay una salida. Solo hay que cantarla.', 'There is always a way out. You just have to sing it.'], {
    idle: [['La, la, la... ¡hasta las estrellas bailan!', 'La, la, la... even the stars dance!'], ['Cuida tu salud: agua y buen ánimo.', 'Look after your health: water and good spirits.'], ['Cuando tengo miedo, canto. Funciona.', 'When I am scared, I sing. It works.'], ['Hice 2 horas de bici. ¡Me siento invencible!', 'I did 2 hours on the bike. I feel unbeatable!']],
    peligro: [['¡Calma! ¡Yo ayudo a quien lo necesite!', 'Stay calm! I will help whoever needs it!'], ['¡Yo voy primero!', 'I will go first!']],
    tormenta: [['¡Todos al refugio! ¿Alguien herido?', 'Everyone to the shelter! Anyone hurt?'], ['Respiren. Nos cuidamos entre todos.', 'Breathe. We look after each other.']],
    alivio: [['¡Qué alivio! Revisemos que todos estén bien.', 'What a relief! Let us check everyone is fine.']],
    noche: [['Dulces sueños. Mañana será mejor.', 'Sweet dreams. Tomorrow will be better.'], ['Una canción de cuna para la base...', 'A lullaby for the base...']],
    trabajo: [['Aire limpio, tripulación feliz.', 'Clean air, happy crew.'], ['Un sistema sano es una tripulación sana.', 'A healthy system is a healthy crew.']],
    gracias: [['¡Gracias, cadete! ¡Eres un sol!', 'Thank you, cadet! You are a sunshine!'], ['Esto merece una canción.', 'This deserves a song.']],
    distrae: [['Les cantaré tan lindo que olvidarán su ronda.', 'I will sing so nicely they will forget their round.'], ['Voy a distraerlos... ¡con arte!', 'I will distract them... with art!']],
    traicion: [['Eso dolió más que cualquier herida.', 'That hurt more than any wound.']],
    rescate: [['¡Lo logramos! ¡Cantemos todos!', 'We did it! Everybody sing!']],
  }),
  // ---------- Luna ----------
  'Sofía': P(['Geóloga', 'Geologist'], ['Soñadora y cuidadosa', 'Dreamy and careful'], ['Cada roca lunar guarda una historia de miles de millones de años.', 'Every lunar rock holds a story billions of years old.'], {
    idle: [['Esta roca tiene miles de millones de años.', 'This rock is billions of years old.'], ['Miro la Tierra y pienso: qué pequeña y qué linda.', 'I look at Earth and think: so small, so beautiful.'], ['Anoto todo en mi libreta de rocas.', 'I write everything in my rock notebook.'], ['¿Y si el polvo lunar cuenta secretos?', 'What if the lunar dust tells secrets?']],
    peligro: [['¡Ay! ¡Eso me da mucho susto!', 'Oh! That scares me a lot!'], ['¡Cuidado! ¡Despacio, despacio!', 'Careful! Slowly, slowly!']],
    tormenta: [['¡La radiación! ¡Al refugio, rápido!', 'Radiation! To the shelter, quick!'], ['Mi dosímetro no deja de pitar.', 'My dosimeter will not stop beeping.']],
    alivio: [['Ufff... mi dosímetro dice que estamos bien.', 'Phew... my dosimeter says we are fine.']],
    noche: [['La noche lunar es larguísima. Qué frío.', 'The lunar night is so long. So cold.'], ['Cuento las estrellas: hay millones.', 'I count the stars: there are millions.']],
    trabajo: [['Blindaje de regolito: la roca que nos cuida.', 'Regolith shielding: the rock that looks after us.'], ['Despacito y sin errores.', 'Slow and no mistakes.']],
    gracias: [['¡Mil gracias! Te regalo una piedra... imaginaria.', 'A thousand thanks! I give you a rock... imaginary.'], ['Eres muy amable.', 'You are very kind.']],
    distrae: [['Les enseñaré mi colección de rocas.', 'I will show them my rock collection.'], ['Voy a hacerles una pregunta de geología.', 'I will ask them a geology question.']],
    traicion: [['Ya no sé en quién confiar.', 'I no longer know who to trust.']],
    rescate: [['¡Volvemos a casa! Me llevo mi libreta.', 'We are going home! I am taking my notebook.']],
  }),
  'Nikolai': P(['Minero', 'Miner'], ['Gruñón, pero de buen corazón', 'Grumpy, but kind-hearted'], ['Trabajo duro, estómago lleno.', 'Hard work, full stomach.'], {
    idle: [['Bah. Pura roca y puro frío.', 'Bah. Just rock and cold.'], ['Hoy cocino sopa. Hay sopa para todos.', 'Today I am making soup. There is soup for everyone.'], ['En mis tiempos había menos tecnología. Y más hielo.', 'In my day there was less technology. And more ice.'], ['Si necesitas algo, dilo. Gruñendo, pero ayudo.', 'If you need something, say so. Grumbling, but I help.']],
    peligro: [['¡Maldito polvo! ¡Cuidado ahí!', 'Blasted dust! Watch out!'], ['¡Atrás! ¡Yo me encargo, bah!', 'Back! I will handle it, bah!']],
    tormenta: [['¡Al refugio! Lo digo una vez... bueno, dos.', 'To the shelter! I say it once... well, twice.'], ['Mis huesos sienten la tormenta.', 'My bones can feel the storm.']],
    alivio: [['Bah. Pasó. Ahora, a comer.', 'Bah. It passed. Now, let us eat.']],
    noche: [['La noche lunar dura dos semanas. ¡A la sopa!', 'The lunar night lasts two weeks. Soup time!'], ['Yo vigilo. Ustedes duerman.', 'I will watch. You sleep.']],
    trabajo: [['Trabajo bien hecho no necesita aplauso.', 'Good work needs no applause.'], ['El que repara, vive.', 'Whoever repairs, lives.']],
    gracias: [['Bah... gracias. Toma, una sopita.', 'Bah... thanks. Here, a little soup.'], ['No digas nada. Pero gracias.', 'Do not say anything. But thanks.']],
    distrae: [['Les cuento mis historias de mina. Tardarán horas.', 'I will tell them my mine stories. It will take hours.'], ['Voy a refunfuñarles un rato.', 'I will grumble at them for a while.']],
    traicion: [['Esperaba más de ti.', 'I expected more from you.']],
    rescate: [['Bah... ¡lo logramos! ¡Sopa para todos!', 'Bah... we did it! Soup for everyone!']],
  }),
  'Wei': P(['Comunicaciones', 'Communications'], ['Tímido y ordenadísimo', 'Shy and very tidy'], ['Lista de pendientes: 1) sobrevivir 2) volver.', 'To-do list: 1) survive 2) go home.'], {
    idle: [['Tengo una lista para todo. Hasta para las listas.', 'I have a list for everything. Even for lists.'], ['Eh... hola. Perdón, no quería interrumpir.', 'Um... hi. Sorry, I did not mean to interrupt.'], ['Tres señales perdidas. Las anoté.', 'Three lost signals. I wrote them down.'], ['Si ordenas bien, todo sale bien.', 'If you organize well, everything goes well.']],
    peligro: [['¡Eh! ¡Eso no estaba en mi lista!', 'Hey! That was not on my list!'], ['Perdón... ¡pero hay que moverse ya!', 'Sorry... but we have to move now!']],
    tormenta: [['Paso 1: refugio. Paso 2: refugio.', 'Step 1: shelter. Step 2: shelter.'], ['Perdón, ¿podemos ir al refugio? Ya.', 'Sorry, can we go to the shelter? Now.']],
    alivio: [['Pasó. Lo anoto: "sobrevivimos".', 'It passed. I will note it: "we survived".']],
    noche: [['Reviso la antena un ratito más...', 'I will check the antenna a little longer...'], ['Silencio de radio. Qué bonito.', 'Radio silence. How nice.']],
    trabajo: [['Marcado en la lista: ¡hecho!', 'Ticked off the list: done!'], ['Todo en orden, como me gusta.', 'Everything in order, just how I like it.']],
    gracias: [['G-gracias. Te puse una estrella en mi lista.', 'Th-thanks. I put a star next to you on my list.'], ['Eres de los buenos.', 'You are one of the good ones.']],
    distrae: [['Voy a... eh... preguntarles algo.', 'I am going to... um... ask them something.'], ['Seré breve... bueno, no tanto.', 'I will be brief... well, not that brief.']],
    traicion: [['Lo tengo anotado.', 'I have written it down.']],
    rescate: [['Lista completa: ¡volver a casa! ✔', 'List complete: go home! ✔']],
  }),
  // ---------- Marte ----------
  'Lucía': P(['Botánica', 'Botanist'], ['Cálida y cuidadora', 'Warm and caring'], ['Si cuidas la planta, la planta te cuida.', 'If you look after the plant, the plant looks after you.'], {
    idle: [['Buenos días, tomatitos. ¿Durmieron bien?', 'Good morning, little tomatoes. Did you sleep well?'], ['Una planta en Marte es un pequeño milagro.', 'A plant on Mars is a little miracle.'], ['Hablarles ayuda a crecer. ¡Lo juro!', 'Talking to them helps them grow. I swear!'], ['Aquí cultivamos nuestra propia comida.', 'Here we grow our own food.']],
    peligro: [['¡Mis plantas! ¡Y ustedes también, claro!', 'My plants! And you too, of course!'], ['¡Cuidado, cuidado, despacito!', 'Careful, careful, slowly!']],
    tormenta: [['¡A cubierto! Mis plantas aguantan; nosotros también.', 'Take cover! My plants can take it; so can we.'], ['Refugio ya. Las plantas esperan.', 'Shelter now. The plants can wait.']],
    alivio: [['¡Qué susto! Voy a ver mis plantitas.', 'What a scare! I am going to check my plants.']],
    noche: [['Buenas noches, plantitas.', 'Good night, little plants.'], ['Marte de noche es tan callado...', 'Mars at night is so quiet...']],
    trabajo: [['Riego y cosecha: ¡la comida se cuida casi sola!', 'Watering and harvest: the food almost tends itself!'], ['Invernadero sano, tripulación feliz.', 'Healthy greenhouse, happy crew.']],
    gracias: [['¡Gracias! Toma un tomatito.', 'Thanks! Have a little tomato.'], ['Qué lindo detalle. ¡Eres un sol!', 'What a lovely gesture. You are a sunshine!']],
    distrae: [['Los invitaré a ver mi invernadero.', 'I will invite them to see my greenhouse.'], ['Voy a contarles de mis cultivos.', 'I will tell them about my crops.']],
    traicion: [['Dolió. Las plantas no mienten, y yo tampoco.', 'That hurt. Plants do not lie, and neither do I.']],
    rescate: [['¡Lo logramos! ¡Llevo semillas a casa!', 'We did it! I am taking seeds home!']],
  }),
  'Tomás': P(['Piloto del MAV', 'MAV pilot'], ['Valiente y presumido', 'Brave and a bit of a show-off'], ['Soy el mejor piloto de este planeta. De los dos planetas.', 'I am the best pilot on this planet. On both planets.'], {
    idle: [['Soy el mejor piloto de Marte. Bueno, el único.', 'I am the best pilot on Mars. Well, the only one.'], ['Cuando despegue el MAV será perfecto. Como yo.', 'When the MAV lifts off it will be perfect. Like me.'], ['Dicen que presumo. Yo digo que informo.', 'They say I show off. I say I inform.'], ['Sueño con volver a casa y comer pizza.', 'I dream of going home and eating pizza.']],
    peligro: [['¡Tranquilos! ¡Esto lo resuelvo con un dedo!', 'Relax! I can fix this with one finger!'], ['¡Eh! ¡Cuidado! Por mí no se asusten.', 'Hey! Careful! Do not worry about me.']],
    tormenta: [['¡Al refugio! Un buen piloto sabe cuándo retirarse.', 'To the shelter! A good pilot knows when to pull back.'], ['Ni el mejor piloto vence una tormenta. ¡Corre!', 'Not even the best pilot beats a storm. Run!']],
    alivio: [['Lo tenía todo bajo control. Casi.', 'I had it all under control. Almost.']],
    noche: [['Reviso la ruta del MAV en sueños.', 'I check the MAV route in my dreams.'], ['Buenas noches, futuros astronautas.', 'Good night, future astronauts.']],
    trabajo: [['Mantenimiento perfecto, como mi vuelo.', 'Perfect maintenance, like my flight.'], ['Un piloto cuida su nave. Y su base.', 'A pilot looks after their ship. And their base.']],
    gracias: [['¡Gracias! Te llevo en mi primer viaje.', 'Thanks! I will take you on my first trip.'], ['Eres casi tan bueno como yo.', 'You are almost as good as me.']],
    distrae: [['Les contaré mi mejor aterrizaje. Dura 40 minutos.', 'I will tell them my best landing. It lasts 40 minutes.'], ['Déjame a mí: soy un gran conversador.', 'Leave it to me: I am a great talker.']],
    traicion: [['No me lo esperaba de ti.', 'I did not expect that from you.']],
    rescate: [['¡Lo logramos! ¿Vieron? Les dije.', 'We did it! See? I told you.']],
  }),
  'Aisha': P(['Ingeniera de energía', 'Power engineer'], ['Directa y competitiva', 'Direct and competitive'], ['¿Un reto? ¡Acepto!', 'A challenge? Accepted!'], {
    idle: [['¿Reparar más rápido que yo? Difícil.', 'Repair faster than me? Unlikely.'], ['Paneles al 100 %. Y yo también.', 'Panels at 100 %. And so am I.'], ['No me gusta perder, ni en juegos de mesa.', 'I do not like losing, not even at board games.'], ['Si dices que no se puede, lo intento dos veces.', 'If you say it cannot be done, I try twice.']],
    peligro: [['¡Aquí no hay tiempo! ¡Acción!', 'No time here! Action!'], ['¡Eso lo arreglo en 30 segundos! ¡Cronómetro!', 'I will fix that in 30 seconds! Start the clock!']],
    tormenta: [['¡Refugio! ¿Quién llega primero?', 'Shelter! Who gets there first?'], ['Sin tonterías: ¡al refugio ya!', 'No nonsense: to the shelter now!']],
    alivio: [['¡Uf! Reto superado. ¿El siguiente?', 'Phew! Challenge beaten. The next one?']],
    noche: [['Duermo poco: hay paneles que limpiar.', 'I sleep little: there are panels to clean.'], ['Mañana rompo mi récord de reparación.', 'Tomorrow I break my repair record.']],
    trabajo: [['Energía al máximo. ¡Récord!', 'Power at maximum. Record!'], ['Primera en terminar, como siempre.', 'First to finish, as always.']],
    gracias: [['¡Buen trabajo! Me gustan los que cumplen.', 'Good job! I like people who deliver.'], ['Gracias. Ahora estamos a mano... por poco.', 'Thanks. Now we are even... barely.']],
    distrae: [['Los distraigo un minuto. ¡Cronómetro!', 'I will distract them for a minute. Clock is running!'], ['Reto: que no te vean. ¡Vamos!', 'Challenge: do not get seen. Go!']],
    traicion: [['Eso fue jugar sucio.', 'That was playing dirty.']],
    rescate: [['¡Reto cumplido! ¿Vamos por otro?', 'Challenge complete! Shall we go for another?']],
  }),
};

export const TIPOS = ['idle', 'peligro', 'tormenta', 'alivio', 'noche', 'trabajo', 'gracias', 'distrae', 'traicion', 'rescate'];

const hash = (str) => { let h = 2166136261; for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };

/** Una frase del tipo pedido para ese personaje (null si no hay). `semilla` elige cuál, sin gastar azar de la partida. */
export function linea(nombre, tipo, semilla = '') {
  const arr = PERSONAS[nombre]?.[tipo]; if (!arr?.length) return null;
  const [es, en] = arr[hash(`${nombre}|${tipo}|${semilla}`) % arr.length];
  return T(es, en);
}
/** Lo que dice el compañero `c` de la partida `s` en esa situación. Cambia con el día y la hora del juego. */
export const voz = (s, c, tipo) => linea(c.name, tipo, `${s.seed}|${s.day}|${Math.floor(s.min / 7)}`);

/** Ficha para la pantalla: oficio, forma de ser y frase. */
export function ficha(nombre) {
  const p = PERSONAS[nombre]; if (!p) return null;
  return { rol: T(...p.rol), rasgo: T(...p.rasgo), frase: T(...p.frase) };
}
