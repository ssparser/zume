import { Session } from "inspector/promises";

export const getSessionMessages = (userId: string) => {
    if (typeof window === "undefined") return [];
    try {
      const saved = sessionStorage.getItem(userId);
      if (!saved) return [];
      return JSON.parse(saved);
    } catch (error) {
      console.error("Failed to parse sessionStorage for user:", userId, error);
      return [];
    }
  };
  
  export const saveSessionMessages = ( userId: string, messages: { text: string; sender: string }[]) => {
    if (typeof window !== 'undefined') {
        sessionStorage.setItem(`${userId}`, JSON.stringify(messages));
      }
  };
  
  export const clearSession = () => {
    sessionStorage.removeItem("chat-messages");
    sessionStorage.removeItem('zume-projectId');
};


  
