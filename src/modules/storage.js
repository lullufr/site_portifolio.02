// Acesso seguro ao localStorage. Em navegação privativa ou com o armazenamento
// bloqueado, o site continua funcionando e guarda os valores só na sessão atual.
const memory = new Map();

export const storage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memory.has(key) ? memory.get(key) : null;
    }
  },
  set(key, value) {
    memory.set(key, value);
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* sem armazenamento: o valor fica apenas em memória */
    }
  },
  remove(key) {
    memory.delete(key);
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* sem armazenamento */
    }
  },
};
