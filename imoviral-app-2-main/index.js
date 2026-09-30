import './config/i18n'; // ◄ Inyección global de idiomas en el primer microsegundo
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);