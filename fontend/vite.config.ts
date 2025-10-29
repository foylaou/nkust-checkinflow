import {defineConfig, type LogErrorOptions, type Logger, type LogOptions, type LogType} from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

const customLogger: Logger = {
    info(msg: string, _options?: LogOptions) {
        console.log(msg.replace(/^\d{1,2}:\d{2}:\d{2}\s[AP]M\s/, ''))
    },
    warn(msg: string, _options?: LogOptions) {
        console.warn(msg.replace(/^\d{1,2}:\d{2}:\d{2}\s[AP]M\s/, ''))
    },
    warnOnce(msg: string, _options?: LogOptions) {
        if (!this.hasWarned) {
            console.warn(msg.replace(/^\d{1,2}:\d{2}:\d{2}\s[AP]M\s/, ''))
            this.hasWarned = true
        }
    },
    error(msg: string, _options?: LogErrorOptions) {
        console.error(msg)
    },
    clearScreen(_type: LogType) {
        // 不清除螢幕
    },
    hasErrorLogged(_error: Error) {
        return false
    },
    hasWarned: false
}
// https://vite.dev/config/
export default defineConfig({
  plugins: [
      react(),
      tailwindcss(),

  ],
    server: {
        hmr: {
            overlay: true
        }
    },
    customLogger

})
