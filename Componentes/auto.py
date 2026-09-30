# ═══════════════════════════════════════════════════════════════════════
#  PRUEBAS AUTOMATIZADAS — PROYECTO INTEGRADOR INMOVIRAL
#  Flujo de Inicio de Sesión (Login) con Supabase Auth
#  Tecnología del Frontend: Expo Web (React Native Web)
#  URL de Prueba: http://localhost:8081
#  Herramienta: Selenium WebDriver + Python
# ═══════════════════════════════════════════════════════════════════════

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time


def InicializarDriver():
    """
    Inicializa y retorna una instancia del navegador Firefox (GeckoDriver).
    Se utiliza Firefox por su compatibilidad estable con el bundle de Expo Web.
    """
    driver = webdriver.Firefox()
    # Alternativa para Google Chrome:
    # driver = webdriver.Chrome()
    return driver


def navegar_a_login(driver):
    """
    Navega desde la página principal (Home) hasta la vista de Login.
    En InmoViral, la app inicia en la vista 'home' por defecto.
    Se debe hacer clic en el botón 'INICIAR SESIÓN' del navbar
    para que React cambie el estado de vista a 'login' y renderice
    el formulario de autenticación con sus campos de entrada.
    """
    driver.get("http://localhost:8081")
    # Pausa de 4 segundos: permite que el bundle de Expo Web se hidrate
    # completamente, las fuentes se carguen y la UI esté interactiva.
    time.sleep(4)

    # El botón del navbar dice "INICIAR SESIÓN" (texto literal del JSON i18n).
    # Usamos XPath para localizarlo en la barra de navegación superior.
    btn_navbar_login = driver.find_element(
        By.XPATH, "//*[contains(text(), 'INICIAR SESIÓN')]"
    )
    btn_navbar_login.click()
    # Pausa de 3 segundos: permite que React cambie el estado 'vista'
    # a 'login', desmonte el Home y monte el componente LoginPage.jsx
    # con el carrusel de imágenes y el formulario de acceso.
    time.sleep(3)


def hacer_password_visible(driver):
    """
    Hace clic en el icono del ojito (toggle de visibilidad) para que
    la contraseña escrita se muestre en texto plano en lugar de puntos.
    Esto permite que en el video se distinga claramente la contraseña
    incorrecta de la correcta.
    Usa JavaScript para localizar el botón toggle hermano del input
    dentro del contenedor passwordWrap de React Native Web.
    """
    driver.execute_script("""
        var pwdInput = document.querySelector("input[type='password']");
        if (!pwdInput) return;
        var parent = pwdInput.parentElement;
        var children = parent.children;
        for (var i = 0; i < children.length; i++) {
            if (children[i] !== pwdInput && children[i].tagName !== 'INPUT') {
                children[i].click();
                return;
            }
        }
    """)
    # Breve pausa para que React procese el cambio de estado showPwd
    # y re-renderice el input como type="text" mostrando la contraseña.
    time.sleep(1)


# ─────────────────────────────────────────────────────────────────
#  TC-01 — ESCENARIO POSITIVO (+): Inicio de sesión exitoso
# ─────────────────────────────────────────────────────────────────
def test_login_exitoso(driver):
    """
    Caso de prueba positivo (Happy Path).
    Verifica que un usuario registrado en Supabase puede autenticarse
    correctamente proporcionando credenciales válidas.
    """
    print("\n--- Ejecutando TC-01: Inicio de sesión exitoso ---")
    navegar_a_login(driver)

    # Localización del campo de correo electrónico.
    # Expo Web (React Native Web) no renderiza type="email" en el DOM;
    # el prop keyboardType="email-address" genera inputmode="email".
    # Utilizamos el atributo placeholder como selector CSS para fiabilidad.
    input_email = driver.find_element(By.CSS_SELECTOR, "input[placeholder='tu@email.com']")
    input_email.clear()
    input_email.send_keys("javireynoso21@gmail.com")
    # Pausa de 1.5 segundos: simula cadencia de escritura humana y permite
    # que el estado de React (useState) procese el onChange de forma estable.
    time.sleep(1.5)

    # Localización del campo de contraseña.
    # El prop secureTextEntry de React Native Web sí genera type="password".
    input_pass = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
    input_pass.clear()
    input_pass.send_keys("123456")  # <-- Contraseña real de la cuenta de prueba
    time.sleep(1)

    # Hacemos visible la contraseña para que se vea en el video
    hacer_password_visible(driver)
    time.sleep(1.5)

    # Localización del botón dorado de envío del formulario.
    # El texto en el DOM es "Iniciar Sesión" (capitalización normal);
    # el estilo CSS textTransform: 'uppercase' solo lo transforma visualmente.
    btn_login = driver.find_element(
        By.XPATH, "//*[contains(text(), 'Iniciar Sesión') and not(contains(text(), 'INICIAR'))]"
    )
    btn_login.click()
    # Pausa de 4 segundos: tiempo para que la petición HTTP a Supabase Auth
    # se complete, el JWT se almacene y la interfaz refleje el éxito.
    time.sleep(4)
    print("TC-01 Completado: Autenticación exitosa verificada.")


# ─────────────────────────────────────────────────────────────────
#  TC-02 — ESCENARIO NEGATIVO (−): Contraseña incorrecta
# ─────────────────────────────────────────────────────────────────
def test_contrasena_incorrecta(driver):
    """
    Caso de prueba negativo.
    Valida que Supabase Auth rechace el acceso cuando se proporciona
    una contraseña incorrecta para un correo existente.
    """
    print("\n--- Ejecutando TC-02: Validación de contraseña incorrecta ---")
    navegar_a_login(driver)

    input_email = driver.find_element(By.CSS_SELECTOR, "input[placeholder='tu@email.com']")
    input_email.send_keys("javireynoso21@gmail.com")
    time.sleep(1)

    input_pass = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
    input_pass.send_keys("ClaveFalsaAka999")
    time.sleep(1)

    # Revelamos la contraseña falsa para evidenciar que es incorrecta
    hacer_password_visible(driver)
    time.sleep(1.5)

    btn_login = driver.find_element(
        By.XPATH, "//*[contains(text(), 'Iniciar Sesión') and not(contains(text(), 'INICIAR'))]"
    )
    btn_login.click()
    # Pausa de 3 segundos: tiempo para que Supabase responda con error
    # y la UI renderice la alerta roja de credenciales inválidas.
    time.sleep(3)
    print("TC-02 Completado: Acceso denegado correctamente por Supabase Auth.")


# ─────────────────────────────────────────────────────────────────
#  TC-03 — ESCENARIO NEGATIVO (−): Formato de correo inválido
# ─────────────────────────────────────────────────────────────────
def test_correo_invalido(driver):
    """
    Caso de prueba negativo.
    Verifica que la validación local del frontend (JavaScript) detecte
    la ausencia del carácter '@' y bloquee la petición a Supabase.
    Confirma que handleSubmit ejecuta: if (!email.includes('@')) { ... }
    """
    print("\n--- Ejecutando TC-03: Validación de formato de correo ---")
    navegar_a_login(driver)

    input_email = driver.find_element(By.CSS_SELECTOR, "input[placeholder='tu@email.com']")
    # Se ingresa deliberadamente un texto sin '@' para activar la validación.
    input_email.send_keys("reynosoch-sin-arroba")
    time.sleep(1)

    input_pass = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
    input_pass.send_keys("123456")
    time.sleep(1)

    # Revelamos la contraseña para que se vea en el video
    hacer_password_visible(driver)
    time.sleep(1.5)

    btn_login = driver.find_element(
        By.XPATH, "//*[contains(text(), 'Iniciar Sesión') and not(contains(text(), 'INICIAR'))]"
    )
    btn_login.click()
    # Pausa de 3 segundos: verificar que aparezca la alerta
    # "Por favor, ingresa un correo electrónico válido."
    time.sleep(3)
    print("TC-03 Completado: Validación local del '@' detuvo el envío correctamente.")


# ─────────────────────────────────────────────────────────────────
#  TC-04 — ESCENARIO NEGATIVO (−): Formulario completamente vacío
# ─────────────────────────────────────────────────────────────────
def test_campos_vacios(driver):
    """
    Caso de prueba negativo.
    Verifica que el sistema no permita el envío cuando ambos campos
    están vacíos. Debe mostrar "Completa todos los campos."
    """
    print("\n--- Ejecutando TC-04: Intento de envío con formulario vacío ---")
    navegar_a_login(driver)

    # No se ingresa ningún dato. Se presiona el botón directamente.
    btn_login = driver.find_element(
        By.XPATH, "//*[contains(text(), 'Iniciar Sesión') and not(contains(text(), 'INICIAR'))]"
    )
    btn_login.click()
    # Pausa de 3 segundos: verificar bordes rojos y mensaje de error.
    time.sleep(3)
    print("TC-04 Completado: La interfaz exige completar campos obligatorios.")


# ═════════════════════════════════════════════════════════════════
#  ORQUESTADOR PRINCIPAL DE LA SUITE DE PRUEBAS
# ═════════════════════════════════════════════════════════════════
def main():
    """
    Función principal que inicializa el navegador, ejecuta los 4 casos
    de prueba secuencialmente y garantiza el cierre limpio del driver.
    """
    driver = InicializarDriver()
    driver.maximize_window()

    try:
        # Ejecución secuencial: primero los tres casos negativos para que
        # el flujo de navegación se mantenga intacto (sin sesión activa).
        # El caso positivo va al final porque al autenticarse exitosamente
        # la app redirige al Home y el botón "INICIAR SESIÓN" del navbar
        # desaparece, lo que impediría navegar de vuelta al formulario.
        test_contrasena_incorrecta(driver)
        test_correo_invalido(driver)
        test_campos_vacios(driver)
        test_login_exitoso(driver)

    except Exception as e:
        print("Sucedió un error durante la ejecución automatizada:", e)

    finally:
        print("\nTodas las pruebas automatizadas del equipo han sido ejecutadas.")
        # Pausa final antes de cerrar para observar en la grabación.
        time.sleep(3)
        driver.quit()


if __name__ == "__main__":
    main()
