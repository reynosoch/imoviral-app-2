const fs = require('fs');

const enPath = './locales/en.json';
const esPath = './locales/es.json';

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const es = JSON.parse(fs.readFileSync(esPath, 'utf8'));

const translations = {
  ubicacion: { es: 'Ubicación', en: 'Location' },
  detalles: { es: 'Detalles', en: 'Details' },
  amenidades: { es: 'Amenidades', en: 'Amenities' },
  servicios: { es: 'Servicios', en: 'Services' },
  alta_inmueble: { es: 'Alta de Inmueble', en: 'List Property' },
  paso_x_de_4: { es: 'Paso {{step}} de 4', en: 'Step {{step}} of 4' },
  tipo_propiedad_label: { es: 'TIPO DE PROPIEDAD', en: 'PROPERTY TYPE' },
  operacion_label: { es: 'OPERACIÓN', en: 'OPERATION' },
  ubicacion_aprox_label: { es: 'UBICACIÓN APROXIMADA (ZONA O CIUDAD)', en: 'APPROXIMATE LOCATION (ZONE OR CITY)' },
  ej_reliz: { es: 'Ej. El Reliz, Chihuahua', en: 'E.g. El Reliz, Chihuahua' },
  calle_numero_label: { es: 'CALLE Y NÚMERO (Opcional)', en: 'STREET AND NUMBER (Optional)' },
  ej_calle: { es: 'Ej. Av. Teófilo Borunda 1204', en: 'E.g. Av. Teofilo Borunda 1204' },
  colonia_label: { es: 'COLONIA / SECTOR (Opcional)', en: 'NEIGHBORHOOD / SECTOR (Optional)' },
  ej_colonia: { es: 'Ej. Diamante Reliz', en: 'E.g. Diamante Reliz' },
  cp_label: { es: 'CÓDIGO POSTAL (Opcional)', en: 'ZIP CODE (Optional)' },
  ej_cp: { es: 'Ej. 31203', en: 'E.g. 31203' },
  selecciona_mapa: { es: 'SELECCIONA EN EL MAPA / ARRASTRA EL PIN', en: 'SELECT ON MAP / DRAG THE PIN' },
  confirma_mapa: { es: 'Confirma la ubicación arrastrando el pin hasta el punto exacto. (Solo Web)', en: 'Confirm the location by dragging the pin to the exact point. (Web Only)' },
  recamaras_label: { es: 'RECÁMARAS', en: 'BEDROOMS' },
  banos_label: { es: 'BAÑOS COMPLETOS', en: 'FULL BATHROOMS' },
  estacionamientos_label: { es: 'CAJONES DE ESTACIONAMIENTO', en: 'PARKING SPOTS' },
  antiguedad_label: { es: 'ANTIGÜEDAD', en: 'PROPERTY AGE' },
  titulo_pub_label: { es: 'TÍTULO DE LA PUBLICACIÓN', en: 'PUBLICATION TITLE' },
  ej_titulo: { es: 'Ej. Bonita casa en el Reliz con bonita vista', en: 'E.g. Beautiful house in El Reliz with nice view' },
  remate_bancario_q: { es: '¿ESTE INMUEBLE ESTÁ EN REMATE BANCARIO?', en: 'IS THIS PROPERTY A BANK FORECLOSURE?' },
  si_remate: { es: 'SÍ, ES REMATE', en: 'YES, FORECLOSURE' },
  no_remate: { es: 'NO', en: 'NO' },
  precio_label: { es: 'PRECIO EVALUADO ($)', en: 'EVALUATED PRICE ($)' },
  superficie_label: { es: 'SUPERFICIE TOTAL M²', en: 'TOTAL AREA SQM' },
  max_m2: { es: 'Max. 9,999 m²', en: 'Max. 9,999 sqm' },
  ej_superficie: { es: 'Ej. 150', en: 'E.g. 150' },
  descripcion_label: { es: 'DESCRIPCIÓN EDITORIAL COMPLETA', en: 'FULL EDITORIAL DESCRIPTION' },
  ej_desc: { es: 'Ej. Bonita casa en el Reliz con bonita vista, amplios espacios modernos, seguridad las 24 horas y acabados de lujo.', en: 'E.g. Beautiful house in El Reliz with nice view, spacious modern areas, 24-hour security, and luxury finishes.' },
  galeria_label: { es: 'GALERÍA DE IMÁGENES PRESTIGE', en: 'PRESTIGE IMAGE GALLERY' },
  arrastra_reordenar: { es: 'Arrastra para reordenar', en: 'Drag to reorder' },
  seleccionar_fotos: { es: 'Seleccionar fotos premium...', en: 'Select premium photos...' },
  max_15_img: { es: 'Máximo 15 imágenes.', en: 'Maximum 15 images.' },
  primera_portada: { es: '(La primera imagen será la portada)', en: '(The first image will be the cover)' },
  amenidades_incluidas_label: { es: 'AMENIDADES INCLUIDAS', en: 'INCLUDED AMENITIES' },
  servicios_virales_label: { es: 'SERVICIOS VIRALES OPCIONALES', en: 'OPTIONAL VIRAL SERVICES' },
  datos_propietario_label: { es: 'DATOS DEL PROPIETARIO O REPRESENTANTE', en: 'OWNER OR REPRESENTATIVE DATA' },
  nombre_completo_label: { es: 'NOMBRE COMPLETO', en: 'FULL NAME' },
  ej_nombre: { es: 'Ej. Roberto García', en: 'E.g. Robert Garcia' },
  tel_contacto_label: { es: 'TELÉFONO DE CONTACTO (PÚBLICO)', en: 'CONTACT PHONE (PUBLIC)' },
  ej_telefono: { es: 'Ej. 614 123 4567', en: 'E.g. 614 123 4567' },
  register_confirm_pwd_lbl: { es: 'Confirmar Contraseña', en: 'Confirm Password' },
  siguiente_btn: { es: 'SIGUIENTE', en: 'NEXT' },
  atras_btn: { es: 'ATRÁS', en: 'BACK' },
  publicar_prop_btn: { es: 'PUBLICAR PROPIEDAD', en: 'PUBLISH PROPERTY' },
  guardar_cambios_btn: { es: 'GUARDAR CAMBIOS', en: 'SAVE CHANGES' },
  publicando_btn: { es: 'Publicando...', en: 'Publishing...' },
  volver_inicio_btn: { es: 'VOLVER AL INICIO', en: 'RETURN TO HOME' },
  prop_publicada_exito: { es: '¡PROPIEDAD PUBLICADA CON ÉXITO!', en: 'PROPERTY PUBLISHED SUCCESSFULLY!' },
  prop_publicada_desc: { es: 'Tu inmueble ha sido integrado a la red InmoViral con altos estándares de calidad. Pronto será visible para prospectos en todo el país.', en: 'Your property has been integrated into the InmoViral network with high quality standards. It will soon be visible to prospects nationwide.' },
  vender_rentar_hero: { es: 'VENDER O RENTAR', en: 'SELL OR RENT' },
  haz_tu_prop: { es: 'Haz que tu\npropiedad se vuelva', en: 'Make your\nproperty go' },
  viral_italic: { es: 'viral', en: 'viral' },
  hero_desc_ventas: { es: 'Publica de forma rápida y segura. Conecta directamente con miles de prospectos, compradores y arrendatarios potenciales.', en: 'Publish quickly and securely. Connect directly with thousands of prospects, buyers, and potential tenants.' },
  props_remates_eyebrow: { es: 'OPORTUNIDADES DE INVERSIÓN', en: 'INVESTMENT OPPORTUNITIES' },
  props_remates_title_1: { es: 'Remates', en: 'Bank' },
  props_remates_title_em: { es: 'Bancarios', en: 'Foreclosures' },
  props_remates_sub: { es: 'Adquiere propiedades exclusivas mediante remates bancarios seleccionados.', en: 'Acquire exclusive properties through selected bank foreclosures.' },
  letras_lbl: { es: 'Letras', en: 'Letters' }
};

for (const [key, val] of Object.entries(translations)) {
  en[key] = val.en;
  es[key] = val.es;
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');
fs.writeFileSync(esPath, JSON.stringify(es, null, 2), 'utf8');
console.log('Locales updated successfully');
