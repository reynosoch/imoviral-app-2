const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Componentes', 'Vendedor.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  // WIZARD_STEPS
  [/label: 'Ubicación'/g, "label: t('ubicacion', {defaultValue: 'Ubicación'})"],
  [/label: 'Detalles'/g, "label: t('detalles', {defaultValue: 'Detalles'})"],
  [/label: 'Amenidades'/g, "label: t('amenidades', {defaultValue: 'Amenidades'})"],
  [/label: 'Servicios'/g, "label: t('servicios', {defaultValue: 'Servicios'})"],
  
  // Headings
  [/>Alta de Inmueble</g, ">{t('alta_inmueble', {defaultValue: 'Alta de Inmueble'})}<"],
  [/>\{`Paso \$\{step\} de 4`\}</g, ">{t('paso_x_de_4', {defaultValue: 'Paso ' + step + ' de 4'})}<"],

  // Step 1
  [/>TIPO DE PROPIEDAD</g, ">{t('tipo_propiedad_label', {defaultValue: 'TIPO DE PROPIEDAD'})}<"],
  [/>OPERACIÓN</g, ">{t('operacion_label', {defaultValue: 'OPERACIÓN'})}<"],
  [/>UBICACIÓN APROXIMADA \(ZONA O CIUDAD\)</g, ">{t('ubicacion_aprox_label', {defaultValue: 'UBICACIÓN APROXIMADA (ZONA O CIUDAD)'})}<"],
  [/placeholder="Ej\. El Reliz, Chihuahua"/g, "placeholder={t('ej_reliz', {defaultValue: 'Ej. El Reliz, Chihuahua'})}"],
  [/>CALLE Y NÚMERO \(Opcional\)</g, ">{t('calle_numero_label', {defaultValue: 'CALLE Y NÚMERO (Opcional)'})}<"],
  [/placeholder="Ej\. Av\. Teófilo Borunda 1204"/g, "placeholder={t('ej_calle', {defaultValue: 'Ej. Av. Teófilo Borunda 1204'})}"],
  [/>COLONIA \/ SECTOR \(Opcional\)</g, ">{t('colonia_label', {defaultValue: 'COLONIA / SECTOR (Opcional)'})}<"],
  [/placeholder="Ej\. Diamante Reliz"/g, "placeholder={t('ej_colonia', {defaultValue: 'Ej. Diamante Reliz'})}"],
  [/>CÓDIGO POSTAL \(Opcional\)</g, ">{t('cp_label', {defaultValue: 'CÓDIGO POSTAL (Opcional)'})}<"],
  [/placeholder="Ej\. 31203"/g, "placeholder={t('ej_cp', {defaultValue: 'Ej. 31203'})}"],
  [/>SELECCIONA EN EL MAPA \/ ARRASTRA EL PIN</g, ">{t('selecciona_mapa', {defaultValue: 'SELECCIONA EN EL MAPA / ARRASTRA EL PIN'})}<"],
  [/>Confirma la ubicación arrastrando el pin hasta el punto exacto\. \(Solo Web\)</g, ">{t('confirma_mapa', {defaultValue: 'Confirma la ubicación arrastrando el pin hasta el punto exacto. (Solo Web)'})}<"],

  // Step 2
  [/label="RECÁMARAS"/g, "label={t('recamaras_label', {defaultValue: 'RECÁMARAS'})}"],
  [/label="BAÑOS COMPLETOS"/g, "label={t('banos_label', {defaultValue: 'BAÑOS COMPLETOS'})}"],
  [/label="CAJONES DE ESTACIONAMIENTO"/g, "label={t('estacionamientos_label', {defaultValue: 'CAJONES DE ESTACIONAMIENTO'})}"],
  [/>ANTIGÜEDAD</g, ">{t('antiguedad_label', {defaultValue: 'ANTIGÜEDAD'})}<"],

  [/>TÍTULO DE LA PUBLICACIÓN</g, ">{t('titulo_pub_label', {defaultValue: 'TÍTULO DE LA PUBLICACIÓN'})}<"],
  [/placeholder="Ej\. Bonita casa en el Reliz con bonita vista"/g, "placeholder={t('ej_titulo', {defaultValue: 'Ej. Bonita casa en el Reliz con bonita vista'})}"],
  [/>¿ESTE INMUEBLE ESTÁ EN REMATE BANCARIO\?</g, ">{t('remate_bancario_q', {defaultValue: '¿ESTE INMUEBLE ESTÁ EN REMATE BANCARIO?'})}<"],
  [/>SÍ, ES REMATE</g, ">{t('si_remate', {defaultValue: 'SÍ, ES REMATE'})}<"],
  [/>NO</g, ">{t('no_remate', {defaultValue: 'NO'})}<"],
  [/>PRECIO EVALUADO \(\$\)</g, ">{t('precio_label', {defaultValue: 'PRECIO EVALUADO ($)'})}<"],
  [/>SUPERFICIE TOTAL M²</g, ">{t('superficie_label', {defaultValue: 'SUPERFICIE TOTAL M²'})}<"],
  [/>Max\. 9,999 m²</g, ">{t('max_m2', {defaultValue: 'Max. 9,999 m²'})}<"],
  [/placeholder="Ej\. 150"/g, "placeholder={t('ej_superficie', {defaultValue: 'Ej. 150'})}"],

  [/>DESCRIPCIÓN EDITORIAL COMPLETA</g, ">{t('descripcion_label', {defaultValue: 'DESCRIPCIÓN EDITORIAL COMPLETA'})}<"],
  [/placeholder="Ej\. Bonita casa en el Reliz con bonita vista, amplios espacios modernos, seguridad las 24 horas y acabados de lujo\."/g, "placeholder={t('ej_desc', {defaultValue: 'Ej. Bonita casa en el Reliz con bonita vista, amplios espacios modernos, seguridad las 24 horas y acabados de lujo.'})}"],

  [/>GALERÍA DE IMÁGENES PRESTIGE</g, ">{t('galeria_label', {defaultValue: 'GALERÍA DE IMÁGENES PRESTIGE'})}<"],
  [/>Arrastra para reordenar</g, ">{t('arrastra_reordenar', {defaultValue: 'Arrastra para reordenar'})}<"],
  [/>Seleccionar fotos premium\.\.\.</g, ">{t('seleccionar_fotos', {defaultValue: 'Seleccionar fotos premium...'})}<"],
  [/>Máximo 15 imágenes\.</g, ">{t('max_15_img', {defaultValue: 'Máximo 15 imágenes.'})}<"],
  [/>\(La primera imagen será la portada\)</g, ">{t('primera_portada', {defaultValue: '(La primera imagen será la portada)'})}<"],

  // Step 3 y 4 Labels
  [/>AMENIDADES INCLUIDAS</g, ">{t('amenidades_incluidas_label', {defaultValue: 'AMENIDADES INCLUIDAS'})}<"],
  [/>SERVICIOS VIRALES OPCIONALES</g, ">{t('servicios_virales_label', {defaultValue: 'SERVICIOS VIRALES OPCIONALES'})}<"],

  // Info Owner
  [/>DATOS DEL PROPIETARIO O REPRESENTANTE</g, ">{t('datos_propietario_label', {defaultValue: 'DATOS DEL PROPIETARIO O REPRESENTANTE'})}<"],
  [/>NOMBRE COMPLETO</g, ">{t('nombre_completo_label', {defaultValue: 'NOMBRE COMPLETO'})}<"],
  [/placeholder="Ej\. Roberto García"/g, "placeholder={t('ej_nombre', {defaultValue: 'Ej. Roberto García'})}"],
  [/>TELÉFONO DE CONTACTO \(PÚBLICO\)</g, ">{t('tel_contacto_label', {defaultValue: 'TELÉFONO DE CONTACTO (PÚBLICO)'})}<"],
  [/placeholder="Ej\. 614 123 4567"/g, "placeholder={t('ej_telefono', {defaultValue: 'Ej. 614 123 4567'})}"],

  // Buttons
  [/>SIGUIENTE</g, ">{t('siguiente_btn', {defaultValue: 'SIGUIENTE'})}<"],
  [/>ATRÁS</g, ">{t('atras_btn', {defaultValue: 'ATRÁS'})}<"],
  [/>PUBLICAR PROPIEDAD</g, ">{t('publicar_prop_btn', {defaultValue: 'PUBLICAR PROPIEDAD'})}<"],
  [/>GUARDAR CAMBIOS</g, ">{t('guardar_cambios_btn', {defaultValue: 'GUARDAR CAMBIOS'})}<"],
  [/>Publicando\.\.\.</g, ">{t('publicando_btn', {defaultValue: 'Publicando...'})}<"],
  [/>VOLVER AL INICIO</g, ">{t('volver_inicio_btn', {defaultValue: 'VOLVER AL INICIO'})}<"],

  // Success Screen
  [/>¡PROPIEDAD PUBLICADA CON ÉXITO!</g, ">{t('prop_publicada_exito', {defaultValue: '¡PROPIEDAD PUBLICADA CON ÉXITO!'})}<"],
  [/>Tu inmueble ha sido integrado a la red InmoViral con altos estándares de calidad\. Pronto será visible para prospectos en todo el país\.</g, ">{t('prop_publicada_desc', {defaultValue: 'Tu inmueble ha sido integrado a la red InmoViral con altos estándares de calidad. Pronto será visible para prospectos en todo el país.'})}<"],

  // Hero Panel
  [/>VENDER O RENTAR</g, ">{t('vender_rentar_hero', {defaultValue: 'VENDER O RENTAR'})}<"],
  [/>Haz que tu\{'\\n'\}propiedad se vuelva </g, ">{t('haz_tu_prop', {defaultValue: 'Haz que tu\\npropiedad se vuelva'})} <"],
  [/>viral</g, ">{t('viral_italic', {defaultValue: 'viral'})}<"],
  [/>Publica de forma rápida y segura\. Conecta directamente con miles de prospectos, compradores y arrendatarios potenciales\.</g, ">{t('hero_desc_ventas', {defaultValue: 'Publica de forma rápida y segura. Conecta directamente con miles de prospectos, compradores y arrendatarios potenciales.'})}<"]
];

for (const [regex, replacement] of replacements) {
  content = content.replace(regex, replacement);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Translations applied successfully!');
