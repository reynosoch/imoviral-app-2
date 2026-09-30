import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext.js';
import { LinearGradient } from 'expo-linear-gradient';


/* ─────────────────────────────────────────────
   TOKENS  (Espejo exacto del diseño premium)
───────────────────────────────────────────── */
const T = {
  bg: '#0A0A0A',
  bgInput: '#121212',
  gold: '#A07840',
  goldHover: '#C39B5F',
  text: '#F5F5F0',
  textMuted: '#A3A3A3',
  borderSubtle: 'rgba(255,255,255,0.10)',
  borderMid: 'rgba(255,255,255,0.20)',
  errorBg: 'rgba(220,50,50,0.12)',
  errorBorder: 'rgba(220,50,50,0.3)',
  errorText: '#ff7070',
  successBg: 'rgba(160,120,64,0.15)',
  successText: '#C49A58',
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Cormorant Garamond, Georgia, serif' }),
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'Montserrat, sans-serif' }),
};

/* ─────────────────────────────────────────────
   HOOK: Estado de hover compatible web/native
───────────────────────────────────────────── */
function useHover() {
  const [hovered, setHovered] = useState(false);
  const handlers = Platform.select({
    web: {
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
    },
    default: {},
  });
  return [hovered, handlers];
}

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */
export default function LoginPage({ onVolver }) {
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const { signIn, signInWithGoogle } = useAuth();
  const isWide = width > 1024;

  // ── Estados comunes
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modo, setModo] = useState('login'); // 'login' | 'register' | 'forgot'

  // ── Refs para foco y submit con Enter
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  // ── Estados de registro
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [clientType, setClientType] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // ── Errores por campo (para border rojo)
  const [fieldErrors, setFieldErrors] = useState({});

  // ── Hover states para web
  const [hoverPrimary, hoverPrimaryHandlers] = useHover();
  const [hoverGoogle, hoverGoogleHandlers] = useHover();
  const [hoverForgot, hoverForgotHandlers] = useHover();

  const esES = i18n.language.startsWith('es');
  const cambiarIdioma = (lang) => i18n.changeLanguage(lang);

  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo);
    setError('');
    setSuccess('');
    setConfirmPassword('');
    setShowConfirmPwd(false);
  };

  // ── Lógica Supabase
  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setFieldErrors({});
    setLoading(true);
    try {
      if (modo === 'forgot') {
        if (!email) {
          setFieldErrors({ email: true });
          throw new Error(
            esES
              ? 'Por favor introduce tu correo electrónico.'
              : 'Please enter your email address.'
          );
        }
        if (!email.includes('@')) {
          setFieldErrors({ email: true });
          throw new Error(
            esES
              ? 'Por favor, ingresa un correo electrónico válido.'
              : 'Please enter a valid email address.'
          );
        }
        const redirectUrl = Platform.OS === 'web' ? window.location.origin : undefined;
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl,
        });
        if (err) throw err;
        setSuccess(
          esES
            ? '¡Correo de recuperación enviado! Revisa tu bandeja de entrada.'
            : 'Recovery email sent! Please check your inbox.'
        );
      } else if (modo === 'login') {
        if (!email.trim()) {
          setFieldErrors({ email: true });
          throw new Error(esES ? 'Por favor ingresa tu correo electrónico.' : 'Please enter your email.');
        }
        if (!password.trim()) {
          setFieldErrors({ password: true });
          throw new Error(esES ? 'Por favor ingresa tu contraseña.' : 'Please enter your password.');
        }
        if (!email.includes('@')) {
          setFieldErrors({ email: true });
          throw new Error(
            esES
              ? 'Por favor, ingresa un correo electrónico válido.'
              : 'Please enter a valid email address.'
          );
        }
        const { error: err } = await signIn(email, password);
        if (err) throw err;
        setSuccess(t('login_success_msg', { defaultValue: '¡Sesión iniciada correctamente!' }));
        setTimeout(() => onVolver(), 1200);
      } else {
        if (!fullName.trim()) {
          setFieldErrors({ fullName: true });
          throw new Error(esES ? 'Por favor ingresa tu nombre completo.' : 'Please enter your full name.');
        }
        if (!phone.trim()) {
          setFieldErrors({ phone: true });
          throw new Error(esES ? 'Por favor ingresa tu teléfono.' : 'Please enter your phone number.');
        }
        if (!email.trim()) {
          setFieldErrors({ email: true });
          throw new Error(esES ? 'Por favor ingresa tu correo electrónico.' : 'Please enter your email.');
        }
        if (!email.includes('@')) {
          setFieldErrors({ email: true });
          throw new Error(
            esES
              ? 'Por favor, ingresa un correo electrónico válido.'
              : 'Please enter a valid email address.'
          );
        }
        if (!password.trim()) {
          setFieldErrors({ password: true });
          throw new Error(esES ? 'Por favor ingresa una contraseña.' : 'Please enter a password.');
        }
        if (!confirmPassword.trim()) {
          setFieldErrors({ confirmPassword: true });
          throw new Error(esES ? 'Por favor confirma tu contraseña.' : 'Please confirm your password.');
        }
        if (password !== confirmPassword) {
          setFieldErrors({ password: true, confirmPassword: true });
          throw new Error(
            esES
              ? 'Las contraseñas no coinciden.'
              : 'Passwords do not match.'
          );
        }
        if (!clientType) {
          setFieldErrors({ clientType: true });
          throw new Error(esES ? 'Por favor selecciona si eres Vendedor, Comprador o Propietario.' : 'Please select your client type.');
        }
        if (!acceptTerms) {
          setFieldErrors({ acceptTerms: true });
          throw new Error(
            esES
              ? 'Debes aceptar los términos y condiciones.'
              : 'You must accept the terms and conditions.'
          );
        }
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, phone, client_type: clientType },
          },
        });
        if (err) throw err;
        setSuccess(t('register_success_msg', { defaultValue: '¡Cuenta creada! Revisa tu correo para confirmar.' }));
        setFullName(''); setPhone(''); setEmail('');
        setPassword(''); setConfirmPassword(''); setClientType(''); setAcceptTerms(false);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión con Google.');
    } finally {
      setLoading(false);
    }
  };

  const CAROUSEL_IMAGES = [
    // Arquitectura oscura y fría — tonos concreto/acero/noche
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=90', // villa noche luces cálidas en fachada oscura
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1400&q=90', // interior minimalista gris oscuro
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1400&q=90', // mansion moderna crepusculo
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1400&q=90', // fachada concreto y cristal noche
  ];

  const SLIDE_DURATION = 9500;  // 9.5 s — carrusel muy relajado y elegante
  const FADE_DURATION  = 2500;  // 2.5 s — crossfade suave y cinematográfico
  const ZOOM_DURATION  = SLIDE_DURATION + FADE_DURATION; // zoom cubre toda la vida del slide

  // Opacidad independiente por imagen
  const opacities = useRef(
    CAROUSEL_IMAGES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))
  ).current;

  // Escala independiente por imagen (Ken Burns)
  const scales = useRef(
    CAROUSEL_IMAGES.map(() => new Animated.Value(1))
  ).current;

  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselIndexRef = useRef(0);

  // Arranca el zoom Ken Burns: 1.0 → 1.06 ultra lento e imperceptible
  const startZoom = (idx) => {
    scales[idx].setValue(1.0);
    Animated.timing(scales[idx], {
      toValue: 1.06,
      duration: ZOOM_DURATION,
      useNativeDriver: true,
    }).start();
  };

  const goToSlide = (next) => {
    const current = carouselIndexRef.current;
    if (next === current) return;
    startZoom(next);
    Animated.parallel([
      Animated.timing(opacities[current], { toValue: 0, duration: FADE_DURATION, useNativeDriver: true }),
      Animated.timing(opacities[next],    { toValue: 1, duration: FADE_DURATION, useNativeDriver: true }),
    ]).start(() => {
      carouselIndexRef.current = next;
      setCarouselIndex(next);
    });
  };

  useEffect(() => {
    // Zoom de la primera imagen al montar
    startZoom(0);
    const interval = setInterval(() => {
      const next = (carouselIndexRef.current + 1) % CAROUSEL_IMAGES.length;
      goToSlide(next);
    }, SLIDE_DURATION);
    return () => clearInterval(interval);
  }, []);

  // ────────────────────────────────────────────
  //  FUNCIONES DE RENDER (Evitan la pérdida de foco)
  // ────────────────────────────────────────────
  const renderImagePanel = () => (
    <View style={S.imagePanel}>
      {/* Imágenes apiladas con Ken Burns */}
      {CAROUSEL_IMAGES.map((uri, i) => (
        <Animated.Image
          key={i}
          source={{ uri }}
          style={[
            StyleSheet.absoluteFillObject,
            { opacity: opacities[i], transform: [{ scale: scales[i] }] },
          ]}
          resizeMode="cover"
        />
      ))}

      {/* Degradado tipo viñeta premium con LinearGradient nativo */}
      {/* Capa superior — negro desde arriba */}
      <LinearGradient
        colors={['rgba(10,10,10,0.82)', 'rgba(10,10,10,0.10)', 'transparent']}
        style={[StyleSheet.absoluteFillObject, { height: '45%', top: 0 }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      {/* Capa inferior — negro desde abajo */}
      <LinearGradient
        colors={['transparent', 'rgba(10,10,10,0.20)', 'rgba(10,10,10,0.95)']}
        style={[StyleSheet.absoluteFillObject, { top: '45%' }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      {/* Capa lateral derecha — transición al formulario */}
      <LinearGradient
        colors={['transparent', 'rgba(10,10,10,0.55)', 'rgba(10,10,10,0.98)']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      />

      <View style={S.imageCaption}>
        <Text style={S.captionLabel}>
          {modo === 'login' || modo === 'forgot'
            ? t('login_caption_lbl', { defaultValue: 'Premium Real Estate' })
            : t('register_caption_lbl', { defaultValue: 'Únete a la colección' })}
        </Text>

        <Text style={S.captionQuote}>
          {modo === 'login' || modo === 'forgot'
            ? t('login_caption', { defaultValue: 'Una colección curada de propiedades excepcionales para quienes valoran la exclusividad.' })
            : t('register_caption', { defaultValue: 'Cada propiedad es una solución a medida, diseñada en torno a la visión del cliente.' })}
        </Text>

        {/* Puntos de navegación */}
        <View style={S.carouselDots}>
          {CAROUSEL_IMAGES.map((_, i) => (
            <View
              key={i}
              style={[S.carouselDot, i === carouselIndex && S.carouselDotActive]}
            />
          ))}
        </View>
      </View>
    </View>
  );



  const renderFormPanel = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={[S.formScroll, isWide && S.formScrollWide, width <= 768 && { paddingTop: 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Encabezado ── */}
        <Text style={S.overline}>
          {modo === 'login'
            ? t('login_welcome', { defaultValue: 'Bienvenido de nuevo' })
            : modo === 'forgot'
              ? t('login_forgot_welcome', { defaultValue: 'Recuperar Acceso' })
              : t('register_overline', { defaultValue: 'Acceso Privado' })}
        </Text>
        <Text style={S.title}>
          {modo === 'login'
            ? t('login_title', { defaultValue: 'Inicia sesión' })
            : modo === 'forgot'
              ? t('login_forgot_title', { defaultValue: '¿Olvidaste tu contraseña?' })
              : t('login_title_reg', { defaultValue: 'Crear cuenta' })}
        </Text>
        <Text style={S.subtitle}>
          {modo === 'login'
            ? t('login_subtitle', { defaultValue: 'Propiedades excepcionales para clientes exigentes.' })
            : modo === 'forgot'
              ? t('login_forgot_subtitle', { defaultValue: 'Introduce tu correo y te enviaremos un enlace para restablecer tu contraseña.' })
              : t('register_subtitle', { defaultValue: 'Accede a las propiedades más exclusivas del mercado.' })}
        </Text>

        {/* ── Alertas ── */}
        {!!error && <View style={[S.alert, S.alertError]}><Text style={S.alertTextError}>{error}</Text></View>}
        {!!success && <View style={[S.alert, S.alertSuccess]}><Text style={S.alertTextSuccess}>{success}</Text></View>}

        {/* ── Campos exclusivos de Registro ── */}
        {modo === 'register' && (
          <>
            <Field label={t('register_name_lbl', { defaultValue: 'Nombre Completo' })}>
              <TextInput
                style={[S.input, fieldErrors.fullName && S.inputError]}
                placeholder="Ej. Juan Pérez"
                placeholderTextColor="rgba(255,255,255,0.30)"
                value={fullName}
                onChangeText={(v) => { setFullName(v); setFieldErrors(p => ({ ...p, fullName: false })); }}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </Field>
            <Field label={t('register_phone_lbl', { defaultValue: 'Teléfono' })}>
              <TextInput
                style={[S.input, fieldErrors.phone && S.inputError]}
                placeholder="+52 614 000 0000"
                placeholderTextColor="rgba(255,255,255,0.30)"
                value={phone}
                onChangeText={(v) => { setPhone(v); setFieldErrors(p => ({ ...p, phone: false })); }}
                keyboardType="phone-pad"
                returnKeyType="next"
              />
            </Field>
          </>
        )}

        {/* ── Correo ── */}
        <Field label={t('login_email_lbl', { defaultValue: 'Correo Electrónico' })}>
          <TextInput
            style={[S.input, fieldErrors.email && S.inputError]}
            placeholder="tu@email.com"
            placeholderTextColor="rgba(255,255,255,0.30)"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            value={email}
            onChangeText={(v) => { setEmail(v); setFieldErrors(p => ({ ...p, email: false })); }}
            onSubmitEditing={() => passwordRef.current && passwordRef.current.focus()}
          />
        </Field>

        {/* ── Contraseña ── */}
        {modo !== 'forgot' && (
          <Field
            label={t('login_pwd_lbl', { defaultValue: 'Contraseña' })}
          >
            <View style={S.passwordWrap}>
              <TextInput
                ref={passwordRef}
                style={[S.input, { flex: 1, borderWidth: 0 }, fieldErrors.password && { borderWidth: 1, borderColor: T.errorText }]}
                placeholder={modo === 'login' ? '••••••••' : 'Mínimo 6 caracteres'}
                placeholderTextColor="rgba(255,255,255,0.30)"
                secureTextEntry={!showPwd}
                autoCapitalize="none"
                returnKeyType={modo === 'register' ? 'next' : 'done'}
                value={password}
                onChangeText={(v) => { setPassword(v); setFieldErrors(p => ({ ...p, password: false })); }}
                onSubmitEditing={() => modo === 'register' ? confirmPasswordRef.current && confirmPasswordRef.current.focus() : handleSubmit()}
              />
              <Pressable onPress={() => setShowPwd(!showPwd)} style={S.togglePwd}>
                <View>{EyeIcon({ open: showPwd })}</View>
              </Pressable>
            </View>
            {modo === 'login' && (
              <Pressable
                onPress={() => cambiarModo('forgot')}
                style={{ alignSelf: 'flex-end', marginTop: 10, paddingVertical: 4 }}
                {...hoverForgotHandlers}
              >
                <Text style={[S.forgot, hoverForgot && S.forgotHover]}>
                  {t('login_forgot', { defaultValue: '¿Olvidaste tu contraseña?' })}
                </Text>
              </Pressable>
            )}
          </Field>
        )}

        {/* ── Confirmar Contraseña ── */}
        {modo === 'register' && (
          <Field
            label={t('register_confirm_pwd_lbl', { defaultValue: 'Confirmar Contraseña' })}
          >
            <View style={S.passwordWrap}>
              <TextInput
                ref={confirmPasswordRef}
                style={[S.input, { flex: 1, borderWidth: 0 }, fieldErrors.confirmPassword && { borderWidth: 1, borderColor: T.errorText }]}
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.30)"
                secureTextEntry={!showConfirmPwd}
                autoCapitalize="none"
                returnKeyType="done"
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); setFieldErrors(p => ({ ...p, confirmPassword: false })); }}
                onSubmitEditing={handleSubmit}
              />
              <Pressable onPress={() => setShowConfirmPwd(!showConfirmPwd)} style={S.togglePwd}>
                <View>{EyeIcon({ open: showConfirmPwd })}</View>
              </Pressable>
            </View>
          </Field>
        )}

        {modo === 'register' && (
          <>
            <Field label={t('register_type_lbl', { defaultValue: 'Tipo de Cliente' })}>
              <View style={[S.clientOptions, fieldErrors.clientType && { borderWidth: 1, borderColor: T.errorText, padding: 4 }]}>
                {['Comprador', 'Vendedor'].map((opt) => (
                  <Pressable
                    key={opt}
                    onPress={() => { setClientType(opt); setFieldErrors(p => ({ ...p, clientType: false })); }}
                    style={[S.clientOption, clientType === opt && S.clientOptionActive]}
                  >
                    <Text style={[S.clientOptionText, clientType === opt && S.clientOptionTextActive]}>
                      {opt}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Field>

            <Pressable onPress={() => setAcceptTerms(!acceptTerms)} style={[S.terms, fieldErrors.acceptTerms && { borderWidth: 1, borderColor: T.errorText, padding: 8 }]}>
              <View style={[S.checkbox, acceptTerms && S.checkboxActive]}>
                {acceptTerms && <Text style={S.checkMark}>✓</Text>}
              </View>
              <Text style={S.termsText}>
                {t('register_terms_1', { defaultValue: 'Acepto los ' })}
                <Text
                  style={[S.termsEm, { textDecorationLine: 'underline' }]}
                  onPress={(e) => { e.stopPropagation && e.stopPropagation(); setShowTerms(true); }}
                >
                  {t('register_terms_em', { defaultValue: 'términos y condiciones' })}
                </Text>
                {t('register_terms_2', { defaultValue: ' y la política de privacidad de INMOVIRAL.' })}
              </Text>
            </Pressable>
          </>
        )}

        {/* ── Modal Términos y Condiciones ── */}
        {showTerms && (
          <Pressable style={S.termsOverlay} onPress={() => setShowTerms(false)}>
            <Pressable style={S.termsModal} onPress={(e) => e.stopPropagation && e.stopPropagation()}>
              <View style={S.termsModalHeader}>
                <Text style={S.termsModalTitle}>Términos y Condiciones</Text>
                <Pressable onPress={() => setShowTerms(false)} style={S.termsModalClose}>
                  <Text style={S.termsModalCloseText}>✕</Text>
                </Pressable>
              </View>
              <ScrollView style={S.termsModalScroll} showsVerticalScrollIndicator={false}>
                <Text style={S.termsModalBody}>
                  <Text style={S.termsModalSection}>1. Uso del Servicio{"\n"}</Text>
                  {"Al registrarte en INMOVIRAL aceptas utilizar la plataforma únicamente para fines legales relacionados con la búsqueda, compra, venta o renta de bienes inmuebles.\n\n"}
                  <Text style={S.termsModalSection}>2. Privacidad de Datos{"\n"}</Text>
                  {"INMOVIRAL recopila datos personales como nombre, correo y teléfono exclusivamente para personalizar tu experiencia y facilitar el contacto con asesores. Tus datos no serán vendidos a terceros.\n\n"}
                  <Text style={S.termsModalSection}>3. Responsabilidad{"\n"}</Text>
                  {"La información de propiedades es proporcionada por vendedores y asesores. INMOVIRAL no garantiza la exactitud absoluta de los datos y recomienda verificar la información directamente.\n\n"}
                  <Text style={S.termsModalSection}>4. Propiedad Intelectual{"\n"}</Text>
                  {"Todo el contenido de INMOVIRAL —textos, imágenes, logotipos y diseños— es propiedad de INMOVIRAL y está protegido por derechos de autor. Queda prohibida su reproducción sin autorización.\n\n"}
                  <Text style={S.termsModalSection}>5. Modificaciones{"\n"}</Text>
                  {"INMOVIRAL se reserva el derecho de modificar estos términos en cualquier momento. Se notificará a los usuarios registrados sobre cambios significativos.\n\n"}
                  <Text style={S.termsModalSection}>6. Contacto{"\n"}</Text>
                  {"Para cualquier duda sobre estos términos, contáctanos en ventas@inmoviral.com.mx."}
                </Text>
              </ScrollView>
              <Pressable
                style={S.termsModalBtn}
                onPress={() => { setAcceptTerms(true); setShowTerms(false); setFieldErrors(p => ({ ...p, acceptTerms: false })); }}
              >
                <Text style={S.termsModalBtnText}>Acepto los términos</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        )}

        {/* ── Botón principal ── */}
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={[S.btnPrimary, hoverPrimary && S.btnPrimaryHover, loading && S.btnPrimaryDisabled]}
          {...hoverPrimaryHandlers}
        >
          {loading
            ? <ActivityIndicator color="#000" size="small" />
            : <Text style={S.btnPrimaryText}>
              {modo === 'login'
                ? t('login_btn', { defaultValue: 'Iniciar Sesión' })
                : modo === 'forgot'
                  ? t('login_forgot_btn', { defaultValue: 'Enviar enlace de recuperación' })
                  : t('login_btn_reg', { defaultValue: 'Registrarse' })}
            </Text>
          }
        </Pressable>

        {modo !== 'forgot' && (
          <>
            {/* ── Divisor ── */}
            <View style={S.divider}>
              <View style={S.dividerLine} />
              <Text style={S.dividerText}>{esES ? 'o' : 'or'}</Text>
              <View style={S.dividerLine} />
            </View>

            {/* ── Botón Google ── */}
            <Pressable
              onPress={handleGoogle}
              style={[S.btnGoogle, hoverGoogle && S.btnGoogleHover]}
              {...hoverGoogleHandlers}
            >
              <GoogleIcon />
              <Text style={S.btnGoogleText}>
                {modo === 'login'
                  ? t('login_google', { defaultValue: 'Continuar con Google' })
                  : t('register_google', { defaultValue: 'Registrarse con Google' })}
              </Text>
            </Pressable>
          </>
        )}

        {/* ── Footer links ── */}
        <View style={S.footerLink}>
          {modo === 'forgot' ? (
            <Pressable onPress={() => cambiarModo('login')}>
              <Text style={S.footerLinkText}>
                {t('login_signin_link', { defaultValue: 'Inicia sesión' })}
              </Text>
            </Pressable>
          ) : (
            <>
              <Text style={S.footerText}>
                {modo === 'login'
                  ? t('login_no_account', { defaultValue: '¿No tienes una cuenta?' })
                  : t('login_has_account', { defaultValue: '¿Ya tienes una cuenta?' })}{' '}
              </Text>
              <Pressable onPress={() => cambiarModo(modo === 'login' ? 'register' : 'login')}>
                <Text style={S.footerLinkText}>
                  {modo === 'login'
                    ? t('login_register_link', { defaultValue: 'Regístrate' })
                    : t('login_signin_link', { defaultValue: 'Inicia sesión' })}
                </Text>
              </Pressable>
            </>
          )}
        </View>

        <Text style={S.footerSep}>—</Text>

        <View style={S.footerLink}>
          <Text style={S.footerText}>
            {t('login_guest_lbl', { defaultValue: '¿Prefieres continuar sin registrarte?' })}{' '}
          </Text>
          <Pressable onPress={onVolver}>
            <Text style={S.footerLinkText}>
              {t('login_guest_link', { defaultValue: 'Continuar como invitado' })}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // ─── RENDER PRINCIPAL ──────────────────────
  return (
    <SafeAreaView style={S.root}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      {isWide ? (
        <View style={S.splitRow}>
          {renderImagePanel()}
          <View style={S.formSide}>
            {renderFormPanel()}
          </View>
        </View>
      ) : (
        renderFormPanel()
      )}
    </SafeAreaView>
  );
}

// ─── Componentes estáticos utilitarios ────────
function Field({ label, right, children }) {
  return (
    <View style={S.field}>
      <View style={S.fieldHead}>
        <Text style={S.fieldLabel}>{label}</Text>
        {right || null}
      </View>
      {children}
    </View>
  );
}

function EyeIcon({ open }) {
  if (Platform.OS === 'web') {
    if (open) {
      // Ojo abierto
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(163,163,163,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    }
    // Ojo tachado
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(163,163,163,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  // Fallback nativo: texto con símbolo
  return (
    <Text style={{ color: T.textMuted, fontSize: 15, lineHeight: 18 }}>
      {open ? '●' : '∅'}
    </Text>
  );
}

function GoogleIcon() {
  if (Platform.OS === 'web') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57C21.36 18.09 22.56 15.4 22.56 12.25z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.49 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    );
  }
  return <Text style={{ color: '#EA4335', fontSize: 16, fontWeight: '700' }}>G</Text>;
}

export async function obtenerPropiedades() {
  const { data, error } = await supabase
    .from('propiedades')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('Error al obtener propiedades:', error); return []; }
  return data;
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  splitRow: { flex: 1, flexDirection: 'row' },
  imagePanel: { flex: 1, position: 'relative', overflow: 'hidden' },
  imageCaption: { position: 'absolute', bottom: 0, left: 48, right: 48, paddingBottom: 48, zIndex: 2 },
  captionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 3, textTransform: 'uppercase', color: '#C39B5F', marginBottom: 16, fontFamily: T.sans },
  captionQuote: { fontFamily: T.serif, fontSize: 36, lineHeight: Platform.select({ web: undefined, default: 42 }), fontWeight: '300', color: T.text, maxWidth: 520, marginBottom: 24 },
  formSide: { flex: 1, backgroundColor: T.bg },
  formScroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.select({
      web: 40,
      default: 80 + (Platform.OS === 'ios' ? 47 : (StatusBar.currentHeight || 24))
    }),
    paddingBottom: 40
  },
  formScrollWide: { paddingHorizontal: 96, justifyContent: 'center', minHeight: '100%', maxWidth: 612, alignSelf: 'center', width: '100%' },
  langSwitcher: { flexDirection: 'row', alignSelf: 'flex-end', marginBottom: 32, gap: 8 },
  langBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'transparent' },
  langBtnActive: { backgroundColor: T.gold, borderColor: T.gold },
  langBtnText: { fontSize: 10, letterSpacing: Platform.select({ web: '0.2em', default: 2 }), color: T.textMuted, fontFamily: T.sans, fontWeight: '400' },
  langBtnTextActive: { color: '#000' },
  overline: { fontSize: 11, letterSpacing: Platform.select({ web: '0.3em', default: 4 }), textTransform: 'uppercase', color: T.gold, marginBottom: 16, fontFamily: T.sans },
  title: { fontFamily: T.serif, fontSize: 48, fontWeight: '300', color: T.text, marginBottom: 12, lineHeight: Platform.select({ web: undefined, default: 52 }) },
  subtitle: { fontSize: 14, fontWeight: '300', color: T.textMuted, marginBottom: 40, fontFamily: T.sans, lineHeight: Platform.select({ web: undefined, default: 22 }) },
  alert: { padding: 12, marginBottom: 16, borderWidth: 1 },
  alertError: { backgroundColor: T.errorBg, borderColor: T.errorBorder },
  alertSuccess: { backgroundColor: T.successBg, borderColor: T.gold },
  alertTextError: { color: T.errorText, fontSize: 13, fontFamily: T.sans },
  alertTextSuccess: { color: T.successText, fontSize: 13, fontFamily: T.sans },
  field: { marginBottom: 22 },
  fieldHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  fieldLabel: { fontSize: 11, letterSpacing: Platform.select({ web: '0.2em', default: 2 }), textTransform: 'uppercase', color: T.textMuted, fontWeight: '300', fontFamily: T.sans },
  forgot: { fontSize: 12, color: T.gold, fontFamily: T.sans, textDecorationLine: 'underline' },
  forgotHover: { color: T.goldHover },
  input: { width: '100%', height: 48, backgroundColor: T.bgInput, borderWidth: 1, borderColor: T.borderSubtle, color: T.text, paddingHorizontal: 16, fontFamily: T.sans, fontSize: 14, fontWeight: '300', borderRadius: 0, outlineStyle: Platform.select({ web: 'none', default: undefined }) },
  passwordWrap: { flexDirection: 'row', alignItems: 'center', height: 48, backgroundColor: T.bgInput, borderWidth: 1, borderColor: T.borderSubtle, borderRadius: 0 },
  togglePwd: { paddingHorizontal: 14, height: '100%', justifyContent: 'center', alignItems: 'center' },
  clientOptions: { flexDirection: 'row', gap: 8 },
  clientOption: { flex: 1, height: 40, borderWidth: 1, borderColor: T.borderSubtle, backgroundColor: T.bgInput, borderRadius: 0, justifyContent: 'center', alignItems: 'center' },
  clientOptionActive: { borderColor: T.gold, backgroundColor: 'rgba(160,120,64,0.10)' },
  clientOptionText: { fontSize: 11, color: T.textMuted, fontFamily: T.sans, letterSpacing: Platform.select({ web: '0.1em', default: 1 }) },
  clientOptionTextActive: { color: T.gold },
  terms: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 22 },
  checkbox: { width: 16, height: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.30)', backgroundColor: T.bgInput, borderRadius: 0, marginTop: 2, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  checkboxActive: { backgroundColor: T.gold, borderColor: T.gold },
  checkMark: { color: '#000', fontSize: 10, fontWeight: '700', lineHeight: Platform.select({ web: undefined, default: 14 }) },
  termsText: { flex: 1, fontSize: 11, color: T.textMuted, fontWeight: '300', lineHeight: Platform.select({ web: undefined, default: 18 }), fontFamily: T.sans },
  termsEm: { color: T.gold },
  btnPrimary: { width: '100%', height: 48, backgroundColor: T.gold, borderRadius: 0, justifyContent: 'center', alignItems: 'center', marginTop: 4, marginBottom: 0, borderWidth: 0 },
  btnPrimaryHover: { backgroundColor: T.goldHover },
  btnPrimaryDisabled: { opacity: 0.7 },
  btnPrimaryText: { color: '#000000', fontSize: 12, fontWeight: '500', letterSpacing: Platform.select({ web: '0.2em', default: 2 }), textTransform: 'uppercase', fontFamily: T.sans },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 32 },
  dividerLine: { flex: 1, height: 1, backgroundColor: T.borderSubtle },
  dividerText: { fontSize: 10, letterSpacing: Platform.select({ web: '0.3em', default: 3 }), textTransform: 'uppercase', color: T.textMuted, fontFamily: T.sans },
  btnGoogle: { width: '100%', height: 48, backgroundColor: 'transparent', borderWidth: 1, borderColor: T.borderMid, borderRadius: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  btnGoogleHover: { borderColor: 'rgba(255,255,255,0.40)', backgroundColor: 'rgba(255,255,255,0.05)' },
  btnGoogleText: { fontSize: 12, letterSpacing: Platform.select({ web: '0.2em', default: 2 }), textTransform: 'uppercase', fontWeight: '300', color: T.text, fontFamily: T.sans },
  footerLink: { marginTop: 32, flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  footerText: { fontSize: 12, color: T.textMuted, fontWeight: '300', fontFamily: T.sans },
  footerLinkText: { fontSize: 12, color: T.gold, textTransform: 'uppercase', letterSpacing: Platform.select({ web: '0.2em', default: 2 }), fontFamily: T.sans },
  footerSep: { marginTop: 16, textAlign: 'center', color: T.textMuted, fontSize: 11 },
  carouselDots: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  carouselDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)' },
  carouselDotActive: { width: 22, borderRadius: 3, backgroundColor: T.gold, borderColor: T.gold },
  // ── Flechas del carrusel
  carouselArrow: {
    position: 'absolute', top: '50%', zIndex: 4,
    width: 40, height: 40,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(10,10,10,0.45)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 0,
    ...Platform.select({ web: { cursor: 'pointer', backdropFilter: 'blur(6px)' }, default: {} }),
  },
  carouselArrowLeft:  { left: 20,  transform: [{ translateY: -20 }] },
  carouselArrowRight: { right: 20, transform: [{ translateY: -20 }] },
  carouselArrowText:  { color: 'rgba(255,255,255,0.85)', fontSize: 22, lineHeight: 26 },
  // ── Campo con error
  inputError: { borderColor: T.errorText, borderWidth: 1.5 },
  // ── Modal de Términos
  termsOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 999,
    ...Platform.select({ web: { position: 'fixed' }, default: {} }),
  },
  termsModal: {
    backgroundColor: '#141414',
    borderWidth: 1, borderColor: 'rgba(160,120,64,0.25)',
    width: Platform.select({ web: '90%', default: '92%' }),
    maxWidth: 520,
    maxHeight: Platform.select({ web: '80vh', default: 520 }),
    borderRadius: 0,
    overflow: 'hidden',
  },
  termsModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 18,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  termsModalTitle: { fontFamily: T.serif, fontSize: 20, color: T.text, fontWeight: '300', letterSpacing: 1 },
  termsModalClose: { padding: 6 },
  termsModalCloseText: { color: T.textMuted, fontSize: 16 },
  termsModalScroll: { paddingHorizontal: 24, paddingVertical: 20, maxHeight: 320 },
  termsModalBody: { fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: Platform.select({ web: undefined, default: 22 }), fontFamily: T.sans, fontWeight: '300' },
  termsModalSection: { fontSize: 13, color: T.gold, fontWeight: '600', fontFamily: T.sans },
  termsModalBtn: {
    margin: 16, height: 44, backgroundColor: T.gold,
    justifyContent: 'center', alignItems: 'center',
  },
  termsModalBtnText: { color: '#000', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', fontFamily: T.sans },
});